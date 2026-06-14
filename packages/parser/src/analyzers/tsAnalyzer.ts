import { Location } from "@seergraph/shared";
import type { FileFact, SymbolFact } from "./types";
import path from "node:path";

import {
  ArrowFunction,
  ClassDeclaration,
  Diagnostic,
  FunctionDeclaration,
  FunctionExpression,
  MethodDeclaration,
  Node,
  Project,
  SourceFile,
  SyntaxKind,
  ts,
  VariableDeclaration,
} from "ts-morph";

const getLocation = (node: Node, fileId: string): Location => {
  return {
    fileId,
    startLine: node.getStartLineNumber(false),
    startChar: node.getStart(false),
    endLine: node.getEndLineNumber(),
    endChar: node.getEnd(),
  };
};

const getParentId = (node: Node, relativePath: string) => {
  const parent = node.getParent();
  if (parent?.getKindName() === "SourceFile") {
    return "SourceFile";
  } else if (parent?.getKindName() === "Block") {
    const grandparent = parent?.getParent();
    return grandparent?.getKindName();
  }
};

const getSymbolId = (callstack: { name: string; kind: string }[]) => {
  console.log("XXXX", callstack);
  const id: string[] = [];
  let isFirstIteration = true;

  // Put id together based on callstack
  callstack.reverse().forEach((item, idx) => {
    if (isFirstIteration) {
      id.push(item.name, "#");
      isFirstIteration = false;
    } else if (idx === callstack.length - 1) {
      id.push(item.name);
    } else {
      id.push(item.name, ".");
    }
  });

  // Return id
  console.log(id.join(""));
  return id.join("");
};

const getCallstack = (node: Node, relativePath: string) => {
  const symbolKinds = [
    // TOP-LEVEL
    "SourceFile",

    // FUNCTION-RELATED
    "FunctionDeclaration",
    "FunctionExpression",
    "MethodDeclaration",
    "ArrowFunction",

    // VARIABLES (EXPORT-ONLY SHOULD BE GIVEN)
    "VariableDeclaration",

    // CLASSES
    "ClassDeclaration",
  ];

  const stack = [];
  const nameKindPairs: { name: string; kind: string }[] = [];
  let ignoreNextVariableDecl = node.getKindName() === "ArrowFunction" || node.getKindName() === "FunctionExpression";

  const ancestors = node.getAncestors();
  console.log(ancestors.map((a) => a.getKindName()));
  for (const ancestor of ancestors) {
    const isBlock = ancestor.getKindName() === "Block";
    const shouldSkipVariable = ignoreNextVariableDecl && ancestor.getKindName() === "VariableDeclaration";

    if (isBlock) continue;
    if (shouldSkipVariable) {
      ignoreNextVariableDecl = false;
      continue;
    }

    if (ancestor.getKindName() === "ArrowFunction" || ancestor.getKindName() === "FunctionExpression") {
      ignoreNextVariableDecl = true;
    }

    if (symbolKinds.includes(ancestor.getKindName())) {
      stack.push(ancestor);
    }
  }

  for (const ancestor of stack) {
    const maybeNamedAncestor = ancestor as
      | SourceFile
      | ArrowFunction
      | FunctionExpression
      | FunctionDeclaration
      | MethodDeclaration
      | VariableDeclaration
      | ClassDeclaration;

    let ancestorName: string;
    switch (maybeNamedAncestor.getKindName()) {
      case "SourceFile":
        ancestorName = relativePath;
        break;
      case "ArrowFunction":
      case "FunctionExpression":
        const parent = maybeNamedAncestor.getParentIfKind(SyntaxKind.VariableDeclaration);
        if (!parent) throw new Error("Anonymous arrow function detected");
        ancestorName = parent.getName();
        break;
      default:
        const namedAncestor = maybeNamedAncestor as
          | VariableDeclaration
          | FunctionDeclaration
          | MethodDeclaration
          | ClassDeclaration;

        const name = namedAncestor.getName();
        if (!name) throw new Error("Anonymous class detected");
        ancestorName = name;
    }

    nameKindPairs.push({ name: ancestorName, kind: ancestor.getKindName() });
  }

  console.log(nameKindPairs);
  return nameKindPairs;
};

