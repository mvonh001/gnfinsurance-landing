# Brightwater Weekly Blog Autopost — headless runbook (v3, 2026-07-27)
Executed weekly by Windows Task Scheduler via `claude -p`. Follow EXACTLY. If any step fails, post the failure to Discord (step 9) and STOP — never publish a post that failed a check.

**Live tree = `build_brightwater/`.** Brand = Brightwater Insurance Group, domain = brightwaterinsurancegroup.com, droplet webroot = `/var/www/brightwater/` on root@104.236.76.234. The queue, topic bank, and this runbook stay in the legacy `blog/` folder — only PUBLISHED output goes into `build_brightwater/blog/`. `bayharborbenefits.com` is a dead 301 → brightwaterinsurancegroup.com; `/var/www/bayharborbenefits/` on the droplet is unserved and irrelevant — never deploy there.

## 1. QUEUE-FIRST: publish prewritten, generate only as fallback
Check `blog/_queue/` for prewritten posts. If ANY exist: take the OLDEST queued post, SKIP step 2 entirely (it is already written and already Brightwater-branded), and proceed from step 3 (lint it anyway — trust nothing), then continue through deploy/bookkeeping; on **successful** step 6 verify, DELETE it from `_queue/`. Only if the queue is EMPTY: fall back to generating fresh — read `blog/blog_topics.md`, apply Selection rules in order (seasonal-in-window first, else top unused evergreen alternating general/local), skip anything already in PUBLISHED LOG.

## 2. Write the post (fallback path only)
500–800 words, genuinely useful, plain English for seniors. Study 2 existing posts in `build_brightwater/blog/` first and match their HTML template exactly:
- gtag snippet as the first thing inside `<head>`: `AW-18338196634` (script src + inline config block)
- canonical + OG URLs on `https://brightwaterinsurancegroup.com/blog/<slug>.html`; `og:site_name` = "Brightwater Insurance Group"
- favicon `../assets/bw_favicon.svg`; brand/hero/footer marks `../assets/bw_mark.svg`; stylesheet `../assets/styles.css?v=bw2`
- preconnect + Google Fonts (Poppins) block right before `</head>`
- header/footer brand markup: `brightwater` / `Insurance Group` split spans, nav-6
- author line "Michael von Heesen — Licensed Insurance Agent, Brightwater Insurance Group", date = today (post-meta span + BlogPosting JSON-LD `datePublished`/`dateModified`)
- soft CTA box to `../review.html#lead-form` (no urgency)
- full compliance footer copied verbatim from an existing post, incl. `call-pill` before `</body>`
- BlogPosting JSON-LD (publisher name "Brightwater Insurance Group", logo `bw_mark.svg`); FAQPage JSON-LD only if the post has a real visible Q&A section
- Slug: kebab-case of the topic

## 3. COMPLIANCE LINT (hard gate — grep the new file; ANY hit = abort)
- Carrier/plan names: `Humana|UnitedHealthcare|UHC|Aetna|Devoted|CarePlus|Florida Blue|Cigna|Wellcare|Kaiser`
- Dollar figures: `\$[0-9]` (no premiums/penalties in dollars — percentages OK)
- Urgency: `act now|don't wait|don't miss|limited time|hurry|last chance|deadline is approaching`
- Superlatives: `best plan|best coverage|#1|top-rated`
- Plan-year: `2027` (banned until 2026-10-01)
- Affiliation: `official Medicare|government-approved|endorsed by Medicare`
- Old brand (must be ZERO): `Bay Harbor|bayharborbenefits`
- Required-present (must ALL match): `We do not offer every plan` AND `Licensed Insurance Agent` AND `1-800-MEDICARE`

## 4. Wire it in
- Copy the post into `build_brightwater/blog/<slug>.html` (fill any `<!--PUBDATE-->` placeholders: ISO date in JSON-LD, "Month Day" in the visible post-meta span).
- Add a card for the new post at the TOP of `build_brightwater/blog/index.html` (newest first — match existing card markup exactly).
- Add a `<url>` entry to `build_brightwater/sitemap.xml` with today's date (also bump `blog/index.html`'s own `<lastmod>` entry).
- Add a related-posts link in the new post to 2 existing posts in `build_brightwater/blog/`.

## 5. Deploy
scp the new post + updated `build_brightwater/blog/index.html` + `build_brightwater/sitemap.xml` (only if changed) to `root@104.236.76.234:/var/www/brightwater/...` (preserve subpaths — posts/index into `/blog/`, sitemap at webroot). Then:
```
ssh root@104.236.76.234 'chown -R 197609:197609 /var/www/brightwater/blog /var/www/brightwater/sitemap.xml'
```
(drop the sitemap path from that command if sitemap.xml wasn't touched this run). Do NOT touch `review.html`, `privacy.html`, `terms.html`, anything under `/opt`, or any path outside `/var/www/brightwater/blog/` + `/var/www/brightwater/sitemap.xml` on the droplet.

## 6. Verify live
- `curl -s -o /dev/null -w "%{http_code}"` the new post URL on `https://brightwaterinsurancegroup.com/blog/<slug>.html` — expect 200.
- Fetch the live HTML and re-run every step-3 grep against it, PLUS confirm it contains "Brightwater Insurance Group" and does NOT contain "Bay Harbor".
- Curl `https://brightwaterinsurancegroup.com/blog/index.html` — expect 200, confirm the new card's slug is present.
- Curl `https://brightwaterinsurancegroup.com/sitemap.xml` (if changed) — expect 200, confirm the new URL is present.
- Curl `https://brightwaterinsurancegroup.com/` — expect 200 (basic site-health sanity check).
- **Any failure** → remove the deployed post from the droplet, restore the droplet's prior `blog/index.html` and `sitemap.xml` (from local git HEAD before this run's edits), leave the queued file in `_queue/` untouched, then step 9 with the failure.

## 7. Bookkeeping
In `blog/blog_topics.md`: check off the topic `[x]` and append to PUBLISHED LOG (`date · slug · topic`).

## 8. Commit
`git add` only the new/changed files (new post under `build_brightwater/blog/`, `build_brightwater/blog/index.html`, `build_brightwater/sitemap.xml` if changed, `blog/blog_topics.md`, and the queue-file deletion if applicable) — never `git add -A`. Commit `"blog autopost: <slug>"`, push origin main.

## 9. Report (always, success or failure)
ssh root@104.131.54.54, read DISCORD_GENERAL_WEBHOOK_URL from /root/atd/.env, POST via curl (NOT python-urllib — 403s) a message ≤1000 chars: "📝 Blog autopost: <title> — live at <url> — lint clean, deployed, committed" or on failure: "⚠️ Blog autopost FAILED at step <n>: <reason> — nothing published".

## Standing rules
One post per run. Never edit existing posts (annual refreshes are a separate human-triggered task). Never touch any file not listed here. Only delete a file from `blog/_queue/` after a CONFIRMED-successful step 6. If `blog_topics.md` has no eligible topics and the queue is empty, report that via step 9 and stop.
