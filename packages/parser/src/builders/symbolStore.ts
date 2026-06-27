import { FileId, SymbolId } from "@seergraph/shared";
import { BindingFact, SymbolFact } from "../types";

export class SymbolStore {
  // -------------
  // SYMBOL NODES
  // -------------
  private symbols: SymbolFact[] = [];
  private bindingSymbols: BindingFact[] = [];

  // --------
  // INDEXES
  // --------
  private symbolById: Map<SymbolId, SymbolFact> = new Map();
  private symbolsByFile: Map<FileId, SymbolId[]> = new Map();
  private bindingsByFileAndName: Map<FileId, Map<string, SymbolId>> = new Map();

  constructor() {}

  private indexSymbolByFile(symbol: SymbolFact) {
    let symbols = this.symbolsByFile.get(symbol.location.fileId);

    if (!symbols) {
      symbols = [];
      this.symbolsByFile.set(symbol.location.fileId, symbols);
    }

    symbols.push(symbol.id);
  }

  private indexSymbolById(symbol: SymbolFact) {
    this.symbolById.set(symbol.id, symbol);
  }

  private indexBindingSymbol(symbol: SymbolFact) {
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
  public createSymbol(symbol: SymbolFact) {
    if (symbol.kind === "binding") {
      this.bindingSymbols.push(symbol as BindingFact);
      this.indexBindingSymbol(symbol);
    } else {
      this.symbols.push(symbol);
    }
    this.indexSymbolById(symbol);
    this.indexSymbolByFile(symbol);
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
