#!/usr/bin/env bun
// Search Google and return results
// Usage: browser-search.ts "<query>" [-n <num>] [--content]

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { connectBrowser, getActivePage, printUsage, exitError, setupTimeout } from "./lib.ts";
import { htmlToMarkdown } from "./htmlToMarkdown.ts";

setupTimeout(60000);

const args = Bun.argv.slice(2);

const USAGE = `Usage: browser-search.ts "<query>" [-n <num>] [--content]

Search Google and return results.

Options:
  -n <num>    Number of results (default: 5)
  --content   Fetch readable content from each result

Examples:
  browser-search.ts "rust programming"
  browser-search.ts "climate change" -n 10
  browser-search.ts "machine learning" -n 3 --content`;

if (args.includes("--help") || args.includes("-h")) {
	printUsage(USAGE, 0);
}

if (args.length === 0) {
	printUsage(USAGE, 1);
}

// Parse args
const fetchContent = args.includes("--content");
let numResults = 5;
const nIndex = args.indexOf("-n");
if (nIndex !== -1 && args[nIndex + 1]) {
	numResults = parseInt(args[nIndex + 1], 10);
	if (isNaN(numResults) || numResults < 1) {
		exitError("Invalid number of results");
	}
}

// Extract query (everything that's not a flag)
const query = args
	.filter((arg, i) => {
		if (arg.startsWith("-")) return false;
		if (i > 0 && args[i - 1] === "-n") return false;
		return true;
	})
	.join(" ");

if (!query) {
	exitError("Search query is required");
}

const browser = await connectBrowser();
const page = await getActivePage(browser);

// Extract results from current page
async function extractResults() {
	return page.evaluate(() => {
		const items: { title: string; link: string; snippet: string }[] = [];
		const searchResults = document.querySelectorAll("div.MjjYud");

		for (const result of searchResults) {
			const titleEl = result.querySelector("h3");
			const linkEl = result.querySelector("a");
			const snippetEl = result.querySelector("div.VwiC3b, div[data-sncf]");

			if (titleEl && linkEl && linkEl.href && !linkEl.href.startsWith("https://www.google.com")) {
				items.push({
					title: titleEl.textContent?.trim() || "",
					link: linkEl.href,
					snippet: snippetEl?.textContent?.trim() || "",
				});
			}
		}
		return items;
	});
}

// Get HTML via CDP (works even with TrustedScriptURL restrictions)
async function getHtmlViaCDP() {
	const client = await page.createCDPSession();
	try {
		const { root } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
		const { outerHTML } = await client.send("DOM.getOuterHTML", { nodeId: root.nodeId });
		return outerHTML;
	} finally {
		await client.detach();
	}
}


// Navigate and paginate to collect results
const results: { title: string; link: string; snippet: string; content?: string }[] = [];
let start = 0;

try {
	while (results.length < numResults) {
		const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
		await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
		await page.waitForSelector("div.MjjYud", { timeout: 5000 }).catch(() => {});

		const pageResults = await extractResults();
		if (pageResults.length === 0) break;

		for (const r of pageResults) {
			if (results.length >= numResults) break;
			if (!results.some((existing) => existing.link === r.link)) {
				results.push(r);
			}
		}

		start += 10;
		if (start >= 100) break;
	}

	if (results.length === 0) {
		console.log("[]");
		process.exit(0);
	}

	// Optionally fetch content
	if (fetchContent) {
		for (const result of results) {
			try {
				await Promise.race([
					page.goto(result.link, { waitUntil: "networkidle2" }),
					new Promise((r) => setTimeout(r, 10000)),
				]).catch(() => {});

				const html = await getHtmlViaCDP();
				const url = page.url();

				const doc = new JSDOM(html, { url });
				const reader = new Readability(doc.window.document);
				const article = reader.parse();

				if (article?.content) {
					result.content = htmlToMarkdown(article.content).substring(0, 5000);
				} else {
					const fallbackDoc = new JSDOM(html, { url });
					const fallbackBody = fallbackDoc.window.document;
					fallbackBody
						.querySelectorAll("script, style, noscript, nav, header, footer, aside")
						.forEach((el) => el.remove());
					const main =
						fallbackBody.querySelector("main, article, [role='main'], .content, #content") ||
						fallbackBody.body;
					const fallbackText = main?.textContent || "";
					if (fallbackText.trim().length > 100) {
						result.content = fallbackText.trim().substring(0, 5000);
					} else {
						result.content = "(Could not extract content)";
					}
				}
			} catch {
				result.content = "(Error fetching content)";
			}
		}
	}

	console.log(JSON.stringify(results, null, 2));
} catch (e) {
	const message = e instanceof Error ? e.message : String(e);
	exitError(`Search failed: ${message}`);
} finally {
	await browser.disconnect();
}
