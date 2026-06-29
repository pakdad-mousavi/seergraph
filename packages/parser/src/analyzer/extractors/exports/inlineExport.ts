import { Edge, toFileId, toSymbolId } from "@seergraph/shared";
import { randomUUID } from "node:crypto";
import { ClassDeclaration, Symbol } from "ts-morph";

export const extractExportsFromInlineDecl = (
  exportSymbol: Symbol,
  relativePath: string,
  isDefExp: boolean = false,
): Edge => {
  const name = isDefExp ? "default" : exportSymbol.getName();
  return {
    id: randomUUID(),
    from: toFileId(relativePath),
    to: toSymbolId(`${relativePath}#${name}`),
    kind: "exports",
    meta: {
      exportedAs: name,
      isDefault: isDefExp || (exportSymbol.getValueDeclaration() as ClassDeclaration)?.isDefaultExport(),
    },
  };
};
