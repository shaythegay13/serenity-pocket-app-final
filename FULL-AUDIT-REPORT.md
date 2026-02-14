# Full SEO Audit Report: www.playmindlabs.com

**Audit Date:** 2026-02-10
**Pages Crawled:** 12
**Business Type Detected:** SaaS / Sports Betting Analytics Platform
**Overall SEO Health Score: 28/100**

---

## Executive Summary

PlayMind Labs (www.playmindlabs.com) is an AI-powered behavioral sports betting analytics platform. The site suffers from **severe SEO deficiencies** that are likely preventing it from gaining any meaningful organic search visibility.

### Top 5 Critical Issues
1. **Domain identity crisis** - Sitemap and robots.txt reference `serenitypocket.com` while the live site is `www.playmindlabs.com`
2. **Client-side rendering (CSR) blocks crawling** - All page content loads via JavaScript; search engines see empty shells
3. **Zero structured data / schema markup** across the entire site
4. **Brand name inconsistency** - "Serenity Pocket" and "PlayMind Labs" used interchangeably across meta tags
5. **No indexable content** - FAQ, pricing, features, privacy, and terms pages return empty content to crawlers

### Top 5 Quick Wins
1. Fix sitemap and robots.txt to reference `www.playmindlabs.com`
2. Enable Next.js Server-Side Rendering (SSR) or Static Site Generation (SSG) for all public pages
3. Add Organization and SoftwareApplication schema markup
4. Add FAQPage schema to the FAQ page
5. Remove `login` and `survey` pages from the sitemap

---

## 1. Technical SEO (Score: 15/25)

### Crawlability

| Check | Status | Details |
|-------|--------|---------|
| robots.txt exists | PASS | Present and accessible |
| robots.txt correctness | FAIL | References `serenitypocket.com/sitemap.xml` instead of `playmindlabs.com` |
| Sitemap exists | PASS | Present at /sitemap.xml |
| Sitemap domain match | FAIL | All 12 URLs use `serenitypocket.com` domain |
| HTTPS | PASS | Site loads over HTTPS |
| Crawl-delay | PASS | No unnecessary crawl delays |
| API routes blocked | PASS | `/api/` correctly disallowed |
| Auth routes blocked | PASS | `/auth/`, `/dashboard/`, `/account/` disallowed |
| Redirect chain | WARN | Need to verify www vs non-www canonical |

### Indexability

| Check | Status | Details |
|-------|--------|---------|
| Content rendering | FAIL | Client-side rendered (CSR) - crawlers see empty pages |
| Canonical tags | NOT FOUND | No canonical tags detected |
| Meta robots | NOT FOUND | No meta robots directives found |
| Hreflang | NOT FOUND | No international targeting (acceptable if US-only) |
| 404 handling | WARN | llms.txt returns 404 (expected, but should have custom 404 page) |

### Security

| Check | Status | Details |
|-------|--------|---------|
| HTTPS | PASS | Valid SSL certificate |
| Mixed content | PASS | No HTTP resources detected |
| Security headers | WARN | Unable to verify CSP, HSTS, X-Frame-Options from fetch |

### Disallowed Paths (robots.txt)
- `/api/` - Correct (API routes)
- `/dashboard/` - Correct (authenticated area)
- `/account/` - Correct (authenticated area)
- `/profile/` - Correct (authenticated area)
- `/betlab/` - Correct (authenticated area)
- `/analytics/` - Correct (authenticated area)
- `/onboarding/` - Correct (authenticated area)
- `/auth/` - Correct (authentication flows)

**Verdict:** Disallow rules are appropriate.

---

## 2. Content Quality (Score: 8/25)

### E-E-A-T Assessment

| Signal | Score | Details |
|--------|-------|---------|
| Experience | LOW | No case studies, testimonials, or user stories |
| Expertise | LOW | No author bios, credentials, or research citations |
| Authoritativeness | LOW | No press mentions, partnerships, or industry recognition |
| Trustworthiness | MEDIUM | Has responsible gambling page, privacy policy, terms of service |

### Page-by-Page Content Analysis

