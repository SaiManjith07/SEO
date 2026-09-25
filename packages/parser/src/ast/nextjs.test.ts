import { test, expect } from 'vitest';
import * as ts from 'typescript';
import { NextJsExtractor } from './nextjs.js';

test('NextJsExtractor should extract metadata', () => {
  const code = `
    export const metadata = {
      title: 'Test Title',
      description: 'Test Desc',
      alternates: {
        canonical: 'https://test.com'
      },
      openGraph: {
        title: 'OG Title',
        description: 'OG Desc'
      }
    };
  `;

  const sourceFile = ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true);
  const extractor = new NextJsExtractor();
  const meta = extractor.extract(sourceFile, code);

  expect(meta.title?.value).toBe('Test Title');
  expect(meta.description?.value).toBe('Test Desc');
  expect(meta.canonicalUrl?.value).toBe('https://test.com');
  expect(meta.metaTags?.['og:title']?.value).toBe('OG Title');
  expect(meta.metaTags?.['og:description']?.value).toBe('OG Desc');
});
