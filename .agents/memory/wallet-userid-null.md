---
name: Wallet userId nullability
description: influencerWallets.userId and brandWallets.userId are nullable; code joining wallets to users must handle null (account erasure tombstone).
---

## Rule
`influencerWallets.userId` and `brandWallets.userId` are `string | null` (not `NOT NULL`) with `onDelete: "set null"`.

## Why
GDPR account deletion: when a user deletes their account, wallet records are tombstoned (userId set to null) before the user row is deleted, preserving the financial audit trail while erasing PII.

## How to apply
- Any code that `JOIN`s or queries wallets by userId must guard for null.
- Code reading `wallet.user` via Drizzle relations must use `?.` optional chaining.
- Notification dispatches using `recipientUserId: row.userId` from a wallet join must be wrapped in `if (row.userId) { ... }`.
- `captureAndCreditPaypalTopup` requires a non-null userId — guard before calling: `if (!row.userId) throw new Error(...)` or skip.
- Receipt PDF routes: `tx.wallet.user` may be null — fall back to `"Deleted Account"` / `""` for name/email fields.
- `brand-wallet-receipt.ts`: `if (!wallet.userId) return;` before querying the user table.
- `paypal-reconcile.ts`: skip orphaned wallets with `if (!tx.userId) { skipped++; continue; }`.
