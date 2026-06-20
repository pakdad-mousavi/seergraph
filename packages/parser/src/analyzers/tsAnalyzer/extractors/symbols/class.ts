import { ClassDeclaration } from "ts-morph";
import { SymbolFact } from "../../../types";
import { getCallstack, getLocation, getSymbolId } from "../../ast";

export function* extractClassDeclaration(node: ClassDeclaration, relativePath: string): Generator<SymbolFact> {
  const name = node.isDefaultExport() ? "default" : node.getName();
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