| Page | Visible Content | Assessment |
|------|----------------|------------|
| Homepage (`/`) | Tagline + nav only | THIN - No substantive content visible to crawlers |
| Features (`/features`) | Meta tags only | CRITICAL - Feature descriptions load client-side |
| Pricing (`/pricing`) | Meta tags only | CRITICAL - Pricing tiers load client-side |
| How It Works (`/how-it-works`) | Meta tags only | CRITICAL - Process steps load client-side |
| About (`/about`) | Meta tags only | CRITICAL - Team/company info loads client-side |
| FAQ (`/faq`) | Meta tags only | CRITICAL - All Q&As load client-side |
| Contact (`/contact`) | Meta tags only | CRITICAL - Contact info/form loads client-side |
| Responsible Use (`/responsible-use`) | Meta tags only | CRITICAL - Policy text loads client-side |
| Privacy (`/privacy`) | Meta tags only | CRITICAL - Policy text loads client-side |
| Terms (`/terms`) | Meta tags only | CRITICAL - Terms text loads client-side |
| Login (`/login`) | N/A | Should not be indexed |
| Survey (`/survey`) | N/A | Should not be indexed |

### Content Gaps
- No blog or educational content
- No betting guides or how-to articles
- No glossary of betting terms
- No industry news or updates section
- No user success stories or case studies

---

## 3. On-Page SEO (Score: 12/20)

### Title Tags

| Page | Title | Length | Assessment |
|------|-------|--------|------------|
| Home | PlayMind Labs - Behavioral Sports Betting Analytics | 52 chars | GOOD |
| Features | Features \| PlayMind Labs - Behavioral Sports Betting Tools | 59 chars | GOOD |
| Pricing | Pricing \| PlayMind Labs - Subscription Plans | 46 chars | GOOD |
| How It Works | How It Works \| PlayMind Labs | 29 chars | OK - Could be more descriptive |
| About | About Us \| Serenity Pocket - PlayMind Labs | 44 chars | FAIL - Wrong brand name "Serenity Pocket" |
| FAQ | FAQ \| PlayMind Labs - Frequently Asked Questions | 50 chars | GOOD |
| Contact | Contact Us \| PlayMind Labs | 27 chars | OK |
| Responsible Use | Responsible Gambling \| PlayMind Labs | 37 chars | GOOD |
| Privacy | Privacy Policy \| PlayMind Labs | 31 chars | OK |
| Terms | Terms of Service \| PlayMind Labs | 33 chars | OK |

### Meta Descriptions

| Page | Has Description | Length | Quality |
|------|----------------|--------|---------|
| Home | Yes | 89 chars | GOOD - Includes value prop |
| Features | Yes | 145 chars | GOOD - Feature-rich description |
| Pricing | Yes | 128 chars | GOOD - Mentions free tier and trial |
| How It Works | Yes | 125 chars | GOOD |
| About | Yes | 108 chars | WARN - References "Serenity Pocket" |
| FAQ | Yes | 126 chars | GOOD |
| Contact | Yes | 117 chars | GOOD |
| Responsible Use | Yes | 122 chars | GOOD |
| Privacy | Yes | 97 chars | OK |
| Terms | Yes | 100 chars | OK |

### Heading Structure
- H1 tags: Only "The science of smarter betting" detected (same across pages)
- Duplicate H1 across all pages is a PROBLEM
- Subheading hierarchy not verifiable due to CSR

### Internal Linking
- Navigation includes: FAQs, Demo, Features, Pricing, About, Privacy, Terms, Contact
- Footer links present
- No contextual internal links within page content (due to CSR)
- Missing: breadcrumbs, related content links, cross-page references

---

## 4. Schema & Structured Data (Score: 0/10)

### Current Implementation
**None detected.** Zero structured data markup found on any crawled page.

### Missing Schema Opportunities

| Schema Type | Page | Priority |
|-------------|------|----------|
| Organization | Homepage | CRITICAL |
| WebSite (with SearchAction) | Homepage | HIGH |
| SoftwareApplication | Homepage, Features | HIGH |
| FAQPage | FAQ | HIGH |
| BreadcrumbList | All pages | MEDIUM |
| WebPage | All pages | MEDIUM |
| ContactPage | Contact | MEDIUM |
| Product (pricing) | Pricing | MEDIUM |
| HowTo | How It Works | MEDIUM |
| AboutPage | About | LOW |

