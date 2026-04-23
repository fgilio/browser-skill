# Browser Skill - Global Setup

## Prerequisites

- `~/.bun/bin` in PATH (bun setup does this automatically)

## Install

Run the setup script from the skill root:

```bash
./setup.sh
```

It installs dependencies and links the CLIs globally.

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

Run from the skill root:

```bash
bun unlink
```
