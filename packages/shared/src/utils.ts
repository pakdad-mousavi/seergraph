import { SymbolId, FileId } from "../src";

export const toSymbolId = (id: string) => {
  return id as SymbolId;
};

export const toFileId = (id: string) => {
  return id as FileId;
};