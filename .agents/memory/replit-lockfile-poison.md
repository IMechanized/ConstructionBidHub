---
name: Replit lockfile proxy poisoning
description: Internal package proxy URLs can enter lockfiles and break external installs; do not assume prior prevention hooks still exist.
---

Keep committed package tarball URLs portable to external build environments.
Internal package-firewall hosts can enter the lockfile during dependency
installation; check both the `.local` and `.internal` variants.

**Why:** External Vercel builds cannot use internal package hosts. A generic
npm "Exit handler never called!" failure may obscure an install problem, but
the summary log alone does not establish its cause.

**How to apply:** Inspect resolved URLs before investigating application code
when an external build fails during dependency installation. Preserve package
versions and integrity hashes while correcting internal URLs, and verify a
clean install against the public registry. Never assume old prevention hooks
still exist: earlier notes claimed they were installed, but inspection on
2026-10-12 found no committed hook directory or post-merge registration.

A post-install normalizer alone is not sufficient protection for an external
builder: the committed lockfile must already be portable before npm downloads
packages.

**Why:** Install lifecycle hooks cannot rescue tarball downloads that fail
before the hook runs. Validate the committed file before installation, and
normalize after local installations to prevent reintroduction.

**How to apply:** Keep both prevention stages. Verify portability using a
fresh dependency directory and empty cache, not just the existing workspace
dependencies; otherwise cached packages can hide unreachable package URLs.
