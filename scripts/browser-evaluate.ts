#!/usr/bin/env bun
// Execute JavaScript in the active tab's page context
// Usage: browser-evaluate.ts '<code>' | browser-evaluate.ts -f <file> | echo '<code>' | browser-evaluate.ts

import { existsSync, readFileSync } from "node:fs";
import { connectBrowser, getActivePage, printUsage, exitError, setupTimeout } from "./lib.ts";

setupTimeout(30000);

const args = Bun.argv.slice(2);

const USAGE = `Usage: browser-evaluate.ts '<code>'
       browser-evaluate.ts -f <file>
       echo '<code>' | browser-evaluate.ts

Execute JavaScript in the active tab. Code runs in async page context.

Options:
  -f, --file <path>  Read code from file (avoids shell escaping issues)
  (stdin)            Pipe code via stdin for complex scripts

Examples:
  browser-evaluate.ts 'document.title'
  browser-evaluate.ts -f ./scrape.js
  echo 'document.querySelectorAll("a").length' | browser-evaluate.ts`;

if (args.includes("--help") || args.includes("-h")) {
	printUsage(USAGE, 0);
}

// Determine code source: file flag, stdin, or args
let code: string;

const fileIndex = args.indexOf("-f") !== -1 ? args.indexOf("-f") : args.indexOf("--file");
if (fileIndex !== -1) {
	// File mode
	const filePath = args[fileIndex + 1];
	if (!filePath) {
		exitError("Missing file path after -f flag");
	}
	if (!existsSync(filePath)) {
		exitError(`File not found: ${filePath}`);
	}
	code = readFileSync(filePath, "utf-8");
} else if (args.length > 0) {
	// Arg mode
	code = args.join(" ");
} else if (!process.stdin.isTTY) {
	// Stdin mode (piped input)
	code = await Bun.stdin.text();
	code = code.trim();
	if (!code) {
		exitError("No code provided via stdin");
	}
} else {
	printUsage(USAGE, 1);
	process.exit(1); // TypeScript needs this
}

const browser = await connectBrowser();
const page = await getActivePage(browser);

try {
	const result = await page.evaluate((c: string) => {
		const AsyncFunction = (async () => {}).constructor as new (
			...args: string[]
		) => (...args: unknown[]) => Promise<unknown>;
		return new AsyncFunction(`return (${c})`)();
	}, code);

	// Output result based on type
	if (result === undefined) {
		console.log("undefined");
	} else if (result === null) {
		console.log("null");
	} else if (typeof result === "object") {
		console.log(JSON.stringify(result, null, 2));
	} else {
		console.log(String(result));
	}
} catch (e) {
	const message = e instanceof Error ? e.message : String(e);
	exitError(`Evaluation failed: ${message}`);
} finally {
	await browser.disconnect();
}
