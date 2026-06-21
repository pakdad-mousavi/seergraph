/**
  The extensions for the language being used in a file, ex: `.ts`, `.js`, etc.
*/
export type LanguageExtension = ".ts" | ".js" | ".py";

/**
  The language being used in a file, ex: `typescript`, `javascript`, etc.
*/
export type Language = "typescript" | "javascript" | "python" | "go" | "rust" | "java";

/**
  The type of the symbol, ex: `function`, `class`, etc.
*/
export type SymbolKind = "function" | "method" | "class" | "interface" | "enum" | "type" | "object";
// | "property"

/**
  The type of the edge connecting any two nodes.
*/
export type EdgeType = "imports" | "calls" | "references" | "inherits" | "implements" | "contains" | "exports";

/**
  Defines the location of a specific symbol inside of a file.
*/
export interface Location {
  fileId: string;

  startLine: number;
  startChar: number;

  endLine: number;
  endChar: number;
}

/**
  A node representing a file.
*/
export interface FileNode {
  id: string;
  path: string;
  language: Language;
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
export interface Edge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;

  // optional metadata
  meta?: {
    exportedAs: string;
    aliasName?: string;
    isDefault?: boolean;
    importName?: string;
  };
}

/**
  The entire graph of a project. Maps are key-value pairs that link a record's `id` to the entire record itself.
*/
export interface ProjectGraph {
  files: Map<string, FileNode>;
  symbols: Map<string, SymbolNode>;
  edges: Edge[];
}
