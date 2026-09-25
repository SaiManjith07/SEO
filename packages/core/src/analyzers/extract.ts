import * as cheerio from 'cheerio';

export interface ExtractedPage {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  lang: string | null;
  h1s: string[];
  headings: { level: number; text: string }[];
  images: { src: string; alt: string | null; width?: string; height?: string }[];
  links: { href: string; text: string; rel: string | null }[];
  jsonLd: unknown[];
  /** Visible text content, whitespace-normalised */
  text: string;
  wordCount: number;
}

/** Parse a raw HTML string into the fields every rule needs. Done once per page. */
export function extract(html: string): ExtractedPage {
  const $ = cheerio.load(html);

  const jsonLd: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      jsonLd.push(JSON.parse(raw));
    } catch {
      jsonLd.push({ __parseError: true, raw: raw.slice(0, 200) });
    }
  });

  const headings: { level: number; text: string }[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = (el as unknown as { tagName: string }).tagName ?? 'h1';
    headings.push({
      level: Number(tag.replace(/\D/g, '')) || 1,
      text: $(el).text().trim(),
    });
  });

  const images: ExtractedPage['images'] = [];
  $('img').each((_, el) => {
    const $el = $(el);
    images.push({
      src: $el.attr('src') ?? '',
      alt: $el.attr('alt') ?? null,
      width: $el.attr('width'),
      height: $el.attr('height'),
    });
  });

  const links: ExtractedPage['links'] = [];
  $('a[href]').each((_, el) => {
    const $el = $(el);
    links.push({
      href: $el.attr('href') ?? '',
      text: $el.text().trim(),
      rel: $el.attr('rel') ?? null,
    });
  });

  // Strip non-content elements before measuring visible text.
  $('script, style, noscript, template').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();

  return {
    title: $('title').first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr('content')?.trim() ?? null,
    canonical: $('link[rel="canonical"]').attr('href')?.trim() ?? null,
    robotsMeta: $('meta[name="robots"]').attr('content')?.trim() ?? null,
    lang: $('html').attr('lang')?.trim() ?? null,
    h1s: $('h1')
      .map((_, el) => $(el).text().trim())
      .get(),
    headings,
    images,
    links,
    jsonLd,
    text,
    wordCount: text ? text.split(/\s+/).length : 0,
  };
}

/** Flatten a JSON-LD graph (which may use @graph or be an array) into nodes. */
export function flattenJsonLd(blocks: unknown[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      if (Array.isArray(obj['@graph'])) (obj['@graph'] as unknown[]).forEach(visit);
      if (obj['@type']) out.push(obj);
    }
  };
  blocks.forEach(visit);
  return out;
}

/** Collect every @type present, normalising the array form. */
export function schemaTypes(blocks: unknown[]): Set<string> {
  const types = new Set<string>();
  for (const node of flattenJsonLd(blocks)) {
    const t = node['@type'];
    if (typeof t === 'string') types.add(t);
    else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x));
  }
  return types;
}
