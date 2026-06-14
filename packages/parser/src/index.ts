// import { parseFile } from "./parser";
import { Parser } from "./parser";
import { scanRepo } from "./scanner";

export const parseRepo = async (repoPath: string) => {
  const parser = new Parser(repoPath);
  await parser.parseProject();
};

(async () => await parseRepo("/Users/pakdad/Desktop/Work/Projects/pixeli"))();
