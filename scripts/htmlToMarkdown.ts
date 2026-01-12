// Shared HTML to Markdown conversion utility
// Used by browser-search.ts and browser-content.ts

import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/**
 * Convert HTML to clean Markdown
 */
export function htmlToMarkdown(html: string): string {
	const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
	turndown.use(gfm);
	turndown.addRule("removeEmptyLinks", {
		filter: (node) => node.nodeName === "A" && !node.textContent?.trim(),
		replacement: () => "",
	});
	return turndown
		.turndown(html)
		.replace(/\[\\?\[\s*\\?\]\]\([^)]*\)/g, "") // Remove empty markdown links
		.replace(/ +/g, " ") // Collapse multiple spaces
		.replace(/\s+,/g, ",") // Fix spacing before commas
		.replace(/\s+\./g, ".") // Fix spacing before periods
		.replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines
		.trim();
}
