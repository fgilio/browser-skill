#!/usr/bin/env bun
// Click elements by CSS selector with smart auto-wait
// Usage: browser-click.ts <selector>

import { connectBrowser, getActivePage, printUsage, exitError, setupTimeout } from "./lib.ts";
import { waitForElement } from "./waitForElement.ts";

setupTimeout(30000);

const args = Bun.argv.slice(2);

const USAGE = `Usage: browser-click.ts <selector>

Click an element by CSS selector. Auto-waits for element to be:
- Present in DOM
- Visible (not hidden)
- Enabled (not disabled)

Examples:
  browser-click.ts "#submit"
  browser-click.ts "button.login"
  browser-click.ts "[data-testid='save']"`;

if (args.includes("--help") || args.includes("-h")) {
	printUsage(USAGE, 0);
}

if (args.length === 0) {
	printUsage(USAGE, 1);
}

const selector = args.join(" ");

const browser = await connectBrowser();
const page = await getActivePage(browser);

try {
	// Wait for element to be ready (visible + enabled)
	const element = await waitForElement(page, selector);

	// Click the element
	await element.click();

	console.log(`Clicked: ${selector}`);
} catch (e) {
	const message = e instanceof Error ? e.message : String(e);
	exitError(`Click failed: ${message}`);
} finally {
	await browser.disconnect();
}
