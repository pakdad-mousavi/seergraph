import { FileId, FileNode, SymbolId, BindingNode, SymbolNode, toSymbolId, toFileId } from "@seergraph/shared";

export class SymbolStore {
  // -------------
  // SYMBOL NODES
  // -------------
  private symbols: SymbolNode[] = [];
  private bindingSymbols: BindingNode[] = [];

  // --------
  // INDEXES
  // --------
  private fileById: Map<FileId, FileNode> = new Map();
  private symbolById: Map<SymbolId, SymbolNode> = new Map();
  private symbolChildren = new Map<SymbolId | FileId, Map<string, SymbolNode>>();
  private bindingsByFileAndName: Map<FileId, Map<string, SymbolId>> = new Map();

  constructor() {}

  private indexSymbolById(symbol: SymbolNode) {
    this.symbolById.set(symbol.id, symbol);
  }

  private indexBindingSymbol(symbol: SymbolNode) {
    let symbolNamesToIds = this.bindingsByFileAndName.get(symbol.location.fileId);

    if (!symbolNamesToIds) {
      symbolNamesToIds = new Map();
    }

    symbolNamesToIds.set(symbol.name, symbol.id);
    this.bindingsByFileAndName.set(symbol.location.fileId, symbolNamesToIds);
  }

  private indexSymbolChildren(symbol: SymbolNode) {
    if (!symbol.parentId) return;

    let children = this.symbolChildren.get(symbol.parentId);

    if (!children) {
      children = new Map();
      this.symbolChildren.set(symbol.parentId, children);
    }

    children.set(symbol.name, symbol);
  }

  // ----------------
  // Symbol Creation
  // ----------------
  public createSymbol(symbol: SymbolNode) {
    if (symbol.kind === "binding") {
      this.bindingSymbols.push(symbol as BindingNode);
      this.indexBindingSymbol(symbol);
    } else {
      this.symbols.push(symbol);
    }
    this.indexSymbolChildren(symbol);
    this.indexSymbolById(symbol);
  }

  public createFile(fileNode: FileNode) {
    this.fileById.set(fileNode.id, fileNode);
  }

  // -----------------
  // Symbol Retrieval
  // -----------------
  public getAllSymbols() {
    return [...this.symbols, ...this.bindingSymbols];
  }
  public getSymbols() {
    return this.symbols;
  }
  public getBindingSymbols() {
    return this.bindingSymbols;
  }

  // ----------------
  // Index Retrieval
  // ----------------
  public getSymbolById(id: string | SymbolId) {
    return this.symbolById.get(toSymbolId(id));
  }

  public getFileByIdIndex(id: string | FileId) {
    return this.fileById.get(toFileId(id));
  }

  public getBindingByFileAndName(fileId: string | FileId, name: string) {
    return this.bindingsByFileAndName.get(toFileId(fileId))?.get(name);
  }

  public getChild(parent: SymbolId | FileId | null, name: string) {
    if (!parent) return undefined;

    const children = this.symbolChildren.get(parent);
    const symbol = children?.get(name);

    return symbol;
  }
}
