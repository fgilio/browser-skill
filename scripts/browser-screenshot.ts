#!/usr/bin/env bun
// Capture screenshot of the current viewport
// Usage: browser-screenshot.ts

import { tmpdir } from "node:os";
import { join } from "node:path";
import { connectBrowser, getActivePage, printUsage, exitError, setupTimeout } from "./lib.ts";

setupTimeout(30000);

const args = Bun.argv.slice(2);

const USAGE = `Usage: browser-screenshot.ts

Capture the current viewport and return the file path.

Example:
  browser-screenshot.ts`;

if (args.includes("--help") || args.includes("-h")) {
	printUsage(USAGE, 0);
}

if (args.length > 0 && !args[0].startsWith("-")) {
	exitError(`Unknown argument: ${args[0]}`);
}

const browser = await connectBrowser();
const page = await getActivePage(browser);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const filename = `screenshot-${timestamp}.png`;
const filepath = join(tmpdir(), filename);

try {
	await page.screenshot({ path: filepath });
	console.log(filepath);
} catch (e) {
	const message = e instanceof Error ? e.message : String(e);
	exitError(`Screenshot failed: ${message}`);
} finally {
	await browser.disconnect();
}
