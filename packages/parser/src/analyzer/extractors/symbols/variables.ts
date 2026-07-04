import { Node, VariableDeclaration } from "ts-morph";
import { SymbolNode } from "@seergraph/shared";
import { getLexicalPath, getLocation, getSymbolId } from "../../ast";
import { extractObjectLiteral } from "./object";

export function* extractVariableDeclaration(node: VariableDeclaration, relativePath: string): Generator<SymbolNode> {
  const name = node.getName();
  const initializer = node.getInitializer();
  if (!initializer) return;

  if (Node.isObjectLiteralExpression(initializer)) {
    yield* extractObjectLiteral(initializer, name, relativePath);
  }

  if (Node.isFunctionExpression(initializer)) {
    const callstack = getLexicalPath(initializer, relativePath);
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
    const callstack = getLexicalPath(initializer, relativePath);
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
