// import { parseFile } from "./parser";
import { analyzer } from "./analyzer/analyzer";
import { Parser } from "./parser";
import { scanRepo } from "./scanner";

export const parseRepo = async (repoPath: string) => {
  try {
    const filePaths = await scanRepo(repoPath);
    analyzer({ root: repoPath, projectInit: "empty", input: filePaths });
    
  } catch (error) {
    console.error("ERROR HAS OCCURRED");
    if (error instanceof Error) {
      console.error(error);
    } else {
      console.error("An unexpected error occurred", error);
    }
  }
};

// (async () => await parseRepo("/Users/pakdad/Desktop/Work/Projects/pixeli"))();
(async () => await parseRepo("/Users/pakdad/Desktop/Work/Projects/seergraph/packages/parser/src/dummy-files"))();
