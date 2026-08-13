"""Failure-path E2E, final-expense.html production, 2026-08-13 am robot run.

Per the FAILURE-PATH E2E RULE (permanent): exercise the validation-blocked path,
and verify BOTH (a) the error is visible IN the tested viewport and (b) the
*_gate_blocked analytics event fires. Happy path is NOT submitted -- a real POST
would create a real lead and text the operator.

Analytics hosts are blocked at the network layer; gtag() is defined inline so
calls still land in window.dataLayer, which is what we assert against.
"""
import json
from playwright.sync_api import sync_playwright

URL = "https://brightwaterinsurancegroup.com/final-expense.html?src=e2e&grp=failpath"
VW, VH = 390, 667
BLOCK = ("googletagmanager.com", "google-analytics.com", "googleadservices.com",
         "doubleclick.net", "bat.bing.com", "formsubmit.co", "google.com/ads")

results = {}

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": VW, "height": VH})
    pg.route("**/*", lambda r: r.abort()
             if any(h in r.request.url for h in BLOCK) else r.continue_())

    posted = []
    pg.on("request", lambda r: posted.append(r.url)
          if r.method == "POST" else None)

    pg.goto(URL, wait_until="domcontentloaded")
    pg.wait_for_timeout(1200)

    # STEP 1 -> STEP 2 -> STEP 3 (capture gate)
    pg.click('.q-screen.active .q-opt[data-key="who"]')
    pg.wait_for_timeout(500)
    pg.click('.q-screen.active .q-opt[data-key="age"]')
    pg.wait_for_timeout(700)

    step = pg.eval_on_selector('.q-screen.active', 'e => e.getAttribute("data-step")')
    results["reached_step"] = step

    # the corrected copy must be the copy actually rendered on this screen
    results["stepsub_text"] = pg.eval_on_selector(
        '.q-screen.active .q-stepsub', 'e => e.textContent.trim()')
    results["teaser_text"] = pg.eval_on_selector(
        '.q-screen.active .q-teaser p', 'e => e.textContent.trim()')

    # ---- FAILURE PATH: submit with every required field empty ----
    pg.eval_on_selector('#qSubmit', 'e => e.scrollIntoView({block:"center"})')
    pg.wait_for_timeout(400)
    pg.click('#qSubmit')
    pg.wait_for_timeout(1500)

    # (a) is an error ON SCREEN in this viewport?
    results["errors_shown"] = pg.eval_on_selector_all(
        '.q-err.show', 'els => els.map(e => e.id)')
    results["first_err_box"] = pg.evaluate("""() => {
        const e = document.querySelector('.q-err.show');
        if (!e) return null;
        const r = e.getBoundingClientRect();
        return {id: e.id, top: Math.round(r.top), bottom: Math.round(r.bottom),
                text: e.textContent.trim().slice(0, 60)};
    }""")

    # (b) did the gate_blocked event fire?
    results["datalayer"] = pg.evaluate("""() => (window.dataLayer || [])
        .map(a => { try { return JSON.stringify(Array.from(a)); }
                    catch (e) { return String(a); } })""")

    # still on the gate, not advanced
    results["step_after_blocked_submit"] = pg.eval_on_selector(
        '.q-screen.active', 'e => e.getAttribute("data-step")')
    results["post_requests"] = posted
    b.close()

# ---------------- assertions ----------------
gb = [d for d in results["datalayer"] if "fe_gate_blocked" in d]
box = results["first_err_box"]
in_viewport = bool(box) and 0 <= box["top"] < VH

print(json.dumps({k: v for k, v in results.items() if k != "datalayer"},
                 indent=2)[:1500])
print("\nfe_gate_blocked events in dataLayer:", gb)
print("\n--- VERDICT ---")
print(f"reached capture gate (step 3)      : {results['reached_step'] == '3'}")
print(f"blocked submit did NOT advance     : {results['step_after_blocked_submit'] == '3'}")
print(f"error rendered IN viewport (<{VH}px): {in_viewport}  box={box}")
print(f"fe_gate_blocked fired              : {len(gb) > 0}")
print(f"no real lead POSTed                : {not any('api/lead' in u for u in results['post_requests'])}")
ok = (results["reached_step"] == "3" and results["step_after_blocked_submit"] == "3"
      and in_viewport and len(gb) > 0
      and not any("api/lead" in u for u in results["post_requests"]))
print("\nFAILURE-PATH E2E:", "PASS" if ok else "FAIL")
