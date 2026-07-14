import { ThisExpression } from "ts-morph";
import { getLexicalPath, getSymbolId } from "../ast";
import { FileId, ResolvedValue } from "@seergraph/shared";

export const resolveThisExpression = (expr: ThisExpression, fileId: FileId): ResolvedValue => {
  const stack = getLexicalPath(expr, fileId);

  let bindingSiteIdx: number | null = null;
  for (let i = 0; i < stack.length; i++) {
    const ancestor = stack[i];
    if (ancestor.kind === "FunctionDeclaration") {
      break;
    }

    if (ancestor.kind === "MethodDeclaration") {
      bindingSiteIdx = i + 1;
      break;
    }

    if (ancestor.kind === "ClassDeclaration") {
      bindingSiteIdx = i;
    }
  }

  if (bindingSiteIdx !== null) {
    const subStack = stack.slice(bindingSiteIdx);
    const { id } = getSymbolId(subStack);
    return { kind: "symbol", symbolId: id };
  }

  return { kind: "unknown" };
};
