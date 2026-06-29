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
// | "property"

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

/**
  A node representing a file.
*/
export interface FileNode {
  id: FileId;
  name: string;
}

/**
  A node representing a symbol.
*/
export interface SymbolNode {
  id: string;
  name: string;
  kind: SymbolKind;
  location: Location;
  fileId: string;
}

/**
  The edge connecting any two nodes.
*/
export type Edge = AliasEdge | ExportEdge | ImportEdge;

/**
  The entire graph of a project. Maps are key-value pairs that link a record's `id` to the entire record itself.
*/
export interface ProjectGraph {
  files: Map<string, FileNode>;
  symbols: Map<string, SymbolNode>;
  edges: Edge[];
}

// Export utilities
export * from "./utils";
