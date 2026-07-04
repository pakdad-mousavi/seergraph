import { FunctionDeclaration } from "ts-morph";
import { SymbolNode } from "@seergraph/shared";
import { getLexicalPath, getLocation, getSymbolId } from "../../ast";

export function* extractFunctionDeclaration(node: FunctionDeclaration, relativePath: string): Generator<SymbolNode> {
  const isDefExp = node.isDefaultExport();
  const name = isDefExp ? "default" : node.getName();
  if (!name) return;

  const callstack = getLexicalPath(node, relativePath);
  const { id, parentId } = getSymbolId([{ name, kind: node.getKindName() }, ...callstack]);

  yield {
    id,
    parentId,
    name,
    kind: "function",
    location: getLocation(node, relativePath),
  };
}
