# BHB Weekly Blog Autopost — headless runbook
Executed weekly by Windows Task Scheduler via `claude -p`. Follow EXACTLY. If any step fails, post the failure to Discord (step 9) and STOP — never publish a post that failed a check.

## 1. QUEUE-FIRST (v2, 2026-07-21): publish prewritten, generate only as fallback
Check `blog/_queue/` for prewritten posts (each a complete post .html + matching `.meta` line inside it). If ANY exist: take the OLDEST queued post, SKIP step 2 entirely (it is already written), and proceed from step 3 (lint it anyway — trust nothing), then continue through deploy/bookkeeping; on success DELETE it from _queue/. Only if the queue is EMPTY: fall back to generating fresh — read `blog/blog_topics.md`, apply Selection rules in order (seasonal-in-window first, else top unused evergreen alternating general/local), skip anything already in PUBLISHED LOG.

## 2. Write the post
500–800 words, genuinely useful, plain English for seniors. Study 2 existing posts in `blog/` first and match their HTML template exactly: same head/meta/OG/canonical pattern, same header/nav (nav-6), author line "Michael von-Heesen — Licensed Insurance Agent, Bay Harbor Benefits", date = today, soft CTA box to /review.html (no urgency), full compliance footer copied verbatim from an existing post, BlogPosting JSON-LD; FAQPage JSON-LD only if the post has a real visible Q&A section. Slug: kebab-case of the topic.

## 3. COMPLIANCE LINT (hard gate — grep the new file; ANY hit = abort)
- Carrier/plan names: `Humana|UnitedHealthcare|UHC|Aetna|Devoted|CarePlus|Florida Blue|Cigna|Wellcare|Kaiser`
- Dollar figures: `\$[0-9]` (no premiums/penalties in dollars — percentages OK)
- Urgency: `act now|don't wait|don't miss|limited time|hurry|last chance|deadline is approaching`
- Superlatives: `best plan|best coverage|#1|top-rated`
- Plan-year: `2027` (banned until 2026-10-01)
- Affiliation: `official Medicare|government-approved|endorsed by Medicare`
- Required-present (must ALL match): `We do not offer every plan` AND `Licensed Insurance Agent` AND `1-800-MEDICARE`

## 4. Wire it in
Add a card for the new post at the TOP of `blog/index.html` (match existing card markup). Add a `<url>` entry to `sitemap.xml` with today's date. Add a related-posts link in the new post to 2 existing posts.

## 5. Deploy
scp the new post + updated `blog/index.html` + `sitemap.xml` to root@104.236.76.234:/var/www/bayharborbenefits/ (preserve subpaths; chown to match existing files' owner). Do NOT touch review.html, privacy.html, terms.html, or anything under /opt.

## 6. Verify live
curl the new post URL (expect 200), re-run every step-3 grep against the LIVE fetched HTML, curl https://bayharborbenefits.com/ (expect 200) and https://bayharborbenefits.com/api/health (expect ok:true). Any failure → remove the deployed file from the droplet, then step 9 with the failure.

## 7. Bookkeeping
In `blog/blog_topics.md`: check off the topic `[x]` and append to PUBLISHED LOG (`date · slug · topic`).

## 8. Commit
`git add` the new/changed files, commit "blog autopost: <slug>", push origin main.

## 9. Report (always, success or failure)
ssh root@104.131.54.54, read DISCORD_GENERAL_WEBHOOK_URL from /root/atd/.env, POST via curl (NOT python-urllib — 403s) a message ≤1000 chars: "📝 Blog autopost: <title> — live at <url> — lint clean, deployed, committed" or on failure: "⚠️ Blog autopost FAILED at step <n>: <reason> — nothing published". 

## Standing rules
One post per run. Never edit existing posts (annual refreshes are a separate human-triggered task). Never touch any file not listed here. If blog_topics.md has no eligible topics, report that via step 9 and stop.
