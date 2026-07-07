import { AliasEdge, ExportEdge, ImportEdge } from "./edges";

/**
  The id of a file.
*/
export type FileId = string & { readonly __brand: "FileId" };

/**
  The id of a symbol.
*/
export type SymbolId = string & { readonly __brand: "SymbolId" };

/**
  The type of the symbol, ex: `function`, `class`, etc.
*/
export type SymbolKind = "function" | "method" | "class" | "interface" | "enum" | "type" | "object" | "binding";

/**
  The type of the edge connecting any two nodes.
*/
export type EdgeType =
  | "imports"
  | "calls"
  | "references"
  | "inherits"
  | "implements"
  | "contains"
  | "exports"
  | "aliases";

/**
  Defines the location of a specific symbol inside of a file.
*/
export interface Location {
  fileId: FileId;

  startLine: number;
  startChar: number;

  endLine: number;
  endChar: number;
}

export interface SymbolNode {
  id: SymbolId;
  name: string;
  kind: SymbolKind;
  location: Location;
  parentId: SymbolId | FileId | null;
}

export interface BindingNode extends SymbolNode {
  kind: "binding";
}

/**
  A node representing a file.
*/
export interface FileNode {
  id: FileId;
  name: string;
}

export type ResolvedValue =
  | { kind: "symbol"; symbolId: SymbolId }
  | { kind: "object"; symbolId: SymbolId }
  | { kind: "class"; classId: SymbolId }
  | { kind: "instance"; classId: SymbolId }
  | { kind: "namespace"; fileId: FileId }
  | { kind: "unknown" };

export interface LexicalScope {
  id: SymbolId;
  parentId: SymbolId | FileId | null;
}

/**
  The edge connecting any two nodes.
*/
export type Edge = AliasEdge | ExportEdge | ImportEdge;

// Export utilities
export * from "./utils";
