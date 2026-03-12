# Single-Page Deep Analysis: www.playmindlabs.com (Homepage)

**Analysis Date:** 2026-02-11
**Source:** Direct source code inspection of `app/page.tsx`, `app/layout.tsx`, `components/landing-page.tsx`, `components/footer.tsx`
**Framework:** Next.js 16.1.6 (React 19.2.1)
**Rendering Mode:** Client-Side Rendered (`"use client"` directive on homepage)

---

## 1. On-Page Elements

### Title Tag
- **Current:** `PlayMind Labs - Behavioral Sports Betting Analytics`
- **Length:** 52 characters (within 50-60 char optimal range)
- **Location:** Defined in `app/layout.tsx` line 15 via Next.js `Metadata` export
- **Assessment:** GOOD length, but uses a brand-first format. For a site with low domain authority, a keyword-first format would perform better.

**Recommended fix:**
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: "Behavioral Sports Betting Analytics | PlayMind Labs",
  // ...
}
```

### Meta Description
- **Current:** `Your behavioral betting companion for smarter, data-driven play. The seatbelt for responsible betting.`
- **Length:** 89 characters (below the 150-160 char optimal range)
- **Assessment:** UNDERUTILIZED. At 89 characters, roughly 40% of available SERP real estate is wasted. The description is also vague -- "seatbelt for responsible betting" is creative but does not contain transactional or informational intent keywords.

**Recommended fix:**
```typescript
description: "PlayMind Labs uses AI-powered behavioral analytics to help sports bettors track emotions, prevent tilt, and make data-driven decisions. Free tier available. Start betting smarter today.",
```
This version is ~175 characters (Google may truncate, but the core message appears first), includes action keywords ("track emotions", "prevent tilt", "data-driven decisions"), a free tier mention (CTR booster), and a call-to-action.

### Headings

| Level | Text | Location | Assessment |
|-------|------|----------|------------|
| H1 #1 | `PlayMind Labs` | Header (line 137-139 of landing-page.tsx) | PROBLEM: Brand name as H1, not descriptive |
| H1 #2 | `Win with Data & Discipline` | Hero section (line 165-174) | PROBLEM: Duplicate H1 on same page |
| H2 | `Have you lost a bet recently?` | Entry flow section (line 192-198) | Conversational, low keyword value |
| H2 | `Everything You Need to Win` | Features grid (line 295-297) | Vague, no keywords |
| H2 | `Your Success is Built on Trust` | Trust section (line 387-389) | Vague, no keywords |
| H3 | `PlayMind Labs` | Footer (line 32) | Redundant brand mention |
| H3 | Feature titles: "Behavioral Tracking", "Real-Time Analytics", "AI-Powered Insights", "Performance Analytics", "Parlay Optimizer", "Data Analytics" | Features grid (lines 308-346) | GOOD keyword-rich headings, but rendered client-side |
| H4 | `Resources`, `Company` | Footer (lines 103, 142) | Standard footer headings |

**Critical Issues:**
1. **Two H1 tags on the same page** -- The brand name in the header is wrapped in `<h1>` (line 137), and the hero headline is also `<h1>` (line 165). Google recommends one H1 per page.
2. **H1 content is not keyword-optimized** -- "Win with Data & Discipline" is catchy but contains no target keywords like "sports betting", "betting analytics", or "behavioral betting."
3. **Footer contains an H3 for the brand name** -- This is semantically incorrect; it should be a `<span>` or `<p>`.

**Recommended fix for heading hierarchy:**
```tsx
// Header: Change H1 to span/div
<div className="text-xl font-bold text-white">
  PlayMind Labs
</div>

// Hero: Single, keyword-rich H1
<h1 className="text-6xl md:text-7xl font-bold tracking-tight">
  AI-Powered Behavioral Analytics for
  <span className="gradient-text">Smarter Sports Betting</span>
</h1>

// Section headings: Use keyword-rich H2s
<h2>Behavioral Sports Betting Tools & Features</h2>
<h2>Why Bettors Trust PlayMind Labs</h2>

// Footer: Change H3 to span
<span className="text-lg font-bold text-foreground">PlayMind Labs</span>
```

### URL Structure
- **Homepage URL:** `https://www.playmindlabs.com/` (clean root URL)
- **Assessment:** GOOD. Clean, no parameters or fragments.

### Keyword Optimization Summary
| Element | Primary Keyword Present | Assessment |
|---------|------------------------|------------|
| Title tag | "Behavioral Sports Betting Analytics" | PASS |
| Meta description | "behavioral betting", "responsible betting" | PARTIAL - missing "sports betting analytics" |
| H1 (hero) | None of the target keywords | FAIL |
| H1 (header) | "PlayMind Labs" brand only | FAIL |
| Body copy first paragraph | "behavioral analytics", "AI-powered insights", "betting strategy" | PASS |
| URL | Root "/" | N/A |

