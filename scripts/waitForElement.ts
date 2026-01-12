// Shared auto-wait utility for browser scripts
// Waits for element to appear, be visible, and be enabled

import type { Page, ElementHandle } from "puppeteer-core";

export interface WaitOptions {
	timeout?: number;
	visible?: boolean;
	enabled?: boolean;
}

const DEFAULT_TIMEOUT = 5000;

/**
 * Wait for element to be ready for interaction.
 * Used by browser-click.ts, browser-type.ts, browser-upload.ts
 */
export async function waitForElement(
	page: Page,
	selector: string,
	options: WaitOptions = {}
): Promise<ElementHandle<Element>> {
	const { timeout = DEFAULT_TIMEOUT, visible = true, enabled = true } = options;

	const startTime = Date.now();

	// Wait for element to exist
	let element: ElementHandle<Element> | null = null;
	while (Date.now() - startTime < timeout) {
		element = await page.$(selector);
		if (element) break;
		await new Promise((r) => setTimeout(r, 100));
	}

	if (!element) {
		throw new Error(`Element not found: ${selector} (waited ${timeout}ms)`);
	}

	// Wait for visible if requested
	if (visible) {
		const isVisible = await waitForCondition(
			page,
			element,
			async (el) => {
				return await page.evaluate((e) => {
					const style = window.getComputedStyle(e);
					return (
						style.display !== "none" &&
						style.visibility !== "hidden" &&
						style.opacity !== "0" &&
						e.offsetParent !== null
					);
				}, el);
			},
			timeout - (Date.now() - startTime)
		);
		if (!isVisible) {
			throw new Error(`Element not visible: ${selector} (waited ${timeout}ms)`);
		}
	}

	// Wait for enabled if requested
	if (enabled) {
		const isEnabled = await waitForCondition(
			page,
			element,
			async (el) => {
				return await page.evaluate((e) => {
					return !(e as HTMLInputElement).disabled;
				}, el);
			},
			timeout - (Date.now() - startTime)
		);
		if (!isEnabled) {
			throw new Error(`Element disabled: ${selector} (waited ${timeout}ms)`);
		}
	}

	return element;
}

async function waitForCondition(
	page: Page,
	element: ElementHandle<Element>,
	condition: (el: ElementHandle<Element>) => Promise<boolean>,
	timeout: number
): Promise<boolean> {
	const startTime = Date.now();
	while (Date.now() - startTime < timeout) {
		if (await condition(element)) {
			return true;
		}
		await new Promise((r) => setTimeout(r, 100));
	}
	return false;
}
