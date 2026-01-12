# Browser Skill - Global Setup

## Prerequisites

- [bun](https://bun.sh) installed
- `~/.bun/bin` in PATH (bun setup does this automatically)

## Install

Run from skill directory:

```bash
cd ~/.claude/skills/browser && bun link
```

Requires `~/.bun/bin` in PATH.

## Commands

After setup, these commands are available globally:

- `browser-start` - Launch Chrome with CDP
- `browser-navigate` - Navigate to URL
- `browser-evaluate` - Execute JavaScript
- `browser-screenshot` - Capture screenshot
- `browser-pick` - Interactive element picker
- `browser-cookies` - Manage cookies
- `browser-search` - Google search
- `browser-content` - Extract page content

## Verify

```bash
which browser-start && browser-start --help
```

## Uninstall

```bash
cd ~/.claude/skills/browser && bun unlink
```
