import { FileId, SymbolId } from "../src";

interface EdgeBase {
  id: string;
  meta?: {
    exportedAs?: string;
    aliasName?: string;
    isDefault?: boolean;
    importName?: string;
    isNamespace?: boolean;
  };
}

export interface AliasEdge extends EdgeBase {
  kind: "aliases";
  from: SymbolId;
  to: SymbolId | FileId;
}

export interface ExportEdge extends EdgeBase {
  kind: "exports";
  from: FileId;
  to: SymbolId;
}

export interface ImportEdge extends EdgeBase {
  kind: "imports";
  from: FileId;
  to: SymbolId | FileId;
}
