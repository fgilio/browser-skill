---
name: browser
description: >
  Chrome browser automation via CDP.
  Use for: web scraping, frontend testing, page inspection, element selection.
  Keywords: browser, chrome, scrape, screenshot, pick element, cookies, navigate, evaluate.
user-invocable: true
disable-model-invocation: false
---

# Browser Skill

Chrome DevTools Protocol tools for agent-assisted web automation. Connect to Chrome on `:9222` with remote debugging.

Scripts location: `~/.claude/skills/browser/scripts/`

---

## Quick Reference

| Script | Purpose | Output |
|--------|---------|--------|
| `browser-start.ts` | Launch Chrome with CDP | Plain text |
| `browser-navigate.ts` | Navigate to URLs | Plain text |
| `browser-click.ts` | Click element (auto-waits) | Plain text |
| `browser-type.ts` | Type into input (React-aware) | Plain text |
| `browser-upload.ts` | Upload files | Plain text |
| `browser-evaluate.ts` | Execute JS in page | Flexible |
| `browser-screenshot.ts` | Capture viewport | File path |
| `browser-pick.ts` | Interactive element picker | JSON |
| `browser-cookies.ts` | Get all cookies | JSON |
| `browser-search.ts` | Google search | JSON |
| `browser-content.ts` | Extract readable content | Markdown |

---

## Start Chrome

```bash
browser-start.ts                      # Clean session (or reuse existing)
browser-start.ts --profile            # Use your Chrome profile (cookies, logins)
browser-start.ts --profile "Work"     # Use a specific profile by name
browser-start.ts --force              # Force restart
```

Launch a **separate** Chrome instance with remote debugging on `:9222`. Does NOT kill your existing browser.

- Reuses existing CDP connection if available
- Uses `~/.cache/browser-skill/` for isolated profile
- `--profile` syncs your Chrome profile (auto-detects). Requires rsync.
- `--force` kills only the skill's Chrome instance and restarts

**Output:**
```
Chrome started on :9222
Chrome started on :9222 with profile
Chrome already running on :9222 (reusing)
```

---

## Navigate

```bash
browser-navigate.ts https://example.com
browser-navigate.ts https://example.com --new
```

Navigate to URLs. Use `--new` to open in a new tab instead of reusing current tab.

**Output:**
```
Navigated to: https://example.com
Opened: https://example.com
```

---

## Click Element

```bash
browser-click.ts "#submit"
browser-click.ts "button.login"
```

Click element by CSS selector. Auto-waits for element to appear, be visible, and be enabled.

---

## Type Text

```bash
browser-type.ts "#email" "user@example.com"
browser-type.ts "textarea" "Long text" --clear
```

Type into input/textarea. Auto-waits for element. Works with React/Vue/Svelte automatically.

---

## Upload Files

```bash
browser-upload.ts ~/document.pdf
browser-upload.ts ~/doc.pdf --selector "input#resume"
```

Upload files to file input. Default targets first `input[type=file]`.

---

## Evaluate JavaScript

```bash
browser-evaluate.ts 'document.title'
echo 'complex.code()' | browser-evaluate.ts
browser-evaluate.ts -f ./script.js
```

Execute JavaScript in the active tab. Supports stdin and file input for complex scripts.

**Output:** Returns the evaluation result (string, number, array, object).

---

## Screenshot

```bash
browser-screenshot.ts
```

Capture current viewport. Returns temporary file path for the agent to read.

**Output:**
```
/var/folders/.../screenshot-2025-01-15T10-30-00.png
```

---

## Pick Elements

```bash
browser-pick.ts "Click the submit button"
browser-pick.ts "Select the product cards"
```

Interactive element picker. Click to select, Cmd/Ctrl+Click for multi-select, Enter to finish, ESC to cancel.

**Use this when:**
- User wants to select specific DOM elements
- Page structure is complex or ambiguous
- Building scrapers interactively

**Output (JSON):**
```json
[
  {
    "tag": "button",
    "id": "submit",
    "class": "btn btn-primary",
    "text": "Submit",
    "html": "<button id=\"submit\" class=\"btn btn-primary\">Submit</button>",
    "parents": "form#login > div.actions"
  }
]
```

---

## Cookies

```bash
browser-cookies.ts
```

Get all cookies for the current tab including httpOnly cookies.

**Output (JSON):**
```json
[
  {
    "name": "session",
    "value": "abc123",
    "domain": ".example.com",
    "path": "/",
    "httpOnly": true,
    "secure": true
  }
]
```

---

## Search Google

```bash
browser-search.ts "rust programming"
browser-search.ts "climate change" -n 10
browser-search.ts "machine learning" -n 3 --content
```

Search Google and return results.

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-n <num>` | Number of results | 5 |
| `--content` | Fetch readable content from each result | false |

**Output (JSON):**
```json
[
  {
    "title": "Rust Programming Language",
    "link": "https://www.rust-lang.org/",
    "snippet": "A language empowering everyone...",
    "content": "# Rust\n\nA language empowering..."
  }
]
```

---

## Extract Page Content

```bash
browser-content.ts https://example.com
```

Navigate to URL and extract readable content as markdown. Uses Mozilla Readability.

**Output:**
```
URL: https://example.com
Title: Example Domain

# Example Domain

This domain is for use in illustrative examples...
```

---

## Error Handling

All scripts return JSON errors to stderr with exit code 1:

```json
{"error": "Could not connect to browser. Run: browser-start.ts"}
{"error": "No active tab found"}
{"error": "Timeout after 30s"}
```

---

## Important Notes

**Tab Selection**: All scripts operate on the **last tab** (most recently opened/used). To work with a specific page:
1. Navigate to it first with `browser-navigate.ts`
2. Or open it in a new tab with `browser-navigate.ts <url> --new`

**Timeouts**: All scripts have built-in timeouts (30s default, 60s for search, 120s for pick). Timeout errors return JSON to stderr.

**Your Browser is Safe**: `browser-start.ts` runs a separate Chrome instance. Your main browser with all its tabs remains untouched.

---

## Typical Workflow

1. Start Chrome: `browser-start.ts --profile`
2. Navigate: `browser-navigate.ts https://target-site.com`
3. Interact: `browser-type.ts`, `browser-click.ts`, `browser-upload.ts`
4. Verify: `browser-screenshot.ts`
5. Extract: `browser-evaluate.ts` or `browser-content.ts`

---

## See Also

Detailed guides in `docs/`:

- **[reactive-inputs.md](docs/reactive-inputs.md)** - Handling React/Vue/Svelte inputs
- **[workflows.md](docs/workflows.md)** - Common automation patterns
- **[limitations.md](docs/limitations.md)** - Known limitations and workarounds
