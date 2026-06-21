import path from "node:path";
import { Diagnostic, Project, ts } from "ts-morph";

import { Edge } from "@seergraph/shared";
import type { ImportFact, SymbolFact } from "../types";

import { extractExportsFromSourceFile } from "./sourceFile/extractExports";
import { extractSymbolsFromSourceFile } from "./sourceFile/extractSymbols";
import { extractImportsFromSourceFile } from "./sourceFile/extractImports";

type AnalyzerArgs =
  | [root: string, input: string[]] // Input is filepaths
  | [root: string, input: string[], testingMode: false] // Input is filepaths
  | [root: string, input: string, testingMode: true]; // Input is source code

type AnalyzerReturn =
  | { error: true; symbols: null; imports: null; exportEdges: null; diagnostics: Diagnostic[] }
  | { error: false; symbols: SymbolFact[]; imports: ImportFact[]; exportEdges: Edge[]; diagnostics: null };

export const tsAnalyzer = (...args: AnalyzerArgs): AnalyzerReturn => {
  const [root, input, testingMode] = args;
  // const absPath = path.resolve(this.root, filePath);
  const project = new Project();

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
    // Parse input
    const dummyRelativePath = "./src/dummy-files/ts/index.ts";
    const dummyPathToChangeToAbsPath = path.resolve(dummyRelativePath);
    project.addSourceFileAtPath(dummyPathToChangeToAbsPath);
    const sourceFile = project.getSourceFileOrThrow(dummyPathToChangeToAbsPath);

    // Check for errors
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    const containsErrors = diagnostics.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
    if (containsErrors) return { error: true, symbols: null, imports: null, exportEdges: null, diagnostics };

    // Return data
    const symbols = extractSymbolsFromSourceFile(sourceFile, dummyRelativePath);
    const imports = extractImportsFromSourceFile(sourceFile, dummyRelativePath);
    const exportEdges = extractExportsFromSourceFile(sourceFile, symbols, dummyRelativePath);
    return { error: false, symbols, imports, exportEdges, diagnostics: null };
  }
};
