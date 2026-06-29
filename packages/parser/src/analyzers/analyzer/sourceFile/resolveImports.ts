import { Edge } from "@seergraph/shared";
import { buildExportIndex } from "../linker/buildExportIndex";
import { ImportFact, SymbolNode } from "../../../types";
import { randomUUID } from "node:crypto";

export const resolveImports = (exportEdges: Edge[], importsPerFile: Record<string, ImportFact[]>) => {
  const expIndex = buildExportIndex(exportEdges);
  console.log(expIndex);

  const importEdges: Edge[] = [];
  const aliasEdges: Edge[] = [];
  const symbols: SymbolNode[] = [];

  for (const [importPath, importFacts] of Object.entries(importsPerFile)) {
    for (const importFact of importFacts) {
      const exports = expIndex.get(importFact.moduleSpecifier);
      if (!exports) continue;

      for (const namedImport of importFact.namedImports) {
        const expEdge = exports.get(namedImport.imported);
        if (!expEdge?.from) continue;

        importEdges.push({
          id: randomUUID(),
          from: importPath,
          to: expEdge.to,
          type: "imports",
          meta: {
            importName: namedImport.local || namedImport.imported,
          },
        });

        const id = `${importPath}#binding:${namedImport.local || namedImport.imported}`;
        symbols.push({
          id,
          name: namedImport.local || namedImport.imported,
          kind: "binding",
          location: importFact.location,
          parentId: importPath,
        });

        aliasEdges.push({
          id: randomUUID(),
          from: id,
          to: expEdge.to,
          type: "aliases",
        });
      }

      if (importFact.defaultImport) {
        const expEdge = exports.get("default");
        if (!expEdge?.from) continue;

        importEdges.push({
          id: randomUUID(),
          from: importPath,
          to: expEdge.to,
          type: "imports",
          meta: {
            importName: importFact.defaultImport,
          },
        });

        const id = `${importPath}#binding:${importFact.defaultImport}`;
        symbols.push({
          id,
          name: importFact.defaultImport,
          kind: "binding",
          location: importFact.location,
          parentId: importPath,
        });

        aliasEdges.push({
          id: randomUUID(),
          from: id,
          to: expEdge.to,
          type: "aliases",
        });
      }

      if (importFact.namespaceImport) {
        importEdges.push({
          id: randomUUID(),
          from: importPath,
          to: importFact.moduleSpecifier,
          type: "imports",
          meta: {
            importName: importFact.namespaceImport,
          },
        });

        const id = `${importPath}#binding:${importFact.namespaceImport}`;
        symbols.push({
          id,
          name: importFact.namespaceImport,
          kind: "binding",
          location: importFact.location,
          parentId: importPath,
        });

        aliasEdges.push({
          id: randomUUID(),
          from: id,
          to: importFact.moduleSpecifier,
          type: "aliases",
          meta: {
            isNamespace: true,
          },
        });
      }
    }
  }

  return { importEdges, aliasEdges, symbols };
};
