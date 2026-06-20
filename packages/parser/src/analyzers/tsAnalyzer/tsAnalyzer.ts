import { Edge } from "@seergraph/shared";
import type { SymbolFact } from "../types";
import path from "node:path";

// SYMBOL EXTRACTION FUNCTIONS
import { extractFunctionDeclaration, extractVariableDeclaration, extractClassDeclaration } from "./extractors/symbols";

// EXPORT EXTRACTION FUNCTIONS
import {
  extractExportsFromVariableDecl,
  extractExportsFromInlineDecl,
  extractExportsFromExportSpecifier,
  extractExportsFromExportAssignment,
} from "./extractors/exports";

import { Diagnostic, Node, Project, SourceFile, ts } from "ts-morph";

const extractSymbolsFromNode = (node: Node, relativePath: string) => {
  const symbols: SymbolFact[] = [];

  if (Node.isFunctionDeclaration(node)) {
    symbols.push(...extractFunctionDeclaration(node, relativePath));
  } else if (Node.isVariableDeclaration(node)) {
    symbols.push(...extractVariableDeclaration(node, relativePath));
  } else if (Node.isClassDeclaration(node)) {
    symbols.push(...extractClassDeclaration(node, relativePath));
  }

  return symbols;
};

const extractSymbolsFromSourceFile = (sourceFile: SourceFile, relativePath: string) => {
  const symbols: SymbolFact[] = [];

  sourceFile.forEachDescendant((node) => {
    console.log(node.getKindName());
    symbols.push(...extractSymbolsFromNode(node, relativePath));
  });

  console.log(symbols.filter((s) => s.kind));
  return symbols;
};

const extractExportsFromSourceFile = (sourceFile: SourceFile, symbols: SymbolFact[], relativePath: string) => {
  const expSyms = sourceFile.getExportSymbols();
  const edges: Edge[] = [];

  for (const s of expSyms) {
    const decl = s.getDeclarations()[0];
    console.log(decl.getKindName());
    if (Node.isVariableDeclaration(decl)) {
      const edge = extractExportsFromVariableDecl(decl, s, relativePath);
      if (edge) edges.push(edge);
    }

    if (Node.isFunctionDeclaration(decl) || Node.isClassDeclaration(decl)) {
      const edge = extractExportsFromInlineDecl(s, relativePath);
      if (edge) edges.push(edge);
    }

    if (Node.isExportSpecifier(decl)) {
      const edge = extractExportsFromExportSpecifier(s, relativePath);
      if (edge) edges.push(edge);
    }

    if (Node.isExportAssignment(decl)) {
      const res = extractExportsFromExportAssignment(s, relativePath);
      if (res) {
        const { edge, symbols: syms } = res;
        console.log(syms);
        symbols.push(...syms);
        if (edge) edges.push(edge);
      }
    }
  }

  return edges;
};

type AnalyzerArgs =
  | [root: string, input: string[]] // Input is filepaths
  | [root: string, input: string[], testingMode: false] // Input is filepaths
  | [root: string, input: string, testingMode: true]; // Input is source code

type AnalyzerReturn =
  | { error: true; symbols: null; exportEdges: null; diagnostics: Diagnostic[] }
  | { error: false; symbols: SymbolFact[]; exportEdges: Edge[]; diagnostics: null };

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
    if (containsErrors) return { error: true, symbols: null, exportEdges: null, diagnostics };

    // Return data
    const symbols = extractSymbolsFromSourceFile(sourceFile, "dummy-file.ts");
    const exportEdges = extractExportsFromSourceFile(sourceFile, symbols, "dummy-file.ts");
    return { error: false, symbols, exportEdges, diagnostics: null };
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
    if (containsErrors) return { error: true, symbols: null, exportEdges: null, diagnostics };

    // Return data
    const symbols = extractSymbolsFromSourceFile(sourceFile, dummyRelativePath);
    const exportEdges = extractExportsFromSourceFile(sourceFile, symbols, dummyRelativePath);
    return { error: false, symbols, exportEdges, diagnostics: null };
  }
};
