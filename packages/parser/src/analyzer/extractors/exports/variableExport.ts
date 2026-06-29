import { Edge, toFileId, toSymbolId } from "@seergraph/shared";
import { randomUUID } from "node:crypto";
import { Node, PropertyAssignment, Symbol, VariableDeclaration } from "ts-morph";
import { getCallstack, getSymbolId } from "../../ast";

export const extractExportsFromVariableDecl = (
  node: VariableDeclaration,
  exportSymbol: Symbol,
  relativePath: string,
): Edge | null => {
  // Get the initializer of the exported variable declaration
  const initializer = node.getInitializer();

  // Only process the following types of variables, and not string/numeric literals
  if (
    Node.isArrowFunction(initializer) ||
    Node.isFunctionExpression(initializer) ||
    Node.isObjectLiteralExpression(initializer)
  ) {
    return {
      id: randomUUID(),
      from: toFileId(relativePath),
      to: toSymbolId(`${relativePath}#${exportSymbol.getName()}`),
      kind: "exports",
      meta: {
        exportedAs: exportSymbol.getName(),
        isDefault: (exportSymbol.getValueDeclaration() as VariableDeclaration).isDefaultExport(),
      },
    };
  }

  if (Node.isPropertyAccessExpression(initializer)) {
    const propertyAssignment = initializer.getSymbol()?.getDeclarations()[0] as PropertyAssignment;
    const callstack = getCallstack(propertyAssignment, relativePath);
    const { id } = getSymbolId([
      { name: propertyAssignment.getName(), kind: propertyAssignment.getKindName() },
      ...callstack,
    ]);

    return {
      id: randomUUID(),
      from: toFileId(relativePath),
      to: toSymbolId(id),
      kind: "exports",
      meta: {
        exportedAs: exportSymbol.getName(),
      },
    };
  }

  return null;
};
