import { LexicalScope, toFileId, toSymbolId } from "@seergraph/shared";

export const getSymbolId = (lexicalStack: { name: string; kind: string }[]): LexicalScope => {
  // Duplicate to avoid modification of original stack
  const stack = lexicalStack.slice();

  // Handle singular "SourceFile" lexicalStack items
  if (stack.length === 1 && stack[0].kind === "SourceFile") {
    return { id: toSymbolId(stack[0].name), parentId: null };
  }

  const reversed = stack.reverse();
  const source = reversed.splice(0, 1)[0];
  const id = `${source.name}#${reversed.map((s) => s.name).join(".")}`;
  const parentId = `${source.name}#${reversed
    .slice(0, reversed.length - 1)
    .map((s) => s.name)
    .join(".")}`;
  return { id: toSymbolId(id), parentId: parentId.endsWith("#") ? toFileId(source.name) : toSymbolId(parentId) };
};
