---
name: Apify actor IDs
description: Correct Apify actor IDs, input formats, and response field names for each social platform used in src/lib/apify.ts
---

# Apify Actor Reference

**Why:** Multiple actor bugs confirmed via live errors in June 2026:
- `apify/twitter-scraper` doesn't exist → use `apidojo/twitter-profile-scraper`
- `clockworks/tiktok-scraper` `profiles` field needs bare usernames, not URLs
- Short-link domains (vt.tiktok.com) must be redirect-resolved before extracting username
- `apify/instagram-scraper` resultsType `"details"` is deprecated → use `"profiles"`

## Platform → Actor mapping

| Platform | Actor ID | Notes |
|---|---|---|
| TikTok | `clockworks/tiktok-scraper` | Active, 92M runs |
| Instagram | `apify/instagram-scraper` | Working |
| X/Twitter | `apidojo/twitter-profile-scraper` | 233K runs — NOT `apify/twitter-scraper` (doesn't exist) |
| Facebook Pages | `apify/facebook-pages-scraper` | Working |
| Pinterest | `apify/pinterest-crawler` | Working |
| Twitch | `apify/twitch-scraper` | Working |
| Threads | `apify/threads-scraper` | Working |

## TikTok input format

Handles are stored as full URLs (`https://www.tiktok.com/@username`).
The `profiles` field requires a **bare username** (no `@`, no domain).
Short-link domains (`vt.tiktok.com`, `vm.tiktok.com`) must be resolved via
HTTP redirect before extracting the username (see `resolveTikTokUsername()`).

```json
{ "profiles": ["username"], "resultsType": "profiles", "maxItems": 1 }
```

Response fields: `fans` (followers), `heart` / `heartCount` (total likes).

Do NOT use `startUrls` — the actor only accepts `postURLs`, `hashtags`,
search queries, music references, or `profiles`.

## X/Twitter input format

Extract bare username from stored URL, then use `twitterHandles`:
```json
{ "twitterHandles": ["username"], "maxItems": 10 }
```
Falls back to `startUrls: [{ url }]` only if no username can be extracted.

Response: each item is a **tweet** with author embedded.
Key fields: `author.followersCount` (canonical), `likeCount`, `replyCount`.
Code also falls back to `author.followers_count` and `author.followers`.

## Instagram input format

```json
{ "directUrls": ["https://www.instagram.com/username/"], "resultsType": "profiles", "resultsLimit": 1 }
```

`resultsType: "details"` is deprecated — causes failures with current actor version.
Response fields: `followersCount`, `latestPosts[].likesCount`, `latestPosts[].commentsCount`.

**How to apply:** Any future changes to these platform functions in `src/lib/apify.ts`
must use these actor IDs, input formats, and field names.
