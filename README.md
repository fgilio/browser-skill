# Browser Skill

Chrome browser automation via CDP for Claude Code. Inspired by [agent-tools/browser-tools](https://github.com/badlogic/agent-tools/tree/main/browser-tools).

## Usage

```bash
# Start browser
browser-start              # clean session
browser-start --profile    # with user profile (cookies preserved)

# Navigate
browser-navigate https://example.com
browser-navigate https://example.com --new   # new tab

# Interact
browser-click "#submit-btn"
browser-type "#email" "user@example.com"
browser-type "#search" "new query" --clear

# Extract
browser-evaluate 'document.title'
browser-screenshot
browser-cookies
browser-content https://example.com   # markdown extraction

# Advanced
browser-pick "Select element"         # interactive element picker
browser-search "query"                # Google search results
browser-upload ~/file.pdf             # file upload
```

## Install

```bash
bun install
```

Requires Chrome and [Bun](https://bun.sh).
