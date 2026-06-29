import { Edge, Location, SymbolKind, FileId, SymbolId } from "@seergraph/shared";

export interface SymbolFact {
  id: SymbolId;
  name: string;
  kind: SymbolKind;
  location: Location;
  parentId: string | null;
}

export interface BindingFact extends SymbolFact {
  kind: "binding";
}

export interface ImportFact {
  moduleSpecifier: string;
  namedImports: {
    imported: string;
    local: string | undefined;
  }[];
  defaultImport?: string;
  namespaceImport?: string;
  location: Location;
}

export interface CallFact {
  scopeId: string;
  callee: {
    type: "identifier" | "member";
    parts: string[];
  };

  location: Location;
  scopeChain: string[];
}

export interface FileFact {
  fileId: FileId;
  path: string;
}
