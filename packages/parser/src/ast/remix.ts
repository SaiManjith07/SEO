import * as ts from 'typescript';
import { PageMetadata } from '@seokit/website';
import { FrameworkExtractor, locateNode, findProperty } from './extractor.js';

export class RemixExtractor implements FrameworkExtractor {
  public extract(sourceFile: ts.SourceFile, code: string): Partial<PageMetadata> {
    const pageMetadata: Partial<PageMetadata> = {
      metaTags: {},
      headings: { h1: [], h2: [], h3: [] },
      outboundLinks: []
    };

    // Find `export const meta: MetaFunction = () => { return [ { title: "..." }, ... ] }`
    ts.forEachChild(sourceFile, node => {
      if (ts.isVariableStatement(node)) {
        const isExport = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
        if (isExport) {
          for (const dec of node.declarationList.declarations) {
            if (ts.isIdentifier(dec.name) && dec.name.text === 'meta') {
              if (dec.initializer && (ts.isArrowFunction(dec.initializer) || ts.isFunctionExpression(dec.initializer))) {
                 this.parseMetaFunction(dec.initializer, pageMetadata, sourceFile, code);
              }
            }
          }
        }
      }
    });

    return pageMetadata;
  }

  private parseMetaFunction(
    func: ts.ArrowFunction | ts.FunctionExpression,
    meta: Partial<PageMetadata>,
    sourceFile: ts.SourceFile,
    code: string
  ) {
    let returnedArray: ts.ArrayLiteralExpression | undefined;

    if (ts.isBlock(func.body)) {
      ts.forEachChild(func.body, statement => {
        if (ts.isReturnStatement(statement) && statement.expression && ts.isArrayLiteralExpression(statement.expression)) {
          returnedArray = statement.expression;
        }
      });
    } else if (ts.isArrayLiteralExpression(func.body)) {
      returnedArray = func.body;
    }

    if (returnedArray) {
      for (const element of returnedArray.elements) {
        if (ts.isObjectLiteralExpression(element)) {
          const titleProp = findProperty(element, 'title');
          if (titleProp && titleProp.initializer && ts.isStringLiteral(titleProp.initializer)) {
            meta.title = {
              value: titleProp.initializer.text,
              location: locateNode(titleProp, sourceFile, code)
            };
          }

          const nameProp = findProperty(element, 'name');
          const propertyProp = findProperty(element, 'property');
          const contentProp = findProperty(element, 'content');

          if ((nameProp || propertyProp) && contentProp && contentProp.initializer && ts.isStringLiteral(contentProp.initializer)) {
            let key = '';
            let keyNode: ts.PropertyAssignment | undefined;
            if (nameProp && nameProp.initializer && ts.isStringLiteral(nameProp.initializer)) {
              key = nameProp.initializer.text;
              keyNode = nameProp;
            } else if (propertyProp && propertyProp.initializer && ts.isStringLiteral(propertyProp.initializer)) {
              key = propertyProp.initializer.text;
              keyNode = propertyProp;
            }

            if (key && keyNode && meta.metaTags) {
                if (key === 'description') {
                    meta.description = {
                        value: contentProp.initializer.text,
                        location: locateNode(contentProp, sourceFile, code)
                    };
                } else {
                    meta.metaTags[key] = {
                        value: contentProp.initializer.text,
                        location: locateNode(keyNode, sourceFile, code)
                    };
                }
            }
          }
        }
      }
    }
  }
}
