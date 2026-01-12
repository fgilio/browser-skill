#!/usr/bin/env bun
// Navigate to a URL in the active tab or a new tab
// Usage: browser-navigate.ts <url> [--new]

import { connectBrowser, getActivePage, printUsage, exitError, setupTimeout } from "./lib.ts";

setupTimeout(30000);

const args = Bun.argv.slice(2);

const USAGE = `Usage: browser-navigate.ts <url> [--new]

Options:
  --new  Open URL in a new tab instead of current tab

Examples:
  browser-navigate.ts https://example.com       # Navigate current tab
  browser-navigate.ts https://example.com --new # Open in new tab`;

if (args.includes("--help") || args.includes("-h")) {
	printUsage(USAGE, 0);
}

if (args.length === 0) {
	printUsage(USAGE, 1);
}

const newTab = args.includes("--new");
const url = args.find((arg) => !arg.startsWith("-"));

if (!url) {
	exitError("URL is required");
}

// Validate URL
try {
	new URL(url);
} catch {
	exitError(`Invalid URL: ${url}`);
}

const browser = await connectBrowser();

try {
	if (newTab) {
		const page = await browser.newPage();
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
		console.log(`Opened: ${url}`);
	} else {
		const page = await getActivePage(browser);
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
		console.log(`Navigated to: ${url}`);
	}
} catch (e) {
	const msg = e instanceof Error ? e.message : String(e);
	exitError(`Navigation failed: ${msg}`);
} finally {
	await browser.disconnect();
}
