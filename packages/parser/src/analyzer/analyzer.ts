import path from "node:path";
import { Diagnostic, Project, SourceFile, ts } from "ts-morph";

import type { ImportFact } from "../types";

import { extractExportsFromSourceFile } from "./sourceFile/extractExports";
import { extractSymbolsFromSourceFile } from "./sourceFile/extractSymbols";
import { extractImportsFromSourceFile } from "./sourceFile/extractImports";
import { resolveImports } from "./sourceFile/resolveImports";
import { GraphBuilder } from "./builders/graphBuilder";

type AnalyzerOptions =
  | {
      root: string;
      projectInit: "empty";
      input: string[];
    }
  | {
      root: string;
      projectInit: "empty";
      input: Record<string, string>;
    }
  | {
      root: string;
      projectInit: "tsconfig";
      input?: never;
    }
  | {
      root: string;
      projectInit: "tsconfig";
      input: string[];
    }
  | {
      root: string;
      projectInit: "tsconfig";
      input: Record<string, string>;
    };

type AnalyzerReturn =
  | { error: true; graphBuilder: null; diagnostics: Diagnostic[] }
  | { error: false; graphBuilder: GraphBuilder; diagnostics: null };

export const analyzer = (options: AnalyzerOptions): AnalyzerReturn => {
  const { root, input, projectInit } = options;

  // --------------------
  // Initialize project
  // --------------------
  const project =
    projectInit === "tsconfig"
      ? new Project({
          tsConfigFilePath: path.join(root, "tsconfig.json"),
          skipAddingFilesFromTsConfig: !!input,
        })
      : new Project();

  const graphBuilder = GraphBuilder.createDefault();
  const importsPerFile: Record<string, ImportFact[]> = {};

  // ----------------------------------------
  // Normalize input into a single iterable
  // ----------------------------------------
  const entries: { filepath: string; sourceFile: SourceFile }[] = [];

  if (Array.isArray(input)) {
    for (const filepath of input) {
      const absolutePath = path.resolve(root, filepath);
      const sourceFile = project.addSourceFileAtPath(absolutePath);

      entries.push({ filepath, sourceFile });
    }
  } else if (input) {
    for (const [filepath, content] of Object.entries(input)) {
      const sourceFile = project.createSourceFile(filepath, content, {
        overwrite: true,
      });

      entries.push({ filepath, sourceFile });
    }
  } else {
    const sourceFiles = project.getSourceFiles();
    for (const sourceFile of sourceFiles) {
      const filepath = sourceFile.getFilePath();

      entries.push({ filepath, sourceFile });
    }
  }

  // -------------------------
  // Run analysis on project
  // -------------------------
  for (const entry of entries) {
    const { filepath, sourceFile } = entry;

    // Check for errors
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    const containsErrors = diagnostics.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
    if (containsErrors) return { error: true, graphBuilder: null, diagnostics };

    // Extraction
    extractSymbolsFromSourceFile(sourceFile, filepath, graphBuilder);
    extractExportsFromSourceFile(sourceFile, filepath, graphBuilder);
    const imports = extractImportsFromSourceFile(sourceFile, root);
    importsPerFile[filepath] = imports;
  }

  // Resolve imports after collecting all file's imports/exports
  resolveImports(importsPerFile, graphBuilder);

  return { error: false, graphBuilder, diagnostics: null };
};
