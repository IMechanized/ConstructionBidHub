---
name: Lint false positives — Lucide Image icon
description: Lucide <Image> component triggers jsx-a11y/alt-text; suppress with eslint-disable
---

## Rule
Lucide's `<Image>` SVG icon component triggers the `jsx-a11y/alt-text` ESLint rule because the rule pattern-matches on the component name `Image`. Suppress with `{/* eslint-disable-next-line jsx-a11y/alt-text */}` on the line before the component.

## Why
The rule cannot distinguish Lucide icon components from Next.js `<Image>` or HTML `<img>` by name alone. Adding `alt` to a Lucide icon is semantically wrong; `aria-hidden="true"` is the correct accessibility attribute.

## How to apply
Always pair Lucide `<Image>` with `aria-hidden="true"` for accessibility, and add the eslint-disable comment. Files affected: influencer-dashboard.tsx, admin/community/client.tsx.
