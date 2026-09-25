import * as ts from 'typescript';
import { PageMetadata, SourceLocation } from '@seokit/website';

export interface FrameworkExtractor {
  extract(sourceFile: ts.SourceFile, code: string): Partial<PageMetadata>;
}

export function locateNode(node: ts.Node, sourceFile: ts.SourceFile, code: string): SourceLocation {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  
  // Extract snippet (current line)
  const lines = code.split('\n');
  const snippet = lines[start.line] ? lines[start.line].trim() : '';

  return {
    line: start.line + 1, // 1-indexed
    columnStart: start.character + 1,
    columnEnd: start.character + node.getWidth() + 1,
    snippet
  };
}

// Utility to recursively find property assignments in ObjectLiterals
export function findProperty(node: ts.Node, propName: string): ts.PropertyAssignment | undefined {
  if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === propName) {
    return node;
  }
  let found: ts.PropertyAssignment | undefined;
  ts.forEachChild(node, child => {
    if (!found) {
      found = findProperty(child, propName);
    }
  });
  return found;
}
