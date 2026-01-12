# Reactive Framework Inputs (React/Vue/Svelte)

Modern frontend frameworks use synthetic event systems that don't respond to direct `.value` assignment. This guide explains how to handle them.

## The Problem

Standard DOM manipulation doesn't trigger React/Vue state updates:

```javascript
// This FAILS on React apps - value appears then disappears
document.querySelector('#email').value = 'test@example.com';
```

The framework's virtual DOM overwrites the change on next render cycle.

## Solution: Use browser-type.ts

The simplest solution - handles all frameworks automatically:

```bash
browser-type.ts "#email" "test@example.com"
browser-type.ts "textarea.description" "Long text"
browser-type.ts "#search" "query" --clear
```

Internally handles:
1. Native value setter bypass
2. Event dispatching (input, change, blur)
3. Auto-wait for element

## Manual Solution (browser-evaluate.ts)

If you need custom logic, use the native setter pattern:

```javascript
(function() {
  const el = document.querySelector('#email');

  // Bypass React's property getter/setter
  const proto = el.tagName === 'TEXTAREA'
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, 'test@example.com');

  // Dispatch events React listens to
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

  return true;
})()
```

Run via stdin to avoid quote escaping:

```bash
cat << 'EOF' | browser-evaluate.ts
(function() {
  const el = document.querySelector('#email');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, 'test@example.com');
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()
EOF
```

## Why This Works

React overrides `element.value` with a custom getter/setter that syncs with component state. By using `Object.getOwnPropertyDescriptor` on the prototype, we access the original DOM property setter, bypassing React's interception.

The events (`input`, `change`, `blur`) trigger React's synthetic event handlers, ensuring state updates propagate correctly.

## Framework-Specific Notes

**React**: Needs `input` event with `bubbles: true`
**Vue**: Same pattern works, v-model listens to `input`
**Svelte**: bind:value uses `input` event
**Angular**: May need additional `ngModelChange` dispatch

## When to Use browser-evaluate.ts vs browser-type.ts

| Scenario | Use |
|----------|-----|
| Simple text input | `browser-type.ts` |
| Custom event handling | `browser-evaluate.ts` with stdin |
| Contenteditable | `browser-evaluate.ts` (set innerHTML) |
| Complex multi-step | `browser-evaluate.ts -f script.js` |
