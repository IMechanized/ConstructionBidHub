---
name: Report export color compatibility
description: Why printable reports retain modern brand colors but legacy PDF rendering needs a disposable sRGB copy.
---

Keep brand definitions in OKLCH; convert colors only in the disposable PDF rendering copy, rather than weakening the platform palette to suit the PDF renderer.

**Why:** Browser support for OKLCH does not imply support in html2canvas 1.x, the renderer bundled with html2pdf. Direct modern color tokens can fail export even when the report looks correct in the browser.

**How to apply:** Any future PDF color or renderer changes must be checked with an actual browser export, including mixed semantic tints and dark-mode restoration. Do not replace the design-system tokens with a separate hand-picked gray/RGB brand.