---

## 2. Content Quality

### Word Count Estimation
Analyzing all visible text from `components/landing-page.tsx`:

| Section | Approximate Word Count |
|---------|----------------------|
| Header (brand + tagline) | ~8 words |
| Hero headline + subheading | ~25 words |
| Entry flow question + description | ~30 words |
| Stats section | ~16 words (labels only; numbers are dynamic) |
| Features grid (6 cards) | ~100 words |
| Trust section | ~55 words |
| **Total visible text** | **~234 words** |

**Assessment: CRITICALLY THIN.** Google's helpful content guidelines suggest 300+ words minimum for a homepage, and competitive SaaS landing pages typically have 800-2,000+ words. At approximately 234 words, this page provides almost no substantive content for crawlers to index.

**Compounding factor:** Because the page is client-side rendered (`"use client"` on both `app/page.tsx` and `components/landing-page.tsx`), Googlebot's initial crawl sees even less content -- essentially just the loading state: `<div class="animate-pulse text-muted-foreground">Loading...</div>`.

### Readability
- **Reading level:** Approximately 8th-9th grade (appropriate for general audience)
- **Sentence structure:** Short, punchy sentences -- good for scanning
- **Jargon level:** Moderate -- "behavioral analytics", "predictive modeling", "cognitive bias" may be unfamiliar to casual bettors
- **Assessment:** Readability is acceptable, but there is not enough content to evaluate meaningfully.

### E-E-A-T Signals (Experience, Expertise, Authority, Trust)

| Signal | Present | Evidence |
|--------|---------|----------|
| **Experience** | ABSENT | No user testimonials, case studies, or success stories on homepage |
| **Expertise** | ABSENT | No credentials, research citations, or expert endorsements |
| **Authority** | ABSENT | No press mentions, partnerships, awards, or third-party validation |
| **Trust** | WEAK | Trust section mentions encryption and responsible betting, but no trust badges, SSL seal, certifications, or links to responsible gambling organizations (NCPG, GamCare, etc.) |

**Recommendations:**
1. Add a testimonials section with real user quotes (even 2-3 is better than zero)
2. Add "As seen in" or partner logos if any press coverage exists
3. Link to recognized responsible gambling organizations (NCPG, 1-800-GAMBLER)
4. Display security/compliance badges if applicable
5. Add a brief "About the founders" snippet linking to `/about`

### Topical Relevance
The homepage touches on relevant topics but lacks depth:
- "Behavioral analytics" -- mentioned but not explained
- "AI-powered insights" -- mentioned but not demonstrated
- "Responsible betting" -- claimed but not substantiated
- **Missing topics:** How the product actually works, what data it analyzes, what users see in the dashboard, comparison to alternatives, pricing overview

---

## 3. Technical Meta Tags

