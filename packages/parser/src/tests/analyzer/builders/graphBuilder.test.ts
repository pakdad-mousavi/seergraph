import { describe, expect, test } from "vitest";

import { Edge, SymbolNode, toFileId, toSymbolId } from "@seergraph/shared";
import { GraphBuilder } from "../../../analyzer/builders/graphBuilder";
import { SymbolStore } from "../../../analyzer/builders/symbolStore";
import { EdgeStore } from "../../../analyzer/builders/edgeStore";

describe("Can be instantiated from both constructor and static createDefault method", () => {
  test("is instantiated from constructor", () => {
    const graphBuilder = new GraphBuilder(new SymbolStore(), new EdgeStore());
    expect(graphBuilder).toBeInstanceOf(GraphBuilder);
  });

  test("is instantiated from static createDefault method", () => {
    const graphBuilder = GraphBuilder.createDefault();
    expect(graphBuilder).toBeInstanceOf(GraphBuilder);
  });
});

describe("correctly creates and returns nodes", () => {
  test("creates and returns file nodes", () => {
    const graphBuilder = GraphBuilder.createDefault();

    const id = toFileId("/dummy_folder/dummy.ts");
    const fileNode = {
      id,
      name: "dummy.ts",
    };
    graphBuilder.createFileNode(fileNode);

    expect(graphBuilder.getFileById(id)).toStrictEqual(fileNode);
  });

  test("creates and returns regular symbol nodes", () => {
    const graphBuilder = GraphBuilder.createDefault();

    const id = toSymbolId("/dummy_folder/dummy.ts#mySymbol");
    const fileId = toFileId("/dummy_folder/dummy.ts");
    const symbolNode = {
      id,
      name: "mySymbol",
      kind: "object",
      location: {
        fileId,
        endChar: 0,
        endLine: 0,
        startChar: 0,
        startLine: 0,
      },
      parentId: fileId,
    } satisfies SymbolNode;

    graphBuilder.createSymbolNode(symbolNode);

    expect(graphBuilder.getSymbolById(id)).toStrictEqual(symbolNode);
    expect(graphBuilder.getSymbolsSnapshot()).toStrictEqual([symbolNode]);
  });

  test("creates and returns binding symbol nodes and their alias edge", () => {
    const graphBuilder = GraphBuilder.createDefault();

    const id = toSymbolId("/dummy_folder/dummy.ts#binding:mySymbol");
    const targetId = toSymbolId("/some_other_dummy_folder/dummy.ts#actualSymbol");
    const fileId = toFileId("/dummy_folder/dummy.ts");
    const symbolNode = {
      id,
      name: "mySymbol",
      kind: "binding",
      location: {
        fileId,
        endChar: 0,
        endLine: 0,
        startChar: 0,
        startLine: 0,
      },
      parentId: fileId,
    } satisfies SymbolNode;

    graphBuilder.createBindingSymbolNode(symbolNode, targetId);

    expect(graphBuilder.getSymbolById(id)).toStrictEqual(symbolNode);
    expect(graphBuilder.getSymbolsSnapshot()).toStrictEqual([symbolNode]);

    expect(graphBuilder.getBindingByFileAndName(fileId, "mySymbol")).toStrictEqual(id);
    expect(graphBuilder.getEdgesSnapshot()).toStrictEqual([
      {
        from: "/dummy_folder/dummy.ts#binding:mySymbol",
        id: expect.any(String),
        kind: "aliases",
        to: "/some_other_dummy_folder/dummy.ts#actualSymbol",
      },
    ]);
  });
});

describe("correctly creates and returns edges", () => {
  test("creates and returns edges", () => {
    const graphBuilder = GraphBuilder.createDefault();

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

    graphBuilder.createEdge(importEdge);
    graphBuilder.createEdge(exportEdge);
    graphBuilder.createEdge(aliasEdge);

    expect(graphBuilder.getSymbolsSnapshot().length).toBe(0);
    expect(graphBuilder.getEdgesSnapshot()).toStrictEqual([importEdge, exportEdge, aliasEdge]);
  });
});
