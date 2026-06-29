import { toFileId, toSymbolId } from "@seergraph/shared";

export const getSymbolId = (callstack: { name: string; kind: string }[]) => {
  const reversed = callstack.reverse();
  const source = reversed.splice(0, 1)[0];
  const id = `${source.name}#${reversed.map((s) => s.name).join(".")}`;
  const parentId = `${source.name}#${reversed
    .slice(0, reversed.length - 1)
    .map((s) => s.name)
    .join(".")}`;
  return { id: toSymbolId(id), parentId: parentId.endsWith("#") ? toFileId(source.name) : toSymbolId(parentId) };
};
