import { describe, expect, test, vi, beforeEach } from "vitest";
import { ts } from "ts-morph";

import { fs as memFs, vol } from "memfs";
import { tsAnalyzer } from "../../analyzers/tsAnalyzer/tsAnalyzer";

vi.mock("node:fs", () => memFs);
vi.mock("node:fs/promises", () => memFs.promises);

beforeEach(() => {
  vi.resetModules();
});

describe("Typescript analyzer correctly extracts all symbols from a file", () => {
  test("Returns diagnostics for code with errors", () => {
    const code = `
    const x = 123;
    let y = 456;
    var z = 789;

    const square = function(x: number) {
      return x*x;
    };

    leth elloWorld = 'Hello world';
    console.log(helloWorld);
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(true);
    expect(symbols).toBe(null);
    expect(diagnostics).not.toBe(null);

    const containsErrors = diagnostics?.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
    expect(containsErrors).toBe(true);
  });

  test("Ignores non-exported variables that do not contain a function", async () => {
    const code = `
    const x = 123;
    let y = 456;
    var z = 789;

    const e = 2.71; 

    console.log(x, y, z);
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);
    expect(symbols).toStrictEqual([]);
  });

  test("Creates a symbol for non-exported variables that contain a function", () => {
    const code = `
    const x = 123;
    let y = 456;
    var z = 789;

    const square = function(x: number) {
      return x*x;
    };
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);
    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#square",
        parentId: "dummy-file.ts",
        kind: "function",
        location: {
          startChar: 65,
          startLine: 6,
          endLine: 8,
          endChar: 119,
          fileId: "dummy-file.ts",
        },
        name: "square",
      },
    ]);
  });

  test("Creates a symbol for exported variables", () => {
    const code = `
    const x = 123;
    let y = 456;
    var z = 789;

    export const square = function(x: number) {
      return x*x;
    };
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);
    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#square",
        parentId: "dummy-file.ts",
        kind: "function",
        location: {
          endChar: 126,
          endLine: 8,
          fileId: "dummy-file.ts",
          startChar: 72,
          startLine: 6,
        },
        name: "square",
      },
    ]);
  });

  test("Creates a symbol for named classes", () => {
    const code = `
    class NamedClass {}
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);
    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#NamedClass",
        parentId: "dummy-file.ts",
        kind: "class",
        location: {
          endChar: 24,
          endLine: 2,
          fileId: "dummy-file.ts",
          startChar: 5,
          startLine: 2,
        },
        name: "NamedClass",
      },
    ]);
  });

  test("Creates symbols for a named class's methods", () => {
    const code = `
    class NamedClass {
      private myMethodOne() {}
      public myMethodTwo() {}
      public static myMethodThree() {}
    }
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    const methodSymbols = symbols?.filter((s) => s.kind === "method");
    expect(methodSymbols).toStrictEqual([
      {
        id: "dummy-file.ts#NamedClass.myMethodOne",
        parentId: "dummy-file.ts#NamedClass",
        kind: "method",
        location: {
          endChar: 54,
          endLine: 3,
          fileId: "dummy-file.ts",
          startChar: 30,
          startLine: 3,
        },
        name: "myMethodOne",
      },
      {
        id: "dummy-file.ts#NamedClass.myMethodTwo",
        parentId: "dummy-file.ts#NamedClass",
        kind: "method",
        location: {
          endChar: 84,
          endLine: 4,
          fileId: "dummy-file.ts",
          startChar: 61,
          startLine: 4,
        },
        name: "myMethodTwo",
      },
      {
        id: "dummy-file.ts#NamedClass.myMethodThree",
        parentId: "dummy-file.ts#NamedClass",
        kind: "method",
        location: {
          endChar: 123,
          endLine: 5,
          fileId: "dummy-file.ts",
          startChar: 91,
          startLine: 5,
        },
        name: "myMethodThree",
      },
    ]);
  });

  test("Creates a symbol for named function declarations and arrow functions.", () => {
    const code = `
    const x = () => 123;
    const y = function () { return 456 };
    function z() {
      return 789;
    }
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);
    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#x",
        parentId: "dummy-file.ts",
        kind: "function",
        location: {
          endChar: 24,
          endLine: 2,
          fileId: "dummy-file.ts",
          startChar: 11,
          startLine: 2,
        },
        name: "x",
      },
      {
        id: "dummy-file.ts#y",
        parentId: "dummy-file.ts",
        kind: "function",
        location: {
          endChar: 66,
          endLine: 3,
          fileId: "dummy-file.ts",
          startChar: 36,
          startLine: 3,
        },
        name: "y",
      },
      {
        id: "dummy-file.ts#z",
        parentId: "dummy-file.ts",
        kind: "function",
        location: {
          endChar: 110,
          endLine: 6,
          fileId: "dummy-file.ts",
          startChar: 72,
          startLine: 4,
        },
        name: "z",
      },
    ]);
  });

  test("Creates a symbol for nested function declarations and arrow functions.", () => {
    const code = `
    const x = () => {
      const y = function() {
        function z() {}
      }
    }
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);
    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#x",
        parentId: "dummy-file.ts",
        kind: "function",
        location: {
          endChar: 89,
          endLine: 6,
          fileId: "dummy-file.ts",
          startChar: 11,
          startLine: 2,
        },
        name: "x",
      },
      {
        id: "dummy-file.ts#x.y",
        parentId: "dummy-file.ts#x",
        kind: "function",
        location: {
          endChar: 83,
          endLine: 5,
          fileId: "dummy-file.ts",
          startChar: 35,
          startLine: 3,
        },
        name: "y",
      },
      {
        id: "dummy-file.ts#x.y.z",
        parentId: "dummy-file.ts#x.y",
        kind: "function",
        location: {
          endChar: 75,
          endLine: 4,
          fileId: "dummy-file.ts",
          startChar: 60,
          startLine: 4,
        },
        name: "z",
      },
    ]);
  });

  test("Creates a symbol for an object's properties that are arrow functions/function expressions", () => {
    const code = `
    const obj = {
      x: () => {},
      y: function () {},
      z() {}
    }
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);
    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#obj",
        parentId: "dummy-file.ts",
        kind: "object",
        location: {
          endChar: 81,
          endLine: 6,
          fileId: "dummy-file.ts",
          startChar: 17,
          startLine: 2,
        },
        name: "obj",
      },
      {
        id: "dummy-file.ts#obj.x",
        parentId: "dummy-file.ts#obj",
        kind: "method",
        location: {
          endChar: 36,
          endLine: 3,
          fileId: "dummy-file.ts",
          startChar: 28,
          startLine: 3,
        },
        name: "x",
      },
      {
        id: "dummy-file.ts#obj.y",
        parentId: "dummy-file.ts#obj",
        kind: "method",
        location: {
          endChar: 61,
          endLine: 4,
          fileId: "dummy-file.ts",
          startChar: 47,
          startLine: 4,
        },
        name: "y",
      },
      {
        id: "dummy-file.ts#obj.z",
        parentId: "dummy-file.ts#obj",
        kind: "method",
        location: {
          endChar: 75,
          endLine: 5,
          fileId: "dummy-file.ts",
          startChar: 69,
          startLine: 5,
        },
        name: "z",
      },
    ]);
  });

  test("If an object contains callable descendants, intermediate objects are treated as namespaces", () => {
    const code = `
    const api = {
      users: {
        get() {},
        post: () => {},
        delete: function () {},

        patchRelated: {
          patch() {}
        }
      },

      admins: {
        get() {},
        post: () => {},
        delete: function () {}
      },

      theme: {
        color: "red",
        size: 12
      }
    }
    `;

    const { error, symbols, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#api",
        kind: "object",
        location: {
          endChar: 340,
          endLine: 23,
          fileId: "dummy-file.ts",
          startChar: 17,
          startLine: 2,
        },
        name: "api",
        parentId: "dummy-file.ts",
      },
      {
        id: "dummy-file.ts#api.users",
        kind: "object",
        location: {
          endChar: 171,
          endLine: 11,
          fileId: "dummy-file.ts",
          startChar: 32,
          startLine: 3,
        },
        name: "users",
        parentId: "dummy-file.ts#api",
      },
      {
        id: "dummy-file.ts#api.users.get",
        kind: "method",
        location: {
          endChar: 50,
          endLine: 4,
          fileId: "dummy-file.ts",
          startChar: 42,
          startLine: 4,
        },
        name: "get",
        parentId: "dummy-file.ts#api.users",
      },
      {
        id: "dummy-file.ts#api.users.post",
        kind: "method",
        location: {
          endChar: 74,
          endLine: 5,
          fileId: "dummy-file.ts",
          startChar: 66,
          startLine: 5,
        },
        name: "post",
        parentId: "dummy-file.ts#api.users",
      },
      {
        id: "dummy-file.ts#api.users.delete",
        kind: "method",
        location: {
          endChar: 106,
          endLine: 6,
          fileId: "dummy-file.ts",
          startChar: 92,
          startLine: 6,
        },
        name: "delete",
        parentId: "dummy-file.ts#api.users",
      },
      {
        id: "dummy-file.ts#api.users.patchRelated",
        kind: "object",
        location: {
          endChar: 163,
          endLine: 10,
          fileId: "dummy-file.ts",
          startChar: 131,
          startLine: 8,
        },
        name: "patchRelated",
        parentId: "dummy-file.ts#api.users",
      },
      {
        id: "dummy-file.ts#api.users.patchRelated.patch",
        kind: "method",
        location: {
          endChar: 153,
          endLine: 9,
          fileId: "dummy-file.ts",
          startChar: 143,
          startLine: 9,
        },
        name: "patch",
        parentId: "dummy-file.ts#api.users.patchRelated",
      },
      {
        id: "dummy-file.ts#api.admins",
        kind: "object",
        location: {
          endChar: 270,
          endLine: 17,
          fileId: "dummy-file.ts",
          startChar: 188,
          startLine: 13,
        },
        name: "admins",
        parentId: "dummy-file.ts#api",
      },
      {
        id: "dummy-file.ts#api.admins.get",
        kind: "method",
        location: {
          endChar: 206,
          endLine: 14,
          fileId: "dummy-file.ts",
          startChar: 198,
          startLine: 14,
        },
        name: "get",
        parentId: "dummy-file.ts#api.admins",
      },
      {
        id: "dummy-file.ts#api.admins.post",
        kind: "method",
        location: {
          endChar: 230,
          endLine: 15,
          fileId: "dummy-file.ts",
          startChar: 222,
          startLine: 15,
        },
        name: "post",
        parentId: "dummy-file.ts#api.admins",
      },
      {
        id: "dummy-file.ts#api.admins.delete",
        kind: "method",
        location: {
          endChar: 262,
          endLine: 16,
          fileId: "dummy-file.ts",
          startChar: 248,
          startLine: 16,
        },
        name: "delete",
        parentId: "dummy-file.ts#api.admins",
      },
    ]);
  });

  test("Ignores exports of unexported functions/objects/classes", () => {
    const code = `
    const x = () => {};
    const y = function () {};
    const z = function add() {};
    const i = {
      abc: 123,
      def: {
        ghi: 456,
      }
    };
    const j = i.def.ghi;
    const k = class {}
    class MyCls {}
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([]);
  });

  test("Ignores exports of uncallable literals without uncallable values", () => {
    const code = `
    export const x = 123;
    export const y = 'hello world';
    export const z = [() => {}, function () {}, {}, 123, 'string'];
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([]);
  });

  test("Creates an edge for exported unnamed function declarations", () => {
    const code = `
    export const x = function () {};
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "x",
          isDefault: false,
        },
        to: "dummy-file.ts#x",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for exported named function declarations", () => {
    const code = `
    export const x = function add() {};
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "x",
          isDefault: false,
        },
        to: "dummy-file.ts#x",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for exported arrow functions", () => {
    const code = `
    export const x = () => {};
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "x",
          isDefault: false,
        },
        to: "dummy-file.ts#x",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for exported arrow functions", () => {
    const code = `
    export const x = () => {};
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "x",
          isDefault: false,
        },
        to: "dummy-file.ts#x",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for exported classes", () => {
    const code = `
    export class x {};
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "x",
          isDefault: false,
        },
        to: "dummy-file.ts#x",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for exported objects, but not their children", () => {
    const code = `
    export const x = {
      test: () => {}
    };
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "x",
          isDefault: false,
        },
        to: "dummy-file.ts#x",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for exported references, with and without aliases", () => {
    const code = `
    const x = () => {};
    const y = function () {};
    const z = { test() {} };
    const i = 123;
    export { x, y, z as j, i };
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          aliasName: undefined,
          exportedAs: "x",
        },
        to: "dummy-file.ts#x",
        type: "exports",
      },
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          aliasName: undefined,
          exportedAs: "y",
        },
        to: "dummy-file.ts#y",
        type: "exports",
      },
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          aliasName: "j",
          exportedAs: "z",
        },
        to: "dummy-file.ts#z",
        type: "exports",
      },
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          aliasName: undefined,
          exportedAs: "i",
        },
        to: "dummy-file.ts#i",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge and symbol for a default exported function", () => {
    const code = `
    export default function () {};
    `;

    const { error, symbols, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "default",
          isDefault: true,
        },
        to: "dummy-file.ts#default",
        type: "exports",
      },
    ]);

    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#default",
        kind: "function",
        location: {
          endChar: 34,
          endLine: 2,
          fileId: "dummy-file.ts",
          startChar: 5,
          startLine: 2,
        },
        name: "default",
        parentId: "dummy-file.ts",
      },
    ]);
  });

  test("Creates an edge and symbol for a default exported function with a name", () => {
    const code = `
    export default function add() {};
    `;

    const { error, symbols, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "default",
          isDefault: true,
        },
        to: "dummy-file.ts#default",
        type: "exports",
      },
    ]);

    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#default",
        kind: "function",
        location: {
          endChar: 37,
          endLine: 2,
          fileId: "dummy-file.ts",
          startChar: 5,
          startLine: 2,
        },
        name: "default",
        parentId: "dummy-file.ts",
      },
    ]);
  });

  test("Creates an edge for a default export referencing a function declaration", () => {
    const code = `
    function add() {}

    export default add;
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "add",
          isDefault: true,
        },
        to: "dummy-file.ts#add",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for a default export referencing a function expression", () => {
    const code = `
    const add = function () {}

    export default add;
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "add",
          isDefault: true,
        },
        to: "dummy-file.ts#add",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for a default export referencing an arrow function", () => {
    const code = `
    const add = () => {};

    export default add;
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "add",
          isDefault: true,
        },
        to: "dummy-file.ts#add",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for a default exported arrow function", () => {
    const code = `
    export default () => {};
    `;

    const { error, symbols, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "default",
          isDefault: true,
        },
        to: "dummy-file.ts#default",
        type: "exports",
      },
    ]);

    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#default",
        kind: "function",
        location: {
          endChar: 28,
          endLine: 2,
          fileId: "dummy-file.ts",
          startChar: 20,
          startLine: 2,
        },
        name: "default",
        parentId: "dummy-file.ts",
      },
    ]);
  });

  test("Creates an edge for a default export referencing an object", () => {
    const code = `
    const api = {
      test: () => {},
    };

    export default api;
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "api",
          isDefault: true,
        },
        to: "dummy-file.ts#api",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge and symbols for a default exported object", () => {
    const code = `
    export default {
      test: () => {}
    };
    `;

    const { error, symbols, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "default",
          isDefault: true,
        },
        to: "dummy-file.ts#default",
        type: "exports",
      },
    ]);

    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#default",
        kind: "object",
        location: {
          endChar: 48,
          endLine: 4,
          fileId: "dummy-file.ts",
          startChar: 20,
          startLine: 2,
        },
        name: "default",
        parentId: "dummy-file.ts",
      },
      {
        id: "dummy-file.ts#default.test",
        kind: "method",
        location: {
          endChar: 42,
          endLine: 3,
          fileId: "dummy-file.ts",
          startChar: 34,
          startLine: 3,
        },
        name: "test",
        parentId: "dummy-file.ts#default",
      },
    ]);
  });

  test("Creates an edge for a default export referencing a class", () => {
    const code = `
    class MyCls {}
    export default MyCls;
    `;

    const { error, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "MyCls",
          isDefault: true,
        },
        to: "dummy-file.ts#MyCls",
        type: "exports",
      },
    ]);
  });

  test("Creates an edge for a default exported class and its methods", () => {
    const code = `
    export default class {
      private test() {}
    };
    `;

    const { error, symbols, exportEdges, diagnostics } = tsAnalyzer("./", code, true);

    expect(error).toBe(false);
    expect(diagnostics).toBe(null);

    expect(exportEdges).toStrictEqual([
      {
        from: "dummy-file.ts",
        id: expect.any(String),
        meta: {
          exportedAs: "default",
          isDefault: true,
        },
        to: "dummy-file.ts#default",
        type: "exports",
      },
    ]);

    expect(symbols).toStrictEqual([
      {
        id: "dummy-file.ts#default",
        kind: "class",
        location: {
          endChar: 57,
          endLine: 4,
          fileId: "dummy-file.ts",
          startChar: 5,
          startLine: 2,
        },
        name: "default",
        parentId: "dummy-file.ts",
      },
      {
        id: "dummy-file.ts#default.test",
        kind: "method",
        location: {
          endChar: 51,
          endLine: 3,
          fileId: "dummy-file.ts",
          startChar: 34,
          startLine: 3,
        },
        name: "test",
        parentId: "dummy-file.ts#default",
      },
    ]);
  });

  test("Creates a symbol for types", { todo: true });
  test("Creates a symbol for interfaces", { todo: true });
  test("Creates a symbol for enums", { todo: true });
});
