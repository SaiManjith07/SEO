import * as ts from 'typescript';
import { PageMetadata } from '@seokit/website';
import { FrameworkExtractor, locateNode, findProperty } from './extractor.js';

export class NextJsExtractor implements FrameworkExtractor {
  public extract(sourceFile: ts.SourceFile, code: string): Partial<PageMetadata> {
    const pageMetadata: Partial<PageMetadata> = {
      metaTags: {},
      headings: { h1: [], h2: [], h3: [] },
      outboundLinks: []
    };

    // Find `export const metadata = { ... }` or `export function generateMetadata() { ... }`
    ts.forEachChild(sourceFile, node => {
      if (ts.isVariableStatement(node)) {
        const isExport = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
        if (isExport) {
          for (const dec of node.declarationList.declarations) {
            if (ts.isIdentifier(dec.name) && dec.name.text === 'metadata') {
              if (dec.initializer && ts.isObjectLiteralExpression(dec.initializer)) {
                this.parseMetadataObject(dec.initializer, pageMetadata, sourceFile, code);
              }
            }
          }
        }
      }
    });

    return pageMetadata;
  }

  private parseMetadataObject(
    obj: ts.ObjectLiteralExpression,
    meta: Partial<PageMetadata>,
    sourceFile: ts.SourceFile,
    code: string
  ) {
    const titleProp = findProperty(obj, 'title');
    if (titleProp && titleProp.initializer && ts.isStringLiteral(titleProp.initializer)) {
      meta.title = {
        value: titleProp.initializer.text,
        location: locateNode(titleProp, sourceFile, code)
      };
    }

    const descProp = findProperty(obj, 'description');
    if (descProp && descProp.initializer && ts.isStringLiteral(descProp.initializer)) {
      meta.description = {
        value: descProp.initializer.text,
        location: locateNode(descProp, sourceFile, code)
      };
    }

    const alternatesProp = findProperty(obj, 'alternates');
    if (alternatesProp && alternatesProp.initializer && ts.isObjectLiteralExpression(alternatesProp.initializer)) {
      const canonicalProp = findProperty(alternatesProp.initializer, 'canonical');
      if (canonicalProp && canonicalProp.initializer && ts.isStringLiteral(canonicalProp.initializer)) {
        meta.canonicalUrl = {
            value: canonicalProp.initializer.text,
            location: locateNode(canonicalProp, sourceFile, code)
        };
      }
    }

    const openGraphProp = findProperty(obj, 'openGraph');
    if (openGraphProp && openGraphProp.initializer && ts.isObjectLiteralExpression(openGraphProp.initializer)) {
        const ogTitle = findProperty(openGraphProp.initializer, 'title');
        if (ogTitle && ogTitle.initializer && ts.isStringLiteral(ogTitle.initializer) && meta.metaTags) {
            meta.metaTags['og:title'] = {
                value: ogTitle.initializer.text,
                location: locateNode(ogTitle, sourceFile, code)
            }
        }
        const ogDesc = findProperty(openGraphProp.initializer, 'description');
        if (ogDesc && ogDesc.initializer && ts.isStringLiteral(ogDesc.initializer) && meta.metaTags) {
            meta.metaTags['og:description'] = {
                value: ogDesc.initializer.text,
                location: locateNode(ogDesc, sourceFile, code)
            }
        }
    }
  }
}
