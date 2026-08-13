---
name: FindConstructionBids
description: Government-RFP marketplace for construction contractors — find, filter, and act on publicly-issued opportunities.
colors:
  primary: "oklch(52% 0.16 47)"
  primary-deep: "oklch(44% 0.15 47)"
  primary-light: "oklch(65% 0.16 47)"
  surface: "oklch(97% 0.005 60)"
  surface-raised: "oklch(98.5% 0.003 60)"
  surface-panel: "oklch(95% 0.007 60)"
  foreground: "oklch(18% 0.008 60)"
  foreground-muted: "oklch(52% 0.015 60)"
  border: "oklch(87% 0.010 60)"
  destructive: "oklch(56% 0.21 25)"
  chart-amber: "oklch(62% 0.15 85)"
  chart-green: "oklch(58% 0.14 155)"
  chart-slate: "oklch(60% 0.12 220)"
  chart-purple: "oklch(56% 0.11 300)"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "{colors.surface-panel}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: FindConstructionBids

## 1. Overview

**Creative North Star: "The Site Trailer Bulletin Board"**

Experienced contractors scan bid boards fast. They know what they're looking for — jurisdiction, deadline, dollar value, trade category — and they want to find it without friction. This design system is built for that scan speed. It is warm stone and terracotta: the colors of a construction site office in afternoon light, not a government agency or a SaaS pitch deck.

The system is Restrained: tinted warm neutrals carry 90% of the surface. The terracotta primary — a single decisive accent — appears only on actions, selections, and state indicators. Everything else steps back. The accent's rarity is the point: when it appears, it means something.

Density is embraced as a feature. RFP lists at standard row height, compact badges, tight label/value pairs in detail views. No artificial enlargement, no card grids for data that belongs in a table. Typography is a single well-tuned sans at a tight 1.15 scale ratio — Inter, the standard for product UI — used at consistent DPI without fluid scaling.

**Key Characteristics:**
- Warm stone neutrals — tinted toward hue 60 (amber-warm), never pure white or pure black
- Single terracotta accent (oklch 52% 0.16 47) used on ≤10% of any surface
- Inter at 15px base, tight 1.15 ratio, fixed rem scale (no clamp on product UI)
- Flat by default; subtle borders and tonal layering convey hierarchy, not shadows
- State-rich semantic vocabulary: every component has hover, focus, active, disabled, error defined

## 2. Colors: The Warm Stone Palette

Tinted neutrals from a warm-amber base, with terracotta as the sole accent. The palette reads professional without reading bureaucratic.

### Primary
- **Terracotta** (oklch(52% 0.16 47)): Primary actions (buttons, links, selected state), focus rings, active navigation items. Used sparingly — no more than 10% of any surface. Never decorative.
- **Terracotta Deep** (oklch(44% 0.15 47)): Hover and pressed states for primary interactive elements.
- **Terracotta Light** (oklch(65% 0.16 47)): Dark-mode primary surface; lighter enough to read on dark backgrounds.

### Neutral
- **Warm Surface** (oklch(97% 0.005 60)): Main page background. Slightly warm, never pure white.
- **Raised Surface** (oklch(98.5% 0.003 60)): Card and popover backgrounds. Subtly lighter than the main surface to create lift without shadows.
- **Panel Surface** (oklch(95% 0.007 60)): Sidebar, toolbar, and panel backgrounds. A second neutral layer, slightly cooler/darker than content.
- **Foreground** (oklch(18% 0.008 60)): Primary text. Warm dark, never pure black.
- **Muted Foreground** (oklch(52% 0.015 60)): Secondary text, labels, metadata, placeholder copy.
- **Border** (oklch(87% 0.010 60)): Dividers, input strokes, table lines. Visible but not loud.
- **Destructive** (oklch(56% 0.21 25)): Error states, destructive actions. Warm red — consistent with the amber family.

### Named Rules
**The One Accent Rule.** Terracotta (oklch(52% 0.16 47)) is used on ≤10% of any given screen. Its rarity makes it meaningful. It marks primary actions and current selection — nothing else.

