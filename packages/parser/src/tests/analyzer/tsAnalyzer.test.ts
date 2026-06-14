import { describe, expect, test } from "vitest";
import { tsAnalyzer } from "../../analyzers/tsAnalyzer";
import { ts } from "ts-morph";

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

  test("Creates a symbol for an object's arrow functions/function expressions", { todo: true });
  test("If an object contains callable descendants, intermediate objects are treated as namespaces", { todo: true });
  test("Creates a symbol for default exports, whether named or not", { todo: true });
  test("Creates a symbol for types", { todo: true });
  test("Creates a symbol for interfaces", { todo: true });
  test("Creates a symbol for enums", { todo: true });
});
