import { toFileId, toSymbolId } from "@seergraph/shared";
import { buildExportIndex } from "../linker/buildExportIndex";
import { ImportFact } from "../../types";
import { randomUUID } from "node:crypto";
import { GraphBuilder } from "../builders/graphBuilder";

export const resolveImports = (importsPerFile: Record<string, ImportFact[]>, graphBuilder: GraphBuilder) => {
  const expIndex = buildExportIndex(graphBuilder);

  for (const [importPath, importFacts] of Object.entries(importsPerFile)) {
    for (const importFact of importFacts) {
      const exports = expIndex.get(importFact.moduleSpecifier);
      if (!exports) continue;

      for (const namedImport of importFact.namedImports) {
        const expEdge = exports.get(namedImport.imported);
        if (!expEdge?.from) continue;

        graphBuilder.createEdge({
          id: randomUUID(),
          from: toFileId(importPath),
          to: expEdge.to,
          kind: "imports",
          meta: {
            importName: namedImport.local || namedImport.imported,
          },
        });

        graphBuilder.createBindingSymbolNode(
          {
            id: toSymbolId(`${importPath}#binding:${namedImport.local || namedImport.imported}`),
            name: namedImport.local || namedImport.imported,
            kind: "binding",
            location: importFact.location,
            parentId: importPath,
          },
          expEdge.to,
        );
      }

      if (importFact.defaultImport) {
        const expEdge = exports.get("default");
        if (!expEdge?.from) continue;

        graphBuilder.createEdge({
          id: randomUUID(),
          from: toFileId(importPath),
          to: expEdge.to,
          kind: "imports",
          meta: {
            importName: importFact.defaultImport,
          },
        });

        graphBuilder.createBindingSymbolNode(
          {
            id: toSymbolId(`${importPath}#binding:${importFact.defaultImport}`),
            name: importFact.defaultImport,
            kind: "binding",
            location: importFact.location,
            parentId: importPath,
          },
          expEdge.to,
        );
      }

      if (importFact.namespaceImport) {
        graphBuilder.createEdge({
          id: randomUUID(),
          from: toFileId(importPath),
          to: toFileId(importFact.moduleSpecifier),
          kind: "imports",
          meta: {
            importName: importFact.namespaceImport,
            isNamespace: true,
          },
        });

        graphBuilder.createBindingSymbolNode(
          {
            id: toSymbolId(`${importPath}#binding:${importFact.namespaceImport}`),
            name: importFact.namespaceImport,
            kind: "binding",
            location: importFact.location,
            parentId: importPath,
          },
          toFileId(importFact.moduleSpecifier),
        );
      }
    }
  }
};
