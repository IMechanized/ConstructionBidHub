# UI/UX Design Rules: A Comprehensive Reference

> *Good design is not just what looks good. It works. It solves problems. It earns trust.*

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Visual Hierarchy](#2-visual-hierarchy)
3. [Typography](#3-typography)
4. [Color Theory & Usage](#4-color-theory--usage)
5. [Spacing & Layout](#5-spacing--layout)
6. [Navigation & Information Architecture](#6-navigation--information-architecture)
7. [Forms & Input Design](#7-forms--input-design)
8. [Feedback & Affordances](#8-feedback--affordances)
9. [Accessibility (A11y)](#9-accessibility-a11y)
10. [Performance & Perceived Speed](#10-performance--perceived-speed)
11. [Motion & Animation](#11-motion--animation)
12. [Mobile & Responsive Design](#12-mobile--responsive-design)
13. [Content & Microcopy](#13-content--microcopy)
14. [Consistency & Design Systems](#14-consistency--design-systems)
15. [User Research & Testing](#15-user-research--testing)
16. [Anti-Patterns to Avoid](#16-anti-patterns-to-avoid)

---

## 1. Core Principles

These are the foundational laws that govern all UI/UX decisions.

### 1.1 Clarity Over Cleverness
- The interface should communicate its purpose immediately — a user should understand what to do within seconds.
- If you have to explain it, redesign it.
- Prioritise function first; form follows.

### 1.2 Hick's Law
- The time it takes to make a decision increases with the number of options.
- Limit choices at any given step. Use progressive disclosure to surface advanced options only when needed.
- **Rule of thumb**: Aim for 5–7 items in menus, navigation bars, and option lists.

### 1.3 Fitts's Law
- The time to reach a target is a function of its size and distance.
- Make interactive elements large enough and close enough to where the user's attention already is.
- Avoid placing destructive actions (e.g. Delete) adjacent to primary actions (e.g. Save).

### 1.4 Miller's Law
- The average person can hold approximately 7 (±2) items in working memory.
- Chunk information into groups of 3–5 for easier cognitive processing.
- Use progressive disclosure and pagination to avoid overwhelming users.

### 1.5 Jakob's Law
- Users spend most of their time on other sites. They expect your site to behave like all the others.
- Leverage established mental models and familiar conventions.
- Only break conventions when you have a compelling, user-centred reason.

### 1.6 The Principle of Least Surprise
- Every element should behave as the user expects based on prior experience.
- Consistent behaviour builds trust; inconsistency destroys it.

### 1.7 Don't Make Me Think (Krug's Law)
- Self-evident design is always preferable to clever design.
- Navigation, labels, and calls-to-action must be instantly recognisable.

---

## 2. Visual Hierarchy

Visual hierarchy guides the user's eye and communicates relative importance.

### 2.1 Establish a Clear Reading Order
- Design with F-pattern or Z-pattern reading in mind for text-heavy interfaces.
- Place the most critical information at the top-left (in left-to-right cultures).

### 2.2 Size and Scale
- Larger elements are perceived as more important. Use size deliberately.
- Establish a clear scale relationship: headings should be noticeably larger than body text; body text noticeably larger than captions.

### 2.3 Contrast and Weight
- High-contrast elements attract attention first.
- Use bold weight sparingly — when everything is bold, nothing is.

### 2.4 Colour as a Hierarchy Tool
- Reserve your brand's primary colour for the most important interactive element on the screen.
- Secondary and tertiary actions should use lower-contrast styles (outlined, ghost, or text buttons).

### 2.5 Proximity
- Elements that are close together are perceived as related (Gestalt principle).
- Group related content; separate unrelated content with whitespace.

### 2.6 Alignment
- Align elements to an invisible grid. Misaligned elements look amateur and create cognitive friction.
- Prefer left-alignment for body text; use centring sparingly and only for short, impactful text (e.g. headings, hero copy).

---

## 3. Typography

Typography accounts for ~95% of web design. Get it right.

### 3.1 Choose a Type Scale
- Use a modular scale (e.g. 1.25× or 1.333×) for harmonious font sizes.
- Common scale: 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64px.
- Body text should be no smaller than **16px** on screen.

### 3.2 Limit Typefaces
- Use a maximum of **2 typefaces** per project: one for headings, one for body.
- Pair a distinctive display font with a highly legible body font.

### 3.3 Line Length (Measure)
- Optimal line length is **60–80 characters** (roughly 45–75 words per line).
- Lines that are too long tire the eye; too short fragment reading flow.

### 3.4 Line Height (Leading)
- Body text: **1.4–1.6× font size** (e.g. 16px text → 24–26px line height).
- Headings: **1.1–1.3×** (tight, as they are short).

### 3.5 Letter Spacing (Tracking)
- Never tighten body text tracking — it reduces legibility.
- Slightly increase tracking (0.05–0.1em) on uppercase labels and small caps.

### 3.6 Text Contrast
- Body text must meet a minimum **4.5:1 contrast ratio** against its background (WCAG AA).
- Large text (18pt+) requires a minimum **3:1** ratio.
- Avoid pure black (#000000) on white — use near-black (e.g. #1a1a1a) for less harshness.

### 3.7 Font Loading
- Load only the weights and styles you actually use.
- Use `font-display: swap` to prevent invisible text during font load.

---

## 4. Color Theory & Usage

### 4.1 The 60-30-10 Rule
- **60%**: Dominant/neutral colour (backgrounds, large surfaces).
- **30%**: Secondary colour (cards, sidebars, supporting elements).
- **10%**: Accent colour (CTAs, highlights, interactive states).

### 4.2 Establish a Semantic Colour System
| Role       | Purpose                          | Example         |
|------------|----------------------------------|-----------------|
| Primary    | Brand, key actions               | Buttons, links  |
| Secondary  | Supporting actions               | Secondary buttons |
| Success    | Positive feedback                | Green checkmarks |
| Warning    | Non-blocking alerts              | Yellow banners  |
| Error      | Destructive or blocking issues   | Red form errors |
| Neutral    | Text, borders, backgrounds       | Greys           |

### 4.3 Do Not Rely on Colour Alone
- Approximately 8% of men and 0.5% of women have colour vision deficiency.
- Always pair colour cues with icons, text labels, or patterns.

### 4.4 Dark Mode Considerations
- Don't simply invert colours — rethink the palette for a dark environment.
- Avoid pure black (#000000) backgrounds; use dark greys (#121212–#1e1e1e) for depth.
- Reduce saturation of accent colours slightly; they appear more vivid on dark backgrounds.
- Elevate surfaces with lighter dark shades, not colour tinting.

### 4.5 Contrast in All States
- Check contrast for all interactive states: default, hover, focus, active, disabled.
- Disabled elements are typically exempt from contrast requirements but should remain identifiable.

---

## 5. Spacing & Layout

### 5.1 Use a Spacing Scale
- Build all spacing from a base unit (commonly **8px** or **4px**).
- Permitted values: 4, 8, 12, 16, 24, 32, 48, 64, 96px.
- Never use arbitrary pixel values like 13px or 27px.

### 5.2 Whitespace Is Active, Not Empty
- Generous whitespace improves comprehension, perceived quality, and focus.
- If a layout feels "empty," fill it with better content — not decorative clutter.

### 5.3 Grid Systems
- Use a **12-column grid** for desktop layouts (flexible for 2, 3, 4, and 6-column splits).
- Define column gutters and outer margins explicitly.
- Snap all elements to the grid; intentional grid breaks are only powerful when the grid is consistent everywhere else.

### 5.4 Padding vs. Margin
- Use **padding** to control internal spacing within a component.
- Use **margin** (or gap in flex/grid) to control spacing *between* components.
- Avoid collapsing margins in complex layouts — use `gap` instead.

### 5.5 Content Width
- Cap content width at **1200–1440px** for widescreen layouts.
- Prose and reading-focused content should be constrained to **680–760px** max-width.

---

## 6. Navigation & Information Architecture

### 6.1 The Three-Click Rule (Revised)
- Users should be able to reach any piece of content within **3 clicks or interactions** from the home/entry point.
- More importantly, every step should feel *logical* — frustrating clicks count more than extra clicks.

### 6.2 Always Show the User Where They Are
- Use breadcrumbs, active nav states, page titles, and URL structures to orient users.
- Users should never have to ask "where am I?"

### 6.3 Primary Navigation
- Limit primary navigation to **5–7 items**.
- Use clear, noun-based labels (not clever or branded jargon users won't recognise).
- The logo should always link back to the home/dashboard.

### 6.4 Search
- If an interface has more than ~20 items of content, provide search.
- Search input should be prominently placed and keyboard-accessible.
- Show recent searches and autocomplete suggestions where appropriate.

### 6.5 Breadcrumbs
- Use breadcrumbs on pages deeper than 2 levels.
- Format: `Home > Category > Subcategory > Current Page`.
- The current page should not be a link.

### 6.6 Empty States
- Every list, table, or data view needs a thoughtfully designed empty state.
- Empty states should explain why it's empty and offer a clear action to fill it.

---

## 7. Forms & Input Design

Forms are where users do their most effortful work. Reduce friction ruthlessly.

### 7.1 Single Column Layout
- Multi-column forms increase cognitive load and completion time.
- Use single-column layout for all but the simplest field pairings (e.g. First Name / Last Name).

### 7.2 Label Placement
- Place labels **above** the input field, not beside it or inside it as placeholder.
- Inline placeholder text disappears on focus — never use it as a substitute for a label.

### 7.3 Input Field Sizing
- Size fields to match the expected length of input (e.g. a postcode field should be short).
- Minimum tap/click target for inputs: **44×44px**.

### 7.4 Validate Inline, in Real Time
- Validate on blur (when the user leaves the field), not on submit.
- Display error messages *below* the relevant field, not in a summary at the top.
- Error messages must explain the problem AND how to fix it.
- Example: ❌ *"Invalid email"* → ✅ *"Please enter a valid email address (e.g. name@example.com)"*

### 7.5 Reduce Required Fields
- Only ask for what you absolutely need.
- Every additional field reduces conversion. Ruthlessly cut optional fields.
- If you must include optional fields, mark them clearly as "Optional" (not required fields with an asterisk).

### 7.6 Smart Defaults
- Pre-fill fields where you can reasonably infer the value.
- Default selections should represent the most common choice, not the lowest-risk choice for the business.

### 7.7 Password Fields
- Always provide a show/hide toggle for password fields.
- Show real-time strength feedback when creating passwords.
- Never block paste on password fields — it discourages password manager use.

### 7.8 Submit Buttons
- Label submit buttons with the specific action: "Create Account", "Book Appointment", "Send Message" — not just "Submit".
- Disable the submit button after click to prevent duplicate submissions; show a loading state.

---

## 8. Feedback & Affordances

### 8.1 Every Action Needs a Response
- Acknowledge every user action within **100ms** (even if just a visual state change).
- For operations taking >1 second, show a loading indicator.
- For operations taking >10 seconds, show a progress indicator with estimated time.

### 8.2 System Status Visibility (Nielsen's #1 Heuristic)
- Users must always know the system's current state.
- Show loading, success, error, and empty states for all async operations.
- Do not make users wonder if their action was registered.

### 8.3 Affordances
- Interactive elements must look interactive: buttons should look clickable, links should look tappable.
- Hover and focus states are not optional — they are critical affordance signals.
- Avoid styling non-interactive text to look like a link or button.

### 8.4 Destructive Actions
- Destructive actions (delete, archive, remove) must require confirmation.
- Use a two-step confirmation pattern: first click → confirm dialog → second click to proceed.
- Style destructive confirmation buttons in red/error colour.
- Where possible, offer an **undo** instead of a confirmation — it's less disruptive.

### 8.5 Notifications & Toasts
- Use **toasts** for non-critical, transient feedback (success messages, non-blocking warnings).
- Use **modals or inline messages** for errors that require user action before proceeding.
- Toast duration: **3–5 seconds** for information; persistent for errors.
- Position toasts consistently (typically bottom-right or top-right on desktop).

---

## 9. Accessibility (A11y)

Accessibility is not optional — it is a legal requirement in many jurisdictions and a moral imperative.

### 9.1 Follow WCAG 2.1 AA as a Baseline
- Target **WCAG 2.1 Level AA** compliance for all public-facing interfaces.
- Aim for AAA where feasible, especially for text contrast.

### 9.2 Keyboard Navigation
- Every interactive element must be reachable and operable via keyboard alone.
- Maintain logical tab order that follows the visual reading order.
- Never remove the focus ring — style it to match your design system, but never hide it.

### 9.3 Screen Reader Support
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<header>`, `<article>`).
- All images must have descriptive `alt` text. Decorative images use `alt=""`.
- Use ARIA labels only when semantic HTML is insufficient — do not over-ARIA.
- Test with at least one screen reader (NVDA, JAWS, or VoiceOver).

### 9.4 Focus Management
- After opening a modal, move focus to the first interactive element inside it.
- After closing a modal, return focus to the element that triggered it.
- Trap focus within modals and drawers while they are open.

### 9.5 Colour & Contrast
- Text contrast: 4.5:1 minimum (AA), 7:1 recommended (AAA).
- Large text (18pt / 14pt bold): 3:1 minimum.
- UI components and icons: 3:1 against adjacent colours.

### 9.6 Motion & Vestibular Disorders
- Respect the `prefers-reduced-motion` media query.
- Any animations that involve large-scale movement, flashing, or parallax must be reduced or disabled for users who prefer it.

### 9.7 Touch Target Sizes
- Minimum touch target: **44×44px** (Apple HIG) or **48×48dp** (Material Design).
- Ensure sufficient spacing between adjacent touch targets to prevent mis-taps.

---

## 10. Performance & Perceived Speed

Perceived performance is as important as actual performance.

### 10.1 Core Web Vitals Targets
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 2.5–4.0s | > 4.0s |
| FID / INP (Interaction to Next Paint) | ≤ 200ms | 200–500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1–0.25 | > 0.25 |

### 10.2 Skeleton Screens Over Spinners
- Show skeleton/placeholder UI that reflects the incoming content's shape.
- Skeleton screens feel faster than spinners because they set expectations.
- Use spinners only for indeterminate operations (e.g. file upload).

### 10.3 Optimistic UI
- Update the UI immediately on user action; reconcile with the server response in the background.
- Roll back gracefully with a clear error message if the server response is negative.

### 10.4 Lazy Loading
- Defer loading of below-the-fold images, videos, and heavy components.
- Use `loading="lazy"` for images not in the initial viewport.

### 10.5 Avoid Layout Shift
- Always specify `width` and `height` attributes on images and video elements.
- Reserve space for dynamically loaded content (ads, embeds, async components) before it loads.

---

## 11. Motion & Animation

### 11.1 Animation Has Purpose
- Every animation must serve a function: orient the user, provide feedback, communicate state change, or guide attention.
- Decorative animation that doesn't serve usability has a high cost (performance, distraction, motion sensitivity) — use it sparingly.

### 11.2 Duration Guidelines
| Interaction Type | Duration |
|------------------|----------|
| Micro-interactions (hover, focus) | 100–200ms |
| Simple transitions (show/hide, colour) | 150–300ms |
| Panel/modal open/close | 200–350ms |
| Page transitions | 300–500ms |
| Complex choreography | 400–700ms |

- Never exceed **700ms** for UI transitions. Users will feel it as sluggish.

### 11.3 Easing
- Use **ease-out** for elements entering the screen (fast start, slow finish — feels snappy).
- Use **ease-in** for elements leaving the screen (slow start, fast finish — feels natural exit).
- Use **ease-in-out** for elements moving within the screen.
- Avoid linear easing — it feels mechanical and cheap.

### 11.4 Staggered Reveals
- When animating lists or groups of items, stagger them by 30–60ms per item.
- Staggering creates a sense of vitality and draws the eye through the content.

### 11.5 Always Respect `prefers-reduced-motion`
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Mobile & Responsive Design

### 12.1 Mobile-First Design
- Design for the smallest screen first, then progressively enhance for larger screens.
- Mobile-first forces you to prioritise — only the most essential content survives.

### 12.2 Breakpoints
- Use content-driven breakpoints, not device-driven ones.
- Common breakpoints: 375px (small mobile), 768px (tablet), 1024px (desktop), 1440px (wide).

### 12.3 Touch Interactions
- Design for thumbs: primary actions should be reachable in the **lower two-thirds** of the screen.
- Swipe gestures must have discoverable alternatives (visible buttons).
- Avoid hover-only interactions on touch devices.

### 12.4 Navigation Patterns on Mobile
- Hamburger menus are acceptable for secondary navigation but hide content — use a bottom navigation bar for up to 5 primary destinations.
- Bottom navigation is highly discoverable and thumb-friendly.

### 12.5 Typography on Mobile
- Minimum body font size on mobile: **16px** (prevents iOS auto-zoom on input focus).
- Increase line height slightly on mobile for improved legibility on small screens.

### 12.6 Content Adaptation
- Simplify tables for mobile: use cards, horizontally scrollable tables, or collapsed row patterns.
- Reduce the number of columns in grids — 3-column desktop layouts often become 1-column on mobile.

---

## 13. Content & Microcopy

### 13.1 Write for Scanning, Not Reading
- Users scan before they read. Use headings, bullet points, and bold text to allow fast scanning.
- Put the most important information in the first sentence of every paragraph.
- Use the inverted pyramid: conclusion first, details second.

### 13.2 Plain Language Principles
- Use simple, everyday words. Avoid jargon, acronyms, and technical language unless your audience demands it.
- Use active voice: "Save your changes" not "Changes will be saved".
- Aim for a reading level of Grade 8–10 for general audiences.

### 13.3 Microcopy That Reduces Anxiety
- Labels, help text, and error messages have an outsized impact on user confidence.
- Anticipate user questions and answer them inline (e.g. "We'll never share your email").
- Use reassuring language near sensitive fields (passwords, payment info).

### 13.4 CTAs Must Be Specific
- The call-to-action label should describe the specific outcome of clicking it.
- ❌ "Click here" / "Learn more" / "Submit"
- ✅ "Download the free guide" / "Start your 14-day trial" / "Create your account"

### 13.5 Error Messages
- Never blame the user. Use neutral, solution-focused language.
- ❌ "You entered an invalid date."
- ✅ "Please enter a date in DD/MM/YYYY format."

### 13.6 Empty States & Zero-Data Screens
- Explain what goes here.
- Tell the user how to get started.
- Use a relevant illustration or icon to make it feel intentional, not broken.

---

## 14. Consistency & Design Systems

### 14.1 Build and Maintain a Design System
- A design system is a single source of truth for all UI components, tokens, and patterns.
- Components should be composable, documented, and versioned.
- Every new interface should be built from existing components before introducing new ones.

### 14.2 Design Tokens
- Define all foundational values as tokens: colour, typography, spacing, border radius, shadow, duration.
- Tokens decouple design decisions from implementation and make theming trivial.
- Example token categories: `color.primary.500`, `spacing.md`, `radius.button`, `duration.fast`.

### 14.3 Component Consistency
- The same component must behave identically everywhere it appears.
- Variants are acceptable; arbitrary one-offs are not.
- Every component must have defined states: default, hover, focus, active, disabled, loading, error.

### 14.4 Icon Consistency
- Use a single icon library per product.
- Maintain consistent icon sizing (16px, 20px, 24px are common sizes).
- Never mix filled and outline icons arbitrarily — pick a style and commit.

---

## 15. User Research & Testing

### 15.1 Test Early and Often
- Test prototypes with real users before writing production code.
- Usability issues found in wireframes cost a fraction of those found in production.

### 15.2 5-User Rule (Nielsen)
- Testing with **5 representative users** reveals approximately 85% of usability problems.
- Run multiple rounds of testing with 5 users rather than one large test.

### 15.3 Types of Research
| Method | Best For | When |
|--------|----------|------|
| User interviews | Uncovering mental models and needs | Discovery phase |
| Card sorting | Information architecture validation | Before navigation design |
| Usability testing | Finding interaction problems | Prototype and post-launch |
| A/B testing | Optimising known solutions | Post-launch with traffic |
| Analytics review | Identifying drop-off points | Ongoing |
| Heatmaps / session recordings | Understanding attention and behaviour | Post-launch |

### 15.4 Watch, Don't Ask
- In usability tests, observe what users *do*, not just what they *say*.
- "I would use this all the time" does not predict actual use.
- Ask participants to think aloud while completing tasks.

### 15.5 Define Success Metrics Before You Build
- Set clear, measurable success criteria: completion rate, error rate, time-on-task, satisfaction score.
- Use metrics to make design decisions, not just to report outcomes.

---

## 16. Anti-Patterns to Avoid

These patterns actively harm the user experience and should never be used without exceptional justification.

| Anti-Pattern | Why It's Harmful |
|--------------|-----------------|
| **Dark patterns** (hidden unsubscribes, pre-checked boxes, trick questions) | Manipulates users; destroys trust; increasingly illegal |
| **Infinite scroll without pagination** | Disorienting; users cannot find where they were; poor for accessibility |
| **Auto-playing video/audio with sound** | Intrusive, especially in quiet environments; users immediately close the tab |
| **Popup on page load (within 5 seconds)** | Interrupts before the user has seen any value |
| **Disabling browser back button** | Breaks a core mental model; traps users |
| **Fake urgency / scarcity** | Erodes trust when users realise it's manufactured |
| **Removing placeholder/label on focus** | Users forget what the field is for mid-entry |
| **Using colour as the sole differentiator** | Fails colour-blind users |
| **Walls of text without visual hierarchy** | Users will not read it; they'll bounce |
| **Modal-on-modal** | Creates disorienting, hard-to-dismiss stack; break the task into steps instead |
| **Hamburger menu on desktop** | Hides primary navigation; use on mobile only |
| **Cookie consent that makes "Reject All" harder than "Accept All"** | Manipulative; increasingly illegal under GDPR |
| **Horizontal scroll on full pages** (not carousels) | Unexpected and disorienting on desktop |
| **Tiny, low-contrast text for T&Cs** | Users rightfully perceive it as designed to deceive |

---

## Quick Reference Checklists

### ✅ Visual Design Checklist
- [ ] Clear visual hierarchy with one dominant focal point
- [ ] Consistent use of a type scale
- [ ] Colour palette follows 60-30-10 rule
- [ ] All text meets WCAG AA contrast ratios
- [ ] Spacing follows an 8px base grid
- [ ] Interactive elements have all required states (hover, focus, active, disabled)

### ✅ Accessibility Checklist
- [ ] Keyboard navigable from start to finish
- [ ] Logical tab order
- [ ] Focus ring is visible
- [ ] All images have alt text
- [ ] Semantic HTML is used throughout
- [ ] `prefers-reduced-motion` is respected
- [ ] Touch targets are ≥ 44×44px

### ✅ Forms Checklist
- [ ] Labels are above (not inside) inputs
- [ ] Inline validation on blur
- [ ] Error messages are specific and actionable
- [ ] Submit button has a descriptive label
- [ ] Password fields have show/hide toggle
- [ ] Required vs optional fields are clearly marked

### ✅ Content Checklist
- [ ] CTAs describe the specific outcome
- [ ] Active voice used throughout
- [ ] Empty states are designed and informative
- [ ] Error messages are neutral and solution-focused
- [ ] No jargon or unexplained acronyms

---

*Last updated: May 2026 | Based on WCAG 2.1, Nielsen's 10 Usability Heuristics, Material Design, Apple Human Interface Guidelines, and established UX research literature.*