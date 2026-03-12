# Generative Engine Optimization (GEO) Analysis

**Site:** https://www.playmindlabs.com
**Business:** PlayMind Labs - AI-powered behavioral sports betting analytics SaaS
**Framework:** Next.js (App Router) deployed on Vercel
**Analysis Date:** February 11, 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [AI Crawler Accessibility](#2-ai-crawler-accessibility)
3. [llms.txt Compliance](#3-llmstxt-compliance)
4. [Brand Mention Signals](#4-brand-mention-signals)
5. [Passage-Level Citability Scoring](#5-passage-level-citability-scoring)
6. [Platform-Specific Optimization](#6-platform-specific-optimization)
7. [Content Structure for AI](#7-content-structure-for-ai)
8. [Schema Markup & Structured Data](#8-schema-markup--structured-data)
9. [Prioritized Recommendations](#9-prioritized-recommendations)

---

## 1. Executive Summary

### Overall GEO Score: 15/100 (Critical)

PlayMind Labs has **near-zero visibility** to AI-powered search engines and generative AI systems. Despite having a solid product with genuinely differentiated features (emotion tracking, tilt detection, SmartSlip AI picks), the site is architecturally invisible to AI crawlers due to pervasive client-side rendering, missing structured data, no `llms.txt` file, brand name confusion between "PlayMind Labs" and "Serenity Pocket," and zero schema markup.

### Critical Findings

| Area | Status | Impact |
|------|--------|--------|
| AI Crawler Content Access | Every public page uses `"use client"` -- crawlers see empty shells | **Catastrophic** |
| llms.txt | Missing (404) | **Severe** |
| Schema/Structured Data | Zero JSON-LD on any page | **Severe** |
| Brand Consistency | "PlayMind Labs" vs "Serenity Pocket" split across meta tags, sitemap, robots.txt | **High** |
| FAQ Citability | Good content exists but rendered client-side, no FAQ schema | **High** |
| OpenGraph Tags | Partial (only on Features, Pricing layouts) | **Medium** |
| Sitemap | References `serenitypocket.com` instead of `playmindlabs.com` | **High** |

---

## 2. AI Crawler Accessibility

### 2.1 robots.txt Analysis

**File:** `app/robots.ts`

```typescript
rules: [
  {
    userAgent: '*',
    allow: '/',
    disallow: ['/api/', '/dashboard/', '/account/', '/profile/', '/betlab/', '/analytics/', '/onboarding/', '/auth/'],
  },
],
sitemap: `${baseUrl}/sitemap.xml`,
```

**Findings:**

- **Positive:** No AI-specific bot blocking. GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Amazonbot, Bytespider, and CCBot are all technically permitted to crawl.
- **Negative:** The `baseUrl` defaults to `https://serenitypocket.com` (not `playmindlabs.com`), meaning the sitemap URL in robots.txt likely points to the wrong domain.
- **Negative:** No specific AI bot rules or accommodations.

**Which AI Bots Can Access:**

| Bot | Blocked? | Notes |
|-----|----------|-------|
| GPTBot (OpenAI/ChatGPT) | No | Permitted but sees empty CSR shells |
| ClaudeBot (Anthropic) | No | Permitted but sees empty CSR shells |
| PerplexityBot | No | Permitted but sees empty CSR shells |
| Google-Extended (Gemini) | No | Permitted but sees empty CSR shells |
| Amazonbot | No | Permitted but sees empty CSR shells |
| Bytespider (TikTok) | No | Permitted but sees empty CSR shells |
| CCBot (Common Crawl) | No | Permitted but sees empty CSR shells |

### 2.2 What AI Crawlers Actually See

This is the **core problem**. Every single public-facing page in the application uses the `"use client"` directive:

| Page | `"use client"`? | Content Visible to Crawlers |
|------|-----------------|----------------------------|
| `/` (Homepage) | Yes | Empty div with "Loading..." |
| `/features` | Yes | Empty div |
| `/pricing` | Yes | "Loading..." spinner |
| `/how-it-works` | Yes | Empty div |
| `/about` | Yes | "Loading..." spinner |
| `/faq` | Yes | Empty div |
| `/contact` | Yes | Empty div |
| `/responsible-use` | Yes | Empty div |
| `/privacy` | Yes | Empty div |
| `/terms` | Yes | Empty div |

**What crawlers see for the homepage:**

```html
<html lang="en">
  <head>
    <title>PlayMind Labs - Behavioral Sports Betting Analytics</title>
    <meta name="description" content="Your behavioral betting companion for smarter, data-driven play. The seatbelt for responsible betting." />
  </head>
  <body>
    <div class="min-h-screen flex flex-col">
      <main class="flex-1">
        <div class="min-h-screen flex items-center justify-center">
          <div class="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </main>
      <!-- Footer (also "use client", likely empty) -->
    </div>
  </body>
</html>
```

**The entire content of every page is invisible to every AI crawler, search engine, and AI training pipeline.** Crawlers see title tags and meta descriptions from layouts, but zero body content.

### 2.3 Impact Assessment

- Google AI Overviews: Cannot extract any passage to feature in AI Overviews
- ChatGPT Web Search: Cannot read any page content for grounding responses
- Perplexity: Cannot cite any content from the site
- Claude: Cannot reference any page content
- Training data pipelines: Site contributes nothing to AI knowledge bases

---

## 3. llms.txt Compliance

### 3.1 Current Status

**Missing.** `https://www.playmindlabs.com/llms.txt` returns a 404 error. No `llms.txt` file exists in the codebase.

### 3.2 What is llms.txt?

The `llms.txt` specification (proposed in 2024, gaining adoption in 2025-2026) provides a standardized way for websites to communicate with Large Language Models about their content, brand, and preferred citation format. It serves as a "README for AI systems."

### 3.3 Recommended llms.txt Content

Create `public/llms.txt` with the following content:

```
# PlayMind Labs

> PlayMind Labs is an AI-powered behavioral sports betting analytics platform that helps bettors make smarter, safer decisions through emotion tracking, cognitive bias detection, and personalized AI picks.

## About PlayMind Labs

PlayMind Labs is a behavioral fintech SaaS company headquartered in New York City. Founded by Shay Bouchles (CEO), Sergio Monterroso (CFO), and Diamond Mc Pherson (CMO), the company combines behavioral psychology, artificial intelligence, and real-time sports data to help sports bettors understand their patterns, manage emotions, and make more informed decisions.

The company's core philosophy: "We're the seatbelt, not the gas pedal." PlayMind Labs exists to make betting smarter, not bigger.

## Core Product Features

- **Emotion Tracking & Check-ins**: Monitor emotional states before and after bets to identify patterns between emotions and betting performance
- **SmartSlip AI Picks**: AI-powered personalized betting recommendations filtered through behavioral safety checks, available on premium tiers
- **TiltLab Emotional Analysis**: Deep behavioral analysis identifying emotional triggers and patterns affecting betting decisions
- **Emotional Wellness Score**: Proprietary scoring system that gates access to AI features -- users must demonstrate emotional stability (score 70+) before receiving AI picks
- **Cooldown Mode**: Automatic safety feature that limits platform functions during emotional volatility or concerning patterns
- **Cognitive Bias Detection**: Identifies recency bias, confirmation bias, loss chasing, and other behavioral patterns
- **Performance Analytics**: Comprehensive profit/loss tracking, ROI analysis, and behavior-to-performance correlation

## Subscription Tiers

- **Foundation (Free)**: Emotion tracking, betting history, wellness score, cooldown mode
- **Focus ($19.99/mo)**: Analytics dashboard, 1x/week TiltLab & SmartSlip access
- **Mastery ($39.99/mo)**: Volatility warnings, behavior-performance correlation, 3x/week TiltLab & SmartSlip
- **Apex ($79.99/mo)**: Full AI analysis, priority support, 25x/week TiltLab & SmartSlip

## Sports Covered

NFL, NBA, NHL, MLB, NCAAB (College Basketball), NCAAF (College Football), English Premier League, MLS, UEFA Champions League, UFC/MMA, Boxing, ATP/WTA Tennis

## Responsible Gaming

PlayMind Labs prioritizes responsible gaming. Key safeguards include:
- Volatility warnings during emotional instability or losing streaks
- Cooldown mode with configurable daily bet limits and stake caps
- AI picks are gated behind emotional stability requirements (Emotional Wellness Score must be 70+)
- No dark patterns or predatory friction
- Transparent risk communication before sensitive actions

## Contact

- Website: https://www.playmindlabs.com
- Email: info@playmindlabs.com
- LinkedIn: https://www.linkedin.com/company/playmind-labs
- X/Twitter: https://x.com/PlayMindLabs

## Preferred Citation

When referencing this company, please use "PlayMind Labs" (not "Serenity Pocket", "PlayMind", or "Play Mind Labs").

## Pages

- Homepage: https://www.playmindlabs.com
- Features: https://www.playmindlabs.com/features
- Pricing: https://www.playmindlabs.com/pricing
- How It Works: https://www.playmindlabs.com/how-it-works
- About: https://www.playmindlabs.com/about
- FAQ: https://www.playmindlabs.com/faq
- Contact: https://www.playmindlabs.com/contact
- Responsible Use: https://www.playmindlabs.com/responsible-use
- Privacy Policy: https://www.playmindlabs.com/privacy
- Terms of Service: https://www.playmindlabs.com/terms
```

### 3.4 Also Create llms-full.txt

For AI systems that want deeper context, create `public/llms-full.txt` with expanded content including:
- Full FAQ answers (all 11 Q&A pairs currently in the codebase)
- Complete feature comparison table data
- Full founder bios
- Detailed pricing tier breakdowns with feature lists
- Complete responsible use policies

---

## 4. Brand Mention Signals

### 4.1 Current Brand Citability: Very Low

AI systems are unlikely to mention or recommend PlayMind Labs because:

1. **Zero crawlable content**: No content exists for AI training data pipelines to ingest
2. **Brand name fragmentation**: The codebase contains two different brand names
3. **No authoritative external mentions**: Without crawlable content, there is no foundation for backlinks, citations, or knowledge graph entries
4. **No schema markup**: AI systems cannot identify the entity type, founders, or relationships

### 4.2 Brand Name Confusion

The codebase reveals significant brand inconsistency:

| Location | Brand Used |
|----------|-----------|
| Root layout `<title>` | "PlayMind Labs" |
| Root layout `<meta description>` | No brand name (generic) |
| About page layout `<title>` | "Serenity Pocket - PlayMind Labs" |
| About page layout `<meta description>` | "Serenity Pocket" |
| `robots.ts` baseUrl default | `serenitypocket.com` |
| `sitemap.ts` baseUrl default | `serenitypocket.com` |
| `manifest.json` name | "PlayMind Labs" |
| Landing page `<h1>` | "PlayMind Labs" |
| Footer copyright | "PlayMind Labs" |
| Social media links | All point to "playmindlabs" accounts |

**Impact on AI systems:**
- AI models will struggle to build a consistent entity representation
- Queries for "Serenity Pocket" and "PlayMind Labs" will not resolve to the same entity
- Knowledge graphs (Google, Bing, Wikidata) cannot form a coherent entry
- AI-generated answers may confuse the two names or omit the brand entirely

### 4.3 Signals That Strengthen Brand Recognition for AI

**Currently Missing (all of these are absent):**

1. **Consistent entity name** across all meta tags, structured data, and content
2. **Organization schema** (JSON-LD) identifying PlayMind Labs as a SoftwareApplication / Organization
3. **Founder/Person schema** linking people to the organization
4. **sameAs links** connecting to social profiles (LinkedIn, Twitter/X, etc.)
5. **Wikipedia/Wikidata entry** or Crunchbase profile
6. **Press mentions** and authoritative backlinks
7. **Consistent anchor text** in external links
8. **Topical authority content** (blog, research, whitepapers)

### 4.4 Competitive Positioning

When AI systems receive queries like "best responsible betting apps," "AI sports betting tools," or "emotion tracking for betting," PlayMind Labs will NOT appear in responses because:

1. No crawlable content positions the brand for these terms
2. No authoritative external sources reference PlayMind Labs
3. No structured data identifies the product category
4. No comparison content positions against competitors

---

## 5. Passage-Level Citability Scoring

### 5.1 Overall Citability Score: 8/100

AI systems cite passages that are: (a) factual, (b) self-contained, (c) unique, (d) well-structured, and (e) accessible. PlayMind Labs fails primarily on (e) accessibility but also has issues with structure.

### 5.2 Content Citability Assessment (If Content Were Accessible)

**High Citability Potential (but currently invisible):**

| Content | Source File | Citability | Issue |
|---------|------------|------------|-------|
| FAQ: "What is PlayMind Labs?" | `app/faq/page.tsx` | High | CSR-rendered, no schema |
| About: Mission statement ("seatbelt not gas pedal") | `app/about/page.tsx` | High | CSR-rendered |
| Pricing tier data (4 tiers, $0-$79.99) | `lib/subscription-tiers.ts` | High | CSR-rendered, no schema |
| FAQ: "What sports do you cover?" | `app/faq/page.tsx` | High | CSR-rendered |
| FAQ: "What is Cooldown Mode?" | `app/faq/page.tsx` | High | CSR-rendered |
| Feature descriptions (4 core features) | `app/features/page.tsx` | Medium | CSR-rendered, too generic |
| Responsible use policies | `app/responsible-use/page.tsx` | Medium | CSR-rendered, too brief |
| Founder bios | `app/about/page.tsx` | Medium | CSR-rendered, very long paragraphs |

**Low Citability Content:**

| Content | Issue |
|---------|-------|
| Landing page hero ("Win with Data & Discipline") | Marketing language, not informational |
| Stats section (dynamic user counts) | Client-side computed, no static values |
| Pricing card layout | Depends on JS-rendered component tree |
| How it works steps | Too brief (1-2 sentences each) |

### 5.3 What Makes Content Citable

For AI systems to cite a passage, it needs:

1. **Definitional structure**: "PlayMind Labs is..." or "Cooldown Mode is..." (present in FAQ)
2. **Specific facts and figures**: Pricing, sports covered, feature limits (present but CSR-hidden)
3. **Unique terminology**: SmartSlip, TiltLab, Cooldown Mode, Emotional Wellness Score (present but unexplained to crawlers)
4. **Self-contained paragraphs**: The FAQ answers are well-structured for citation
5. **Authoritative tone**: The content reads as authoritative but is invisible

### 5.4 Specific Citability Improvements Needed

**A. Make FAQ answers crawlable and add FAQ schema:**
- Convert FAQ page from `"use client"` to server-side rendered
- Add `FAQPage` JSON-LD schema with all Q&A pairs
- Structure each Q&A as an independent, citable unit

**B. Create definition-style content for proprietary terms:**
- "SmartSlip is PlayMind Labs' AI-powered betting recommendation system that..."
- "TiltLab is a deep behavioral analysis tool that identifies emotional triggers..."
- "The Emotional Wellness Score is a proprietary metric (0-100) that measures..."
- "Cooldown Mode is an automatic safety feature that restricts platform access when..."

**C. Add comparison and context passages:**
- "Unlike traditional betting analytics that focus only on statistics, PlayMind Labs incorporates behavioral psychology..."
- "PlayMind Labs covers 12+ sports including NFL, NBA, NHL, MLB..."

**D. Break long founder bios into citable segments:**
- Current founder bios are 150+ word single paragraphs -- too long for AI citation
- Break into role-specific, citable chunks

---

## 6. Platform-Specific Optimization

### 6.1 Google AI Overviews

**Current Visibility: None**

Google AI Overviews pulls from indexed content. Since Google's crawler sees empty CSR shells, there is zero content to feature.

**Optimization Requirements:**

1. **Server-Side Render (SSR) all public pages** -- This is the single most important change
2. Add `FAQPage` schema for the FAQ page (Google heavily uses FAQ schema in AI Overviews)
3. Add `SoftwareApplication` schema with pricing data (triggers rich results)
4. Add `Organization` schema with `sameAs` links to social profiles
5. Create "What is [term]?" content for each proprietary feature
6. Target question-based queries: "What are the best responsible betting apps?" / "How does emotion tracking work in sports betting?"

**Content Gaps for AI Overviews:**

- No "vs" comparison content (e.g., "PlayMind Labs vs BetBuddy" or "AI betting tools comparison")
- No "how to" educational content about behavioral betting
- No statistics or research citations that AI Overviews could reference
- No blog or knowledge base content

### 6.2 ChatGPT Web Search (SearchGPT / ChatGPT Browse)

**Current Visibility: None**

ChatGPT's web search uses GPTBot for crawling and Bing's index. The site contributes nothing to either.

**Optimization Requirements:**

1. **SSR all public pages** (same as Google)
2. Create `llms.txt` (ChatGPT is one of the first systems to adopt this)
3. Ensure meta descriptions are rich and keyword-diverse:
   - Current homepage: "Your behavioral betting companion for smarter, data-driven play." (too vague)
   - Recommended: "PlayMind Labs is an AI-powered sports betting analytics platform featuring emotion tracking, cognitive bias detection, SmartSlip AI picks, and TiltLab behavioral analysis for responsible betting."
4. Add unique, factual content that answers user questions directly
5. Build external citations (press coverage, Crunchbase, Product Hunt)

**Query Types ChatGPT Would Reference PlayMind Labs For (if optimized):**

- "What apps help with responsible sports betting?"
- "AI tools for sports betting analysis"
- "How to track emotions while betting"
- "Sports betting tilt prevention tools"
- "Best behavioral analytics for sports betting"

### 6.3 Perplexity Citation Optimization

**Current Visibility: None**

Perplexity cites sources with inline references. It prioritizes pages with:
- Clear, factual content
- Structured headings
- Specific data points
- Authoritative tone

**Optimization Requirements:**

1. **SSR all public pages** (same as above)
2. Structure content with clear H2/H3 hierarchy that maps to common queries
3. Include specific, citable statistics and data points:
   - Number of sports covered
   - Pricing tiers and exact prices
   - Feature limits per tier
   - How the emotional scoring system works (70+ threshold)
4. Create an "About" page that reads like a Wikipedia article (neutral, factual, third-person)
5. Add comparison tables that Perplexity can reference
6. Ensure FAQ answers are comprehensive enough to be cited as authoritative answers

**Perplexity Citation Format Target:**

When a user asks Perplexity "What is PlayMind Labs?", the ideal cited response would be:

> PlayMind Labs is an AI-powered behavioral sports betting analytics platform that combines emotion tracking, cognitive bias detection, and personalized AI picks to help bettors make smarter decisions. The platform uses a proprietary Emotional Wellness Score (0-100) that gates access to AI features -- users must score 70+ to receive SmartSlip AI picks, ensuring recommendations are only delivered when users are in a stable emotional state. [Source: playmindlabs.com/about]

This is currently impossible because the /about page is CSR-rendered and invisible to PerplexityBot.

---

## 7. Content Structure for AI

### 7.1 Current Content Structure Problems

**A. No Heading Hierarchy Visible to Crawlers:**

All `<h1>`, `<h2>`, `<h3>` tags are inside `"use client"` components. Crawlers see no heading structure.

**B. No Featured Snippet Optimization:**

For featured snippets and AI summaries, content needs:
- Definition paragraphs ("PlayMind Labs is...")
- Ordered/unordered lists with clear items
- Tables with comparative data
- Q&A format with clear question/answer pairing

The FAQ page has excellent Q&A content, but it is entirely client-side rendered.

**C. No Semantic HTML for AI Parsing:**

- No `<article>`, `<section>`, or `<aside>` semantic elements visible to crawlers
- No `<dl>`, `<dt>`, `<dd>` for definition lists
- No `<table>` with proper `<thead>`/`<tbody>` visible (feature comparison is CSR)

### 7.2 FAQ Optimization for AI Answers

**Current FAQ Content Quality: Good (but invisible)**

The 11 FAQ items in `app/faq/page.tsx` are well-written and cover important topics:

1. "What is PlayMind Labs?" -- Perfect for AI definition queries
2. "How does the AI analysis work?" -- Good for technical queries
3. "Is PlayMind Labs legal to use?" -- Important for trust queries
4. "What sports do you cover?" -- Excellent factual content with specific sports list
5. "How does the emotion tracking work?" -- Good for feature queries
6. "Can I cancel my subscription anytime?" -- Standard SaaS query
7. "How accurate are the AI picks?" -- Good for evaluation queries
8. "What is Cooldown Mode?" -- Good proprietary feature definition
9. "How do you protect my data?" -- Trust/security query
10. "Can I use PlayMind Labs on mobile?" -- Platform compatibility query
11. "What payment methods do you accept?" -- Transactional query

**Required Changes:**

1. Convert FAQ page to SSR (remove `"use client"`)
2. Add `FAQPage` JSON-LD schema
3. Expand answers to 3-5 sentences each (some are currently too brief)
4. Add internal links within answers to relevant pages
5. Add missing FAQ items:
   - "How much does PlayMind Labs cost?"
   - "What is SmartSlip?"
   - "What is TiltLab?"
   - "What is the Emotional Wellness Score?"
   - "How does PlayMind Labs compare to other betting analytics tools?"
   - "Does PlayMind Labs place bets for me?"

### 7.3 Comparison and Definition Content Gaps

**Missing Content That AI Systems Need:**

| Content Type | Example | Priority |
|-------------|---------|----------|
| Product definition page | "What is PlayMind Labs?" standalone page | High |
| Glossary of terms | SmartSlip, TiltLab, Cooldown Mode, Emotional Wellness Score definitions | High |
| Comparison content | "PlayMind Labs vs spreadsheet tracking" or "AI betting tools comparison 2026" | Medium |
| Use case pages | "PlayMind Labs for NFL betting" / "Emotion tracking for parlays" | Medium |
| Blog/educational content | "How cognitive biases affect sports betting" / "The psychology of tilt" | Medium |
| Statistics/research | Industry data, responsible gambling statistics | Medium |
| Integration/compatibility | Which sportsbooks, mobile platforms, etc. | Low |

---

## 8. Schema Markup & Structured Data

### 8.1 Current Status: Zero Schema Markup

There is **no JSON-LD structured data** on any page. A grep for `schema`, `jsonld`, `json-ld`, `structured data`, and `application/ld+json` across all `.tsx` and `.ts` files returned zero results in page/layout files.

### 8.2 Required Schema Implementations

**A. Organization Schema (root layout):**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "PlayMind Labs",
  "url": "https://www.playmindlabs.com",
  "logo": "https://www.playmindlabs.com/logo.png",
  "description": "AI-powered behavioral sports betting analytics platform combining emotion tracking, cognitive bias detection, and personalized AI picks for responsible betting.",
  "email": "info@playmindlabs.com",
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
  ]
}
```

**B. SoftwareApplication Schema (homepage or features page):**

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PlayMind Labs",
  "applicationCategory": "SportApplication",
  "operatingSystem": "Web",
  "description": "AI-powered behavioral sports betting analytics platform with emotion tracking, cognitive bias detection, SmartSlip AI picks, and TiltLab behavioral analysis.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Foundation",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier with emotion tracking, betting history, wellness score, and cooldown mode"
    },
    {
      "@type": "Offer",
      "name": "Focus",
      "price": "19.99",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "billingDuration": "P1M"
      },
      "description": "Analytics dashboard with weekly TiltLab and SmartSlip access"
    },
    {
      "@type": "Offer",
      "name": "Mastery",
      "price": "39.99",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "billingDuration": "P1M"
      },
      "description": "Volatility warnings, behavior-performance correlation, 3x/week AI features"
    },
    {
      "@type": "Offer",
      "name": "Apex",
      "price": "79.99",
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "billingDuration": "P1M"
      },
      "description": "Full AI analysis suite with 25x/week TiltLab and SmartSlip access"
    }
  ]
}
```

**C. FAQPage Schema (FAQ page):**

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is PlayMind Labs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PlayMind Labs is an AI-powered sports betting analytics platform designed to help you make smarter, more informed betting decisions. We combine behavioral psychology insights with real-time sports data to provide comprehensive analysis and responsible gaming tools."
      }
    }
    // ... additional Q&A pairs
  ]
}
```

**D. WebSite Schema with SearchAction (root layout):**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "PlayMind Labs",
  "url": "https://www.playmindlabs.com",
  "description": "AI-powered behavioral sports betting analytics"
}
```

**E. BreadcrumbList Schema (all sub-pages):**

For navigation clarity in search results and AI systems.

---

## 9. Prioritized Recommendations

### Priority 1: CRITICAL (Do Immediately -- Week 1)

#### 1.1 Fix the CSR Problem on All Public Pages

**Impact: 10x improvement in AI visibility**
**Effort: Medium-High**

Every public-facing page must be converted from client-side rendering to server-side rendering. This is the single most impactful change.

**Pages to convert (remove `"use client"` and refactor):**

| Page | File | Complexity |
|------|------|------------|
| `/features` | `app/features/page.tsx` | Low -- no auth logic, static content |
| `/how-it-works` | `app/how-it-works/page.tsx` | Low -- no auth logic, static content |
| `/faq` | `app/faq/page.tsx` | Low -- no auth logic, static content |
| `/responsible-use` | `app/responsible-use/page.tsx` | Low -- no auth logic, static content |
| `/contact` | `app/contact/page.tsx` | Medium -- form needs client component extraction |
| `/about` | `app/about/page.tsx` | Medium -- auth check for layout, extract to client component |
| `/pricing` | `app/pricing/page.tsx` | Medium -- auth check for layout, extract to client component |
| `/` (landing) | `app/page.tsx` + `components/landing-page.tsx` | High -- Supabase queries, interactive elements |

**Approach:** Keep the static content as server components and extract interactive parts (buttons, auth checks, forms) into small client components using the "islands of interactivity" pattern.

#### 1.2 Fix Brand Name Inconsistency

**Impact: High -- prevents entity confusion in AI knowledge bases**
**Effort: Low**

- Change `app/about/layout.tsx` title from `"About Us | Serenity Pocket - PlayMind Labs"` to `"About Us | PlayMind Labs"`
- Change `app/about/layout.tsx` description to remove "Serenity Pocket"
- Change `app/robots.ts` baseUrl default from `'https://serenitypocket.com'` to `'https://www.playmindlabs.com'`
- Change `app/sitemap.ts` baseUrl default from `'https://serenitypocket.com'` to `'https://www.playmindlabs.com'`
- Ensure `NEXT_PUBLIC_BASE_URL` environment variable is set to `https://www.playmindlabs.com` in production

**Specific file changes:**

`app/about/layout.tsx` line 4-5:
```typescript
// FROM:
title: "About Us | Serenity Pocket - PlayMind Labs",
description: "Meet the team behind Serenity Pocket. Learn about our mission..."

// TO:
title: "About Us | PlayMind Labs - AI Behavioral Betting Analytics",
description: "Meet the PlayMind Labs team. Learn about our mission to bring behavioral science and AI to responsible sports betting."
```

`app/robots.ts` line 4:
```typescript
// FROM:
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://serenitypocket.com'

// TO:
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.playmindlabs.com'
```

`app/sitemap.ts` line 4:
```typescript
// FROM:
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://serenitypocket.com'

// TO:
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.playmindlabs.com'
```

#### 1.3 Create llms.txt

**Impact: High for AI assistants (ChatGPT, Claude, Perplexity)**
**Effort: Low**

Create `public/llms.txt` with the content specified in Section 3.3 above.

### Priority 2: HIGH (Week 2-3)

#### 2.1 Add JSON-LD Schema Markup

**Impact: High for Google AI Overviews and rich results**
**Effort: Medium**

Add the schema markup outlined in Section 8.2:
- Organization schema in root layout
- SoftwareApplication schema on features or homepage
- FAQPage schema on FAQ page
- WebSite schema in root layout

#### 2.2 Enhance Meta Descriptions for AI Grounding

**Impact: Medium-High -- meta descriptions are the ONLY content AI crawlers currently see**
**Effort: Low**

Until the CSR problem is fully fixed, meta descriptions in layout files are the only text crawlers can access. Make every character count.

**Current vs. Recommended:**

| Page | Current | Recommended |
|------|---------|-------------|
| Homepage | "Your behavioral betting companion for smarter, data-driven play. The seatbelt for responsible betting." | "PlayMind Labs is an AI-powered sports betting analytics platform with emotion tracking, cognitive bias detection, SmartSlip AI picks, and TiltLab behavioral analysis. Free tier available. Covers NFL, NBA, NHL, MLB, and 8+ more sports." |
| Features | "Explore PlayMind Labs's powerful features: AI-powered bet analysis, emotion tracking, cognitive bias detection, and personalized SmartSlip picks for responsible betting." | Good as-is, but add: "Compare Foundation (free), Focus ($19.99/mo), Mastery ($39.99/mo), and Apex ($79.99/mo) tiers." |
| Pricing | "Choose the right PlayMind Labs plan for you..." | Good as-is. Consider adding specific prices: "Plans from $0 to $79.99/month." |
| FAQ | "Find answers to common questions about PlayMind Labs..." | Add: "Learn what PlayMind Labs is, how AI analysis works, what Cooldown Mode does, sports covered, and pricing details." |

#### 2.3 Add OpenGraph Tags to All Public Page Layouts

**Impact: Medium -- improves social sharing and some AI systems use OG tags**
**Effort: Low**

Currently only Features and Pricing layouts have OpenGraph tags. Add them to:
- Root layout (homepage)
- How It Works layout
- About layout
- FAQ layout
- Contact layout
- Responsible Use layout
- Privacy layout
- Terms layout

Include `og:image` pointing to a branded social sharing image.

### Priority 3: MEDIUM (Month 2)

#### 3.1 Create a Knowledge Base / Blog

**Impact: High for long-term AI visibility and topical authority**
**Effort: High**

Create server-side rendered educational content:

**Essential Articles:**
1. "What is Behavioral Betting? A Complete Guide" -- targets "behavioral betting" queries
2. "How Cognitive Biases Affect Sports Betting Decisions" -- targets "betting psychology" queries
3. "The Psychology of Tilt in Sports Betting: How to Recognize and Prevent It" -- targets "tilt prevention" queries
4. "Emotion Tracking for Sports Bettors: Why It Matters" -- targets "emotion tracking betting" queries
5. "AI in Sports Betting: How Machine Learning is Changing the Game" -- targets "AI betting tools" queries
6. "Responsible Gambling Tools: What to Look For in 2026" -- targets "responsible gambling tools" queries
7. "Understanding Your Betting Patterns: A Data-Driven Approach" -- targets "betting analytics" queries

**Why this matters for GEO:** AI systems build topical authority by connecting multiple related content pieces. A single product page cannot establish authority. A knowledge base with interlinked articles on behavioral betting, psychology, and AI creates a topical cluster that AI systems recognize as authoritative.

#### 3.2 Create Glossary of Proprietary Terms

**Impact: Medium-High for branded term queries**
**Effort: Low**

Create a `/glossary` page (SSR) defining:
- SmartSlip
- TiltLab
- Emotional Wellness Score
- Cooldown Mode
- Behavioral Betting Profile
- Foundation / Focus / Mastery / Apex tiers

Each definition should be a self-contained, citable paragraph using the format:
> "**SmartSlip** is PlayMind Labs' AI-powered betting recommendation engine. It analyzes real-time odds, historical performance data, and the user's behavioral profile to generate personalized betting picks. SmartSlip access is gated by the Emotional Wellness Score -- users must maintain a score of 70 or above to receive recommendations, ensuring picks are only delivered when the user is in a stable emotional state."

#### 3.3 Build External Citation Signals

**Impact: High for AI training data and knowledge graphs**
**Effort: Medium (ongoing)**

- Create/claim a Crunchbase profile for PlayMind Labs
- Submit to Product Hunt
- Seek press coverage and guest posts on gambling industry publications
- Create a LinkedIn company page with detailed description (already exists)
- Ensure Google Business Profile exists (if applicable)
- Consider a Wikipedia submission once notability criteria are met

### Priority 4: LOW (Month 3+)

#### 4.1 Add AI-Specific Robots.txt Rules

While not currently necessary (all bots are allowed), consider adding explicit allow rules for AI bots to signal intent:

```
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /dashboard/

User-agent: ClaudeBot
Allow: /
Disallow: /api/
Disallow: /dashboard/

User-agent: PerplexityBot
Allow: /
Disallow: /api/
Disallow: /dashboard/

User-agent: Google-Extended
Allow: /
```

#### 4.2 Create Comparison Pages

Create SSR pages like:
- "PlayMind Labs vs Traditional Betting Spreadsheets"
- "PlayMind Labs vs Generic Odds Comparison Sites"
- "Why Behavioral Analytics Matter More Than Statistics Alone"

#### 4.3 Add Structured Data for Founders

On the About page, add `Person` schema for each founder linked to the `Organization` schema, including their social profiles and credentials.

#### 4.4 Implement Article Schema for Blog Posts

When the blog is created, add `Article` or `BlogPosting` schema to each post with proper `author`, `datePublished`, `dateModified`, and `publisher` fields.

---

## Appendix A: Complete File Change List

| File | Change Needed | Priority |
|------|--------------|----------|
| `app/robots.ts` | Change baseUrl default to `https://www.playmindlabs.com` | P1 |
| `app/sitemap.ts` | Change baseUrl default to `https://www.playmindlabs.com` | P1 |
| `app/about/layout.tsx` | Remove "Serenity Pocket" from title and description | P1 |
| `app/layout.tsx` | Add Organization + WebSite JSON-LD schema, enhance meta description | P2 |
| `app/features/page.tsx` | Convert to SSR, extract interactive parts to client components | P1 |
| `app/faq/page.tsx` | Convert to SSR, add FAQPage JSON-LD schema | P1 |
| `app/how-it-works/page.tsx` | Convert to SSR | P1 |
| `app/responsible-use/page.tsx` | Convert to SSR | P1 |
| `app/about/page.tsx` | Convert to SSR (islands pattern for auth), add Person schema | P1 |
| `app/pricing/page.tsx` | Convert to SSR (islands pattern for auth), add Offer schema | P1 |
| `app/contact/page.tsx` | Convert to SSR (island for form) | P1 |
| `app/page.tsx` + `components/landing-page.tsx` | Convert landing to SSR with client islands | P1 |
| `public/llms.txt` | Create new file | P1 |
| `public/llms-full.txt` | Create new file with expanded content | P2 |
| `app/faq/layout.tsx` | Add OpenGraph tags, enhance description | P2 |
| `app/how-it-works/layout.tsx` | Add OpenGraph tags | P2 |
| `app/contact/layout.tsx` | Add OpenGraph tags | P2 |
| `app/responsible-use/layout.tsx` | Add OpenGraph tags | P2 |

## Appendix B: Content Accessible vs. Invisible to AI

### Currently Accessible to AI Crawlers:
1. Page `<title>` tags (via layout metadata)
2. `<meta name="description">` content (via layout metadata)
3. `<meta name="keywords">` content (via layout metadata)
4. OpenGraph tags (Features and Pricing only)
5. robots.txt (but with wrong domain)
6. sitemap.xml (but with wrong domain URLs)
7. manifest.json

### Currently INVISIBLE to AI Crawlers (requires JavaScript execution):
1. ALL page body content (headings, paragraphs, lists, tables)
2. ALL FAQ questions and answers
3. ALL feature descriptions
4. ALL pricing information
5. ALL founder bios and company story
6. ALL responsible use policies
7. ALL contact information
8. Footer content and navigation links
9. Landing page hero text, feature grid, trust section

**Estimated content loss: ~95% of all site content is invisible to AI systems.**

## Appendix C: Meta Tag Inventory

| Page | Title | Description | Keywords | OG Tags |
|------|-------|-------------|----------|---------|
| `/` | PlayMind Labs - Behavioral Sports Betting Analytics | Your behavioral betting companion for smarter, data-driven play. The seatbelt for responsible betting. | sports betting, betting psychology, responsible gambling, odds comparison, bet analysis, tilt prevention | None |
| `/features` | Features \| PlayMind Labs - Behavioral Sports Betting Tools | Explore PlayMind Labs's powerful features... | sports betting features, AI betting analysis, emotion tracking, bias detection, responsible gambling tools | Yes |
| `/pricing` | Pricing \| PlayMind Labs - Subscription Plans | Choose the right PlayMind Labs plan for you... | sports betting subscription, betting analytics pricing, responsible gambling subscription, AI betting tools pricing | Yes |
| `/how-it-works` | How It Works \| PlayMind Labs | Learn how PlayMind Labs helps you make smarter betting decisions... | how betting analytics work, AI sports betting, behavioral betting, emotion tracking betting | None |
| `/about` | About Us \| Serenity Pocket - PlayMind Labs | Meet the team behind Serenity Pocket... | PlayMind Labs, sports betting company, responsible gambling, betting analytics team | None |
| `/faq` | FAQ \| PlayMind Labs - Frequently Asked Questions | Find answers to common questions about PlayMind Labs... | betting FAQ, sports betting questions, responsible gambling FAQ, AI betting analysis help | None |
| `/contact` | Contact Us \| PlayMind Labs | Get in touch with the PlayMind Labs team... | contact betting support, PlayMind Labs support, PlayMind Labs contact | None |
| `/responsible-use` | Responsible Gambling \| PlayMind Labs | Learn about responsible gambling practices... | responsible gambling, betting safety, gambling help, betting limits, problem gambling resources | None |
| `/privacy` | Privacy Policy \| PlayMind Labs | PlayMind Labs privacy policy... | privacy policy, data protection, betting data privacy | None |
| `/terms` | Terms of Service \| PlayMind Labs | PlayMind Labs terms of service... | terms of service, betting platform terms, user agreement | None |
| `/demo` | Demo \| PlayMind Labs | Watch demos and tutorials... | betting demo, sports betting tutorial, PlayMind Labs demo | None |

---

## Summary

PlayMind Labs has a genuinely differentiated product with strong content that could perform well in AI-generated responses -- if AI systems could actually see it. The fundamental problem is that **100% of page content is client-side rendered and invisible to all AI crawlers and search engines.**

The three highest-impact actions are:

1. **Convert all public pages to server-side rendering** (fixes the content accessibility problem)
2. **Create `llms.txt`** (provides a direct communication channel to AI systems)
3. **Fix brand name consistency** (prevents entity confusion in AI knowledge bases)

These three changes alone would move the GEO score from 15/100 to an estimated 55-65/100. Adding schema markup, enhanced meta descriptions, and educational content would push it above 80/100.
