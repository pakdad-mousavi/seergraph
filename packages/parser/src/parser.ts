import type { ProjectGraph, SymbolNode, FileNode, Edge, LanguageExtension } from "@seergraph/shared";

import { scanRepo } from "./scanner";
import { tsAnalyzer } from "./analyzers/tsAnalyzer/tsAnalyzer";

// interface AstParser {
//   (filePath: string): Promise<ProjectGraph | void>; // TODO: REMOVE VOID
// }

// interface RepoParser {
//   parsers: Record<LanguageExtension, AstParser>;
//   parseProject(): Promise<ProjectGraph | void>; // TODO: REMOVE VOID
// }

export class Parser {
  constructor(
    private root: string,
    private useTsconfig: boolean,
  ) {}

  public async parseProject(): Promise<void> {
    try {
      const filePaths = await scanRepo(this.root);
      tsAnalyzer(this.root, this.useTsconfig, filePaths);

      // const parse = this.parsers[".ts"];
      // await parse(filePath);
    } catch (error) {
      if (error instanceof Error) {
        console.error("XXX");
        console.error(error);
      } else {
        console.error("An unexpected error occurred", error);
      }
    }
  }
}
