import { SourceFile } from "ts-morph";
import type { ImportFact } from "../../types";
import path from "node:path";
import { getLocation } from "../ast";

export const extractImportsFromSourceFile = (sourceFile: SourceFile, root: string) => {
  const importDecls = sourceFile.getImportDeclarations();
  const importFacts: ImportFact[] = importDecls.flatMap((i) => {
    const modSpecifier = i.getModuleSpecifierSourceFile();
    if (!modSpecifier) return [];

    return [
      {
        moduleSpecifier: path.relative(root, modSpecifier.getFilePath()),
        namedImports: i.getNamedImports().map((n) => {
          return { imported: n.getName(), local: n.getAliasNode()?.getText() };
        }),
        defaultImport: i.getDefaultImport()?.getSymbol()?.getName(),
        namespaceImport: i.getNamespaceImport()?.getSymbol()?.getName(),
        location: getLocation(i, path.relative(root, sourceFile.getFilePath())),
      },
    ];
  });

  return importFacts;
};
