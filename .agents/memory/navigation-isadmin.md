---
name: Navigation isAdmin
description: isAdmin derived from session directly to avoid react-hooks/set-state-in-effect
---

## Rule
In `src/components/navigation.tsx`, `isAdmin` is computed as `const isAdmin = Boolean((session?.user as any)?.isAdmin)` — no useState, no setIsAdmin call inside useEffect.

## Why
`react-hooks/set-state-in-effect` ESLint rule treats synchronous setState inside an effect body as an error (cascading renders). Since `isAdmin` is available synchronously from `session`, using state is unnecessary.

## How to apply
Any derived value already available from a hook result should be computed inline rather than mirrored into state. Only use state for values that require async resolution or external subscription.
