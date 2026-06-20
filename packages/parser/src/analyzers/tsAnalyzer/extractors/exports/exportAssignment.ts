import { Edge } from "@seergraph/shared";
import { SymbolFact } from "../../../types";
import { Node, Symbol } from "ts-morph";

import { getLocation } from "../../ast";
import { randomUUID } from "node:crypto";

import { extractObjectLiteral } from "../symbols";
import { extractExportsFromInlineDecl } from "./inlineExport";

export const extractExportsFromExportAssignment = (
  exportSymbol: Symbol,
  relativePath: string,
): { edge: Edge; symbols: SymbolFact[] } | null => {
  const exportAssignment = exportSymbol.getDeclarations()[0];
  const value = exportAssignment.getChildAtIndex(2);
  const valueKind = value.getKindName();
  const valueSymbol = value.getSymbol();

  let edge: Edge;
  let symbols: SymbolFact[] = [];

  if (!valueSymbol) return null;

  if (Node.isArrowFunction(value) || Node.isObjectLiteralExpression(value)) {
    edge = extractExportsFromInlineDecl(valueSymbol, relativePath, true);
    edge.meta!.isDefault = true;
    console.log(edge);

    if (Node.isObjectLiteralExpression(value)) {
      symbols = [...extractObjectLiteral(value, "default", relativePath, true)];
    } else {
      symbols.push({
        id: `${relativePath}#default`,
        parentId: relativePath,
        name: "default",
        kind: "function",
        location: getLocation(value, relativePath),
      });
    }

    return { edge, symbols };
  }

  if (Node.isIdentifier(value)) {
    edge = {
      id: randomUUID(),
      from: relativePath,
      to: `${relativePath}#${valueSymbol.getName()}`,
      type: "exports",
      meta: {
        exportedAs: valueSymbol.getName(),
        isDefault: true,
      },
    };

    return { edge, symbols };
  }

  console.log(valueKind, valueSymbol?.getName());
  return null;
};
