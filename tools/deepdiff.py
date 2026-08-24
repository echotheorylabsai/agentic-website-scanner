import json, urllib.request, os, sys
ROOT="/Users/shubh/Desktop/src/echo-official/agentic-website-scanner"
os.chdir(ROOT)

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ora-agent/1.0"})
    return json.load(urllib.request.urlopen(req, timeout=60))

catalog = json.load(open("packages/scanner-core/src/catalog.json"))
byid = {c["id"]: c for c in catalog["checks"]}

def bonus_only(cid):
    c = byid.get(cid)
    if not c: return True
    return bool(c.get("essentialsBonusOnly") or c.get("bonus")) and cid != "markdown-negotiation-vary"

domains = ["vercel.com", "eve.dev", "meta.ai", "example.org"]
summary = {}
for h in domains:
    ess = json.load(open(f"docs/validation/ref-{h}.json")).get("essentials", {})
    theirs = ess["checks"]
    ours_full = get(f"http://localhost:3100/api/report/full?url={h}")
    ours = {c["check_id"]: c for c in ours_full["roster"]}
    mismatches = []
    overlap = 0
    exact = 0
    pool_relevant = []
    for cid, t in theirs.items():
        if cid not in ours: continue
        o = ours[cid]
        if o["status"] == "na" or not o["eligible"]:
            # we N/A'd something Ora scored — pool distortion, flag hard
            mismatches.append((cid, t.get("fraction",0), None, "WE-NA'd-but-they-scored", o["na_reason"]))
            continue
        tf, of_ = t.get("fraction", 0), (o["fraction"] or 0)
        overlap += 1
        if abs(tf-of_) < 1e-9: exact += 1
        if abs(tf-of_) > 1e-9:
            sev = "HIGH" if abs(tf-of_) > 0.34 else "med"
            mismatches.append((cid, tf, of_, sev, ""))
        if not bonus_only(cid) and abs(tf-of_) > 1e-9:
            pool_relevant.append((cid, tf, of_))
    summary[h] = dict(overlap=overlap, exact=exact,
                      score_theirs=ess["score"], score_ours=ours_full["report"]["score"],
                      mismatches=mismatches, pool_relevant=pool_relevant)
    print(f"\n=== {h}: ours {ours_full['report']['score']} vs theirs {ess['score']} · overlap {overlap}, exact {exact}")
    for m in sorted(mismatches, key=lambda x: -(abs((x[1] or 0)-(x[2] or 0)) if x[2] is not None else 9)):
        tf, of_ = m[1], m[2]
        d = "" if of_ is None else f"ours={of_:<6.2f}"
        print(f"  [{m[3]:>22}] {m[0]:<34} theirs={tf:<6.2f} {d} {m[4]}")

json.dump(summary, open("/tmp/summary.json","w"), indent=1)
