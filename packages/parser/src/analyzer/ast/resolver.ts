import {
  Identifier,
  NewExpression,
  Node,
  ObjectLiteralExpression,
  PropertyAccessExpression,
  ThisExpression,
} from "ts-morph";

import { getLexicalPath } from "./callstack";
import { getSymbolId } from "./symbolId";
import { GraphBuilder } from "../builders/graphBuilder";
import { FileId, SymbolId, toFileId, toSymbolId } from "@seergraph/shared";

type ResolvedValue =
  | { kind: "symbol"; symbolId: SymbolId }
  | { kind: "object"; symbolId: SymbolId }
  | { kind: "class"; classId: SymbolId }
  | { kind: "instance"; classId: SymbolId }
  | { kind: "namespace"; fileId: FileId }
  | { kind: "unknown" };

export const evaluateExpression = (
  expression: Identifier | PropertyAccessExpression | NewExpression | ThisExpression | ObjectLiteralExpression,
  fileId: FileId,
  graphBuilder: GraphBuilder,
): ResolvedValue => {
  return { kind: "unknown" };

  // const stack = getLexicalPath(callExpression, fileId);
  // console.log("-------------------------------------", stack);
  // console.log("-------------------------------------", getSymbolId(stack));
  // console.log("-------------------------------------", callExpression.getExpression().getText());

  // const { id, parentId } = getSymbolId(stack);

  // // RETURN THIS AS WELL
  // const scope = id;

  // const expression = callExpression.getExpression();
  // console.log("-------------------------------------", expression.getKindName());

  // // ---------------------------------------------------------------------
  // // Attempt to rebuild symbol id by using the property access expression
  // // ---------------------------------------------------------------------
  // if (Node.isPropertyAccessExpression(expression)) {
  //   // Try to get the locally defined property access id
  //   const potentialSymbolId = fileId + "#" + expression.getText();
  //   const propertyAccessSymbol = graphBuilder.getSymbolById(toSymbolId(potentialSymbolId));

  //   // console.log(propertyAccessSymbol);
  //   if (propertyAccessSymbol) {
  //     return propertyAccessSymbol.id;
  //   }

  //   const expressionParts = expression.getText().split(".");
  //   const basePart = expressionParts.splice(0, 1)[0];

  //   // Try to get the default import id
  //   const importBindingId = graphBuilder.getBindingByFileAndName(fileId, basePart);
  //   const aliasEdge = graphBuilder.getEdgesSnapshot().find((e) => e.from === importBindingId && e.kind === "aliases");
  //   const importId = aliasEdge?.to + "." + expressionParts.join(".");

  //   const defaultImportSymbol = graphBuilder.getSymbolById(importId);
  //   if (defaultImportSymbol) {
  //     return defaultImportSymbol.id;
  //   }

  //   // Check for a potential namespace import
  //   const exportEdge = graphBuilder
  //     .getEdgesSnapshot()
  //     .find((e) => e.to === aliasEdge?.to + "#" + expressionParts.join("."));

  //   if (exportEdge) {
  //     return toSymbolId(exportEdge.to);
  //   }
  // }

  // // ------------------------------------------------
  // // Attempt to resolve local identifier to a symbol
  // // ------------------------------------------------
  // if (Node.isIdentifier(expression)) {
  //   const name = expression.getSymbol()?.getName() || "";
  //   console.log("-------------------------------------", name);

  //   // Attempt to get locally defined function expression
  //   /*
  //   ~~ NOTE:
  //   Uses "parentId" instead of "id" when the lexical scope is not top-level,
  //   as the lexical path of the CallExpression includes the variable it is
  //   being stored in, ex:

  //   function abc () {
  //     const run = () => {};

  //     run();
  //   }

  //   the "id" of "run()" is being set to "index.ts#abc.run", whereas we want
  //   "index.ts#abc", i.e., the "parentId".
  //   */
  //   const potentialSymbolId = parentId ? parentId + "." + expression.getText() : id + "#" + expression.getText();
  //   const symbol = graphBuilder.getSymbolById(toSymbolId(potentialSymbolId));
  //   // console.log(symbol);
  //   if (symbol) {
  //     return symbol.id;
  //   }

  //   // Attempt to get binding id of named import
  //   const bindingId = graphBuilder.getBindingByFileAndName(fileId, name);

  //   if (bindingId) {
  //     const symbol = graphBuilder.getSymbolById(bindingId);
  //     const edge = graphBuilder.getEdgesSnapshot().find((e) => e.from === symbol?.id && e.kind === "aliases");

  //     if (edge) {
  //       // console.log(edge.to);

  //       console.log(graphBuilder.getSymbolById(edge.to));
  //       return edge.to as SymbolId;
  //     }
  //   }
  // }
};
