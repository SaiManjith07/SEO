import { defineRule } from '../engine.js';
import { extract } from '../analyzers/extract.js';
import type { Finding, SiteContext } from '../types.js';

/**
 * Flags keyword cannibalization by checking if multiple pages share the same Title or H1 content.
 */
export const keywordCannibalization = defineRule<SiteContext>({
  id: 'site/keyword-cannibalization',
  category: 'aeo',
  severity: 'warning',
  needs: 'site',
  description: 'Detects if multiple pages target identical keywords/titles.',
  check(ctx) {
    const findings: Finding[] = [];
    const titleToUrls = new Map<string, string[]>();
    const h1ToUrls = new Map<string, string[]>();

    for (const page of ctx.pages) {
      const parsed = extract(page.rawHtml);
      
      if (parsed.title) {
        const normalizedTitle = parsed.title.trim().toLowerCase();
        if (!titleToUrls.has(normalizedTitle)) {
          titleToUrls.set(normalizedTitle, []);
        }
        titleToUrls.get(normalizedTitle)!.push(page.url);
      }

      for (const h1 of parsed.h1s) {
        const normalizedH1 = h1.trim().toLowerCase();
        if (normalizedH1) {
          if (!h1ToUrls.has(normalizedH1)) {
            h1ToUrls.set(normalizedH1, []);
          }
          h1ToUrls.get(normalizedH1)!.push(page.url);
        }
      }
    }

    // Flag duplicate titles
    for (const [title, urls] of titleToUrls.entries()) {
      if (urls.length > 1) {
        findings.push({
          ruleId: 'site/keyword-cannibalization',
          severity: 'warning',
          message: `Keyword cannibalization detected: Multiple pages share the title "${title}"`,
          fix: 'Differentiate the page titles to target unique semantic keyword subtopics.',
          evidence: { urls }
        });
      }
    }

    // Flag duplicate H1s
    for (const [h1, urls] of h1ToUrls.entries()) {
      if (urls.length > 1) {
        findings.push({
          ruleId: 'site/keyword-cannibalization',
          severity: 'warning',
          message: `Keyword cannibalization detected: Multiple pages share the H1 heading "${h1}"`,
          fix: 'Differentiate the header topics to target unique content angles.',
          evidence: { urls }
        });
      }
    }

    return findings;
  }
});

/**
 * Flags orphan pages that have no incoming internal link references.
 */
export const orphanPages = defineRule<SiteContext>({
  id: 'site/orphan-pages',
  category: 'technical',
  severity: 'warning',
  needs: 'site',
  description: 'Identify pages with no incoming internal links.',
  check(ctx) {
    const findings: Finding[] = [];
    const inbound = new Set<string>();

    for (const links of ctx.linkGraph.values()) {
      for (const link of links) {
        try {
          const absoluteUrl = new URL(link, ctx.origin).href;
          inbound.add(absoluteUrl);
        } catch {
          inbound.add(link);
        }
      }
    }

    for (const page of ctx.pages) {
      // Exclude homepage/root origin from orphan checks
      if (page.url === ctx.origin || page.url === `${ctx.origin}/` || page.url === `${ctx.origin}/index.html`) {
        continue;
      }

      if (!inbound.has(page.url)) {
        findings.push({
          ruleId: 'site/orphan-pages',
          severity: 'warning',
          message: `Orphan page found: "${page.url}" has no inbound internal link references.`,
          fix: 'Link to this page from relevant parent pages or include it in main navigation menus.',
          location: { url: page.url }
        });
      }
    }

    return findings;
  }
});

/**
 * Flags thin content pages containing word counts lower than 200 words.
 */
export const thinContent = defineRule<SiteContext>({
  id: 'site/thin-content',
  category: 'content',
  severity: 'warning',
  needs: 'site',
  description: 'Find pages with thin textual content.',
  check(ctx) {
    const findings: Finding[] = [];

    for (const page of ctx.pages) {
      const parsed = extract(page.rawHtml);
      if (parsed.wordCount < 200) {
        findings.push({
          ruleId: 'site/thin-content',
          severity: 'warning',
          message: `Thin content detected: "${page.url}" contains only ${parsed.wordCount} words (minimum threshold: 200 words).`,
          fix: 'Expand the page content with useful information, primary research, or detailed definitions.',
          location: { url: page.url },
          evidence: { wordCount: parsed.wordCount }
        });
      }
    }

    return findings;
  }
});

/**
 * Flags identical duplicate body content pages.
 */
export const duplicateContent = defineRule<SiteContext>({
  id: 'site/duplicate-content',
  category: 'content',
  severity: 'warning',
  needs: 'site',
  description: 'Identify identical text contents served across multiple URLs.',
  check(ctx) {
    const findings: Finding[] = [];
    const textToUrls = new Map<string, string[]>();

    for (const page of ctx.pages) {
      const parsed = extract(page.rawHtml);
      // Clean text content representation
      const cleanText = (parsed.title + ' ' + parsed.h1s.join(' ')).trim().toLowerCase();
      if (cleanText.length > 10) {
        if (!textToUrls.has(cleanText)) {
          textToUrls.set(cleanText, []);
        }
        textToUrls.get(cleanText)!.push(page.url);
      }
    }

    for (const [text, urls] of textToUrls.entries()) {
      if (urls.length > 1) {
        findings.push({
          ruleId: 'site/duplicate-content',
          severity: 'warning',
          message: `Duplicate content detected: Multiple URLs serve identical header text: [${urls.join(', ')}]`,
          fix: 'Merge the redundant pages, apply 301 redirects, or configure canonical tags to point to the primary URL.',
          evidence: { urls }
        });
      }
    }

    return findings;
  }
});

/**
 * Flags missing E-E-A-T site-wide trust pages.
 */
export const eeatTrustPages = defineRule<SiteContext>({
  id: 'site/eeat-trust-pages',
  category: 'technical',
  severity: 'warning',
  needs: 'site',
  description: 'Verifies the presence of crucial E-E-A-T trust signals (About, Contact, Privacy policy).',
  check(ctx) {
    const findings: Finding[] = [];
    const urls = ctx.pages.map((p) => p.url.toLowerCase());

    const hasAbout = urls.some((u) => u.includes('/about') || u.includes('/about-us'));
    const hasContact = urls.some((u) => u.includes('/contact') || u.includes('/contact-us'));
    const hasPrivacy = urls.some((u) => u.includes('/privacy') || u.includes('/privacy-policy'));

    if (!hasAbout) {
      findings.push({
        ruleId: 'site/eeat-trust-pages',
        severity: 'warning',
        message: 'E-E-A-T Signal Missing: About Us page is missing from crawled pages.',
        fix: 'Create a dedicated "About Us" page detailing organization history, mission, and leadership bios.',
        location: { url: ctx.origin }
      });
    }

    if (!hasContact) {
      findings.push({
        ruleId: 'site/eeat-trust-pages',
        severity: 'warning',
        message: 'E-E-A-T Signal Missing: Contact page is missing from crawled pages.',
        fix: 'Create a dedicated "Contact Us" page featuring verified address, contact numbers, and emails.',
        location: { url: ctx.origin }
      });
    }

    if (!hasPrivacy) {
      findings.push({
        ruleId: 'site/eeat-trust-pages',
        severity: 'warning',
        message: 'E-E-A-T Signal Missing: Privacy Policy is missing from crawled pages.',
        fix: 'Create a "Privacy Policy" page to conform with user data transparency requirements.',
        location: { url: ctx.origin }
      });
    }

    return findings;
  }
});
