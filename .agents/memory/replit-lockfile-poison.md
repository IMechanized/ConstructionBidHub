---
name: Replit lockfile proxy poisoning
description: Task agents running npm install inside Replit bake internal proxy URLs into package-lock.json, breaking npm install on Vercel/CI.
---

Replit routes all npm traffic through an internal security firewall at
`http://package-firewall.replit.local/npm/...`. When task agents run
`npm install` and commit the resulting `package-lock.json`, those internal
URLs are baked in. Any external CI/CD environment (Vercel, GitHub Actions)
that then runs `npm install` cannot reach that host and crashes with
`npm error Exit handler never called!` — with no clear indication of the
real cause.

**How to identify:** `grep -c "package-firewall.replit.local" package-lock.json` — any count > 0 means the lockfile is poisoned.

**How to fix immediately:**
```bash
sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json
```

**Prevention (already in place):**
- `.githooks/pre-commit` — detects if `package-lock.json` is staged and rewrites any Replit proxy URLs before the commit lands. Silent no-op when clean.
- `scripts/post-merge.sh` — first line runs `git config core.hooksPath .githooks` so every task-agent environment registers the hook after their merge.
- `.git/hooks/pre-commit` — hook also installed directly for the main-agent environment (since `git config` is a restricted operation there).

**Why:** The hook lives in `.githooks/` (committed to the repo) rather than `.git/hooks/` (not committed). `core.hooksPath .githooks` tells git to use it. The post-merge script ensures the path is registered in every fresh task-agent clone/environment.
