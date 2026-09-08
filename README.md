# Browser Skill — deprecated

> **This project is archived. Use [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) instead.**

`agent-browser` does everything this skill did, and does it better:

- **Accessibility-tree snapshots with stable refs** (`@e1`, `@e2`) — agents act on refs instead of hand-written CSS selectors, which removes the main source of breakage here.
- **No Node or Bun at runtime** — a single native Rust binary with a background daemon, installable with `brew install agent-browser`.
- **Your own Chrome and your own profile** — `--profile Default` copies your real profile (cookies, logins) without touching the original, and `--auto-connect` attaches to a Chrome that already runs with `--remote-debugging-port`.
- **Wider surface** — around 100 commands, including network interception, storage and auth state, dialogs, React introspection, and accessibility audits.
- **MCP server mode** — `agent-browser mcp` for clients that prefer tool calls over a CLI.

Install it:

```bash
brew install agent-browser
agent-browser install
```

---

## What this was

Chrome browser automation via CDP for Claude Code, written in TypeScript on Bun. Inspired by [agent-tools/browser-tools](https://github.com/badlogic/agent-tools/tree/main/browser-tools).

It exposed `browser-start`, `browser-navigate`, `browser-click`, `browser-type`, `browser-upload`, `browser-evaluate`, `browser-screenshot`, `browser-pick`, `browser-cookies`, `browser-search`, and `browser-content`. See [SKILL.md](SKILL.md) for the full reference as it stood at archival.

The code stays here for reference. It gets no further updates.