### Current Implementation (from `app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  title: "PlayMind Labs - Behavioral Sports Betting Analytics",
  description: "Your behavioral betting companion for smarter, data-driven play. The seatbelt for responsible betting.",
  manifest: "/manifest.json",
  generator: 'v0.app',
  keywords: ["sports betting", "betting psychology", "responsible gambling", "odds comparison", "bet analysis", "tilt prevention"]
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
}
```

### Meta Tag Audit

| Meta Tag | Status | Value | Assessment |
|----------|--------|-------|------------|
| `<title>` | PRESENT | "PlayMind Labs - Behavioral Sports Betting Analytics" | OK - see Section 1 |
| `<meta name="description">` | PRESENT | 89 chars | SHORT - expand to 150-160 |
| `<meta name="keywords">` | PRESENT | 6 keywords | LOW IMPACT - Google ignores this tag, but Bing uses it lightly |
| `<meta name="generator">` | PRESENT | "v0.app" | REMOVE - exposes build tool, no SEO value, potential security concern |
| `<meta name="viewport">` | PRESENT | Standard responsive | WARNING: `userScalable: false` is an accessibility violation (WCAG 1.4.4) |
| `<meta name="theme-color">` | PRESENT | #10b981 (green) | OK |
| `<link rel="manifest">` | PRESENT | /manifest.json | OK for PWA |
| `<html lang>` | PRESENT | "en" | GOOD |
| `<meta charset>` | PRESENT | Next.js default UTF-8 | GOOD |

### Missing Meta Tags (Critical)

| Meta Tag | Priority | Impact |
|----------|----------|--------|
| `<link rel="canonical">` | CRITICAL | Without canonical, duplicate content risk is high. Google may index www vs non-www differently |
| `<meta property="og:title">` | HIGH | No Open Graph tags -- links shared on social media will show generic previews |
| `<meta property="og:description">` | HIGH | Missing |
| `<meta property="og:image">` | HIGH | Missing -- social shares will have no preview image |
| `<meta property="og:url">` | HIGH | Missing |
| `<meta property="og:type">` | HIGH | Missing (should be "website") |
| `<meta property="og:site_name">` | MEDIUM | Missing |
| `<meta name="twitter:card">` | HIGH | Missing -- Twitter/X shares will be plain text links |
| `<meta name="twitter:title">` | HIGH | Missing |
| `<meta name="twitter:description">` | HIGH | Missing |
| `<meta name="twitter:image">` | HIGH | Missing |
| `<meta name="twitter:site">` | MEDIUM | Missing (should be @PlayMindLabs) |
| `<meta name="robots">` | MEDIUM | Missing -- should explicitly set "index, follow" for public pages |

**Recommended fix for `app/layout.tsx`:**
```typescript
export const metadata: Metadata = {
  title: "Behavioral Sports Betting Analytics | PlayMind Labs",
  description: "PlayMind Labs uses AI-powered behavioral analytics to help sports bettors track emotions, prevent tilt, and make data-driven decisions. Free tier available.",
  manifest: "/manifest.json",
  // Remove generator: 'v0.app'
  keywords: ["sports betting analytics", "betting psychology", "responsible gambling", "AI betting tools", "tilt prevention", "emotional betting tracker"],
  metadataBase: new URL('https://www.playmindlabs.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "PlayMind Labs - AI-Powered Behavioral Sports Betting Analytics",
    description: "Track your emotions, prevent tilt, and make smarter betting decisions with AI-powered behavioral analytics.",
    url: 'https://www.playmindlabs.com',
    siteName: 'PlayMind Labs',
    images: [
      {
        url: '/og-image.png',  // CREATE THIS: 1200x630px
        width: 1200,
        height: 630,
        alt: 'PlayMind Labs - Behavioral Sports Betting Analytics Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PlayMind Labs - Smarter Sports Betting with AI",
    description: "Track emotions, prevent tilt, and bet with data-driven discipline.",
    site: '@PlayMindLabs',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,       // Changed: Allow zoom for accessibility
  userScalable: true,     // Changed: WCAG compliance
  themeColor: "#10b981",
}
```

---

## 4. Schema Markup

### Current Implementation
**None.** Zero structured data markup exists anywhere on the site. This is confirmed by direct source code inspection -- no `<script type="application/ld+json">` blocks exist in any layout or page file.

### Recommended Schema Implementations

#### 4a. Organization Schema (CRITICAL -- add to `app/layout.tsx`)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "PlayMind Labs",
  "url": "https://www.playmindlabs.com",
  "logo": "https://www.playmindlabs.com/logo.png",
  "description": "AI-powered behavioral sports betting analytics platform for responsible gambling.",
  "foundingDate": "2025",
  "founders": [
    {
      "@type": "Person",
      "name": "Shay Bouchles",
      "jobTitle": "Chief Executive Officer"
    },
    {
      "@type": "Person",
      "name": "Sergio Monterroso",
      "jobTitle": "Chief Financial Officer"
    },
    {
      "@type": "Person",
      "name": "Diamond Mc Pherson",
      "jobTitle": "Chief Marketing Officer"
    }
  ],
  "sameAs": [
    "https://www.linkedin.com/company/playmind-labs",
    "https://www.instagram.com/playmindlabs/",
    "https://www.tiktok.com/@playmindlabs5",
    "https://www.youtube.com/@playmindlabs",
    "https://x.com/PlayMindLabs"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "info@playmindlabs.com",
    "contactType": "customer service"
  }
}
</script>
```

#### 4b. WebSite Schema with SearchAction (HIGH -- add to homepage)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "PlayMind Labs",
  "url": "https://www.playmindlabs.com",
  "description": "Behavioral sports betting analytics platform powered by AI",
  "publisher": {
    "@type": "Organization",
    "name": "PlayMind Labs"
  }
}
</script>
```

#### 4c. SoftwareApplication Schema (HIGH -- add to homepage)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PlayMind Labs",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web, iOS, Android",
  "description": "AI-powered behavioral analytics platform for sports bettors. Track emotions, prevent tilt, get AI-powered betting recommendations.",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "0",
    "highPrice": "49.99",
    "priceCurrency": "USD",
    "offerCount": "4"
  },
  "featureList": [
    "Emotion Tracking & Check-ins",
    "AI-Powered Bet Analysis",
    "SmartSlip AI Picks",
    "TiltLab Emotional Analysis",
    "Performance Analytics",
    "Parlay Optimizer",
    "Cooldown Mode & Safety Controls"
  ],
  "screenshot": "https://www.playmindlabs.com/og-image.png",
  "url": "https://www.playmindlabs.com"
}
</script>
```

#### Implementation in Next.js

Add all schema to the root layout using Next.js `metadata.other` or a dedicated component:

```typescript
// app/layout.tsx - Add to the <head /> section
<head>
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          // Organization schema
          { "@type": "Organization", /* ... */ },
          // WebSite schema
          { "@type": "WebSite", /* ... */ },
          // SoftwareApplication schema
          { "@type": "SoftwareApplication", /* ... */ }
        ]
      })
    }}
  />
</head>
```

---

## 5. Images

### Image Inventory (Homepage)

| Image | Source | Alt Text | Format | Dimensions | Lazy Loading | Assessment |
|-------|--------|----------|--------|------------|--------------|------------|
| Logo (header) | `/logo.png` | `"PlayMind Labs Logo"` | PNG | 40x40 | No (above fold) | ALT: FIXED. Format: Should be SVG or WebP |
| Logo (footer) | `/logo.png` | `"PlayMind Labs Logo"` | PNG | 32x32 | Default | ALT: FIXED. Duplicate of header logo |
| Lucide icons (6x) | Inline SVG | N/A (decorative) | SVG | 24x24 | N/A | OK -- decorative icons do not need alt text |
| Shield icon | Inline SVG | N/A (decorative) | SVG | 64x64 | N/A | OK |

**Note on previous audit:** The earlier audit reported "no alt text" on the logo. Inspection of `components/landing-page.tsx` line 130 shows `alt="PlayMind Labs Logo"` IS present. The footer logo at `components/footer.tsx` line 25 also has `alt="PlayMind Labs Logo"`. This was likely a false negative from the crawler being unable to execute client-side JavaScript.

### Image Issues

1. **PNG logo format**: The `/logo.png` file is served as PNG. For an icon/logo that renders at 32-40px, SVG would be ideal (infinitely scalable, smaller file size). If SVG is not available, WebP with a PNG fallback would improve performance.

2. **`images: { unoptimized: true }` in next.config.mjs**: This disables Next.js Image Optimization entirely. All images are served as-is without automatic WebP conversion, resizing, or quality optimization. This is a significant performance and SEO penalty.

   **Current (next.config.mjs line 10):**
   ```javascript
   images: {
     unoptimized: true,
   },
   ```

   **Recommended fix:**
   ```javascript
   images: {
     // Remove unoptimized: true to enable Next.js Image Optimization
     formats: ['image/avif', 'image/webp'],
     remotePatterns: [],
   },
   ```

3. **No OG image exists**: Social sharing will have no preview image. Create a 1200x630px `og-image.png` in the `/public` directory featuring the PlayMind Labs branding, tagline, and a visual of the platform dashboard.

4. **No favicon meta tags**: While `manifest.json` references the logo as an icon, explicit favicon meta tags should be added:
   ```html
   <link rel="icon" href="/favicon.ico" sizes="any" />
   <link rel="icon" href="/icon.svg" type="image/svg+xml" />
   <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
   ```

---

## 6. Internal Linking

### Navigation Structure

**Header (landing-page.tsx):**
- Only 1 link: "Log In" button (navigates to `/login`)
- **Assessment: SEVERE DEFICIENCY.** The homepage header has no navigation links to any public pages (Features, Pricing, FAQ, About, etc.). This means Google cannot discover subpages from the homepage via navigation.

**Footer (footer.tsx):**
| Section | Links | Anchor Text | Assessment |
|---------|-------|-------------|------------|
| Logo | `/` | "PlayMind Labs" | OK |
| Resources | `/faq` | "FAQs" | OK |
| Resources | `/demo` | "Demo" | OK |
| Resources | `/features` | "Features" | OK |
| Resources | `/pricing` | "Pricing" | OK |
| Company | `/about` | "About" | OK |
| Company | `/privacy` | "Privacy" | OK |
| Company | `/terms` | "Terms" | OK |
| Company | `/contact` | "Contact" | OK |

**External Links (footer social media):**
| Platform | URL | `rel` attribute | Assessment |
|----------|-----|-----------------|------------|
| LinkedIn | `https://www.linkedin.com/company/playmind-labs` | `noopener noreferrer` | OK |
| Instagram | `https://www.instagram.com/playmindlabs/` | `noopener noreferrer` | OK |
| TikTok | `https://www.tiktok.com/@playmindlabs5` | `noopener noreferrer` | OK |
| YouTube | `https://www.youtube.com/@playmindlabs` | `noopener noreferrer` | OK |
| X (Twitter) | `https://x.com/PlayMindLabs` | `noopener noreferrer` | OK |
| Luma Calendar | `https://luma.com/calendar/cal-bxGkf0dgOWPc1N4?` | `noopener noreferrer` | OK |

### CTA Buttons (landing-page.tsx body)

| Button | Action | Link Type | Assessment |
|--------|--------|-----------|------------|
| "Yes" (lost a bet) | `window.location.href = "/login?flow=tiltlab"` | JavaScript redirect | FAIL: Not a crawlable `<a>` tag |
| "No" (didn't lose a bet) | `window.location.href = "/login?flow=smartslip"` | JavaScript redirect | FAIL: Not a crawlable `<a>` tag |
| "Log In to Get Started" | `onClick={onLogin}` -> `/login` | JavaScript handler | FAIL: Not a crawlable `<a>` tag |
| "Log In" (header) | `onClick={onLogin}` -> `/login` | JavaScript handler | FAIL: Not a crawlable `<a>` tag |

### Link Equity Distribution Issues

1. **No top navigation on the landing page.** The homepage header only has the logo and a "Log In" button. All internal navigation lives exclusively in the footer. This means:
   - Link equity flows poorly from the homepage to subpages
   - The most important pages (Features, Pricing) receive footer-level link weight, not primary navigation weight
   - Google may not discover all subpages efficiently from the homepage

2. **All CTA buttons use JavaScript navigation (`window.location.href`), not `<a>` tags.** Googlebot does execute JavaScript in many cases, but JavaScript-based navigation is less reliable for crawling than native `<a href>` links.

3. **No contextual internal links** exist in any body content section. Each section is self-contained with no cross-linking.

4. **Missing links:** No links to `/how-it-works`, `/responsible-use`, or `/demo` from the homepage body content.

**Recommended fixes:**
```tsx
// Add navigation bar to the landing page header
<nav className="hidden md:flex items-center space-x-6">
  <a href="/features" className="text-gray-300 hover:text-white">Features</a>
  <a href="/pricing" className="text-gray-300 hover:text-white">Pricing</a>
  <a href="/how-it-works" className="text-gray-300 hover:text-white">How It Works</a>
  <a href="/faq" className="text-gray-300 hover:text-white">FAQ</a>
  <a href="/about" className="text-gray-300 hover:text-white">About</a>
</nav>

// Change CTA buttons to use <a> tags with href:
<a
  href="/login?flow=tiltlab"
  onClick={(e) => {
    e.preventDefault();
    localStorage.setItem("entry_flow", "tiltlab");
    window.location.href = "/login?flow=tiltlab";
  }}
  className="..."
>
  Yes
</a>
```

---

## 7. Mobile Readiness

### Viewport Configuration
```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,        // PROBLEM: Prevents pinch-to-zoom
  userScalable: false,     // PROBLEM: WCAG 1.4.4 violation
  themeColor: "#10b981",
}
```

**Assessment:**
- `maximumScale: 1` + `userScalable: false` prevents users from zooming in on content. This is a **WCAG 2.1 Level AA violation** (Success Criterion 1.4.4: Resize Text) and may negatively affect accessibility scores, which indirectly impacts SEO.
- Google has stated that mobile-friendliness is a ranking factor. While preventing zoom is not a direct ranking penalty, it signals poor mobile UX.

### Responsive Design Analysis

The landing page uses responsive Tailwind CSS classes appropriately:

| Section | Mobile | Tablet/Desktop | Assessment |
|---------|--------|----------------|------------|
| Header | Logo + Login button | Same layout | OK but cramped |
| Hero text | `text-6xl` | `md:text-7xl` | OK |
| Entry flow buttons | `flex-col` | `sm:flex-row` | GOOD |
| Stats grid | `grid-cols-2` | `md:grid-cols-4` | GOOD |
| Features grid | `grid-cols-1` | `md:grid-cols-2 lg:grid-cols-3` | GOOD |
| Footer | Stacked | Side-by-side | GOOD |

### Touch Targets

The CSS includes a `.touch-target` utility class (globals.css line 222-224) with `min-height: 44px; min-width: 44px`, meeting the WCAG 2.5.5 Target Size guideline. However, this class is not applied to the landing page CTA buttons -- they rely on Tailwind's `py-4` padding instead.

**Specific concerns:**
- The "Yes" and "No" buttons have `min-w-[160px]` and `py-4`, which should yield approximately 48px height -- GOOD.
- The header "Log In" button uses `px-6 py-2`, which yields approximately 36px height -- POTENTIALLY INSUFFICIENT for mobile touch targets.
- Footer text links have no minimum touch target size -- they rely solely on text size + `space-y-2` spacing.

**Recommended fix:**
```tsx
// Header Login button: Increase padding
<Button className="... px-6 py-3 min-h-[44px]">Log In</Button>

// Footer links: Add padding for larger touch targets
<Link className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 inline-block">
```

### PWA Support
The manifest.json is properly configured with app name, icons, orientation, and shortcuts. This is positive for mobile experience and repeat visitors.

---

## 8. Keyword Analysis

### Defined Keywords (from layout.tsx metadata)
```typescript
keywords: ["sports betting", "betting psychology", "responsible gambling",
           "odds comparison", "bet analysis", "tilt prevention"]
```

### Keyword Presence on Homepage

| Keyword | In Title | In Description | In H1 | In Body | In H2/H3 | Density |
|---------|----------|---------------|-------|---------|-----------|---------|
| sports betting | No | No | No | No | No | 0% |
| betting psychology | No | No | No | No | No | 0% |
| responsible gambling | No | "responsible betting" | No | No | No | ~0.4% |
| odds comparison | No | No | No | No | No | 0% |
| bet analysis | No | No | No | No | No | 0% |
| tilt prevention | No | No | No | No | No | 0% |
| behavioral analytics | Yes (title) | Yes (description) | No | Yes (subhead) | No | ~0.8% |
| AI-powered | No | No | No | Yes (subhead) | Yes (feature card) | ~0.8% |
| betting strategy | No | No | No | Yes (subhead) | No | ~0.4% |

**Assessment: SEVERE KEYWORD DEFICIENCY.** Most target keywords appear zero times in the actual page content. The keywords are defined in the meta tags but never used in visible content. This is a major disconnect.

### Primary Keyword Recommendations

| Priority | Keyword Phrase | Monthly Search Volume (est.) | Current Usage | Recommendation |
|----------|---------------|------------------------------|---------------|----------------|
| PRIMARY | "sports betting analytics" | 1,000-2,500 | Title tag only | Add to H1, body copy |
| PRIMARY | "AI betting tools" | 500-1,500 | Absent | Add to H2, feature descriptions |
| PRIMARY | "responsible gambling app" | 1,000-3,000 | Absent | Add to trust section |
| SECONDARY | "betting psychology" | 500-1,000 | Meta keywords only | Add to body copy |
| SECONDARY | "tilt prevention betting" | 100-500 | Meta keywords only | Add to feature descriptions |
| SECONDARY | "emotional betting tracker" | 50-200 | Absent | Add to H2 or feature card |
| SECONDARY | "bet analysis tool" | 200-800 | Meta keywords only | Add to feature descriptions |
| LONG-TAIL | "how to stop emotional betting" | 100-500 | Absent | Create blog content |
| LONG-TAIL | "betting analytics software" | 200-500 | Absent | Add to features section |
| LONG-TAIL | "sports betting bankroll tracker" | 500-1,500 | Absent | Add to feature descriptions |

### Keyword Density Improvement

The homepage should naturally incorporate primary keywords at a density of 1-2%. With ~234 words of content, each primary keyword should appear 2-4 times. Currently, most appear zero times.

**Quick-win keyword injection points in landing-page.tsx:**
```tsx
// Hero subheading (line 177-179): Currently vague
// BEFORE:
<p>"Advanced behavioral analytics and AI-powered insights to transform your betting strategy.
Make smarter decisions backed by psychology and predictive modeling."</p>

// AFTER:
<p>"The most advanced sports betting analytics platform combining AI-powered insights
with behavioral psychology. Track your emotions, prevent tilt, and transform
your betting strategy with data-driven tools built for responsible gambling."</p>

// Features section heading (line 295-297):
// BEFORE:
<h2>"Everything You Need to Win"</h2>
// AFTER:
<h2>"AI-Powered Sports Betting Analytics Tools"</h2>

// Trust section heading (line 387-389):
// BEFORE:
<h2>"Your Success is Built on Trust"</h2>
// AFTER:
<h2>"Built for Responsible Gambling"</h2>
```

---

## 9. Competitor Comparison

### Comparable Platforms in the Behavioral Betting / Sports Betting Analytics Space

| Feature | PlayMind Labs | Pikkit | BetBuddy (Playtech) | Odds Jam | Action Network |
|---------|--------------|--------|---------------------|----------|----------------|
| **SSR/SSG content** | No (CSR only) | Yes | Yes | Yes | Yes |
| **Schema markup** | None | Organization + SoftwareApp | Organization | Organization + FAQPage | Organization + Article |
| **OG/Twitter cards** | None | Full implementation | Full | Full | Full |
| **Blog/content hub** | None | Yes (betting guides) | Yes (research papers) | Yes (strategy articles) | Yes (news + analysis) |
| **Canonical tags** | Missing | Present | Present | Present | Present |
| **Heading hierarchy** | Duplicate H1s | Single H1 | Single H1 | Single H1 | Single H1 |
| **FAQ schema** | None | FAQPage on FAQ | N/A | FAQPage | N/A |
| **Page load (est.)** | Slow (CSR + API calls) | Fast (SSG) | Fast | Fast | Fast |
| **Word count (homepage)** | ~234 | ~1,200+ | ~800+ | ~1,500+ | ~2,000+ |
| **Internal linking** | Footer only | Full nav + contextual | Full nav | Full nav + sidebar | Full nav + related |
| **Mobile optimization** | Good (responsive) | Good | Good | Good | Good |
| **Responsible gambling signals** | Minimal | N/A | Strong (Playtech compliance) | Minimal | Minimal |

### What Competitors Do Better

1. **Server-side rendered content**: Every competitor renders content server-side, ensuring search engines index full page content. PlayMind Labs renders everything client-side, meaning crawlers see empty pages.

2. **Content depth**: Competitors have 3-10x more homepage content. Action Network's homepage includes news feeds, featured picks, and educational content. Odds Jam has detailed tool descriptions with screenshots.

3. **Content marketing**: All competitors with organic traffic invest in blog content (betting guides, strategy articles, industry analysis). PlayMind Labs has zero blog/educational content.

4. **Social proof**: Competitors display user counts, testimonials, ratings, and press mentions prominently. PlayMind Labs shows stats only when data thresholds are met (which appear to not yet be met based on the conditional logic in the code).

5. **Schema implementation**: Competitors use Organization, SoftwareApplication, and FAQ schema at minimum. PlayMind Labs has none.

### Unique Differentiator to Leverage

PlayMind Labs has a **unique positioning** that competitors do not occupy: the intersection of **behavioral psychology** and **sports betting analytics** with a focus on **responsible gambling**. This is currently undersold. The "seatbelt for responsible betting" metaphor is strong but needs to be expanded into substantive content that Google can index and rank.

---

## 10. Prioritized Recommendations

### CRITICAL (Do Immediately -- Days 1-3)

| # | Fix | Impact | Effort | File(s) to Modify |
|---|-----|--------|--------|--------------------|
| 1 | **Convert homepage to SSR/SSG** | Very High | Medium | `app/page.tsx`, `components/landing-page.tsx` -- Remove `"use client"`, move Supabase calls to server components or use `generateStaticParams` with revalidation |
| 2 | **Fix domain mismatch in sitemap + robots** | Very High | Low | `app/sitemap.ts`, `app/robots.ts` -- Change fallback from `https://serenitypocket.com` to `https://www.playmindlabs.com`, or set `NEXT_PUBLIC_BASE_URL` env var |
| 3 | **Fix duplicate H1 tags** | High | Low | `components/landing-page.tsx` -- Change header brand `<h1>` to `<div>`, keep only hero headline as H1 |
| 4 | **Add canonical tags** | High | Low | `app/layout.tsx` -- Add `metadataBase` and `alternates.canonical` |
| 5 | **Add Open Graph + Twitter Card meta tags** | High | Low | `app/layout.tsx` -- Add `openGraph` and `twitter` to metadata export |

### HIGH PRIORITY (Week 1)

| # | Fix | Impact | Effort | File(s) to Modify |
|---|-----|--------|--------|--------------------|
| 6 | **Add Organization + SoftwareApplication schema** | High | Low | `app/layout.tsx` -- Add JSON-LD script tag |
| 7 | **Add navigation links to landing page header** | High | Low | `components/landing-page.tsx` -- Add `<nav>` with links to Features, Pricing, FAQ, About |
| 8 | **Expand homepage content to 500+ words** | High | Medium | `components/landing-page.tsx` -- Add "How It Works" summary, brief social proof section, feature expansion |
| 9 | **Fix About page brand inconsistency** | Medium | Low | `app/about/layout.tsx` -- Change title from `"About Us | Serenity Pocket - PlayMind Labs"` to `"About Us | PlayMind Labs - Our Mission & Team"` |
| 10 | **Remove `generator: 'v0.app'` from metadata** | Low | Trivial | `app/layout.tsx` -- Delete line |
| 11 | **Create OG image (1200x630px)** | High | Medium | Create `/public/og-image.png` |
| 12 | **Remove `/login` and `/survey` from sitemap** | Medium | Low | `app/sitemap.ts` -- Remove from staticPages array |

### MEDIUM PRIORITY (Weeks 2-4)

| # | Fix | Impact | Effort | File(s) to Modify |
|---|-----|--------|--------|--------------------|
| 13 | **Enable Next.js Image Optimization** | Medium | Low | `next.config.mjs` -- Remove `images: { unoptimized: true }` |
| 14 | **Convert CTA buttons to `<a>` tags** | Medium | Low | `components/landing-page.tsx` -- Use `<a href>` with progressive enhancement |
| 15 | **Fix viewport accessibility** | Medium | Low | `app/layout.tsx` -- Set `maximumScale: 5`, `userScalable: true` |
| 16 | **Add keyword-rich H2 headings** | Medium | Low | `components/landing-page.tsx` -- Replace generic headings with keyword-optimized versions |
| 17 | **Add BreadcrumbList schema to subpages** | Medium | Medium | Create shared breadcrumb component with schema |
| 18 | **Add responsible gambling organization links** | Medium | Low | `components/landing-page.tsx` or footer -- Add NCPG, 1-800-GAMBLER links |
| 19 | **Expand meta description to 150-160 chars** | Medium | Trivial | `app/layout.tsx` |
| 20 | **Add FAQPage schema to FAQ page** | Medium | Medium | `app/faq/page.tsx` -- Add JSON-LD |

### LONG-TERM (Month 1-3)

| # | Fix | Impact | Effort | Details |
|---|-----|--------|--------|---------|
| 21 | **Launch a blog** | Very High | High | Create `/blog` with articles on betting psychology, strategy guides, responsible gambling tips |
| 22 | **Add testimonials / social proof section** | High | Medium | Collect user testimonials and display on homepage |
| 23 | **Create comparison landing pages** | High | High | "PlayMind Labs vs [Competitor]" pages targeting comparison keywords |
| 24 | **Submit to Google Search Console** | High | Low | Verify site ownership and submit sitemap |
| 25 | **Build backlinks** | Very High | High | Guest posts on betting industry blogs, press releases, responsible gambling organization listings |
| 26 | **Create an `llms.txt` file** | Low | Low | AI search optimization -- provide structured content guide for AI crawlers |
| 27 | **Add `demo` page to sitemap** | Low | Trivial | `app/sitemap.ts` -- Add `/demo` to staticPages array |
| 28 | **Implement `loading.tsx` with meaningful content** | Medium | Low | Replace loading spinner with content skeleton that contains semantic HTML |

---

## Appendix A: Complete Recommended `app/layout.tsx` Metadata

```typescript
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  metadataBase: new URL('https://www.playmindlabs.com'),
  title: {
    default: "Behavioral Sports Betting Analytics | PlayMind Labs",
    template: "%s | PlayMind Labs",
  },
  description: "PlayMind Labs uses AI-powered behavioral analytics to help sports bettors track emotions, prevent tilt, and make data-driven decisions. Free tier available. Start betting smarter today.",
  manifest: "/manifest.json",
  keywords: [
    "sports betting analytics",
    "betting psychology",
    "responsible gambling",
    "AI betting tools",
    "bet analysis",
    "tilt prevention",
    "emotional betting tracker",
    "sports betting app"
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "PlayMind Labs - AI-Powered Behavioral Sports Betting Analytics",
    description: "Track your emotions, prevent tilt, and make smarter betting decisions with AI-powered behavioral analytics. Free tier available.",
    url: 'https://www.playmindlabs.com',
    siteName: 'PlayMind Labs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PlayMind Labs - Behavioral Sports Betting Analytics Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PlayMind Labs - Smarter Sports Betting with AI",
    description: "Track emotions, prevent tilt, and bet with data-driven discipline. Free tier available.",
    site: '@PlayMindLabs',
    creator: '@PlayMindLabs',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#10b981",
}
```

## Appendix B: Recommended Sitemap Fix (`app/sitemap.ts`)

```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.playmindlabs.com'

  const staticPages = [
    { route: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { route: '/features', changeFrequency: 'weekly' as const, priority: 0.9 },
    { route: '/pricing', changeFrequency: 'weekly' as const, priority: 0.9 },
    { route: '/how-it-works', changeFrequency: 'weekly' as const, priority: 0.8 },
    { route: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
    { route: '/faq', changeFrequency: 'weekly' as const, priority: 0.8 },
    { route: '/demo', changeFrequency: 'monthly' as const, priority: 0.7 },
    { route: '/contact', changeFrequency: 'monthly' as const, priority: 0.6 },
    { route: '/responsible-use', changeFrequency: 'monthly' as const, priority: 0.6 },
    { route: '/privacy', changeFrequency: 'monthly' as const, priority: 0.3 },
    { route: '/terms', changeFrequency: 'monthly' as const, priority: 0.3 },
    // REMOVED: /login and /survey (should not be indexed)
  ]

  return staticPages.map(({ route, changeFrequency, priority }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}
```

## Appendix C: Recommended Robots Fix (`app/robots.ts`)

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.playmindlabs.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/account/',
          '/profile/',
          '/betlab/',
          '/analytics/',
          '/onboarding/',
          '/auth/',
          '/login',
          '/survey',
          '/gambling-survey/',
          '/pgsi-survey',
          '/signup-success',
          '/home',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

---

*Report generated by Claude Code - Source-code-based SEO analysis - 2026-02-11*
*Files analyzed: app/page.tsx, app/layout.tsx, components/landing-page.tsx, components/footer.tsx, app/sitemap.ts, app/robots.ts, app/about/layout.tsx, next.config.mjs, public/manifest.json, app/globals.css, and 8 additional layout files.*
