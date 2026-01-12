# Browser Skill QA Checklist

Run through this checklist after making changes to verify the skill works correctly.

## Prerequisites

- [ ] Chrome installed
- [ ] Bun installed
- [ ] No other process using port 9222

---

## browser-start.ts

- [ ] `browser-start.ts` launches Chrome in clean mode
- [ ] `browser-start.ts --profile` launches with user profile (cookies preserved)
- [ ] `browser-start.ts --force` kills existing and restarts
- [ ] Running twice reuses existing connection (doesn't spawn new Chrome)
- [ ] Switching from clean to profile mode restarts Chrome

---

## browser-navigate.ts

- [ ] `browser-navigate.ts https://example.com` navigates current tab
- [ ] `browser-navigate.ts https://example.com --new` opens new tab
- [ ] Invalid URL shows error

---

## browser-click.ts

- [ ] `browser-click.ts "#existing-button"` clicks element
- [ ] Auto-waits for element to appear (test on SPA that loads content async)
- [ ] Fails with clear error if element not found after timeout
- [ ] Fails with clear error if element is disabled
- [ ] Works on React/Vue apps

---

## browser-type.ts

- [ ] `browser-type.ts "#input" "text"` types into input
- [ ] `browser-type.ts "textarea" "text"` works on textarea
- [ ] `browser-type.ts "#input" "new" --clear` clears before typing
- [ ] Works on React controlled inputs (value persists after typing)
- [ ] Works on Vue v-model inputs
- [ ] Auto-waits for element to appear

---

## browser-upload.ts

- [ ] `browser-upload.ts ~/file.pdf` uploads to first file input
- [ ] `browser-upload.ts ~/file.pdf --selector "#specific"` targets specific input
- [ ] `browser-upload.ts file1.pdf file2.pdf` uploads multiple files
- [ ] Fails with clear error if file doesn't exist
- [ ] Works with hidden file inputs (common pattern)

---

## browser-evaluate.ts

- [ ] `browser-evaluate.ts 'document.title'` returns title
- [ ] `browser-evaluate.ts '1 + 1'` returns 2
- [ ] `echo 'document.title' | browser-evaluate.ts` stdin mode works
- [ ] `browser-evaluate.ts -f script.js` file mode works
- [ ] Complex quotes work via stdin (e.g., `'[data-id="test"]'`)
- [ ] Returns JSON for objects/arrays
- [ ] Returns string for primitives

---

## browser-screenshot.ts

- [ ] `browser-screenshot.ts` returns valid PNG path
- [ ] Screenshot file exists and is viewable
- [ ] Captures current viewport correctly

---

## browser-pick.ts

- [ ] `browser-pick.ts "Select element"` shows overlay
- [ ] Single click selects and returns element info
- [ ] Cmd/Ctrl+click adds to selection
- [ ] Enter confirms multi-selection
- [ ] Escape cancels and returns empty array
- [ ] Returns tag, id, class, text, html, parents

---

## browser-cookies.ts

- [ ] `browser-cookies.ts` returns cookies as JSON
- [ ] Includes httpOnly cookies
- [ ] Includes session cookies after login

---

## browser-search.ts

- [ ] `browser-search.ts "test query"` returns Google results
- [ ] `-n 10` returns 10 results
- [ ] `--content` fetches page content for each result
- [ ] Returns title, link, snippet (and content if requested)

---

## browser-content.ts

- [ ] `browser-content.ts https://example.com` extracts content
- [ ] Returns markdown format
- [ ] Handles article pages well (news, blogs)
- [ ] Falls back gracefully on non-article pages

---

## Integration Workflows

- [ ] **Form fill + submit**: navigate > type > type > click > screenshot
- [ ] **Login flow**: navigate > type email > type password > click > verify logged in
- [ ] **File upload**: navigate > type > upload > click > verify
- [ ] **Scraping**: navigate > evaluate to extract data > content for full page

---

## Error Handling

- [ ] All scripts show JSON error on stderr when failing
- [ ] "Could not connect to browser" when Chrome not running
- [ ] "Element not found" with selector when element missing
- [ ] "Timeout" errors include duration waited
- [ ] Exit code 1 on all errors

---

## Edge Cases

- [ ] Works on sites with Shadow DOM (via evaluate)
- [ ] Handles iframes (via evaluate with contentDocument)
- [ ] Survives page navigation during operation
- [ ] Handles slow-loading pages (timeouts appropriate)
- [ ] Works after browser has been idle for a while

---

## Performance

- [ ] Scripts complete in reasonable time (<5s for simple operations)
- [ ] Auto-wait doesn't add unnecessary delay on fast pages
- [ ] Multiple sequential commands work without issues

---

## Notes

Record any issues found during QA:

```
Date:
Tester:
Issues:
-
```
