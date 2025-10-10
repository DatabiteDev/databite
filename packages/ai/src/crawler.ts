import puppeteer from "puppeteer";
import TurndownService from "turndown";
import { URL } from "url";

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  links: string[];
}

export interface DocumentationCrawlResult {
  baseUrl: string;
  pages: CrawledPage[];
}

export async function crawlDocumentation(
  startUrl: string,
  maxDepth: number = 2
): Promise<DocumentationCrawlResult> {
  const browser = await puppeteer.launch({ headless: true });
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  const turndown = new TurndownService();
  const baseUrl = new URL(startUrl).origin;

  async function crawlPage(url: string, depth: number) {
    if (depth > maxDepth || visited.has(url)) return;

    visited.add(url);

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      const content = await page.evaluate(() => {
        // Remove script, style, and nav elements
        const scripts = document.querySelectorAll(
          "script, style, nav, footer, header"
        );
        scripts.forEach((el) => el.remove());

        return document.body.innerHTML;
      });

      const title = await page.title();
      const markdown = turndown.turndown(content);

      // Extract links
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]"))
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((href) => href.startsWith("http"));
      });

      pages.push({
        url,
        title,
        content: markdown,
        links,
      });

      await page.close();

      // Crawl linked pages within same domain
      if (depth < maxDepth) {
        const sameDomainLinks = links.filter((link) => {
          try {
            return new URL(link).origin === baseUrl;
          } catch {
            return false;
          }
        });

        for (const link of sameDomainLinks.slice(0, 10)) {
          await crawlPage(link, depth + 1);
        }
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  await crawlPage(startUrl, 0);
  await browser.close();

  return { baseUrl, pages };
}
