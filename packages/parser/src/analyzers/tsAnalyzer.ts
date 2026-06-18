import { Location } from "@seergraph/shared";
import type { SymbolFact } from "./types";
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

const getLocation = (node: Node, fileId: string): Location => {
  return {
    fileId,
    startLine: node.getStartLineNumber(false),
    startChar: node.getStart(false),
    endLine: node.getEndLineNumber(),
    endChar: node.getEnd(),
  };
};

type CallstackEntry = {
  name: string;
  kind: string;
};

const getSymbolId = (callstack: { name: string; kind: string }[]) => {
  const reversed = callstack.reverse();
  const source = reversed.splice(0, 1)[0];
  const id = `${source.name}#${reversed.map((s) => s.name).join(".")}`;
  const parentId = `${source.name}#${reversed
    .slice(0, reversed.length - 1)
    .map((s) => s.name)
    .join(".")}`;
  return { id, parentId: parentId.endsWith("#") ? source.name : parentId };
};

// const getSymbolId = (...args: [callstack: CallstackEntry[]] | [relativePath: string, name: string]) => {
//   const [callstackOrPath, name] = args;
//   if (typeof callstackOrPath === "string") {
//     const path = callstackOrPath;
//     return { id: `${path}#${name}`, parentId: path };
//   }
//   const callstack = callstackOrPath;
//   const reversed = callstack.reverse();
//   const source = reversed.splice(0, 1)[0];
//   const id = `${source.name}#${reversed.map((s) => s.name).join(".")}`;
//   const parentId = `${source.name}#${reversed
//     .slice(0, reversed.length - 1)
//     .map((s) => s.name)
//     .join(".")}`;
//   return { id, parentId: parentId.endsWith("#") ? source.name : parentId };
// };

const getCallstack = (node: Node, relativePath: string): CallstackEntry[] => {
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

function* extractFunctionDeclaration(node: FunctionDeclaration, relativePath: string): Generator<SymbolFact> {
  const name = node.getName();
  if (!name) return;

  const callstack = getCallstack(node, relativePath);
  const { id, parentId } = getSymbolId([{ name, kind: node.getKindName() }, ...callstack]);

  yield {
    id,
    parentId,
    name,
    kind: "function",
    location: getLocation(node, relativePath),
  };
}

function* extractVariableDeclaration(node: VariableDeclaration, relativePath: string): Generator<SymbolFact> {
  const name = node.getName();
  const initializer = node.getInitializer();
  if (!initializer) return;

  if (Node.isObjectLiteralExpression(initializer)) {
    yield* extractObjectLiteral(initializer, name, relativePath);
  }

  if (Node.isFunctionExpression(initializer)) {
    const callstack = getCallstack(initializer, relativePath);
    const { id, parentId } = getSymbolId([{ name, kind: initializer.getKindName() }, ...callstack]);
    yield {
      id,
      parentId,
      name,
      kind: "function",
      location: getLocation(node, relativePath),
    };
  }
  if (Node.isArrowFunction(initializer)) {
    const callstack = getCallstack(initializer, relativePath);
    const { id, parentId } = getSymbolId([{ name, kind: initializer.getKindName() }, ...callstack]);
    yield {
      id,
      parentId,
      name,
      kind: "function",
      location: getLocation(node, relativePath),
    };
  }
}

function* extractClassDeclaration(node: ClassDeclaration, relativePath: string): Generator<SymbolFact> {
  const name = node.getName();
  if (!name) return;

  const callstack = getCallstack(node, relativePath);
  const { id, parentId } = getSymbolId([{ name, kind: node.getKindName() }, ...callstack]);

  yield {
    id,
    parentId,
    name,
    kind: "class",
    location: getLocation(node, relativePath),
  };

  // Create symbols for the class's methods
  const methods = node.getMethods();
  for (const method of methods) {
    const callstack = getCallstack(method, relativePath);
    const { id, parentId } = getSymbolId([{ name: method.getName(), kind: method.getKindName() }, ...callstack]);

    yield {
      id,
      parentId,
      name: method.getName(),
      kind: "method",
      location: getLocation(method, relativePath),
    };
  }
}

function* extractObjectLiteral(
  node: ObjectLiteralExpression,
  name: string,
  relativePath: string,
  isFirstRun: boolean = true,
): Generator<SymbolFact> {
  // Use to collect symbolFacts. Needed so that symbolFacts can be emitted in hierarchical order
  const symbolFacts: SymbolFact[] = [];

  // All properties of the current object
  const props = node.getProperties();

  // Flag to specify if a the current object contains callable descendants
  let containsCallableDescendants = false;

  // Loop through each object property
  for (const prop of props) {
    // -----------------------------------
    // Handle all of the object's methods
    // -----------------------------------
    if (Node.isMethodDeclaration(prop)) {
      const name = prop.getName();
      const callstack = getCallstack(prop, relativePath);
      const { id, parentId } = getSymbolId([{ name, kind: prop.getKindName() }, ...callstack]);

      symbolFacts.push({
        id,
        parentId,
        name,
        kind: "method",
        location: getLocation(prop, relativePath),
      });

      containsCallableDescendants = true;
      continue;
    }

    // --------------------------------------
    // Handle all of the object's properties
    // --------------------------------------
    if (Node.isPropertyAssignment(prop)) {
      // Get initializer node
      const initializer = prop.getInitializer();

      // -------------------------------------
      // Recursively get all object's methods
      // -------------------------------------
      if (Node.isObjectLiteralExpression(initializer)) {
        const name = prop.getName();
        const symbols = [...extractObjectLiteral(initializer, name, relativePath, false)];
        containsCallableDescendants ||= symbols.length > 0;
        symbolFacts.push(...symbols);
        continue;
      }

      // -------------------------------------------------------------------
      // Handle arrow functions / function expressions stored in a property
      // -------------------------------------------------------------------
      if (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer)) {
        const name = prop.getName();
        const callstack = getCallstack(prop, relativePath);
        const { id, parentId } = getSymbolId([{ name, kind: prop.getKindName() }, ...callstack]);
        symbolFacts.push({
          id,
          parentId,
          name,
          kind: "method",
          location: getLocation(initializer, relativePath),
        });
        containsCallableDescendants = true;
        continue;
      }
    }
  }

  // -------------------------------------------------------------
  // If the object had callable children, emit the object symbol,
  // then emit all of the symbols collected under that object
  // -------------------------------------------------------------
  if (containsCallableDescendants) {
    const callstack = getCallstack(node, relativePath);
    // Only insert the node's name if it is not a top-level ObjectLiteralExpression
    if (!isFirstRun) {
      callstack.unshift({ name, kind: node.getKindName() });
    }

    const { id, parentId } = getSymbolId(callstack);
    yield {
      id,
      parentId,
      name,
      kind: "object",
      location: getLocation(node, relativePath),
    };

    yield* symbolFacts;
  }
}

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
    const symbols = extractSymbolsFromSourceFile(sourceFile, "dummy-file.ts");
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
    const symbols = extractSymbolsFromSourceFile(sourceFile, dummyRelativePath);
    return { error: false, symbols, diagnostics: null };
  }
};