**The Tinted Neutral Rule.** No pure white (#fff) or pure black (#000) anywhere in the system. Every neutral is tinted toward hue 60 with chroma ≥0.003. This separates the system visually from generic government and generic SaaS.

## 3. Typography

**Body Font:** Inter (with system-ui, sans-serif fallback)

Inter is the right choice for product UI: legible at 13–16px, neutral without being cold, and identical across platforms at consistent DPI. A single family carries all roles — display, label, body, data — without pairing complexity.

**Character:** Efficient and workmanlike. No display faces, no editorial weight contrast. Hierarchy is achieved through size and weight, not family switching.

### Hierarchy

- **Display** (700, 30px / 1.875rem, line-height 1.2, tracking -0.02em): Page titles and section heroes. Used at most once per screen.
- **Headline** (600, 24px / 1.5rem, line-height 1.25): Section headers, modal titles, sidebar section labels.
- **Title** (600, 18px / 1.125rem, line-height 1.3): Card headings, table group headers, key labels in detail views.
- **Body** (400, 15px / 0.9375rem, line-height 1.6): All prose, description fields, RFP summaries. Cap at 72ch for prose contexts; data tables can run wider.
- **Label** (500, 13px / 0.8125rem, line-height 1.4, tracking 0.01em): Form labels, badge text, metadata pairs, column headers in tables, nav items.

### Named Rules
**The Fixed Scale Rule.** No clamp(), no fluid type. Product UI is viewed at consistent DPI on desktop; fluid headings that shrink in a narrow sidebar look broken. Use fixed rem values with responsive layout breakpoints instead.

**The Single Family Rule.** One typeface throughout. Inter at different weights and sizes covers every role. Do not introduce a display font for headings or a mono font for data (unless code/technical content genuinely requires it).

## 4. Elevation

This system is flat by default. Tonal layering — raising the background lightness of cards above the page surface — conveys depth instead of shadows. Shadows appear only as state responses to interaction, not as decorative chrome.

### Shadow Vocabulary
- **Lifted** (`0 1px 3px oklch(18% 0.008 60 / 0.08), 0 1px 2px oklch(18% 0.008 60 / 0.04)`): Hover state on interactive cards and dropdown menus. Replaces tonal lift when the element needs to visually depart from the surface.
- **Floating** (`0 4px 16px oklch(18% 0.008 60 / 0.10), 0 2px 4px oklch(18% 0.008 60 / 0.06)`): Popovers, command palettes, tooltips. Ambient, not dramatic.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. `box-shadow: none` is the default. Shadows are a response to state (hover, open, focus) — never used to decorate a resting card or panel.

## 5. Components

### Buttons
Tactile and confident. Clear affordance with strong contrast; no gradient, no glow, no shadow at rest.
- **Shape:** Gently rounded (6px radius)
- **Primary:** Terracotta background (oklch(52% 0.16 47)), warm white text (oklch(97% 0.005 60)), padding 10px 20px; font-weight 500, 14px
- **Hover / Focus:** Background shifts to oklch(44% 0.15 47) (terracotta-deep); 150ms ease-out transition; focus ring is 2px solid oklch(52% 0.16 47) at 2px offset
- **Secondary:** Panel-surface background (oklch(95% 0.007 60)), foreground text; border 1px border-color; hover darkens background by ~3% lightness
- **Ghost:** Transparent background, foreground text; hover shows panel-surface background
- **Disabled:** 40% opacity on all variants; cursor: not-allowed; no hover state

### Chips / Badges
Compact classification tags for RFP categories, status, and jurisdiction. Shape: full-radius pill (9999px). Background: muted surface tint. Selected state: terracotta background, warm-white text.

### Cards / Containers
- **Corner Style:** Gently rounded (8px radius)
- **Background:** Raised surface (oklch(98.5% 0.003 60)) against warm surface page
- **Shadow Strategy:** Flat at rest; lifted shadow on hover for interactive cards
- **Border:** 1px solid border color (oklch(87% 0.010 60))
- **Internal Padding:** 20px (md spacing)

### Inputs / Fields
- **Style:** Warm surface background, 1px border stroke, 6px radius
- **Focus:** Border shifts to oklch(52% 0.16 47) (terracotta), 2px focus ring at 2px offset; no glow
- **Error:** Border shifts to destructive (oklch(56% 0.21 25)); error message below in destructive color
- **Disabled:** 50% opacity, cursor: not-allowed, background shifts to panel-surface

### Navigation
Side navigation: panel-surface background (oklch(95% 0.007 60)). Nav items are label-size (13px, 500 weight). Default: foreground text. Hover: panel-accent background tint. Active/current: terracotta text + panel-accent background; left indicator line max 1px (not a stripe — use background tint as the primary signal, line only reinforces). Mobile: collapses to drawer.

### RFP List Row (Signature Component)
The primary data surface of the product. Dense, scannable rows in a table or list. Key data — project title, jurisdiction, deadline, dollar amount, category badge — at a glance. Title at title weight (600, 18px). Deadline and dollar in label weight (500, 13px) in muted foreground. Category as a chip. Hover state: subtle row background lift (tonal, not shadow). No hover-card, no expand animation — click navigates to the detail page.

## 6. Do's and Don'ts

### Do:
- **Do** use oklch() for all color values. No hsl(), no #fff, no #000.
- **Do** tint every neutral toward hue 60 with chroma ≥0.003. Pure greys are banned.
- **Do** apply terracotta exclusively to primary actions, active selection, and state indicators.
- **Do** use Inter at fixed rem sizes. 15px body, 13px label, 18px title — no fluid scaling on product UI.
- **Do** cap body prose at 72ch. Data tables can run to full width.
- **Do** define all six component states: default, hover, focus, active, disabled, error.
- **Do** use tonal layering (surface vs. raised surface) for elevation at rest.
- **Do** use borders and whitespace to create structure instead of cards.

### Don't:
- **Don't** use navy blue, government grey, or bureaucratic serif type. This is not a .gov site.
- **Don't** use gradient text (`background-clip: text` with gradient). Any emphasis goes through weight or size.
- **Don't** use side-stripe borders (border-left/right > 1px) as a colored accent on cards, alerts, or list items. Use background tints instead.
- **Don't** use glassmorphism (backdrop-filter blur) as a decorative default. No glass cards at rest.
- **Don't** use the hero-metric template (big number, small label, gradient accent). This is not a marketing dashboard.
- **Don't** use identical card grids (same-size cards, icon + heading + body, repeated). RFP data belongs in tables and dense lists.
- **Don't** use display or decorative fonts for UI labels, buttons, or data.
- **Don't** use modals as the first answer. Exhaust inline and progressive disclosure alternatives first.
- **Don't** use orange-and-black construction marketing aesthetics, diagonal stripes, or hard-hat stock photography.
- **Don't** use SaaS landing-page clichés: animated counters, floating orbs, gradient hero backgrounds.
- **Don't** add decorative motion. Transitions are 150–200ms, ease-out, for state changes only.
