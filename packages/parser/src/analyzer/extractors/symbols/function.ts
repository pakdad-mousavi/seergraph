import { FunctionDeclaration } from "ts-morph";
import { SymbolFact } from "../../../types";
import { getCallstack, getLocation, getSymbolId } from "../../ast";
import { toSymbolId } from "@seergraph/shared";

export function* extractFunctionDeclaration(node: FunctionDeclaration, relativePath: string): Generator<SymbolFact> {
  const isDefExp = node.isDefaultExport();
  const name = isDefExp ? "default" : node.getName();
  if (!name) return;

  const callstack = getCallstack(node, relativePath);
  const { id, parentId } = getSymbolId([{ name, kind: node.getKindName() }, ...callstack]);

  yield {
    id: toSymbolId(id),
    parentId,
    name,
    kind: "function",
    location: getLocation(node, relativePath),
  };
}
