import path from "node:path";
import { Diagnostic, Project, ts } from "ts-morph";

import type { ImportFact, SymbolFact } from "../types";

import { extractExportsFromSourceFile } from "./sourceFile/extractExports";
import { extractSymbolsFromSourceFile } from "./sourceFile/extractSymbols";
import { extractImportsFromSourceFile } from "./sourceFile/extractImports";
import { resolveImports } from "./sourceFile/resolveImports";
import { GraphBuilder } from "./builders/graphBuilder";

type AnalyzerArgs =
  | [root: string, useTsConfig: boolean, input: string[], testingMode?: false] // Input is filepaths
  | [root: string, useTsConfig: boolean, input: string, testingMode: true]; // Input is source code

type AnalyzerReturn =
  | { error: true; graphBuilder: null; diagnostics: Diagnostic[] }
  | { error: false; graphBuilder: GraphBuilder; diagnostics: null };

export const analyzer = (...args: AnalyzerArgs): AnalyzerReturn => {
  const [root, useTsConfig, input, testingMode] = args;
  // const absPath = path.resolve(this.root, filePath);

  const project = useTsConfig
    ? new Project({
        tsConfigFilePath: path.join(root, "tsconfig.json"),
        skipAddingFilesFromTsConfig: true,
      })
    : new Project();

  const graphBuilder = GraphBuilder.createDefault();

  // Testing mode takes in source code
  if (testingMode) {
    // Parse input
    const dummyPath = "dummy-file.ts";
    project.createSourceFile(dummyPath, input);
    const sourceFile = project.getSourceFileOrThrow(dummyPath);

    // Check for errors
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    const containsErrors = diagnostics.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
    if (containsErrors) return { error: true, graphBuilder: null, diagnostics };

    // Return data
    extractSymbolsFromSourceFile(sourceFile, dummyPath, graphBuilder);
    extractImportsFromSourceFile(sourceFile, "./");
    extractExportsFromSourceFile(sourceFile, dummyPath, graphBuilder);
    return { error: false, graphBuilder, diagnostics: null };
  }
  // Otherwise take in filepaths
  else {
    const projectSymbols: SymbolFact[] = [];
    const importsPerFile: Record<string, ImportFact[]> = {};

    // Parse input
    for (const filepath of input) {
      // const dummyRelativePath = "./src/dummy-files/ts/index.ts";
      const absolutePath = path.resolve(root, filepath);

      project.addSourceFileAtPath(absolutePath);
      const sourceFile = project.getSourceFileOrThrow(absolutePath);

      // Check for errors
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      const containsErrors = diagnostics.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
      console.log(diagnostics.map((d) => d.getMessageText() + " " + d.getSourceFile()?.getFilePath()));
      if (containsErrors) return { error: true, graphBuilder: null, diagnostics };

      // Collect all symbols and files
      extractSymbolsFromSourceFile(sourceFile, filepath, graphBuilder);

      // Collect all export edges
      extractExportsFromSourceFile(sourceFile, filepath, graphBuilder);

      // Collect file-specific imports to use to resolve imports
      const imports = extractImportsFromSourceFile(sourceFile, root);
      importsPerFile[filepath] = imports;
    }

    // Resolve imports after collecting all file's imports/exports
    resolveImports(importsPerFile, graphBuilder);

    return { error: false, graphBuilder, diagnostics: null };
  }
};
