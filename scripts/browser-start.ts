#!/usr/bin/env bun
// Launch Chrome with remote debugging on :9222
// Usage: browser-start.ts [--profile] [--force]
//
// Handles: Reuses existing CDP connection, starts separate instance without killing user's browser

import { spawn, execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const HOME = process.env.HOME || process.env.USERPROFILE || "";
const BASE_DIR = `${HOME}/.cache/browser-skill`;
const CLEAN_DIR = `${BASE_DIR}/clean`;
const PROFILE_DIR = `${BASE_DIR}/profile`;
const MODE_FILE = `${BASE_DIR}/.mode`;
const args = Bun.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
	console.error(`Usage: browser-start.ts [--profile [name]] [--force]

Options:
  --profile [name]  Use your Chrome profile (auto-detects if no name given)
  --force           Kill existing skill browser and start fresh

Examples:
  browser-start.ts                    # Clean session (or reuse existing)
  browser-start.ts --profile          # Use your Chrome profile (cookies, logins)
  browser-start.ts --profile "Work"   # Use a specific profile by name
  browser-start.ts --force            # Force restart`);
	process.exit(0);
}

const forceRestart = args.includes("--force");

// Parse --profile [name] - can be flag only or flag with value
const profileIndex = args.indexOf("--profile");
const useProfile = profileIndex !== -1;
let profileName: string | null = null;

if (useProfile && args[profileIndex + 1] && !args[profileIndex + 1].startsWith("-")) {
	profileName = args[profileIndex + 1];
}

// Auto-detect profile when --profile given without name
function findDefaultProfile(chromeDataDir: string): string | null {
	if (existsSync(`${chromeDataDir}/Default`)) {
		return "Default";
	}
	try {
		const entries = readdirSync(chromeDataDir);
		const profileDir = entries.filter((e) => e.startsWith("Profile ")).sort()[0];
		return profileDir || null;
	} catch {
		return null;
	}
}

// Validate args
const validArgs = ["--profile", "--force", profileName];
const unknownArg = args.find((a) => !a.startsWith("-") ? !validArgs.includes(a) : !["--profile", "--force"].includes(a));
if (unknownArg) {
	console.error(JSON.stringify({ error: `Unknown option: ${unknownArg}` }));
	process.exit(1);
}

// Detect Chrome path based on platform
function getChromePath(): string | null {
	if (process.platform === "darwin") {
		const path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
		return existsSync(path) ? path : null;
	} else if (process.platform === "win32") {
		const path = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
		return existsSync(path) ? path : null;
	}
	// Linux: try common locations
	const linuxPaths = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
	return linuxPaths.find((p) => existsSync(p)) || null;
}

// Check if Chrome is already running with remote debugging
async function tryConnect(): Promise<boolean> {
	try {
		const browser = await puppeteer.connect({
			browserURL: "http://localhost:9222",
			defaultViewport: null,
		});
		await browser.disconnect();
		return true;
	} catch {
		return false;
	}
}

// Kill only our skill's Chrome instance (by user-data-dir), not the user's browser
function killSkillChrome() {
	try {
		if (process.platform === "darwin") {
			// Kill Chrome processes with our specific user-data-dir (matches both clean/ and profile/)
			execSync(`pkill -f "user-data-dir=${BASE_DIR}"`, { stdio: "ignore" });
		} else if (process.platform === "win32") {
			execSync(`taskkill /F /FI "COMMANDLINE eq *user-data-dir=${BASE_DIR}*"`, { stdio: "ignore" });
		} else {
			execSync(`pkill -f "user-data-dir=${BASE_DIR}"`, { stdio: "ignore" });
		}
	} catch {
		// Process wasn't running, that's fine
	}
}

// Main
const chromePath = getChromePath();
if (!chromePath) {
	console.error(JSON.stringify({ error: "Chrome not found. Install Google Chrome." }));
	process.exit(1);
}

// Determine requested mode
const requestedMode = useProfile ? "profile" : "clean";

// Try to reuse existing connection (unless force restart)
if (!forceRestart) {
	const alreadyRunning = await tryConnect();
	if (alreadyRunning) {
		const currentMode = existsSync(MODE_FILE) ? readFileSync(MODE_FILE, "utf8").trim() : "clean";

		if (currentMode === requestedMode) {
			const dir = useProfile ? PROFILE_DIR : CLEAN_DIR;
			console.log(`Chrome already running on :9222 (reusing ${currentMode}, ${dir})`);
			process.exit(0);
		}
		// Mode mismatch - restart
		killSkillChrome();
		await new Promise((r) => setTimeout(r, 1000));
	}
}

// Kill only our skill's Chrome if force restart
if (forceRestart) {
	killSkillChrome();
	await new Promise((r) => setTimeout(r, 1000));
}

// Determine which directory to use
const activeDir = useProfile ? PROFILE_DIR : CLEAN_DIR;

// Setup base directory
execSync(`mkdir -p "${BASE_DIR}"`, { stdio: "ignore" });

