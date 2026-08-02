import * as fs from 'fs';
import * as path from 'path';

export interface FixDiff {
  filePath: string;
  original: string;
  modified: string;
  diffText: string;
}

export class SEOFixerEngine {
  public static generateDiff(original: string, modified: string): string {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const diffLines: string[] = [];

    const max = Math.max(origLines.length, modLines.length);
    for (let i = 0; i < max; i++) {
      const o = origLines[i];
      const m = modLines[i];
      if (o !== m) {
        if (o !== undefined) diffLines.push(`- ${o}`);
        if (m !== undefined) diffLines.push(`+ ${m}`);
      } else {
        if (o !== undefined) diffLines.push(`  ${o}`);
      }
    }

    return diffLines.join('\n');
  }

  public static validateFixSafety(html: string, fixType: string, options: any = {}): void {
    if (fixType === 'canonical') {
      if (html.includes('<link rel="canonical"')) {
        throw new Error('Safety Check Failed: Canonical link tag already exists in HTML content.');
      }
      if (!options.href || !options.href.startsWith('http')) {
        throw new Error('Safety Check Failed: Invalid or missing canonical href URL.');
      }
    } else if (fixType === 'title') {
      if (!options.title || options.title.trim().length === 0) {
        throw new Error('Safety Check Failed: Optimize Title target string cannot be empty.');
      }
    } else if (fixType === 'schema') {
      if (html.includes('application/ld+json') && options.schema && html.includes(options.schema)) {
        throw new Error('Safety Check Failed: Duplicate structured schema payload detected.');
      }
    }
  }

  public static insertCanonical(html: string, href: string): string {
    if (html.includes('<link rel="canonical"')) return html;
    const headIndex = html.indexOf('</head>');
    if (headIndex !== -1) {
      return html.slice(0, headIndex) + `  <link rel="canonical" href="${href}">\n` + html.slice(headIndex);
    }
    return html;
  }

  public static insertBreadcrumb(html: string): string {
    if (html.includes('id="seokit-breadcrumbs"')) return html;
    const bodyIndex = html.indexOf('<body>');
    if (bodyIndex !== -1) {
      const insertionIndex = bodyIndex + 6;
      return html.slice(0, insertionIndex) + `\n  <nav id="seokit-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li></ol></nav>` + html.slice(insertionIndex);
    }
    return html;
  }

  public static insertSchema(html: string, schemaJson: string): string {
    const headIndex = html.indexOf('</head>');
    if (headIndex !== -1) {
      return html.slice(0, headIndex) + `  <script type="application/ld+json">\n  ${schemaJson}\n  </script>\n` + html.slice(headIndex);
    }
    return html;
  }

  public static optimizeMetaTitle(html: string, newTitle: string): string {
    const titleRegex = /<title>[^]*?<\/title>/gi;
    if (titleRegex.test(html)) {
      return html.replace(titleRegex, `<title>${newTitle}</title>`);
    }
    const headIndex = html.indexOf('</head>');
    if (headIndex !== -1) {
      return html.slice(0, headIndex) + `  <title>${newTitle}</title>\n` + html.slice(headIndex);
    }
    return `<head><title>${newTitle}</title></head>\n${html}`;
  }

  public static optimizeMetaDescription(html: string, description: string): string {
    const metaRegex = /<meta\s+name="description"\s+content="[^]*?"\s*\/?>/gi;
    if (metaRegex.test(html)) {
      return html.replace(metaRegex, `<meta name="description" content="${description}">`);
    }
    const headIndex = html.indexOf('</head>');
    if (headIndex !== -1) {
      return html.slice(0, headIndex) + `  <meta name="description" content="${description}">\n` + html.slice(headIndex);
    }
    return `<head><meta name="description" content="${description}"></head>\n${html}`;
  }

  public static generateImageAlt(html: string): string {
    const imgRegex = /<img(?![^>]*\balt\b)[^>]*>/gi;
    return html.replace(imgRegex, (match) => {
      return match.replace('<img', '<img alt="SEO Optimized Image"');
    });
  }

