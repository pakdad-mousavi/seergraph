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
  ObjectLiteralExpression,
  Project,
  SourceFile,
  SyntaxKind,
  ts,
  VariableDeclaration,
} from "ts-morph";
import { writeFileSync } from "node:fs";

const getLocation = (node: Node, fileId: string): Location => {
  return {
    fileId,
    startLine: node.getStartLineNumber(false),
    startChar: node.getStart(false),
    endLine: node.getEndLineNumber(),
    endChar: node.getEnd(),
  };
};

const getSymbolId = (callstack: { name: string; kind: string }[]) => {
  const reversed = callstack.reverse();
  const source = reversed.splice(0, 1)[0];
  return `${source.name}#${reversed.map((s) => s.name).join(".")}`;
};

const getCallstack = (node: Node, relativePath: string) => {
  const symbolKinds = [
    // TOP-LEVEL
    SyntaxKind.SourceFile,

    // FUNCTION-RELATED
    SyntaxKind.FunctionDeclaration,
    SyntaxKind.FunctionExpression,
    SyntaxKind.MethodDeclaration,
    SyntaxKind.ArrowFunction,

    // VARIABLES (EXPORT-ONLY SHOULD BE GIVEN)
    SyntaxKind.VariableDeclaration,

    // CLASSES
    SyntaxKind.ClassDeclaration,
    SyntaxKind.ObjectLiteralExpression,
  ];

  const stack = [];
  const nameKindPairs: { name: string; kind: string }[] = [];
  let ignoreNextVariableDecl =
    node.getKind() === SyntaxKind.ArrowFunction || node.getKind() === SyntaxKind.FunctionExpression;

  const ancestors = node.getAncestors();
  for (const ancestor of ancestors) {
    const isBlock = ancestor.getKind() === SyntaxKind.Block;
    const shouldSkipVariable = ignoreNextVariableDecl && ancestor.getKind() === SyntaxKind.VariableDeclaration;

    if (isBlock) continue;
    if (shouldSkipVariable) {
      ignoreNextVariableDecl = false;
      continue;
    }

    if (ancestor.getKind() === SyntaxKind.ArrowFunction || ancestor.getKind() === SyntaxKind.FunctionExpression) {
      ignoreNextVariableDecl = true;
    }

    if (symbolKinds.includes(ancestor.getKind())) {
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
      | ObjectLiteralExpression
      | ClassDeclaration;

    let ancestorName: string;
    switch (maybeNamedAncestor.getKind()) {
      case SyntaxKind.SourceFile:
        ancestorName = relativePath;
        break;
      case SyntaxKind.ArrowFunction:
      case SyntaxKind.FunctionExpression:
        const parent = maybeNamedAncestor.getParentIfKind(SyntaxKind.VariableDeclaration);
        if (!parent) throw new Error("Anonymous arrow function detected");
        ancestorName = parent.getName();
        break;
      case SyntaxKind.ObjectLiteralExpression:
        const property = maybeNamedAncestor.getParentIfKind(SyntaxKind.PropertyAssignment);
        if (!property) continue; // Not a property of another object, skip

        ancestorName = property.getName();
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

        const methodLikeKinds = ["ArrowFunction", "FunctionExpression", "MethodDeclaration"];

        // If the value of the variable is an object
        if (exprKind === "ObjectLiteralExpression") {
          const properties = expr.getDescendantsOfKind(SyntaxKind.PropertyAssignment);
          const methodChildren = new Set(
            properties.flatMap((p) => p.getDescendants().filter((d) => methodLikeKinds.includes(d.getKindName()))),
          );
          const directMethods = expr.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
          for (const method of directMethods) methodChildren.add(method);
          const objectChildren = expr.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);

          // Only take the object if it has callable methods anywhere inside
          if (methodChildren.size > 0) {
            const callstack = getCallstack(expr, relativePath);
            const id = getSymbolId(callstack);

            symbols.push({
              id,
              name,
              kind: "variable",
              location: getLocation(varDecl, relativePath),
            });

            // Add all methods of the object that are method-like
            for (const method of methodChildren) {
              let name;
              let nodeForCallstack;
              if (method.getKindName() === "ArrowFunction" || method.getKindName() === "FunctionExpression") {
                nodeForCallstack = method.getParentIfKind(SyntaxKind.PropertyAssignment);
                if (!nodeForCallstack) {
                  throw Error(
                    "Arrow function or function expression not assigned as a property found inside of an object.",
                  );
                }

                name = nodeForCallstack.getName();
              } else {
                nodeForCallstack = method;
                name = (method as MethodDeclaration).getName();
                console.log("uhrbfvoiwejbvqkwjnvqekdwjvbeqwdkjb");
              }

              const callstack = getCallstack(nodeForCallstack, relativePath);
              const id = getSymbolId([{ name, kind: nodeForCallstack.getKindName() }, ...callstack]);

              symbols.push({
                id,
                name: name,
                kind: "method",
                location: getLocation(method, relativePath),
              });
            }

            // Add all objects that act as namespaces, for callable methods only
            for (const obj of objectChildren) {
              if (obj.getDescendants().some((d) => methodLikeKinds.includes(d.getKindName()))) {
                const property = obj.getParentIfKind(SyntaxKind.PropertyAssignment);
                if (!property) continue;
                const callstack = getCallstack(property, relativePath);
                const id = getSymbolId([{ name: property.getName(), kind: property.getKindName() }, ...callstack]);

                symbols.push({
                  id,
                  name: property.getName(),
                  kind: "property",
                  location: getLocation(property, relativePath),
                });
              }
            }
          }
        }

        // If the value of the variable is a function expression or arrow function
        else if (exprKind === "FunctionExpression" || exprKind === "ArrowFunction") {
          // (expr as FunctionDeclaration).getFunctions()
          const callstack = getCallstack(expr, relativePath);
          const id = getSymbolId([{ name, kind: exprKind }, ...callstack]);

          symbols.push({
            id,
            name,
            kind: "function",
            location: getLocation(varDecl, relativePath),
          });
        }

        // If the variable is being exported
        else if (varDecl.isExported() && exprKind !== "FunctionExpression" && exprKind !== "ArrowFunction") {
          const callstack = getCallstack(varDecl, relativePath);
          const id = getSymbolId([{ name, kind: nodeType }, ...callstack]);

          symbols.push({
            id,
            name,
            kind: "variable",
            location: getLocation(varDecl, relativePath),
          });
        }

        break;
      }

      case "ClassDeclaration": {
        // Create the class symbol
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

        // Create symbols for the class's methods
        const methods = classDecl.getMethods();
        for (const method of methods) {
          const callstack = getCallstack(method, relativePath);
          const id = getSymbolId([{ name: method.getName(), kind: method.getKindName() }, ...callstack]);

          symbols.push({
            id,
            name: method.getName(),
            kind: "method",
            location: getLocation(method, relativePath),
          });
        }

        break;
      }
    }
  });

  console.log(symbols.filter((s) => s.kind));
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
    const dummyRelativePath = "./src/dummy-files/ts/index.ts";
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
