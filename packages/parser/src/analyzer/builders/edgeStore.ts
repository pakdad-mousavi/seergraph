import { Edge } from "@seergraph/shared";

export class EdgeStore {
  private edges: Edge[] = [];

  constructor() {}

  public createEdge(edge: Edge) {
    this.edges.push(edge);
  }

  public getEdges() {
    return this.edges;
  }
}
