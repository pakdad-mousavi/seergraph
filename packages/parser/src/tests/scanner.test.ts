import { describe, expect, test } from "vitest";
import { scanRepo } from "../scanner";

describe("scanRepo scans repository files correctly", () => {
  test("ScanRepo scans the correct files", async () => {
    const filepaths = await scanRepo("./src/dummy-files");

    expect(filepaths.length).toBe(5);
    expect(filepaths).toStrictEqual([
      "ts/auth.ts",
      "ts/index.ts",
      "ts/utils.ts",
      "ts/someFolder/speak.ts",
      "ts/someFolder/test.ts",
    ]);
  });

  test("ScanRepo throws an error when given a non-existent directory", async () => {
    const filepaths = scanRepo("./fvfiwponpewnveqonvdon");

    await expect(filepaths).rejects.toThrow("Directory is not visible or cannot be found.");
  });
});
