#!/usr/bin/env bun
// Type text into input elements with React/Vue support
// Usage: browser-type.ts <selector> <text> [--clear]

import { connectBrowser, getActivePage, printUsage, exitError, setupTimeout } from "./lib.ts";
import { waitForElement } from "./waitForElement.ts";

setupTimeout(30000);

const args = Bun.argv.slice(2);

const USAGE = `Usage: browser-type.ts <selector> <text> [--clear]

Type text into an input element. Auto-waits for element.
Works with React/Vue controlled inputs automatically.

Options:
  --clear  Clear existing value before typing

Examples:
  browser-type.ts "#email" "user@example.com"
  browser-type.ts "textarea.description" "Long text here"
  browser-type.ts "#search" "query" --clear`;

if (args.includes("--help") || args.includes("-h")) {
	printUsage(USAGE, 0);
}

const clearFirst = args.includes("--clear");
const filteredArgs = args.filter((a) => a !== "--clear");

if (filteredArgs.length < 2) {
	printUsage(USAGE, 1);
}

const selector = filteredArgs[0];
const text = filteredArgs.slice(1).join(" ");

const browser = await connectBrowser();
const page = await getActivePage(browser);

try {
	// Wait for element to be ready
	const element = await waitForElement(page, selector);

	// Type the text with React-aware logic
	await page.evaluate(
		({ sel, value, clear }) => {
			const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement;
			if (!el) throw new Error(`Element not found: ${sel}`);

			// Clear if requested
			if (clear) {
				el.value = "";
			}

			// Try native value setter first (works for vanilla JS)
			el.value = value;

			// Check if value stuck (React may have overwritten it)
			if (el.value !== value) {
				// Use prototype setter to bypass React's synthetic events
				const isTextarea = el.tagName === "TEXTAREA";
				const proto = isTextarea ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
				const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
				if (setter) {
					setter.call(el, value);
				}
			}

			// Dispatch events that React/Vue listen to
			el.dispatchEvent(new Event("input", { bubbles: true }));
			el.dispatchEvent(new Event("change", { bubbles: true }));
			el.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
		},
		{ sel: selector, value: text, clear: clearFirst }
	);

	console.log(`Typed into: ${selector}`);
} catch (e) {
	const message = e instanceof Error ? e.message : String(e);
	exitError(`Type failed: ${message}`);
} finally {
	await browser.disconnect();
}
