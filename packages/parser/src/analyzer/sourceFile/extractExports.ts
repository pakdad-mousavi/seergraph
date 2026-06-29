import { Node, SourceFile } from "ts-morph";
import { SymbolFact } from "../../types";
import { Edge } from "@seergraph/shared";

import {
  extractExportsFromExportAssignment,
  extractExportsFromExportSpecifier,
  extractExportsFromInlineDecl,
  extractExportsFromVariableDecl,
} from "../extractors/exports";
import { GraphBuilder } from "../builders/graphBuilder";

export const extractExportsFromSourceFile = (
  sourceFile: SourceFile,
  relativePath: string,
  graphBuilder: GraphBuilder,
) => {
  const expSyms = sourceFile.getExportSymbols();
  const symbols: SymbolFact[] = [];
  const edges: Edge[] = [];

  for (const s of expSyms) {
    const decl = s.getDeclarations()[0];
    console.log(decl.getKindName());
    if (Node.isVariableDeclaration(decl)) {
      const edge = extractExportsFromVariableDecl(decl, s, relativePath);
      if (edge) edges.push(edge);
    }

    if (Node.isFunctionDeclaration(decl) || Node.isClassDeclaration(decl)) {
      const edge = extractExportsFromInlineDecl(s, relativePath);
      if (edge) edges.push(edge);
    }

    if (Node.isExportSpecifier(decl)) {
      const edge = extractExportsFromExportSpecifier(s, relativePath);
      if (edge) edges.push(edge);
    }

    if (Node.isExportAssignment(decl)) {
      const extractionRes = extractExportsFromExportAssignment(s, relativePath);
      if (extractionRes) {
        const { edge, symbols } = extractionRes;
        edges.push(edge);
        symbols.push(...symbols);
      }
    }
  }

  symbols.forEach((s) => graphBuilder.createSymbolNode(s));
  edges.forEach((e) => graphBuilder.createEdge(e));
};
