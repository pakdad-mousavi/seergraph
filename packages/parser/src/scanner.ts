import fs from "node:fs/promises";
import path from "node:path";
import ignore from "ignore";

const isSupportedFileType = (filePath: string) => {
  const supportedExtensions = [".js", ".ts"];
  return supportedExtensions.includes(path.extname(filePath));
};

/**
 *
 * @param rootPath The path to the root directory containing the repository.
 * @returns An array of filepaths (after being filtered out by any .gitignore files).
 */
export const scanRepo = async (rootPath: string) => {
  // Ensure dir exists
  try {
    await fs.access(rootPath, fs.constants.F_OK);
  } catch (e) {
    throw new Error("Directory is not visible or cannot be found.");
  }

  //
  try {
    const filePaths = [];
    const ig = ignore();

    const dirs = await fs.readdir(rootPath, {
      recursive: true,
      withFileTypes: true,
    });
    for (const dir of dirs) {
      // Only keep files
      if (dir.isDirectory()) continue;

      const filePath = path.join(dir.parentPath, dir.name);

      // TEMPORARILY ignore test files (should be a togglable option)
      if (dir.name.includes(".test.")) continue;

      const isIgnore = dir.name.includes(".gitignore");
      if (isIgnore) {
        const gitIgnoreContent = (await fs.readFile(filePath)).toString();
        ig.add(gitIgnoreContent);
        continue;
      }

      filePaths.push(path.relative(rootPath, filePath));
    }

    return ig.filter(filePaths).filter(isSupportedFileType);
  } catch (e) {
    console.log(e);
    return [];
  }
};
