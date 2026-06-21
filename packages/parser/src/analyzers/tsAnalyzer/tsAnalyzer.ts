import path from "node:path";
import { Diagnostic, Project, ProjectOptions, ts } from "ts-morph";

import { Edge } from "@seergraph/shared";
import type { ImportFact, SymbolFact } from "../types";

import { extractExportsFromSourceFile } from "./sourceFile/extractExports";
import { extractSymbolsFromSourceFile } from "./sourceFile/extractSymbols";
import { extractImportsFromSourceFile } from "./sourceFile/extractImports";
import { buildExportIndex } from "./linker/buildExportIndex";

type AnalyzerArgs =
  | [root: string, useTsConfig: boolean, input: string[], testingMode?: false] // Input is filepaths
  | [root: string, useTsConfig: boolean, input: string, testingMode: true]; // Input is source code

type AnalyzerReturn =
  | { error: true; symbols: null; imports: null; exportEdges: null; diagnostics: Diagnostic[] }
  | { error: false; symbols: SymbolFact[]; imports: ImportFact[]; exportEdges: Edge[]; diagnostics: null };

export const tsAnalyzer = (...args: AnalyzerArgs): AnalyzerReturn => {
  const [root, useTsConfig, input, testingMode] = args;
  // const absPath = path.resolve(this.root, filePath);

  const project = useTsConfig
    ? new Project({
        tsConfigFilePath: path.join(root, "tsconfig.json"),
        skipAddingFilesFromTsConfig: true,
      })
    : new Project();

  // Testing mode takes in source code
  if (testingMode) {
    // Parse input
    project.createSourceFile("dummy-file.ts", input);
    const sourceFile = project.getSourceFileOrThrow("dummy-file.ts");

    // Check for errors
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    const containsErrors = diagnostics.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
    if (containsErrors) return { error: true, symbols: null, imports: null, exportEdges: null, diagnostics };

    // Return data
    const symbols = extractSymbolsFromSourceFile(sourceFile, "dummy-file.ts");
    const imports = extractImportsFromSourceFile(sourceFile, "dummy-file.ts");
    const exportEdges = extractExportsFromSourceFile(sourceFile, symbols, "dummy-file.ts");
    return { error: false, symbols, imports, exportEdges, diagnostics: null };
  }
  // Otherwise take in filepaths
  else {
    const projectSymbols = [];
    const projectExportEdges = [];
    const importsPerFile: Record<string, ImportFact[]> = {};

    // Parse input
    for (const filepath of input) {
      // const dummyRelativePath = "./src/dummy-files/ts/index.ts";
      const absolutePath = path.resolve(root, filepath);
      project;
      project.addSourceFileAtPath(absolutePath);
      const sourceFile = project.getSourceFileOrThrow(absolutePath);

      // Check for errors
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      const containsErrors = diagnostics.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
      console.log(diagnostics.map((d) => d.getMessageText() + " " + d.getSourceFile()?.getFilePath()));
      if (containsErrors) return { error: true, symbols: null, imports: null, exportEdges: null, diagnostics };

      // Collect all symbols
      const symbols = extractSymbolsFromSourceFile(sourceFile, absolutePath);
      projectSymbols.push(...symbols);

      // Collect all export edges
      const exportEdges = extractExportsFromSourceFile(sourceFile, symbols, absolutePath);
      projectExportEdges.push(...exportEdges);

      // Collect file-specific imports
      const imports = extractImportsFromSourceFile(sourceFile, absolutePath);
      importsPerFile[filepath] = imports;
    }

    return { error: false, symbols: projectSymbols, imports: [], exportEdges: projectExportEdges, diagnostics: null };
  }
};
