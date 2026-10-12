---
name: GitHub workflow write permissions
description: The connected GitHub OAuth authorization has rejected workflow changes; avoid adding them without verifying permission.
---

Do not change GitHub Actions workflow files as incidental safeguards without
checking that the connected GitHub authorization permits workflow writes.

**Why:** GitHub rejected a push of the development branch because its OAuth
authorization lacked the workflow scope. A dependency portability fix added
workflow changes and unintentionally blocked delivery of unrelated fixes.

**How to apply:** Prefer package lifecycle checks and local validation for
dependency safeguards. If a task genuinely needs GitHub Actions changes,
explain the authorization prerequisite before editing. Recheck permissions
rather than treating this limitation as permanent.
