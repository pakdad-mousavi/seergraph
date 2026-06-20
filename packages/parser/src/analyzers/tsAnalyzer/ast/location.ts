import { Location } from "@seergraph/shared";
import { Node } from "ts-morph";

export const getLocation = (node: Node, fileId: string): Location => {
  return {
    fileId,
    startLine: node.getStartLineNumber(false),
    startChar: node.getStart(false),
    endLine: node.getEndLineNumber(),
    endChar: node.getEnd(),
  };
};
