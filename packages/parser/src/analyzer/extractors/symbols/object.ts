import { Node, ObjectLiteralExpression } from "ts-morph";
import { SymbolNode, toSymbolId } from "@seergraph/shared";
import { getLexicalPath, getLocation, getSymbolId } from "../../ast";

export function* extractObjectLiteral(
  node: ObjectLiteralExpression,
  name: string,
  relativePath: string,
  isFirstRun: boolean = true,
): Generator<SymbolNode> {
  // Use to collect symbolFacts. Needed so that symbolFacts can be emitted in hierarchical order
  const symbolFacts: SymbolNode[] = [];

  // All properties of the current object
  const props = node.getProperties();

  // Flag to specify if a the current object contains callable descendants
  let containsCallableDescendants = false;

  // Loop through each object property
  for (const prop of props) {
    // -----------------------------------
    // Handle all of the object's methods
    // -----------------------------------
    if (Node.isMethodDeclaration(prop)) {
      const name = prop.getName();
      const callstack = getLexicalPath(prop, relativePath);
      const { id, parentId } = getSymbolId([{ name, kind: prop.getKindName() }, ...callstack]);

      symbolFacts.push({
        id,
        parentId,
        name,
        kind: "method",
        location: getLocation(prop, relativePath),
      });

      containsCallableDescendants = true;
      continue;
    }

    // --------------------------------------
    // Handle all of the object's properties
    // --------------------------------------
    if (Node.isPropertyAssignment(prop)) {
      // Get initializer node and property name
      const initializer = prop.getInitializer();
      const name = prop.getName();

      // -------------------------------------
      // Recursively get all object's methods
      // -------------------------------------
      if (Node.isObjectLiteralExpression(initializer)) {
        const symbols = [...extractObjectLiteral(initializer, name, relativePath, false)];
        containsCallableDescendants ||= symbols.length > 0;
        symbolFacts.push(...symbols);
        continue;
      }

      // -------------------------------------------------------------------
      // Handle arrow functions / function expressions stored in a property
      // -------------------------------------------------------------------
      if (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer)) {
        const callstack = getLexicalPath(prop, relativePath);
        const { id, parentId } = getSymbolId([{ name, kind: prop.getKindName() }, ...callstack]);
        symbolFacts.push({
          id,
          parentId,
          name,
          kind: "method",
          location: getLocation(initializer, relativePath),
        });
        containsCallableDescendants = true;
        continue;
      }
    }
  }

  // -------------------------------------------------------------
  // If the object had callable children, emit the object symbol,
  // then emit all of the symbols collected under that object
  // -------------------------------------------------------------
  if (containsCallableDescendants) {
    const callstack = getLexicalPath(node, relativePath);
    // Only insert the node's name if it is not a top-level ObjectLiteralExpression
    if (!isFirstRun) {
      callstack.unshift({ name, kind: node.getKindName() });
    }

    const { id, parentId } = getSymbolId(callstack);

    yield {
      id: parentId === relativePath ? toSymbolId(`${relativePath}#${name}`) : id,
      parentId,
      name,
      kind: "object",
      location: getLocation(node, relativePath),
    };

    yield* symbolFacts;
  }
}