---

## 5. Performance / Core Web Vitals (Score: 5/10)

### Observations
- **Framework:** Next.js (positive for performance potential)
- **Font:** Inter typeface loaded
- **Theme:** Dynamic light/dark mode support
- **Client-side rendering:** Heavy JS bundle required for all content - negatively impacts:
  - **LCP (Largest Contentful Paint):** Likely poor - content requires JS execution
  - **INP (Interaction to Next Paint):** Unknown - requires live measurement
  - **CLS (Cumulative Layout Shift):** Likely poor - dynamic content loading causes layout shifts

### Recommendations
- Enable SSR/SSG for all public pages
- Implement streaming SSR for dynamic content
- Add `loading.tsx` skeletons for better perceived performance
- Optimize JS bundle splitting

---

## 6. Images (Score: 3/5)

### Findings
| Image | Alt Text | Format | Assessment |
|-------|----------|--------|------------|
| `/logo.png` | Not provided | PNG | FAIL - Missing alt text, should use SVG or WebP |

### Issues
- Logo uses PNG format (should be SVG for scalability or WebP for compression)
- No alt text on logo image
- Unable to assess other images due to CSR (content images load dynamically)
- No `<picture>` element or `srcset` responsive image markup detected

---

## 7. AI Search Readiness (Score: 2/5)

### AI Crawler Accessibility

| Check | Status | Details |
|-------|--------|---------|
| GPTBot access | PASS | Not blocked in robots.txt |
| ClaudeBot access | PASS | Not blocked in robots.txt |
| PerplexityBot access | PASS | Not blocked in robots.txt |
| llms.txt | FAIL | Returns 404 - No LLM-specific content guide |
| Content citability | FAIL | CSR means AI crawlers see empty pages |

### Citability Assessment
- **Passage structure:** Unknown (CSR blocks analysis)
- **Factual claims:** Meta descriptions contain some citable content
- **Unique data:** Platform claims AI-powered analysis, emotion tracking, cognitive bias detection
- **Brand mentions:** Inconsistent (PlayMind Labs vs Serenity Pocket)

---

## Sitemap Analysis

### Current Sitemap (12 URLs)

| URL | Priority | Freq | Issues |
|-----|----------|------|--------|
| / | 1.0 | daily | FAIL: Wrong domain (serenitypocket.com) |
| /features | 0.9 | weekly | FAIL: Wrong domain |
| /pricing | 0.9 | weekly | FAIL: Wrong domain |
| /how-it-works | 0.7 | weekly | FAIL: Wrong domain |
| /about | 0.7 | weekly | FAIL: Wrong domain |
| /faq | 0.7 | weekly | FAIL: Wrong domain |
| /contact | 0.7 | weekly | FAIL: Wrong domain |
| /privacy | 0.7 | weekly | FAIL: Wrong domain |
| /terms | 0.7 | weekly | FAIL: Wrong domain |
| /responsible-use | 0.7 | weekly | FAIL: Wrong domain |
| /login | 0.7 | weekly | REMOVE: Auth page shouldn't be indexed |
| /survey | 0.7 | weekly | REMOVE: Should not be indexed |

### Sitemap Issues
1. **All URLs reference wrong domain** (`serenitypocket.com` instead of `playmindlabs.com`)
2. **Login page included** - authentication pages should not be in sitemap
3. **Survey page included** - internal tool pages should not be in sitemap
4. **All lastmod dates identical** - should reflect actual page modification dates
5. **Missing pages:** No demo page despite it being in navigation

---

## Score Breakdown

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 15/25 | 15.0 |
| Content Quality | 25% | 8/25 | 8.0 |
| On-Page SEO | 20% | 12/20 | 12.0 |
| Schema / Structured Data | 10% | 0/10 | 0.0 |
| Performance (CWV) | 10% | 5/10 | 5.0 |
| Images | 5% | 3/5 | 3.0 |
| AI Search Readiness | 5% | 2/5 | 2.0 |
| **TOTAL** | **100%** | | **28/100** |

---

*Report generated by Claude Code SEO Audit - 2026-02-10*
