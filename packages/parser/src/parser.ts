import type { ProjectGraph, SymbolNode, FileNode, Edge, LanguageExtension } from "@seergraph/shared";

import path from "node:path";

import { scanRepo } from "./scanner";
import { Project } from "ts-morph";
import { tsAnalyzer } from "./analyzers/tsAnalyzer";

interface AstParser {
  (filePath: string): Promise<ProjectGraph | void>; // TODO: REMOVE VOID
}

interface RepoParser {
  parsers: Record<LanguageExtension, AstParser>;
  parseProject(): Promise<ProjectGraph | void>; // TODO: REMOVE VOID
}

export class Parser implements RepoParser {
  constructor(private root: string) {}

  // LANGUAGE SPECIFIC PARSERS
  public parsers: Record<LanguageExtension, AstParser> = {
    ".ts": async (filePath: string) => {
      // Set up project
      const project = new Project();
      const absPath = path.resolve(this.root, filePath);

      const dummyPathToChangeToAbsPath = path.resolve("./src/dummy-files/index.ts");
      project.addSourceFileAtPath(dummyPathToChangeToAbsPath);

      const sourceFile = project.getSourceFileOrThrow(dummyPathToChangeToAbsPath);
    },
    ".js": async (filePath: string) => {},
    ".py": async (filePath: string) => {},
  };

  public async parseProject(): Promise<void> {
    try {
      const filePaths = await scanRepo(this.root);
      tsAnalyzer(this.root, filePaths);

      // const parse = this.parsers[".ts"];
      // await parse(filePath);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("An unexpected error occurred", error);
      }
    }
  }
}
