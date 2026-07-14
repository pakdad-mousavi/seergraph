import { FileId, LexicalScope, ResolvedValue, SymbolNode } from "@seergraph/shared";
import { ClassDeclaration, Node, PropertyAccessExpression } from "ts-morph";
import { resolveIdentifier } from "./identifier";
import { GraphBuilder } from "../builders/graphBuilder";
import { getLexicalPath, getSymbolId } from "../ast";
import { resolveThisExpression } from "./thisExpression";

export const resolvePropertyAccess = (
  expression: PropertyAccessExpression,
  lexicalScope: LexicalScope,
  fileId: FileId,
  graphBuilder: GraphBuilder,
): ResolvedValue => {
  const leftSide = expression.getExpression();
  console.log("XXX", leftSide.getKindName());
  const main = expression.getName();

  let resolvedValue: ResolvedValue = { kind: "unknown" };

  // Recursively resolve the left side of the expression (if needed)
  if (Node.isPropertyAccessExpression(leftSide)) {
    resolvedValue = resolvePropertyAccess(leftSide, lexicalScope, fileId, graphBuilder);
  }

  // Resolve final identifier
  if (Node.isIdentifier(leftSide)) {
    resolvedValue = resolveIdentifier(leftSide, lexicalScope, fileId, graphBuilder);
  }

  if (Node.isThisExpression(leftSide)) {
    resolvedValue = resolveThisExpression(leftSide, fileId);
  }

  let symbol: SymbolNode | undefined;

  switch (resolvedValue.kind) {
    case "namespace":
      // Try to get symbol from imported file
      symbol = graphBuilder.getChild(resolvedValue.fileId, main);
      break;

    case "symbol":
      // Try to get symbol from property access
      symbol = graphBuilder.getChild(resolvedValue.symbolId, main);
      break;
  }

  if (symbol) {
    return { kind: "symbol", symbolId: symbol.id };
  }

  return { kind: "unknown" };
};
