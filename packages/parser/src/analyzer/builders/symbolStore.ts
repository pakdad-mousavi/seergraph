import { FileId, FileNode, SymbolId, BindingNode, SymbolNode } from "@seergraph/shared";

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
  private symbolsByFile: Map<FileId, SymbolId[]> = new Map();
  private bindingsByFileAndName: Map<FileId, Map<string, SymbolId>> = new Map();

  constructor() {}

  private indexSymbolByFile(symbol: SymbolNode) {
    let symbols = this.symbolsByFile.get(symbol.location.fileId);

    if (!symbols) {
      symbols = [];
      this.symbolsByFile.set(symbol.location.fileId, symbols);
    }

    symbols.push(symbol.id);
  }

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
    this.indexSymbolById(symbol);
    this.indexSymbolByFile(symbol);
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
  public getSymbolIdIndex() {
    return this.symbolById;
  }
  public getSymbolFileIdIndex() {
    return this.symbolsByFile;
  }
}
