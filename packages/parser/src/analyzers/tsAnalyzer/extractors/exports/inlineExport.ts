import { Edge } from "@seergraph/shared";
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
    from: relativePath,
    to: `${relativePath}#${name}`,
    type: "exports",
    meta: {
      exportedAs: name,
      isDefault: isDefExp || (exportSymbol.getValueDeclaration() as ClassDeclaration)?.isDefaultExport(),
    },
  };
};