// Clean mode: wipe directory for ephemeral behavior (true incognito)
// Seed with "First Run" marker to skip Chrome's welcome UI
if (!useProfile) {
	execSync(`rm -rf "${CLEAN_DIR}"`, { stdio: "ignore" });
	execSync(`mkdir -p "${CLEAN_DIR}"`, { stdio: "ignore" });
	writeFileSync(`${CLEAN_DIR}/First Run`, "");
}

if (useProfile) {
	// Check rsync availability
	try {
		execSync("which rsync", { stdio: "ignore" });
	} catch {
		console.error(JSON.stringify({ error: "rsync not found. Required for --profile option." }));
		process.exit(1);
	}

	// Chrome stores profiles in subdirectories: Default, Profile 1, Profile 2, etc.
	const chromeDataDir =
		process.platform === "darwin"
			? `${HOME}/Library/Application Support/Google/Chrome`
			: process.platform === "win32"
				? `${HOME}\\AppData\\Local\\Google\\Chrome\\User Data`
				: `${HOME}/.config/google-chrome`;

	// Auto-detect profile if not specified
	if (!profileName) {
		profileName = findDefaultProfile(chromeDataDir);
		if (!profileName) {
			console.error(JSON.stringify({ error: `No Chrome profiles found in: ${chromeDataDir}` }));
			process.exit(1);
		}
	}

	const profileSource = `${chromeDataDir}/${profileName}`;

	if (!existsSync(profileSource)) {
		console.error(JSON.stringify({ error: `Chrome profile "${profileName}" not found at: ${profileSource}` }));
		process.exit(1);
	}

	// Sync profile with excludes for speed (~50MB vs 5-10GB)
	//
	// What we KEEP (needed for "logged in" experience):
	//   - Cookies          → session tokens
	//   - Login Data       → saved passwords
	//   - Local Storage/   → site preferences
	//   - Preferences      → Chrome settings
	//   - Extensions/      → browser extensions
	//
	// What we SKIP (heavy cache data, not needed):
	//   - IndexedDB/       → app databases (YouTube alone can be 3GB+)
	//   - Service Worker/  → PWA caches (often 1-3GB)
	//   - Cache/           → browsing cache
	//   - Code Cache/      → compiled JS
	//   - GPUCache/        → shader cache
	//   - File System/     → downloaded files API
	//   - blob_storage/    → binary blobs
	//   - *Cache*/         → any other cache dirs
	//
	const rsyncExcludes = [
		"IndexedDB",
		"Service Worker",
		"Cache",
		"Code Cache",
		"GPUCache",
		"DawnWebGPUCache",
		"File System",
		"blob_storage",
		"Shared Dictionary",
		"*Cache*",
	]
		.map((dir) => `--exclude="${dir}"`)
		.join(" ");

	// Sync to profile directory (persisted across runs)
	const targetProfile = `${PROFILE_DIR}/${profileName}`;
	execSync(`mkdir -p "${targetProfile}"`, { stdio: "ignore" });

	try {
		execSync(`rsync -a --delete ${rsyncExcludes} "${profileSource}/" "${targetProfile}/"`, {
			stdio: "pipe",
		});
		// Also sync Local State file (needed for Chrome to recognize profiles)
		const localState = `${chromeDataDir}/Local State`;
		if (existsSync(localState)) {
			execSync(`cp "${localState}" "${PROFILE_DIR}/"`, { stdio: "ignore" });
		}
	} catch {
		console.error(JSON.stringify({ error: `Failed to sync Chrome profile "${profileName}"` }));
		process.exit(1);
	}
}

// Start Chrome in background (detached so Bun can exit)
// Flags to suppress first-run UI (welcome page, "What's New" tab, default browser check)
const chromeFlags = [
	"--remote-debugging-port=9222",
	`--user-data-dir=${activeDir}`,
	"--no-first-run",
	"--no-default-browser-check",
	"--disable-session-crashed-bubble",
	"--disable-features=MediaRouter,Translate,OptimizationHints,SessionRestore",
	"about:blank", // Start with blank page, don't restore tabs
];
try {
	spawn(chromePath, chromeFlags, {
		detached: true,
		stdio: "ignore",
	}).unref();
} catch (e) {
	const msg = e instanceof Error ? e.message : String(e);
	console.error(JSON.stringify({ error: `Failed to start Chrome: ${msg}` }));
	process.exit(1);
}

// Wait for Chrome to be ready
let connected = false;
for (let i = 0; i < 30; i++) {
	try {
		const browser = await puppeteer.connect({
			browserURL: "http://localhost:9222",
			defaultViewport: null,
		});
		await browser.disconnect();
		connected = true;
		break;
	} catch {
		await new Promise((r) => setTimeout(r, 500));
	}
}

if (!connected) {
	console.error(JSON.stringify({ error: "Chrome started but failed to connect on :9222" }));
	process.exit(1);
}

// Save mode for future runs
writeFileSync(MODE_FILE, requestedMode);

// Explicit log showing mode and cache location
if (useProfile) {
	console.log(`Chrome started on :9222 with profile (${PROFILE_DIR})`);
} else {
	console.log(`Chrome started on :9222 clean (${CLEAN_DIR})`);
}
