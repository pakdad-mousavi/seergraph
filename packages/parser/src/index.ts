// import { parseFile } from "./parser";
import { Parser } from "./parser";
import { scanRepo } from "./scanner";

export const parseRepo = async (repoPath: string) => {
  const parser = new Parser(repoPath, false);
  await parser.parseProject();
};

// (async () => await parseRepo("/Users/pakdad/Desktop/Work/Projects/pixeli"))();
(async () => await parseRepo("/Users/pakdad/Desktop/Work/Projects/seergraph/packages/parser/src/dummy-files"))();
