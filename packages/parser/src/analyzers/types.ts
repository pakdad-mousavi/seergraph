import { Edge, Location, SymbolKind } from "@seergraph/shared";

export interface SymbolFact {
  id: string;
  name: string;
  kind: SymbolKind;
  location: Location;
  parentId: string | null;
}

export interface ImportFact {
  moduleSpecifier: string;
  namedImports: {
    imported: string;
    local: string | undefined;
  }[];
  defaultImport?: string;
  namespaceImport?: string;
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
  fileId: string;
  path: string;

  symbols: SymbolFact[];
  imports: ImportFact[];
  calls: CallFact[];
  exportEdges: Edge[];
}
