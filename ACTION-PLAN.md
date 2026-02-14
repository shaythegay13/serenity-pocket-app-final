# SEO Action Plan: www.playmindlabs.com

**Generated:** 2026-02-10
**Current Score:** 28/100
**Target Score:** 75/100 (after implementing all Critical + High items)

---

## CRITICAL Priority (Fix Immediately)

### 1. Fix Domain References in Sitemap
**Impact:** All 12 URLs point to wrong domain
**Current:** All sitemap URLs reference `serenitypocket.com`
**Action:**
- Update `app/sitemap.ts` (or sitemap generation file) to use `https://www.playmindlabs.com` as the base URL
- Verify by accessing `https://www.playmindlabs.com/sitemap.xml`
- Resubmit sitemap in Google Search Console

### 2. Fix Domain Reference in robots.txt
**Impact:** Search engines can't find valid sitemap
**Current:** `Sitemap: https://serenitypocket.com/sitemap.xml`
**Action:**
- Update to `Sitemap: https://www.playmindlabs.com/sitemap.xml`
- Verify at `https://www.playmindlabs.com/robots.txt`

### 3. Enable Server-Side Rendering (SSR) for All Public Pages
**Impact:** Search engines currently see EMPTY pages
**Current:** All content loads via client-side JavaScript
**Action:**
- Convert all public pages to use Next.js SSR (`getServerSideProps`) or SSG (`getStaticProps`)
- At minimum, these pages MUST be server-rendered:
  - `/` (homepage)
  - `/features`
  - `/pricing`
  - `/how-it-works`
  - `/about`
  - `/faq`
  - `/contact`
  - `/responsible-use`
  - `/privacy`
  - `/terms`
- Use `generateStaticParams` for static pages
- Test with `curl` to verify HTML content is present without JavaScript

### 4. Fix Brand Name Inconsistency
**Impact:** Confuses search engines about site identity
**Current:** About page title says "Serenity Pocket - PlayMind Labs", about meta description says "Serenity Pocket"
**Action:**
- Audit ALL meta tags, titles, and content for "Serenity Pocket" references
- Replace with "PlayMind Labs" consistently
- Update OG tags, Twitter cards, and any social metadata

### 5. Remove Non-Indexable Pages from Sitemap
**Impact:** Wastes crawl budget on pages that shouldn't be indexed
**Action:**
- Remove `/login` from sitemap
- Remove `/survey` from sitemap
- Add `noindex` meta tag to login and survey pages
- Consider adding these paths to robots.txt Disallow rules

---

## HIGH Priority (Fix Within 1 Week)

### 6. Add Organization Schema to Homepage
**Impact:** Establishes brand entity in search results
**Action:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "PlayMind Labs",
  "url": "https://www.playmindlabs.com",
  "description": "AI-powered behavioral sports betting analytics platform",
  "foundingDate": "2026",
  "sameAs": []
}
```

### 7. Add SoftwareApplication Schema
**Impact:** Rich results for software/app searches
**Action:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PlayMind Labs",
  "applicationCategory": "Sports Analytics",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Foundation tier - free"
  }
}
```

### 8. Add FAQPage Schema to FAQ Page
**Impact:** FAQ rich results in search
**Action:** Add FAQPage structured data with all Q&A pairs once content is server-rendered

### 9. Add Canonical Tags to All Pages
**Impact:** Prevents duplicate content issues
**Action:**
- Add `<link rel="canonical" href="https://www.playmindlabs.com/PAGE_PATH" />` to every page
- Ensure canonical URLs use `www.playmindlabs.com` (not `serenitypocket.com`)

### 10. Create Unique H1 Tags Per Page
**Impact:** Currently all pages share "The science of smarter betting" as H1
**Action:**
- Homepage: "AI-Powered Behavioral Sports Betting Analytics"
- Features: "Features That Make Smarter Betting Possible"
- Pricing: "Simple, Transparent Pricing Plans"
- How It Works: "How PlayMind Labs Helps You Bet Smarter"
- About: "About PlayMind Labs"
- FAQ: "Frequently Asked Questions"
- Contact: "Get In Touch With PlayMind Labs"

### 11. Set Up Google Search Console
**Action:**
- Verify `www.playmindlabs.com` in Google Search Console
- Submit corrected sitemap
- Monitor indexing status
- Set up Bing Webmaster Tools as well

---

## MEDIUM Priority (Fix Within 1 Month)

### 12. Add Open Graph & Twitter Card Meta Tags
**Action:** Add to all pages:
```html
<meta property="og:title" content="Page Title" />
<meta property="og:description" content="Page description" />
<meta property="og:image" content="https://www.playmindlabs.com/og-image.png" />
<meta property="og:url" content="https://www.playmindlabs.com/page" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

### 13. Add BreadcrumbList Schema to All Pages
**Action:** Implement breadcrumb navigation with corresponding schema markup

### 14. Optimize Images
**Action:**
- Convert logo from PNG to SVG (scalability) or WebP (compression)
- Add descriptive alt text: `alt="PlayMind Labs - Behavioral Sports Betting Analytics"`
- Implement responsive images with `srcset`
- Add `width` and `height` attributes to prevent CLS

### 15. Create a Blog/Content Section
**Impact:** Major content marketing opportunity
**Action:**
- Add `/blog` section
- Target topics:
  - "How to avoid tilt in sports betting"
  - "Understanding cognitive biases in betting"
  - "Responsible gambling tips"
  - "Sports betting analytics explained"
  - "Emotional tracking for better betting decisions"
- Publish 2-4 articles per month

### 16. Add a Demo Page
**Action:**
- Navigation references "Demo" but it may not exist as a standalone page
- Create `/demo` with video walkthrough or interactive preview
- Add VideoObject schema if using video

### 17. Improve Internal Linking
**Action:**
- Add contextual links between related pages
- Link Features -> Pricing (and vice versa)
- Link How It Works -> Features -> Demo flow
- Add "Related" sections at bottom of content pages

### 18. Add `lastmod` Accuracy to Sitemap
**Action:**
- Update sitemap to reflect actual page modification dates
- Don't use identical timestamps for all pages

---

## LOW Priority (Backlog)

### 19. Create llms.txt File
**Impact:** Helps AI crawlers understand site structure
**Action:** Create `/public/llms.txt` with site overview, key pages, and content guide

### 20. Add Social Media Profiles
**Action:**
- Create and link Twitter/X, LinkedIn profiles
- Add social links to footer
- Update Organization schema with `sameAs` URLs

### 21. Create Custom 404 Page
**Action:** Design a helpful 404 page with:
- Search functionality
- Links to popular pages
- Clear navigation back to homepage

### 22. Implement Structured Data Testing
**Action:**
- Set up automated Schema.org validation in CI/CD pipeline
- Use Google Rich Results Test for manual verification
- Monitor in Google Search Console

### 23. Add Accessibility Improvements
**Action:**
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Add skip-to-content links
- Test with screen readers

### 24. Consider Adding HowTo Schema
**Action:** Add HowTo structured data to the How It Works page with step-by-step process

---

## Implementation Timeline

| Week | Items | Expected Score Gain |
|------|-------|-------------------|
| Week 1 | Items 1-5 (Critical) | +20 points |
| Week 2 | Items 6-11 (High) | +15 points |
| Week 3-4 | Items 12-18 (Medium) | +12 points |
| Ongoing | Items 19-24 (Low) + Blog | +5 points |
| **Total** | | **~75/100** |

---

*Action plan generated by Claude Code SEO Audit - 2026-02-10*
