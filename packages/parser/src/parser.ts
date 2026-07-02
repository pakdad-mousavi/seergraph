import { scanRepo } from "./scanner";
import { analyzer } from "./analyzer/analyzer";

export class Parser {
  constructor(
    private root: string,
    private useTsconfig: boolean,
  ) {}

  public async parseProject(): Promise<void> {
    try {
      const filePaths = await scanRepo(this.root);
      // analyzer({root: this.root, projectInit: });

      // const parse = this.parsers[".ts"];
      // await parse(filePath);
    } catch (error) {
      console.error("ERROR HAS OCCURRED");
      if (error instanceof Error) {
        console.error(error);
      } else {
        console.error("An unexpected error occurred", error);
      }
    }
  }
}
