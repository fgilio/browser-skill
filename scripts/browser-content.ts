#!/usr/bin/env bun
// Extract readable content from a URL as markdown
// Usage: browser-content.ts <url>

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { connectBrowser, getActivePage, printUsage, exitError, setupTimeout } from "./lib.ts";
import { htmlToMarkdown } from "./htmlToMarkdown.ts";

setupTimeout(30000);

const args = Bun.argv.slice(2);

const USAGE = `Usage: browser-content.ts <url>

Navigate to URL and extract readable content as markdown.
Uses Mozilla Readability for article extraction.

Examples:
  browser-content.ts https://example.com
  browser-content.ts https://en.wikipedia.org/wiki/Rust_(programming_language)`;

if (args.includes("--help") || args.includes("-h")) {
	printUsage(USAGE, 0);
}

if (args.length === 0) {
	printUsage(USAGE, 1);
}

const url = args[0];

// Validate URL
try {
	new URL(url);
} catch {
	exitError(`Invalid URL: ${url}`);
}

const browser = await connectBrowser();
const page = await getActivePage(browser);


try {
	await Promise.race([
		page.goto(url, { waitUntil: "networkidle2" }),
		new Promise((r) => setTimeout(r, 15000)),
	]).catch(() => {});

	// Get HTML via CDP (works even with TrustedScriptURL restrictions)
	const client = await page.createCDPSession();
	const { root } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
	const { outerHTML } = await client.send("DOM.getOuterHTML", { nodeId: root.nodeId });
	await client.detach();

	const finalUrl = page.url();

	// Extract with Readability
	const doc = new JSDOM(outerHTML, { url: finalUrl });
	const reader = new Readability(doc.window.document);
	const article = reader.parse();

	let content: string;
	let title: string | undefined;

	if (article?.content) {
		content = htmlToMarkdown(article.content);
		title = article.title;
	} else {
		// Fallback
		const fallbackDoc = new JSDOM(outerHTML, { url: finalUrl });
		const fallbackBody = fallbackDoc.window.document;
		fallbackBody
			.querySelectorAll("script, style, noscript, nav, header, footer, aside")
			.forEach((el) => el.remove());
		const main =
			fallbackBody.querySelector("main, article, [role='main'], .content, #content") ||
			fallbackBody.body;
		const fallbackHtml = main?.innerHTML || "";
		if (fallbackHtml.trim().length > 100) {
			content = htmlToMarkdown(fallbackHtml);
		} else {
			content = "(Could not extract content)";
		}
		title = fallbackDoc.window.document.title || undefined;
	}

	console.log(`URL: ${finalUrl}`);
	if (title) console.log(`Title: ${title}`);
	console.log("");
	console.log(content);
} catch (e) {
	const message = e instanceof Error ? e.message : String(e);
	exitError(`Content extraction failed: ${message}`);
} finally {
	await browser.disconnect();
}
