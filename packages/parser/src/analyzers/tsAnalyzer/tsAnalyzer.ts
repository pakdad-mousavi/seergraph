import path from "node:path";
import { Diagnostic, Project, ProjectOptions, ts } from "ts-morph";

import { Edge } from "@seergraph/shared";
import type { ImportFact, SymbolFact } from "../types";

import { extractExportsFromSourceFile } from "./sourceFile/extractExports";
import { extractSymbolsFromSourceFile } from "./sourceFile/extractSymbols";
import { extractImportsFromSourceFile } from "./sourceFile/extractImports";
import { buildExportIndex } from "./linker/buildExportIndex";
import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

type AnalyzerArgs =
  | [root: string, useTsConfig: boolean, input: string[], testingMode?: false] // Input is filepaths
  | [root: string, useTsConfig: boolean, input: string, testingMode: true]; // Input is source code

type AnalyzerReturn =
  | { error: true; symbols: null; imports: null; exportEdges: null; diagnostics: Diagnostic[] }
  | { error: false; symbols: SymbolFact[]; imports: ImportFact[]; exportEdges: Edge[]; diagnostics: null };

export const tsAnalyzer = (...args: AnalyzerArgs): AnalyzerReturn => {
  const [root, useTsConfig, input, testingMode] = args;
  // const absPath = path.resolve(this.root, filePath);

  const project = useTsConfig
    ? new Project({
        tsConfigFilePath: path.join(root, "tsconfig.json"),
        skipAddingFilesFromTsConfig: true,
      })
    : new Project();

  // Testing mode takes in source code
  if (testingMode) {
    // Parse input
    const dummyPath = "dummy-file.ts";
    project.createSourceFile(dummyPath, input);
    const sourceFile = project.getSourceFileOrThrow(dummyPath);

    // Check for errors
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    const containsErrors = diagnostics.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
    if (containsErrors) return { error: true, symbols: null, imports: null, exportEdges: null, diagnostics };

    // Return data
    const symbols = extractSymbolsFromSourceFile(sourceFile, dummyPath);
    const imports = extractImportsFromSourceFile(sourceFile, "./");
    const exportEdges = extractExportsFromSourceFile(sourceFile, symbols, dummyPath);
    return { error: false, symbols, imports, exportEdges, diagnostics: null };
  }
  // Otherwise take in filepaths
  else {
    const projectSymbols: SymbolFact[] = [];
    const projectExportEdges = [];
    const importsPerFile: Record<string, ImportFact[]> = {};
    const allImports = [];

    // Parse input
    for (const filepath of input) {
      // const dummyRelativePath = "./src/dummy-files/ts/index.ts";
      const absolutePath = path.resolve(root, filepath);

      project.addSourceFileAtPath(absolutePath);
      const sourceFile = project.getSourceFileOrThrow(absolutePath);

      // Check for errors
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      const containsErrors = diagnostics.some((d) => d.getCategory() === ts.DiagnosticCategory.Error);
      console.log(diagnostics.map((d) => d.getMessageText() + " " + d.getSourceFile()?.getFilePath()));
      if (containsErrors) return { error: true, symbols: null, imports: null, exportEdges: null, diagnostics };

      // Collect all symbols
      const symbols = extractSymbolsFromSourceFile(sourceFile, filepath);
      projectSymbols.push(...symbols);

      // Collect all export edges
      const exportEdges = extractExportsFromSourceFile(sourceFile, symbols, filepath);
      projectExportEdges.push(...exportEdges);

      // Collect file-specific imports
      const imports = extractImportsFromSourceFile(sourceFile, root);
      importsPerFile[filepath] = imports;
      allImports.push(...imports);
    }

    const expIndex = buildExportIndex(projectExportEdges);
    console.log(expIndex);

    const importEdges: Edge[] = [];
    const aliasEdges: Edge[] = [];

    for (const [importPath, importFacts] of Object.entries(importsPerFile)) {
      for (const importFact of importFacts) {
        const exports = expIndex.get(importFact.moduleSpecifier);
        if (!exports) continue;

        for (const namedImport of importFact.namedImports) {
          const expEdge = exports.get(namedImport.imported);
          if (!expEdge?.from) continue;

          importEdges.push({
            id: randomUUID(),
            from: importPath,
            to: expEdge.to,
            type: "imports",
            meta: {
              importName: namedImport.local || namedImport.imported,
            },
          });

          const id = `${importPath}#binding:${namedImport.local || namedImport.imported}`;
          projectSymbols.push({
            id,
            name: namedImport.local || namedImport.imported,
            kind: "binding",
            location: importFact.location,
            parentId: importPath,
          });

          aliasEdges.push({
            id: randomUUID(),
            from: id,
            to: expEdge.to,
            type: "aliases",
          });
        }

        if (importFact.defaultImport) {
          const expEdge = exports.get("default");
          if (!expEdge?.from) continue;

          importEdges.push({
            id: randomUUID(),
            from: importPath,
            to: expEdge.to,
            type: "imports",
            meta: {
              importName: importFact.defaultImport,
            },
          });

          const id = `${importPath}#binding:${importFact.defaultImport}`;
          projectSymbols.push({
            id,
            name: importFact.defaultImport,
            kind: "binding",
            location: importFact.location,
            parentId: importPath,
          });

          aliasEdges.push({
            id: randomUUID(),
            from: id,
            to: expEdge.to,
            type: "aliases",
          });
        }

        if (importFact.namespaceImport) {
          importEdges.push({
            id: randomUUID(),
            from: importPath,
            to: importFact.moduleSpecifier,
            type: "imports",
            meta: {
              importName: importFact.namespaceImport,
            },
          });

          const id = `${importPath}#binding:${importFact.namespaceImport}`;
          projectSymbols.push({
            id,
            name: importFact.namespaceImport,
            kind: "binding",
            location: importFact.location,
            parentId: importPath,
          });

          aliasEdges.push({
            id: randomUUID(),
            from: id,
            to: importFact.moduleSpecifier,
            type: "aliases",
            meta: {
              isNamespace: true,
            },
          });
        }
      }
    }

    writeFileSync("./symbols.json", JSON.stringify(projectSymbols));
    writeFileSync("./imports.json", JSON.stringify(importsPerFile));
    writeFileSync("./exports.json", JSON.stringify(projectExportEdges));
    writeFileSync("./importEdges.json", JSON.stringify(importEdges));
    writeFileSync("./aliasEdges.json", JSON.stringify(aliasEdges));

    return { error: false, symbols: projectSymbols, imports: [], exportEdges: projectExportEdges, diagnostics: null };
  }
};