const extractSymbols = (sourceFile: SourceFile, relativePath: string) => {
  const symbols: SymbolFact[] = [];
  sourceFile.forEachDescendant((node) => {
    console.log(node.getKindName());
    // Get node type
    const nodeType = node.getKindName();

    switch (nodeType) {
      case "FunctionDeclaration": {
        const funcDecl = node as FunctionDeclaration;
        const name = funcDecl.getName();
        if (!name) break;

        const callstack = getCallstack(funcDecl, relativePath);
        const id = getSymbolId([{ name, kind: nodeType }, ...callstack]);

        symbols.push({
          id,
          name,
          kind: "function",
          location: getLocation(funcDecl, relativePath),
        });

        break;
      }

      case "VariableDeclaration": {
        const varDecl = node as VariableDeclaration;
        const expr = varDecl.getChildAtIndex(2);
        const exprKind = expr.getKindName();
        const name = varDecl.getName();

        // Handle arrow functions and function expressions (stored as a variable)
        if (exprKind === "FunctionExpression" || exprKind === "ArrowFunction") {
          const callstack = getCallstack(expr, relativePath);
          const id = getSymbolId([{ name, kind: exprKind }, ...callstack]);

          symbols.push({
            id,
            name,
            kind: "function",
            location: getLocation(varDecl, relativePath),
          });
        }

        // Handle exported variables
        else if (varDecl.isExported() && exprKind !== "FunctionExpression" && exprKind !== "ArrowFunction") {
          const callstack = getCallstack(varDecl, relativePath);
          const id = getSymbolId([{ name, kind: nodeType }, ...callstack]);

          symbols.push({
            id,
            name,
            kind: "variable",
            location: getLocation(varDecl, relativePath),
          });
        } else if (varDecl) break;

        break;
      }

      case "ClassDeclaration": {
        const classDecl = node as ClassDeclaration;
        const name = classDecl.getName();
        if (!name) break;

        const callstack = getCallstack(classDecl, relativePath);
        const id = getSymbolId([{ name, kind: nodeType }, ...callstack]);

        symbols.push({
          id,
          name,
          kind: "class",
          location: getLocation(classDecl, relativePath),
        });

        break;
      }

      case "MethodDeclaration": {
        const methodDecl = node as MethodDeclaration;

        // Add method
        const callstack = getCallstack(methodDecl, relativePath);
        const id = getSymbolId([{ name: methodDecl.getName(), kind: methodDecl.getKindName() }, ...callstack]);

        symbols.push({
          id,
          name: methodDecl.getName(),
          kind: "method",
          location: getLocation(methodDecl, relativePath),
        });

        // Check to see if the parent is an object literal
        const parent = methodDecl.getParentIfKind(SyntaxKind.ObjectLiteralExpression);
        const varDeclParent = parent?.getParentIfKind(SyntaxKind.VariableDeclaration);
        if (!parent || !varDeclParent) break;

        const parentCallstack = getCallstack(methodDecl, relativePath);
        const parentId = getSymbolId([...parentCallstack]);

        symbols.push({
          id: parentId,
          name: varDeclParent.getName(),
          kind: "variable",
          location: getLocation(parent, relativePath),
        });

        break;
      }
    }
  });

  console.log(symbols);
  return symbols;
};

type AnalyzerArgs =
  | [root: string, input: string[]] // Input is filepaths
  | [root: string, input: string[], testingMode: false] // Input is filepaths
  | [root: string, input: string, testingMode: true]; // Input is source code

type AnalyzerReturn =
  | { error: true; symbols: null; diagnostics: Diagnostic[] }
  | { error: false; symbols: SymbolFact[]; diagnostics: null };

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
    if (containsErrors) return { error: true, symbols: null, diagnostics };

    // Return data
    const symbols = extractSymbols(sourceFile, "dummy-file.ts");
    return { error: false, symbols, diagnostics: null };
  }
  // Otherwise take in filepaths
  else {
    // Parse input
    const dummyRelativePath = "./src/dummy-files/index.ts";
    const dummyPathToChangeToAbsPath = path.resolve(dummyRelativePath);
    project.addSourceFileAtPath(dummyPathToChangeToAbsPath);
    const sourceFile = project.getSourceFileOrThrow(dummyPathToChangeToAbsPath);

    // Check for errors
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    const containsErrors = diagnostics.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
    if (containsErrors) return { error: true, symbols: null, diagnostics };

    // Return data
    const symbols = extractSymbols(sourceFile, dummyRelativePath);
    return { error: false, symbols, diagnostics: null };
  }
};
