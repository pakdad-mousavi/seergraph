import { Node, SourceFile } from "ts-morph";
import { SymbolFact } from "../../types";
import { Edge } from "@seergraph/shared";

import {
  extractExportsFromExportAssignment,
  extractExportsFromExportSpecifier,
  extractExportsFromInlineDecl,
  extractExportsFromVariableDecl,
} from "../extractors/exports";

export const extractExportsFromSourceFile = (sourceFile: SourceFile, symbols: SymbolFact[], relativePath: string) => {
  const expSyms = sourceFile.getExportSymbols();
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
      const res = extractExportsFromExportAssignment(s, relativePath);
      if (res) {
        const { edge, symbols: syms } = res;
        console.log(syms);
        symbols.push(...syms);
        if (edge) edges.push(edge);
      }
    }
  }

  return edges;
};
