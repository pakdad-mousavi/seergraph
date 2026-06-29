import { Edge, Location, SymbolKind, FileId, SymbolId } from "@seergraph/shared";

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

export interface FileNode {
  fileId: FileId;
  path: string;
}
