---
id: kb-diagnostics
type: diagnostic
discipline: [SEO, AEO, GEO, LLMO]
tags: [triage, symptoms, troubleshooting]
related: [kb-overview]
last_updated: 2026-07-29
---

# Diagnostic Standard — Symptom-to-Stage Mapping

A standing lookup the evaluator/critic should expose (not a pass/fail check, but a triage table). Use this first when performance drops or a page underperforms — diagnose in pipeline order before theorizing.

```
Discovery → Crawl → Render → Index → Retrieval → Ranking → Presentation
```

| Symptom | Likely failing stage | Which standards to check first |
|---|---|---|
| Not in Google at all | Crawl/Index | `standards/01-access-indexability.md` STD-01, STD-02, STD-04 |
| Indexed, zero impressions | Retrieval | Content/topic match — outside rule-engine scope, needs demand validation |
| Impressions, poor position | Ranking | `standards/07-off-site-authority.md` STD-26–30, content depth |
| Good position, low CTR | Presentation | Title/meta, SERP feature capture |
| Good rank, no AI citation | Extractability | `standards/02-rendering.md` STD-06, `standards/06-aeo-geo-content.md` STD-20–25 |
| Sudden site-wide drop | Algorithmic/technical | Recent deploys, update-date correlation |
| Slow multi-month decline | Competitive/quality | `standards/07-off-site-authority.md` STD-26–29 trend, content decay |

**First move on any drop, always:** Search Console → Manual Actions. Takes 10 seconds and rules out the most catastrophic cause first.

Source: `../research/07-algorithms-and-how-ranking-works.md` Part 4.
