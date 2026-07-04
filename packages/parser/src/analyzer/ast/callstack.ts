import {
  ArrowFunction,
  ClassDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  MethodDeclaration,
  Node,
  ObjectLiteralExpression,
  SourceFile,
  SyntaxKind,
  VariableDeclaration,
} from "ts-morph";

type CallstackEntry = {
  name: string;
  kind: string;
};

export const getLexicalPath = (node: Node, relativePath: string): CallstackEntry[] => {
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
      case SyntaxKind.SourceFile: {
        ancestorName = relativePath;
        break;
      }
      case SyntaxKind.ArrowFunction:
      case SyntaxKind.FunctionExpression: {
        const parent = maybeNamedAncestor.getParentIfKind(SyntaxKind.VariableDeclaration);
        if (!parent) continue;
        ancestorName = parent.getName();
        break;
      }
      case SyntaxKind.ObjectLiteralExpression: {
        const property = maybeNamedAncestor.getParentIfKind(SyntaxKind.PropertyAssignment);
        const parent = maybeNamedAncestor.getParent();
        if (!property) {
          // Check to see if the object is unnamed AND a default export
          if (Node.isExportAssignment(parent)) {
            ancestorName = "default";
            break;
          }
          // Not a property of another object AND not a default export, skip
          continue;
        }

        ancestorName = property.getName();
        break;
      }

      default: {
        const namedAncestor = maybeNamedAncestor as
          | VariableDeclaration
          | FunctionDeclaration
          | MethodDeclaration
          | ClassDeclaration;

        let name = namedAncestor.getName();
        if (Node.isClassDeclaration(namedAncestor) && namedAncestor.isDefaultExport()) {
          name = "default";
        }
        if (!name) throw new Error("Anonymous class detected");
        ancestorName = name;
      }
    }

    nameKindPairs.push({ name: ancestorName, kind: ancestor.getKindName() });
  }

  return nameKindPairs;
};
