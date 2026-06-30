import { describe, expect, test } from "vitest";
import { Edge, toFileId, toSymbolId } from "@seergraph/shared";
import { EdgeStore } from "../../../analyzer/builders/edgeStore";

describe("correctly creates edges and returns them", () => {
  test("creates and stores multiple edges", () => {
    const edgeStore = new EdgeStore();

    const importEdge = {
      id: "some-random-id",
      from: toFileId("someFile"),
      to: toSymbolId("someSymbol"),
      kind: "imports",
    } satisfies Edge;

    const exportEdge = {
      id: "some-random-id2",
      from: toFileId("someFile"),
      to: toSymbolId("someOtherSymbol"),
      kind: "exports",
    } satisfies Edge;

    const aliasEdge = {
      id: "some-random-id2",
      from: toSymbolId("someSymbol"),
      to: toSymbolId("someOtherSymbol"),
      kind: "aliases",
    } satisfies Edge;

    edgeStore.createEdge(importEdge);
    edgeStore.createEdge(exportEdge);
    edgeStore.createEdge(aliasEdge);

    expect(edgeStore.getEdges()).toStrictEqual([importEdge, exportEdge, aliasEdge]);
  });
});
