import { Edge, FileId, SymbolId } from "@seergraph/shared";

export class EdgeStore {
  private edges: Edge[] = [];
  private outgoing: Map<SymbolId | FileId, Edge[]> = new Map();
  private incoming: Map<SymbolId | FileId, Edge[]> = new Map();

  constructor() {}

  private addToIndex(map: Map<SymbolId | FileId, Edge[]>, key: SymbolId | FileId, edge: Edge) {
    let edges = map.get(key);

    if (!edges) {
      edges = [];
      map.set(key, edges);
    }

    edges.push(edge);
  }

  public createEdge(edge: Edge) {
    this.edges.push(edge);

    this.addToIndex(this.outgoing, edge.from, edge);
    this.addToIndex(this.incoming, edge.to, edge);
  }

  public getEdges() {
    return this.edges;
  }
}
