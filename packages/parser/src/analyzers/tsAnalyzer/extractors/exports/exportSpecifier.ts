import { Edge } from "@seergraph/shared";
import { randomUUID } from "node:crypto";
import { Symbol } from "ts-morph";

export const extractExportsFromExportSpecifier = (exportSymbol: Symbol, relativePath: string): Edge | null => {
  const origSymbol = exportSymbol.getAliasedSymbol();
  if (!origSymbol) return null;

  const aliasName = exportSymbol.getName() === origSymbol.getName() ? undefined : exportSymbol.getName();
  return {
    id: randomUUID(),
    from: relativePath,
    to: `${relativePath}#${origSymbol.getName()}`,
    type: "exports",
    meta: {
      exportedAs: origSymbol.getName(),
      aliasName,
    },
  };
};
