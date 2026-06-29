import { Edge } from "@seergraph/shared";
import { GraphBuilder } from "../builders/graphBuilder";

export const buildExportIndex = (graphBuilder: GraphBuilder) => {
  const exportsByFile = new Map<
    string, // Index on filename
    Map<string, Edge> // exportName -> full edge
  >();

  const exportEdges = graphBuilder.getEdgesSnapshot().filter((e) => e.kind === "exports");

  for (const edge of exportEdges) {
    const fileExports = exportsByFile.get(edge.from) ?? new Map();

    const meta = edge.meta;
    if (!meta || edge.kind !== "exports") continue;

    fileExports.set(edge.meta?.isDefault ? "default" : meta.exportedAs, edge);

    exportsByFile.set(edge.from, fileExports);
  }

  return exportsByFile;
};
