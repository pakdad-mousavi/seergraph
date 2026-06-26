import { Edge } from "@seergraph/shared";

export const buildExportIndex = (exportEdges: Edge[]) => {
  const exportsByFile = new Map<
    string, // Index on filename
    Map<string, Edge> // exportName -> full edge
  >();

  for (const edge of exportEdges) {
    const fileExports = exportsByFile.get(edge.from) ?? new Map();

    const meta = edge.meta;
    if (!meta || edge.type !== "exports") continue;

    fileExports.set(edge.meta?.isDefault ? "default" : meta.exportedAs, edge);

    exportsByFile.set(edge.from, fileExports);
  }

  return exportsByFile;
};
