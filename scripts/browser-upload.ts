#!/usr/bin/env bun
// Upload files to file input elements
// Usage: browser-upload.ts <file> [--selector <selector>]

import { existsSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { connectBrowser, getActivePage, printUsage, exitError, setupTimeout } from "./lib.ts";
import { waitForElement } from "./waitForElement.ts";

setupTimeout(30000);

const args = Bun.argv.slice(2);

const USAGE = `Usage: browser-upload.ts <file> [file2...] [--selector <selector>]

Upload files to a file input element. Auto-waits for input.

Options:
  --selector <sel>  Target specific file input (default: first input[type=file])

Examples:
  browser-upload.ts ~/document.pdf
  browser-upload.ts ~/doc.pdf --selector "input#resume"
  browser-upload.ts file1.pdf file2.pdf`;

if (args.includes("--help") || args.includes("-h")) {
	printUsage(USAGE, 0);
}

if (args.length === 0) {
	printUsage(USAGE, 1);
}

// Parse args
let selector = 'input[type="file"]';
const selectorIndex = args.indexOf("--selector");
if (selectorIndex !== -1) {
	selector = args[selectorIndex + 1];
	if (!selector) {
		exitError("Missing selector after --selector flag");
	}
	args.splice(selectorIndex, 2);
}

// Remaining args are file paths
const filePaths = args.filter((a) => !a.startsWith("-"));

if (filePaths.length === 0) {
	exitError("No files specified");
}

// Resolve and validate all file paths
const resolvedPaths: string[] = [];
for (const filePath of filePaths) {
	const resolved = resolve(filePath.replace(/^~/, process.env.HOME || ""));
	if (!existsSync(resolved)) {
		exitError(`File not found: ${filePath}`);
	}
	resolvedPaths.push(realpathSync(resolved));
}

const browser = await connectBrowser();
const page = await getActivePage(browser);

try {
	// Wait for file input (don't require visible - file inputs are often hidden)
	const element = await waitForElement(page, selector, { visible: false, enabled: true });

	// Upload files using Puppeteer's uploadFile
	await element.uploadFile(...resolvedPaths);

	const fileNames = resolvedPaths.map((p) => p.split("/").pop()).join(", ");
	console.log(`Uploaded: ${fileNames}`);
} catch (e) {
	const message = e instanceof Error ? e.message : String(e);
	exitError(`Upload failed: ${message}`);
} finally {
	await browser.disconnect();
}
