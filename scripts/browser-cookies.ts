#!/usr/bin/env bun
// Get all cookies for the current tab including httpOnly cookies
// Usage: browser-cookies.ts

import { connectBrowser, getActivePage, printUsage, exitError, setupTimeout } from "./lib.ts";

setupTimeout(30000);

const args = Bun.argv.slice(2);

const USAGE = `Usage: browser-cookies.ts

Get all cookies for the current tab including httpOnly cookies.

Example:
  browser-cookies.ts`;

if (args.includes("--help") || args.includes("-h")) {
	printUsage(USAGE, 0);
}

if (args.length > 0 && !args[0].startsWith("-")) {
	exitError(`Unknown argument: ${args[0]}`);
}

const browser = await connectBrowser();
const page = await getActivePage(browser);

try {
	const cookies = await page.cookies();

	const formatted = cookies.map((c) => ({
		name: c.name,
		value: c.value,
		domain: c.domain,
		path: c.path,
		httpOnly: c.httpOnly,
		secure: c.secure,
		expires: c.expires,
	}));

	console.log(JSON.stringify(formatted, null, 2));
} catch (e) {
	const message = e instanceof Error ? e.message : String(e);
	exitError(`Failed to get cookies: ${message}`);
} finally {
	await browser.disconnect();
}
