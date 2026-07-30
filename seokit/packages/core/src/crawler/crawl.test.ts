import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { crawlSite } from './crawl.js';
import * as http from 'http';

describe('recursive site crawler tests', () => {
  let server: http.Server;
  let port: number;

  beforeAll(() => {
    // Start a tiny local mock HTTP server
    server = http.createServer((req, res) => {
      const url = req.url || '';
      
      if (url === '/robots.txt') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('User-agent: *\nDisallow: /admin\nsitemap: http://localhost:PORT/sitemap.xml');
      } else if (url === '/sitemap.xml') {
        res.writeHead(200, { 'Content-Type': 'application/xml' });
        res.end('<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>');
      } else if (url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><a href="/about">About</a><a href="https://external-site.com">External</a></body></html>');
      } else if (url === '/about') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>About Us</h1><a href="/contact">Contact</a></body></html>');
      } else if (url === '/contact') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Contact</h1><a href="/">Home</a></body></html>');
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    // Listen on a random free port
    server.listen(0);
    const addr = server.address();
    port = typeof addr === 'string' ? 0 : addr?.port || 0;
  });

  afterAll(() => {
    server.close();
  });

  it('should crawl local mock server recursively and build link graph', async () => {
    const seed = `http://localhost:${port}/`;
    const result = await crawlSite(seed, 5, false);

    expect(result.pages.length).toBe(3); // /, /about, /contact
    expect(result.sitemapUrls).toContain(`http://localhost:PORT/sitemap.xml`);
    expect(result.robotsTxt).toContain('User-agent: *');
    
    // Check links mapping in the graph
    const indexUrl = seed;
    const aboutUrl = `http://localhost:${port}/about`;
    
    expect(result.linkGraph.get(indexUrl)).toContain(aboutUrl);
  });
});
