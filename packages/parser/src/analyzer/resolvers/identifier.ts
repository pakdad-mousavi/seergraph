import { FileId, ResolvedValue, SymbolId, toFileId, toSymbolId } from "@seergraph/shared";
import { Identifier } from "ts-morph";
import { GraphBuilder } from "../builders/graphBuilder";

export const resolveIdentifier = (
  identifier: Identifier,
  context: {
    id: SymbolId;
    parentId: SymbolId | FileId | null;
  },
  fileId: FileId,
  builder: GraphBuilder,
): ResolvedValue => {
  const name = identifier.getText();

  // -------------------------
  // LOCALLY DEFINED SYMBOLS
  // -------------------------
  // Attempt to get symbol from current scope
  const symbol = builder.getChild(context.id, name);
  if (symbol) {
    return {
      kind: "symbol",
      symbolId: symbol.id,
    };
  }

  // Attempt to get symbol from parent scope
  const parentSymbol = context.parentId ? builder.getChild(context.parentId, name) : undefined;

  // Resolve to true symbol if this is a binding symbol
  const isBinding = builder.getBindingByFileAndName(fileId, parentSymbol?.name || "");
  const edge = builder.getEdgesSnapshot().find((e) => e.from === parentSymbol?.id && e.kind === "aliases");

  if (isBinding && edge) {
    const file = builder.getFileById(edge.to);
    if (file) {
      return {
        kind: "namespace",
        fileId: toFileId(edge.to),
      };
    } else {
      return {
        kind: "symbol",
        symbolId: toSymbolId(edge.to),
      };
    }
  }

  if (parentSymbol) {
    return {
      kind: "symbol",
      symbolId: parentSymbol.id,
    };
  }

  // Attempt to search stack for all functions/methods and
  // see if this is a parameter
  
  

  return { kind: "unknown" };
};
