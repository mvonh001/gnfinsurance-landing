# BHB Monthly News-Sweep — headless runbook
Runs monthly via Task Scheduler. Produces ONE compliant news-roundup post into blog/_queue/ (the weekly publisher ships it). Never publishes directly.

1. RESEARCH (WebSearch): past ~30 days of Medicare/senior-insurance news relevant to FL beneficiaries: CMS announcements, enrollment-period reminders, scam/fraud warnings (FTC/FCC/DOI alerts — high trust value), Social Security/Medicare interaction news. NO plan-specific benefit news, NO carrier product announcements.
2. WRITE a 500-800 word roundup post ("What Miami seniors should know this month") matching the existing blog template exactly (../ asset paths, author line, soft CTA to ../review.html, verbatim TPMO footer, BlogPosting JSON-LD, <!--PUBDATE--> token for all dates).
3. HARD RAILS on top of the standard lint (blog/autopost_task.md step 3 list applies in full): NO 2027-plan-year content before Oct 1 2026 (regulatory-news mentions of rules are OK ONLY if they contain zero plan/benefit specifics — when in doubt, omit); news framed educationally, never as advice to switch/buy; every claim attributable to a named public source (CMS.gov, FTC.gov...) linked inline.
4. Self-lint per the standard gate; ANY hit = fix or drop the item.
5. Save to blog/_queue/news-roundup-<YYYY-MM>.html, mark a "NEWS SWEEP <YYYY-MM> QUEUED" line in blog/blog_topics.md under HARVESTED.
6. Report via Discord webhook (per autopost_task.md step 9 method): "🗞️ Monthly news sweep queued: <slug> — publishes with the weekly cycle."
