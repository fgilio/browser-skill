# Common Browser Automation Workflows

Patterns for typical automation tasks using the browser skill.

## Form Filling

Fill and submit a form with text inputs and file upload:

```bash
# 1. Navigate to form
browser-navigate.ts https://example.com/apply

# 2. Fill text fields
browser-type.ts "#name" "John Doe"
browser-type.ts "#email" "john@example.com"
browser-type.ts "textarea#bio" "Software engineer with 10 years experience"

# 3. Upload file
browser-upload.ts ~/resume.pdf --selector "input#resume"

# 4. Submit
browser-click.ts "button[type=submit]"

# 5. Verify success
browser-screenshot.ts
```

## Multi-Step Authentication

Login flow with potential 2FA:

```bash
# 1. Start with profile (keeps session)
browser-start.ts --profile

# 2. Navigate to login
browser-navigate.ts https://app.example.com/login

# 3. Enter credentials
browser-type.ts "#email" "user@example.com"
browser-type.ts "#password" "secret123"
browser-click.ts "#login-btn"

# 4. Check for 2FA prompt (screenshot for human)
sleep 2
browser-screenshot.ts

# 5. After 2FA (if needed), verify logged in
browser-evaluate.ts 'document.querySelector(".user-menu")?.textContent'
```

## Web Scraping with Pagination

Extract data across multiple pages:

```bash
# 1. Navigate to listing
browser-navigate.ts "https://example.com/products?page=1"

# 2. Extract current page data
browser-evaluate.ts '[...document.querySelectorAll(".product")].map(p => ({
  name: p.querySelector("h2").textContent,
  price: p.querySelector(".price").textContent
}))'

# 3. Check for next page and navigate
browser-evaluate.ts 'document.querySelector("a.next-page")?.href'
# If URL returned, navigate and repeat

# 4. Alternative: use browser-content.ts for article pages
browser-content.ts "https://example.com/article/123"
```

## Interactive Element Selection

When page structure is unknown, use picker:

```bash
# 1. Navigate to page
browser-navigate.ts https://example.com

# 2. Let user select elements
browser-pick.ts "Select the items you want to scrape"

# 3. Use returned selector in automation
# Output gives you: tag, id, class, html, parents
```

## File Download via Cookies

Download authenticated content:

```bash
# 1. Login first (using auth workflow above)

# 2. Get session cookies
browser-cookies.ts > cookies.json

# 3. Use cookies with curl/wget
curl -b "session=$(jq -r '.[] | select(.name=="session") | .value' cookies.json)" \
  https://example.com/protected/file.pdf -o file.pdf
```

## Google Search + Content Extraction

Research workflow:

```bash
# 1. Search with content fetch
browser-search.ts "latest React 19 features" -n 5 --content

# 2. For deeper dive on specific result
browser-content.ts "https://react.dev/blog/2024/react-19"
```

## SPA Navigation

Single-page apps need waits between actions:

```bash
# 1. Navigate to SPA
browser-navigate.ts https://spa.example.com

# 2. Click navigation (auto-waits for element)
browser-click.ts "[data-nav='dashboard']"

# 3. Wait for content (check if element exists)
browser-evaluate.ts '!!document.querySelector(".dashboard-loaded")'

# 4. If false, retry after delay
sleep 1
browser-evaluate.ts '!!document.querySelector(".dashboard-loaded")'
```

## Debugging Failed Automations

When something goes wrong:

```bash
# 1. Take screenshot to see current state
browser-screenshot.ts

# 2. Check page title/URL
browser-evaluate.ts '({title: document.title, url: location.href})'

# 3. Check if element exists
browser-evaluate.ts '!!document.querySelector("#target-element")'

# 4. Get element details
browser-evaluate.ts 'document.querySelector("#target-element")?.outerHTML'

# 5. Check for error messages
browser-evaluate.ts 'document.querySelector(".error, .alert")?.textContent'
```