  public static restructureHeadings(html: string): string {
    let firstH1 = true;
    return html.replace(/<h1[^>]*>([^]*?)<\/h1>/gi, (match, p1) => {
      if (firstH1) {
        firstH1 = false;
        return match;
      }
      return `<h2>${p1}</h2>`;
    });
  }

  public static insertInternalLink(html: string, anchorText: string, href: string): string {
    if (html.includes(`href="${href}"`)) return html;
    const bodyEndIndex = html.indexOf('</body>');
    if (bodyEndIndex !== -1) {
      return html.slice(0, bodyEndIndex) + `  <p>Read more: <a href="${href}">${anchorText}</a></p>\n` + html.slice(bodyEndIndex);
    }
    return html;
  }

  public static fixRobotsTxt(content: string, sitemapUrl?: string): string {
    let modified = content;
    if (!modified.includes('User-agent: *')) {
      modified = `User-agent: *\nAllow: /\n\n${modified}`;
    }
    if (sitemapUrl && !modified.includes('Sitemap:')) {
      modified = modified.trim() + `\n\nSitemap: ${sitemapUrl}\n`;
    }
    return modified;
  }

  public static generateSitemap(urls: string[]): string {
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const url of urls) {
      sitemap += `  <url>\n    <loc>${url}</loc>\n  </url>\n`;
    }
    sitemap += `</urlset>`;
    return sitemap;
  }

  public static generateLlmsTxt(
    siteName: string,
    description: string,
    pages: { title: string; url: string; description?: string }[]
  ): string {
    const lines = [
      `# ${siteName}`,
      '',
      `> ${description}`,
      '',
      '## Details',
      '',
      'This is the primary developer and AI documentation index.',
      '',
      '## Page Links',
      ''
    ];

    for (const page of pages) {
      const desc = page.description ? `: ${page.description}` : '';
      lines.push(`- [${page.title}](${page.url})${desc}`);
    }

    return lines.join('\n') + '\n';
  }

  public static saveBackupSnapshot(workspaceRoot: string, filePath: string): void {
    const backupDir = path.join(workspaceRoot, '.seokit', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    if (fs.existsSync(filePath)) {
      const fileName = path.basename(filePath);
      const backupPath = path.join(backupDir, `${fileName}.bak`);
      fs.copyFileSync(filePath, backupPath);
    }
  }

  public static rollbackBackup(workspaceRoot: string, filePath: string): void {
    const backupDir = path.join(workspaceRoot, '.seokit', 'backups');
    const fileName = path.basename(filePath);
    const backupPath = path.join(backupDir, `${fileName}.bak`);
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
    } else {
      throw new Error(`No backup snapshot found to rollback file: ${fileName}`);
    }
  }

  public static applyTransactionalFixes(
    workspaceRoot: string,
    fixes: { filePath: string; fixType: string; options: any }[],
    proposer: (filePath: string, fixType: string, options: any) => string
  ): void {
    const appliedSnapshots: string[] = [];

    try {
      // 1. Validate all fixes before making modifications
      for (const fix of fixes) {
        const content = fs.existsSync(fix.filePath) ? fs.readFileSync(fix.filePath, 'utf-8') : '';
        this.validateFixSafety(content, fix.fixType, fix.options);
      }

      // 2. Backup and execute changes
      for (const fix of fixes) {
        this.saveBackupSnapshot(workspaceRoot, fix.filePath);
        appliedSnapshots.push(fix.filePath);

        const modifiedContent = proposer(fix.filePath, fix.fixType, fix.options);
        // Ensure parent directories exist
        const dir = path.dirname(fix.filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fix.filePath, modifiedContent, 'utf-8');
      }
    } catch (err) {
      // 3. Rollback any applied files on error
      for (const filePath of appliedSnapshots) {
        try {
          this.rollbackBackup(workspaceRoot, filePath);
        } catch {
          // ignore nested restore issues
        }
      }
      throw err;
    }
  }
}
