# SEO Progress Report: www.playmindlabs.com

**Date:** 2026-02-10
**Original Score:** 28/100
**Projected Score After Deploy:** 52/100 (+24 points)

---

## Status: Changes Are LOCAL Only — Not Yet Deployed

All code changes from the PLG (Product-Led Growth) refactor are committed locally but have **not been deployed** to production. The live site at `www.playmindlabs.com` still shows the original 28/100 score.

**Once deployed, the following improvements take effect:**

---

## What We Fixed (Local Changes)

### CRITICAL Items — All 5 Addressed

| # | Issue | Status | Details |
|---|-------|--------|---------|
| 1 | Sitemap wrong domain (`serenitypocket.com`) | FIXED | `app/sitemap.ts` now uses `www.playmindlabs.com` |
| 2 | robots.txt wrong sitemap URL | FIXED | `app/robots.ts` now uses `www.playmindlabs.com` |
| 3 | Client-side rendering blocks crawling | PARTIAL | 3 new SSR public pages created (`/check-in`, `/serenity`, `/pgsi`). Existing pages (features, pricing, faq, etc.) still CSR. |
| 4 | Brand name inconsistency ("Serenity Pocket") | FIXED | All instances replaced with "PlayMind Labs" across 9 files |
| 5 | Non-indexable pages in sitemap (`/login`, `/survey`) | FIXED | Removed from sitemap, `/home/` and `/pgsi-survey/` added to robots.txt disallow |

### New Public Pages Created (Server-Rendered SEO Content)

| Page | Title | H1 | Server Content |
|------|-------|----|----------------|
| `/check-in` | "Free Emotional Check-In for Sports Bettors \| PlayMind Labs" | "Free Emotional Check-In for Sports Bettors" | Explainer paragraphs about emotional awareness, how it works, the science behind it |
| `/serenity` | "Free Serenity Assessment - Know Your Betting Archetype \| PlayMind Labs" | "Discover Your Betting Archetype" | Archetype overview, what you'll learn, research basis |
| `/pgsi` | "Free PGSI Assessment for Sports Bettors \| PlayMind Labs" | "Problem Gambling Severity Index (PGSI) Assessment" | What PGSI is, why it matters, responsible gambling resources |

Each page has:
- Unique `<title>` and `<meta description>`
- Server-rendered H1 + H2 headings with paragraph content (crawlable without JS)
- Interactive tool below the SEO content
- Layout metadata via Next.js `layout.tsx`

### Sitemap Changes

**Before (12 URLs, wrong domain):**
- All URLs at `serenitypocket.com`
- Included `/login` and `/survey`

**After (13 URLs, correct domain):**
- All URLs at `www.playmindlabs.com`
- Added: `/check-in` (0.9), `/serenity` (0.9), `/pgsi` (0.9)
- Removed: `/login`, `/survey`

### robots.txt Changes

**Before:**
```
Sitemap: https://serenitypocket.com/sitemap.xml
```

**After:**
```
Disallow: /home/
Disallow: /pgsi-survey/
Sitemap: https://www.playmindlabs.com/sitemap.xml
```

---

## Projected Score Breakdown (After Deploy)

| Category | Weight | Before | After | Change | Notes |
|----------|--------|--------|-------|--------|-------|
| Technical SEO | 25% | 15/25 | 21/25 | +6 | Sitemap/robots fixed, 3 SSR pages, correct domain |
| Content Quality | 25% | 8/25 | 14/25 | +6 | 3 new pages with real crawlable content, brand consistency |
| On-Page SEO | 20% | 12/20 | 16/20 | +4 | New pages have unique H1s, unique titles, unique descriptions |
| Schema / Structured Data | 10% | 0/10 | 0/10 | 0 | NOT YET IMPLEMENTED |
| Performance (CWV) | 10% | 5/10 | 7/10 | +2 | New pages use SSR with server content |
| Images | 5% | 3/5 | 3/5 | 0 | No image changes |
| AI Search Readiness | 5% | 2/5 | 3/5 | +1 | 3 crawlable public pages with structured content |
| **TOTAL** | **100%** | **28** | **52** | **+24** | |

---

## Remaining Gaps (Not Yet Fixed)

### Still Critical
1. **Existing pages still CSR** — `/features`, `/pricing`, `/how-it-works`, `/about`, `/faq`, `/contact`, `/responsible-use`, `/privacy`, `/terms` all still render content client-side. Crawlers see empty shells for these pages.
2. **No schema markup** — Zero JSON-LD structured data on any page (Organization, SoftwareApplication, FAQPage, etc.)
3. **No canonical tags** — No `<link rel="canonical">` on any page
4. **No Open Graph / Twitter Card tags** — No social sharing metadata

### Still High Priority
5. **Duplicate H1 tags** — Existing pages still share "The science of smarter betting" as H1
6. **Google Search Console not set up** — Can't verify indexing without it
7. **No blog/educational content** — Major content gap for organic traffic

### Medium Priority
8. **No breadcrumb navigation or schema**
9. **Logo still PNG** — Should be SVG or WebP with proper alt text
10. **No `llms.txt`** — Missing AI crawler content guide
11. **All lastmod dates identical** in sitemap

---

## Next Steps to Reach 75/100

| Priority | Action | Estimated Score Gain |
|----------|--------|---------------------|
| 1 | **Deploy current changes** to production | Activates the +24 points above |
| 2 | **Add JSON-LD schema** (Organization, SoftwareApplication, FAQPage) | +8 points |
| 3 | **Convert existing pages to SSR** (features, pricing, about, faq, etc.) | +8 points |
| 4 | **Add canonical tags + OG tags** to all pages | +4 points |
| 5 | **Create unique H1s** for all existing pages | +2 points |
| 6 | **Set up Google Search Console** and submit sitemap | (enables monitoring) |
| 7 | **Start a blog** with 2-4 articles targeting key betting psychology terms | +5 points over time |

**Estimated total after all above: ~75/100**

---

## Production Verification Checklist (After Deploy)

Run these checks after deploying to confirm fixes are live:

```bash
# 1. Verify sitemap uses correct domain
curl -s https://www.playmindlabs.com/sitemap.xml | grep "playmindlabs"

# 2. Verify robots.txt uses correct sitemap URL
curl -s https://www.playmindlabs.com/robots.txt

# 3. Verify new public pages return server-rendered content
curl -s https://www.playmindlabs.com/check-in | grep "<h1"
curl -s https://www.playmindlabs.com/serenity | grep "<h1"
curl -s https://www.playmindlabs.com/pgsi | grep "<h1"

# 4. Verify removed pages are gone from sitemap
curl -s https://www.playmindlabs.com/sitemap.xml | grep -c "login"  # should be 0
curl -s https://www.playmindlabs.com/sitemap.xml | grep -c "survey"  # should be 0

# 5. Verify branding is consistent
curl -s https://www.playmindlabs.com/about | grep -i "serenity pocket"  # should be empty
```

---

*Progress report generated by Claude Code SEO Audit — 2026-02-10*
