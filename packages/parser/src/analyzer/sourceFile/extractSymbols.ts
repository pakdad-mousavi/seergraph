import { Node, SourceFile } from "ts-morph";
import { SymbolFact } from "../../types";
import { extractClassDeclaration, extractFunctionDeclaration, extractVariableDeclaration } from "../extractors/symbols";

const extractSymbolsFromNode = (node: Node, relativePath: string) => {
  const symbols: SymbolFact[] = [];

  if (Node.isFunctionDeclaration(node)) {
    symbols.push(...extractFunctionDeclaration(node, relativePath));
  } else if (Node.isVariableDeclaration(node)) {
    symbols.push(...extractVariableDeclaration(node, relativePath));
  } else if (Node.isClassDeclaration(node)) {
    symbols.push(...extractClassDeclaration(node, relativePath));
  }

  return symbols;
};

export const extractSymbolsFromSourceFile = (sourceFile: SourceFile, relativePath: string) => {
  const symbols: SymbolFact[] = [];

  sourceFile.forEachDescendant((node) => {
    console.log(node.getKindName());
    symbols.push(...extractSymbolsFromNode(node, relativePath));
  });

  console.log(symbols.filter((s) => s.kind));
  return symbols;
};
