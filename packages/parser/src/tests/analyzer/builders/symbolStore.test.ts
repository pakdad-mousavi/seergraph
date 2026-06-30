import { describe, expect, test } from "vitest";
import { SymbolStore } from "../../../analyzer/builders/symbolStore";
import { SymbolNode, toFileId, toSymbolId } from "@seergraph/shared";

describe("Correctly creates and stores both symbol and file nodes", () => {
  test("creates and returns file nodes", () => {
    const symbolStore = new SymbolStore();

    const id = toFileId("/my_folder/dummy.ts");
    symbolStore.createFile({
      id,
      name: "dummy.ts",
    });

    expect(symbolStore.getFileByIdIndex(id)).toStrictEqual({
      id: "/my_folder/dummy.ts",
      name: "dummy.ts",
    });
    expect(symbolStore.getAllSymbols().length).toBe(0);
    expect(symbolStore.getSymbols().length).toBe(0);
    expect(symbolStore.getBindingSymbols().length).toBe(0);
  });

  test("creates and returns symbol nodes", () => {
    const symbolStore = new SymbolStore();

    const fileId = toFileId("/my_folder/dummy.ts");
    const id = toSymbolId("/my_folder/dummy.ts#mySymbol");

    const symbol = {
      id,
      name: "mySymbol",
      kind: "function",
      location: {
        fileId,
        endChar: 0,
        endLine: 0,
        startChar: 0,
        startLine: 0,
      },
      parentId: fileId,
    } satisfies SymbolNode;

    symbolStore.createSymbol(symbol);

    expect(symbolStore.getAllSymbols()).toStrictEqual([symbol]);
    expect(symbolStore.getSymbols()).toStrictEqual([symbol]);
    expect(symbolStore.getSymbolById(id)).toStrictEqual(symbol);
    expect(symbolStore.getBindingSymbols().length).toBe(0);
  });
});

describe("Correctly stores and returns binding symbols", () => {
  test("creates and returns binding symbols", () => {
    const symbolStore = new SymbolStore();

    const fileId = toFileId("/my_folder/dummy.ts");
    const id = toSymbolId("/my_folder/dummy.ts#binding:mySymbol");

    const symbol = {
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

    symbolStore.createSymbol(symbol);

    expect(symbolStore.getAllSymbols()).toStrictEqual([symbol]);
    expect(symbolStore.getBindingSymbols()).toStrictEqual([symbol]);
    expect(symbolStore.getSymbols()).toStrictEqual([]);
    expect(symbolStore.getSymbolById(id)).toStrictEqual(symbol);
    expect(symbolStore.getBindingByFileAndName(fileId, "mySymbol")).toStrictEqual(id);
  });

  test("creates and stores binding symbols separate from normal symbols", () => {
    const symbolStore = new SymbolStore();

    const fileId = toFileId("/my_folder/dummy.ts");
    const bindingId = toSymbolId("/my_folder/dummy.ts#binding:mySymbol");
    const normalId = toSymbolId("/my_folder/dummy.ts#someOtherSymbol");

    const bindingSymbol = {
      id: bindingId,
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

    const symbol = {
      id: normalId,
      name: "someOtherSymbol",
      kind: "function",
      location: {
        fileId,
        endChar: 0,
        endLine: 0,
        startChar: 0,
        startLine: 0,
      },
      parentId: fileId,
    } satisfies SymbolNode;

    symbolStore.createSymbol(symbol);
    symbolStore.createSymbol(bindingSymbol);

    expect(symbolStore.getAllSymbols()).toStrictEqual([symbol, bindingSymbol]);
    expect(symbolStore.getSymbols()).toStrictEqual([symbol]);
    expect(symbolStore.getBindingSymbols()).toStrictEqual([bindingSymbol]);

    expect(symbolStore.getSymbolById(bindingId)).toStrictEqual(bindingSymbol);
    expect(symbolStore.getSymbolById(normalId)).toStrictEqual(symbol);

    expect(symbolStore.getBindingByFileAndName(fileId, "mySymbol")).toStrictEqual(bindingId);
    expect(symbolStore.getBindingByFileAndName(fileId, "someOtherSymbol")).toStrictEqual(undefined);
  });
});
