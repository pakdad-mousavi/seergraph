import { SourceFile } from "ts-morph";
import type { ImportFact } from "../../types";

export const extractImportsFromSourceFile = (sourceFile: SourceFile, relativePath: string) => {
  const importDecls = sourceFile.getImportDeclarations();
  const importFacts: ImportFact[] = importDecls.flatMap((i) => {
    const modSpecifier = i.getModuleSpecifierSourceFile();
    if (!modSpecifier) return [];

    return [
      {
        moduleSpecifier: modSpecifier.getFilePath(),
        namedImports: i.getNamedImports().map((n) => {
          return { imported: n.getName(), local: n.getAliasNode()?.getText() };
        }),
        defaultImport: i.getDefaultImport()?.getSymbol()?.getName(),
        namespaceImport: i.getNamespaceImport()?.getSymbol()?.getName(),
      },
    ];
  });

  return importFacts;
};
