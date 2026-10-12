---
name: engineering-standards
description: >
  Comprehensive reference for UI/UX design rules, code quality standards, and application
  security best practices. Use this skill whenever a user asks about: best practices for
  frontend or interface design, visual hierarchy, accessibility, typography, or UX patterns;
  how to write clean, maintainable, or well-structured code; code review standards, naming
  conventions, testing strategies, or refactoring; application security, authentication,
  authorisation, injection attacks, cryptography, secrets management, OWASP, or secure
  coding practices; or any time a user wants a checklist, audit, or review of their UI,
  code, or security posture. Also trigger when a user asks "am I following best practices"
  for design, development, or security — even if they don't use those exact words.
---

# Engineering Standards Reference

A structured knowledge base covering the three pillars of production-quality software:
UI/UX design, code quality, and application security. Load only the reference file(s)
relevant to the user's query — don't load all three unless the question spans all domains.

---

## Reference Files

| Domain | File | Load when the user asks about… |
|--------|------|-------------------------------|
| UI/UX Design | `references/ui-ux.md` | Design, layout, typography, colour, accessibility, UX patterns, navigation, forms, motion |
| Code Quality | `references/code-quality.md` | Clean code, naming, functions, testing, git, refactoring, logging, anti-patterns |
| App Security | `references/app-security.md` | Auth, authorisation, injection, cryptography, secrets, sessions, APIs, OWASP, CSP |

Each reference file has its own detailed table of contents. When the user's question spans
multiple domains (e.g. "review my login form for both UX and security"), load all relevant
files before responding.

---

## How to Use This Skill

### Answering a Standards Question

1. Identify which domain(s) the question touches (see table above).
2. `view` the relevant reference file(s).
3. Answer with specificity — cite the relevant rule, principle, or checklist section by name.
4. Where the question is a yes/no ("is this secure?"), answer directly first, then explain with the relevant standard.

### Conducting a Review or Audit

When a user shares code, a design, or a configuration and asks for a review:

1. Load the relevant reference file(s).
2. Structure your response around the applicable checklist(s) at the end of each reference.
3. Group findings by severity: **Critical** (security holes, blocking UX failures) → **Major** (quality debt, design inconsistencies) → **Minor** (nits, style).
4. For each finding, name the violated principle, explain *why* it matters, and provide a concrete fix.

**Review output template:**
```
## [Domain] Review

### Critical
- [Finding]: [Principle violated] — [Why it matters] — [Fix]

### Major
- ...

### Minor
- ...

### ✅ Passed
- [What the user got right]
```

### Generating a Checklist

When a user asks "give me a checklist for X", pull the relevant checklist sections from the
reference files and present them cleanly. Add context for any item that isn't self-explanatory.

### Answering "What's the rule for X?"

Load the relevant reference, find the section, and give a direct answer. Cite the principle
name so the user can find it again. Don't paraphrase vaguely — be specific about numbers,
thresholds, and rationale (e.g. "bcrypt cost factor ≥12, per NIST SP 800-63B").

---

## Domain Selection Examples

| User says | Load |
|-----------|------|
| "Is my password hashing secure?" | `app-security.md` |
| "Review my button styles" | `ui-ux.md` |
| "My functions are getting too long" | `code-quality.md` |
| "Is my login form well-designed?" | `ui-ux.md` + `app-security.md` |
| "Review this PR for quality and security" | `code-quality.md` + `app-security.md` |
| "Audit my whole app" | All three |
| "What's the WCAG contrast ratio for body text?" | `ui-ux.md` |
| "What's Fitts's Law?" | `ui-ux.md` |
| "Explain SQL injection" | `app-security.md` |
| "What's the boy scout rule?" | `code-quality.md` |
| "How do I store JWTs?" | `app-security.md` |
| "How long should my functions be?" | `code-quality.md` |

---

## Tone and Output Style

- Be direct and prescriptive — users come to this skill for clear guidance, not hedged opinions.
- Always explain *why* a rule exists, not just *what* it says.
- Use code examples when illustrating security or code quality rules — abstract advice is less memorable.
- For UI/UX, reference specific named laws (Fitts's, Hick's, Miller's) to give the user vocabulary they can use going forward.
- Keep checklists tidy — use ✅ / ❌ to distinguish pass/fail when reviewing user-supplied work.