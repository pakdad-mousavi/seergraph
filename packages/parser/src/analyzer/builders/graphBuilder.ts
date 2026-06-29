import { Edge, FileId, FileNode, SymbolId } from "@seergraph/shared";
import { SymbolFact } from "../../types";

import { EdgeStore } from "./edgeStore";
import { SymbolStore } from "./symbolStore";
import { randomUUID } from "node:crypto";

export class GraphBuilder {
  constructor(
    private symbolStore: SymbolStore,
    private edgeStore: EdgeStore,
  ) {}

  public static createDefault() {
    return new GraphBuilder(new SymbolStore(), new EdgeStore());
  }

  public createFileNode(fileNode: FileNode) {
    this.symbolStore.createFile(fileNode);
  }

  public createSymbolNode(symbol: SymbolFact) {
    this.symbolStore.createSymbol(symbol);
  }

  public createBindingSymbolNode(symbol: SymbolFact, target: SymbolId | FileId) {
    this.symbolStore.createSymbol(symbol);
    this.edgeStore.createEdge({
      id: randomUUID(),
      from: symbol.id,
      to: target,
      kind: "aliases",
    });
  }

  public createEdge(edge: Edge) {
    this.edgeStore.createEdge(edge);
  }

  public getSymbolsSnapshot() {
    return this.symbolStore.getAllSymbols();
  }

  public getEdgesSnapshot() {
    return this.edgeStore.getEdges();
  }
}
