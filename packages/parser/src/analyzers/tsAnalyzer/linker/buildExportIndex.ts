import { Edge } from "@seergraph/shared";

export const buildExportIndex = (exportEdges: Edge[]) => {
  const exportsByFile = new Map<
    string, // Index on filename
    Map<string, string> // exportName -> symbolId
  >();

  for (const edge of exportEdges) {
    const fileExports = exportsByFile.get(edge.from) ?? new Map();

    const meta = edge.meta;
    if (!meta || edge.type !== "exports") continue;

    fileExports.set(meta.exportedAs, edge.to);

    exportsByFile.set(edge.from, fileExports);
  }

  return exportsByFile;
};
