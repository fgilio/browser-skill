// Shared utilities for browser skill scripts

import puppeteer, { type Browser } from "puppeteer-core";

const CONNECTION_TIMEOUT = 5000;
const DEFAULT_TIMEOUT = 30000;

/**
 * Connect to Chrome with timeout. Returns browser instance or exits with JSON error.
 */
export async function connectBrowser(timeout = CONNECTION_TIMEOUT): Promise<Browser> {
	try {
		const browser = await Promise.race([
			puppeteer.connect({
				browserURL: "http://localhost:9222",
				defaultViewport: null,
			}),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Connection timeout")), timeout)
			),
		]);
		return browser;
	} catch {
		console.error(JSON.stringify({ error: "Could not connect to browser. Run: browser-start.ts" }));
		process.exit(1);
	}
}

/**
 * Get the last page (most recently used tab) or exit with error.
 */
export async function getActivePage(browser: Browser) {
	const pages = await browser.pages();
	const page = pages.at(-1);
	if (!page) {
		console.error(JSON.stringify({ error: "No active tab found" }));
		await browser.disconnect();
		process.exit(1);
	}
	return page;
}

/**
 * Setup global timeout that exits with JSON error.
 */
export function setupTimeout(ms = DEFAULT_TIMEOUT): NodeJS.Timeout {
	const id = setTimeout(() => {
		console.error(JSON.stringify({ error: `Timeout after ${ms / 1000}s` }));
		process.exit(1);
	}, ms);
	id.unref();
	return id;
}

/**
 * Print usage to stderr and exit.
 */
export function printUsage(usage: string, exitCode = 0): never {
	console.error(usage);
	process.exit(exitCode);
}

/**
 * Exit with JSON error.
 */
export function exitError(message: string): never {
	console.error(JSON.stringify({ error: message }));
	process.exit(1);
}
