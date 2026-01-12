# Browser Skill Limitations

Known limitations and workarounds.

## Quote Escaping in browser-evaluate.ts

Complex JavaScript with nested quotes can break when passed as shell arguments.

**Problem:**
```bash
# This breaks - nested quotes confuse shell
browser-evaluate.ts 'document.querySelector("[data-id='test']").click()'
```

**Solutions:**

1. **Use stdin** (recommended):
```bash
echo 'document.querySelector("[data-id=\"test\"]").click()' | browser-evaluate.ts
```

2. **Use file**:
```bash
browser-evaluate.ts -f ./my-script.js
```

3. **Use heredoc**:
```bash
cat << 'EOF' | browser-evaluate.ts
document.querySelector("[data-id='test']").click()
EOF
```

## Shadow DOM

Elements inside Shadow DOM require special handling:

```javascript
// Access shadow root
const host = document.querySelector('custom-element');
const shadowEl = host.shadowRoot.querySelector('.inner-element');
```

`browser-click.ts` and `browser-type.ts` don't automatically pierce Shadow DOM. Use `browser-evaluate.ts` for shadow DOM interactions.

## Iframes

Scripts operate on the main frame only. For iframe content:

```javascript
// Access iframe document
const iframe = document.querySelector('iframe');
const iframeDoc = iframe.contentDocument;
const el = iframeDoc.querySelector('#target');
```

Cross-origin iframes cannot be accessed due to browser security.

## Sites That Block Automation

Some sites detect and block headless browsers. Signs:
- Immediate CAPTCHA
- "Please enable JavaScript"
- Empty page content
- 403/429 responses

**Mitigations:**
- Use `--profile` to appear more legitimate
- Add delays between actions
- Use realistic viewport sizes
- Some sites simply cannot be automated

## Timeout Handling

Default timeouts:
- General scripts: 30s
- Search: 60s
- Pick (interactive): 120s

If hitting timeouts:
- Add delays between rapid actions
- Check if page is actually loading
- Verify element exists before interacting

## File Upload Constraints

- Files must exist locally (no URLs)
- Path must be absolute or resolvable
- File inputs are often hidden - use `--selector` to target specific ones
- Some sites use custom upload widgets that aren't `<input type="file">`

## CDP Connection Issues

**"Could not connect to browser"**
- Run `browser-start.ts` first
- Check if port 9222 is in use: `lsof -i :9222`
- Force restart: `browser-start.ts --force`

**"No active tab found"**
- Browser started but no tabs open
- Navigate to a URL first: `browser-navigate.ts about:blank`

## Memory/Performance

Long-running sessions accumulate memory:
- Restart browser periodically: `browser-start.ts --force`
- Close unused tabs via evaluate: `browser-evaluate.ts 'window.close()'`
- Screenshots accumulate in /tmp - clean periodically

## React/Vue Inputs

See [reactive-inputs.md](./reactive-inputs.md) for handling modern framework inputs.

Standard `.value = x` doesn't work - use `browser-type.ts` which handles this automatically.

## Contenteditable Elements

`browser-type.ts` doesn't support contenteditable. Use evaluate:

```javascript
const el = document.querySelector('[contenteditable]');
el.innerHTML = 'New content';
el.dispatchEvent(new Event('input', { bubbles: true }));
```

## Select/Dropdown Elements

For `<select>` elements:

```javascript
const select = document.querySelector('select#country');
select.value = 'US';
select.dispatchEvent(new Event('change', { bubbles: true }));
```

Or click to open, then click option:
```bash
browser-click.ts "select#country"
browser-click.ts "option[value='US']"
```

## Checkbox/Radio

```javascript
const checkbox = document.querySelector('input[type=checkbox]');
checkbox.checked = true;
checkbox.dispatchEvent(new Event('change', { bubbles: true }));
```

Or simply click:
```bash
browser-click.ts "input[type=checkbox]#agree"
```
