import { Node, SourceFile } from "ts-morph";
import { SymbolFact } from "../../types";
import { extractClassDeclaration, extractFunctionDeclaration, extractVariableDeclaration } from "../extractors/symbols";
import { toFileId, FileNode } from "@seergraph/shared";
import { GraphBuilder } from "../builders/graphBuilder";
import path from "node:path";

export const extractSymbolsFromSourceFile = (
  sourceFile: SourceFile,
  relativePath: string,
  graphBuilder: GraphBuilder,
) => {
  const symbols: SymbolFact[] = [];

  // Collect symbols
  sourceFile.forEachDescendant((node) => {
    console.log(node.getKindName());
    if (Node.isFunctionDeclaration(node)) {
      symbols.push(...extractFunctionDeclaration(node, relativePath));
    } else if (Node.isVariableDeclaration(node)) {
      symbols.push(...extractVariableDeclaration(node, relativePath));
    } else if (Node.isClassDeclaration(node)) {
      symbols.push(...extractClassDeclaration(node, relativePath));
    }
  });

  // Create symbol nodes
  for (const s of symbols) {
    graphBuilder.createSymbolNode(s);
  }

  // Create a file node
  const fileNode: FileNode = {
    id: toFileId(relativePath),
    name: path.basename(relativePath),
  };
  graphBuilder.createFileNode(fileNode);

  console.log(symbols.filter((s) => s.kind));
};
