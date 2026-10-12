---
name: Vitest coverage provider
description: @vitest/coverage-v8 not installed; adding provider v8 causes test timeouts
---

## Rule
Never add `provider: "v8"` to `vitest.config.ts`. The `@vitest/coverage-v8` package is NOT installed in this project.

## Why
Adding an uninstalled coverage provider causes Vitest to hang/timeout silently instead of reporting a clean error. Discovered when coverage thresholds were added during the engineering audit.

## How to apply
If coverage reporting is needed, either install `@vitest/coverage-v8` first, or use the default istanbul provider. Do not add the `provider` key without verifying the package is present.
