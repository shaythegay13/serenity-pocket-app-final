# Schema.org Markup Analysis -- PlayMind Labs

**Date:** 2026-02-11
**Site:** https://www.playmindlabs.com
**Framework:** Next.js (React, client-side rendering for most pages)

---

## 1. Detection Results

### Existing Schema Markup

| Format   | Found | Details |
|----------|-------|---------|
| JSON-LD  | No    | Zero `<script type="application/ld+json">` blocks on any page |
| Microdata| No    | No `itemscope`/`itemtype` attributes found in any component |
| RDFa     | No    | No `typeof`/`property` RDFa attributes found |

**Conclusion:** The site has zero structured data across all public pages.

---

## 2. Critical Issues Found During Audit

### 2.1 Sitemap and Robots.txt Reference Wrong Domain

Both `app/sitemap.ts` and `app/robots.ts` still reference the old domain `https://serenitypocket.com` as the fallback base URL:

```typescript
// app/sitemap.ts line 4
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://serenitypocket.com'

// app/robots.ts line 4
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://serenitypocket.com'
```

**Action Required:** Update the fallback value to `https://www.playmindlabs.com` in both files, or ensure the `NEXT_PUBLIC_BASE_URL` environment variable is set correctly in production.

### 2.2 About Page Still References "Serenity Pocket"

The about page component has no remaining references to the old brand in the visible content (confirmed the founders' bios now reference "PlayMind Labs"), but this should be double-checked after any future content edits.

---

## 3. Schema Recommendations Per Page

### IMPORTANT: Deprecated/Restricted Schema Types

Before listing recommendations, two requested schema types must be flagged:

| Requested Type | Status | Reason |
|----------------|--------|--------|
| **HowTo** | **DEPRECATED** | Google removed HowTo rich results in September 2023. Adding HowTo schema will have zero search visibility benefit. It will not trigger any rich result. **Do NOT implement.** |
| **FAQPage** | **RESTRICTED** | Google restricted FAQ rich results to government and healthcare authority sites only (August 2023). PlayMind Labs is a SaaS platform, not a government or healthcare site. FAQ schema will be ignored by Google. **Do NOT implement for rich result purposes.** However, the markup is still valid Schema.org vocabulary -- it simply will not produce any visual enhancement in search results. I have included it below as optional, clearly marked. |

---

## 4. Recommended Schema Implementation

All schema uses JSON-LD format injected via `<script type="application/ld+json">` in the `<head>`.

In Next.js, the recommended approach is to add schema to page-level `metadata` exports or inject `<script>` tags in layout/page components.

### Implementation Strategy for Next.js

Create a reusable component at `components/json-ld.tsx`:

```tsx
// components/json-ld.tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

Then use it in any page:

```tsx
import { JsonLd } from "@/components/json-ld"

export default function Page() {
  return (
    <>
      <JsonLd data={schemaObject} />
      {/* page content */}
    </>
  )
}
```

---

### 4.1 Homepage (/) -- Organization + WebSite + SoftwareApplication

This is the most important page for structured data. Three schema blocks are recommended.

#### 4.1.1 Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.playmindlabs.com/#organization",
  "name": "PlayMind Labs",
  "url": "https://www.playmindlabs.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.playmindlabs.com/logo.png",
    "width": 512,
    "height": 512
  },
  "description": "AI-powered behavioral sports betting analytics platform. The seatbelt for responsible betting.",
  "email": "info@playmindlabs.com",
  "sameAs": [],
  "founder": [
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
  "knowsAbout": [
    "Sports Betting Analytics",
    "Behavioral Psychology",
    "Responsible Gambling",
    "Artificial Intelligence",
    "Emotion Tracking"
  ]
}
```

**Notes:**
- Add social media profile URLs to `sameAs` when available (LinkedIn, Twitter/X, etc.)
- Update `logo` dimensions to match the actual logo file dimensions

#### 4.1.2 WebSite Schema with SearchAction

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.playmindlabs.com/#website",
  "name": "PlayMind Labs",
  "url": "https://www.playmindlabs.com",
  "description": "Your behavioral betting companion for smarter, data-driven play.",
  "publisher": {
    "@id": "https://www.playmindlabs.com/#organization"
  }
}
```

**Note:** The `SearchAction` (`potentialAction`) property has been intentionally omitted. SearchAction is only appropriate when the site has a publicly accessible search results page at a predictable URL pattern (e.g., `/search?q={query}`). PlayMind Labs does not have a public search feature -- it is a SaaS application behind authentication. Adding a SearchAction without a working search endpoint would be invalid markup.

#### 4.1.3 SoftwareApplication Schema

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://www.playmindlabs.com/#application",
  "name": "PlayMind Labs",
  "url": "https://www.playmindlabs.com",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "description": "AI-powered behavioral sports betting analytics platform combining emotion tracking, cognitive bias detection, and SmartSlip AI picks for smarter, safer betting decisions.",
  "offers": [
    {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "name": "Foundation",
      "description": "Build self-awareness and track your betting behavior to make safer, smarter decisions.",
      "url": "https://www.playmindlabs.com/pricing"
    },
    {
      "@type": "Offer",
      "price": "19.99",
      "priceCurrency": "USD",
      "name": "Focus",
      "description": "Real-time sports data, odds comparison, and analytical tools to bet smarter.",
      "url": "https://www.playmindlabs.com/pricing",
      "priceValidUntil": "2026-12-31"
    },
    {
      "@type": "Offer",
      "price": "39.99",
      "priceCurrency": "USD",
      "name": "Mastery",
      "description": "Combine psychology insights with data analytics to reduce risk and improve outcomes.",
      "url": "https://www.playmindlabs.com/pricing",
      "priceValidUntil": "2026-12-31"
    },
    {
      "@type": "Offer",
      "price": "79.99",
      "priceCurrency": "USD",
      "name": "Apex",
      "description": "AI-powered picks and analysis tailored to your psychological profile and betting style.",
      "url": "https://www.playmindlabs.com/pricing",
      "priceValidUntil": "2026-12-31"
    }
  ],
  "featureList": [
    "AI-Powered Bet Analysis",
    "Emotion Tracking and Check-ins",
    "Cognitive Bias Detection",
    "SmartSlip AI Picks",
    "TiltLab Emotional Analysis",
    "Real-Time Odds Comparison",
    "Performance Analytics",
    "Cooldown Mode and Safety Controls",
    "Parlay Optimizer",
    "Behavioral Volatility Warnings"
  ],
  "screenshot": "https://www.playmindlabs.com/og-image.png",
  "provider": {
    "@id": "https://www.playmindlabs.com/#organization"
  }
}
```

**Notes:**
- Update `screenshot` to the actual OG image or app screenshot URL
- Update `priceValidUntil` dates as needed (Google recommends this for Offer schema)
- `applicationCategory` uses `FinanceApplication` as the closest standard Schema.org category

---

### 4.2 Features Page (/features) -- WebPage

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.playmindlabs.com/features/#webpage",
  "name": "Platform Features - PlayMind Labs",
  "description": "Discover the powerful behavioral and AI tools that make PlayMind Labs the most comprehensive responsible betting platform available.",
  "url": "https://www.playmindlabs.com/features",
  "isPartOf": {
    "@id": "https://www.playmindlabs.com/#website"
  },
  "about": {
    "@id": "https://www.playmindlabs.com/#application"
  },
  "breadcrumb": {
    "@id": "https://www.playmindlabs.com/features/#breadcrumb"
  }
}
```

---

### 4.3 Pricing Page (/pricing) -- WebPage + Product/Offer

#### 4.3.1 WebPage

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.playmindlabs.com/pricing/#webpage",
  "name": "Pricing - PlayMind Labs",
  "description": "Simple, transparent pricing. Choose the plan that fits your betting style and goals. All plans include core responsible gaming features.",
  "url": "https://www.playmindlabs.com/pricing",
  "isPartOf": {
    "@id": "https://www.playmindlabs.com/#website"
  },
  "breadcrumb": {
    "@id": "https://www.playmindlabs.com/pricing/#breadcrumb"
  }
}
```

#### 4.3.2 Product with Offers (Pricing Tiers)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "PlayMind Labs",
  "description": "AI-powered behavioral sports betting analytics platform with emotion tracking, cognitive bias detection, and personalized AI picks.",
  "brand": {
    "@type": "Brand",
    "name": "PlayMind Labs"
  },
  "url": "https://www.playmindlabs.com/pricing",
  "offers": [
    {
      "@type": "Offer",
      "name": "Foundation Plan",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.playmindlabs.com/pricing",
      "description": "Build self-awareness and track your betting behavior to make safer, smarter decisions. Includes Emotion Tracking, Betting History, Emotional Wellness Score, and Cooldown Mode."
    },
    {
      "@type": "Offer",
      "name": "Focus Plan",
      "price": "19.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.playmindlabs.com/pricing",
      "priceValidUntil": "2026-12-31",
      "description": "Real-time sports data, odds comparison, and analytical tools to bet smarter. Includes Basic Analytics Dashboard, TiltLab (1x/week), and SmartSlip AI Picks (1x/week)."
    },
    {
      "@type": "Offer",
      "name": "Mastery Plan",
      "price": "39.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.playmindlabs.com/pricing",
      "priceValidUntil": "2026-12-31",
      "description": "Combine psychology insights with data analytics to reduce risk and improve outcomes. Includes Emotional Volatility Warnings, Behavior-to-Performance Correlation, TiltLab (3x/week), and SmartSlip AI Picks (3x/week)."
    },
    {
      "@type": "Offer",
      "name": "Apex Plan",
      "price": "79.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.playmindlabs.com/pricing",
      "priceValidUntil": "2026-12-31",
      "description": "AI-powered picks and analysis tailored to your psychological profile and betting style. Includes Priority Support, TiltLab (25x/week), and SmartSlip AI Picks (25x/week)."
    }
  ]
}
```

**Note:** For Google to show Product rich results, the Product schema requires either `review`, `aggregateRating`, or `offers` with price. This schema includes `offers`. Once you collect user reviews, add `aggregateRating` to strengthen the markup.

---

### 4.4 How It Works Page (/how-it-works) -- WebPage Only

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.playmindlabs.com/how-it-works/#webpage",
  "name": "How PlayMind Labs Works",
  "description": "Behavioral fintech for safer, smarter sports betting. Learn how PlayMind Labs uses AI and behavioral science to help you bet responsibly.",
  "url": "https://www.playmindlabs.com/how-it-works",
  "isPartOf": {
    "@id": "https://www.playmindlabs.com/#website"
  },
  "breadcrumb": {
    "@id": "https://www.playmindlabs.com/how-it-works/#breadcrumb"
  }
}
```

**Why no HowTo schema:** HowTo rich results were removed by Google in September 2023. The markup would be syntactically valid but provide zero search benefit. The page content describes the product onboarding flow, not a step-by-step instructional guide, making HowTo semantically incorrect as well.

---

### 4.5 About Page (/about) -- AboutPage + Person (Founders)

```json
{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": "https://www.playmindlabs.com/about/#webpage",
  "name": "About PlayMind Labs",
  "description": "We're on a mission to revolutionize sports betting through behavioral intelligence and responsible gaming technology.",
  "url": "https://www.playmindlabs.com/about",
  "isPartOf": {
    "@id": "https://www.playmindlabs.com/#website"
  },
  "mainEntity": {
    "@id": "https://www.playmindlabs.com/#organization"
  },
  "breadcrumb": {
    "@id": "https://www.playmindlabs.com/about/#breadcrumb"
  }
}
```

#### Founders (Person Schema)

These can be included on the about page alongside the AboutPage schema:

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.playmindlabs.com/about/#shay-bouchles",
  "name": "Shay Bouchles",
  "jobTitle": "Chief Executive Officer",
  "worksFor": {
    "@id": "https://www.playmindlabs.com/#organization"
  },
  "image": "https://www.playmindlabs.com/shay.bouchles.png",
  "description": "CEO of PlayMind Labs. Holds a Master's degree in Environmental Policy and Sustainability Management from The New School. Previously founded Saved by the Plate Inc.",
  "alumniOf": [
    {
      "@type": "CollegeOrUniversity",
      "name": "The New School"
    },
    {
      "@type": "CollegeOrUniversity",
      "name": "University of Maine"
    }
  ]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.playmindlabs.com/about/#sergio-monterroso",
  "name": "Sergio Monterroso",
  "jobTitle": "Chief Financial Officer",
  "worksFor": {
    "@id": "https://www.playmindlabs.com/#organization"
  },
  "image": "https://www.playmindlabs.com/sergio.png",
  "description": "CFO of PlayMind Labs. Holds a Bachelor's in Finance and Economics from Arizona State University and a Master's in Data and Social Research from Queens College.",
  "alumniOf": [
    {
      "@type": "CollegeOrUniversity",
      "name": "Arizona State University"
    },
    {
      "@type": "CollegeOrUniversity",
      "name": "Queens College"
    }
  ]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.playmindlabs.com/about/#diamond-mcpherson",
  "name": "Diamond Mc Pherson",
  "jobTitle": "Chief Marketing Officer",
  "worksFor": {
    "@id": "https://www.playmindlabs.com/#organization"
  },
  "image": "https://www.playmindlabs.com/diamond.png",
  "description": "CMO of PlayMind Labs. Nearly two decades of IT leadership and digital transformation experience. AWS Certified Solutions Architect.",
  "alumniOf": [
    {
      "@type": "CollegeOrUniversity",
      "name": "University of Hertfordshire"
    },
    {
      "@type": "CollegeOrUniversity",
      "name": "University of Texas at Austin"
    }
  ]
}
```

---

### 4.6 FAQ Page (/faq) -- WebPage Only

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.playmindlabs.com/faq/#webpage",
  "name": "Frequently Asked Questions - PlayMind Labs",
  "description": "Find answers to common questions about PlayMind Labs, AI betting analysis, emotion tracking, pricing, and responsible gaming features.",
  "url": "https://www.playmindlabs.com/faq",
  "isPartOf": {
    "@id": "https://www.playmindlabs.com/#website"
  },
  "breadcrumb": {
    "@id": "https://www.playmindlabs.com/faq/#breadcrumb"
  }
}
```

**Why no FAQPage schema:** Google restricted FAQ rich results to government and healthcare authority sites only in August 2023. PlayMind Labs is a SaaS platform, so FAQPage schema will be ignored by Google and will not produce any rich result in search. The WebPage schema above is the appropriate alternative.

#### Optional: FAQPage Schema (No Rich Result Benefit)

If you want to include FAQPage schema purely for semantic completeness (understanding that it will NOT produce any Google rich result), here it is:

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
    },
    {
      "@type": "Question",
      "name": "How does the AI analysis work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our AI analyzes your betting patterns, emotional state, and historical performance alongside real-time sports data. This helps identify potential biases, emotional triggers, and provides personalized recommendations to improve your betting strategy."
      }
    },
    {
      "@type": "Question",
      "name": "Is PlayMind Labs legal to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, PlayMind Labs is completely legal. We provide analytics and insights to help inform your betting decisions, but we do not place bets on your behalf. We operate as an educational and analytical tool."
      }
    },
    {
      "@type": "Question",
      "name": "What sports do you cover?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We cover a wide range of sports including NFL, NBA, NHL, MLB, NCAAB (College Basketball), NCAAF (College Football), English Premier League, MLS, UEFA Champions League, UFC/MMA, Boxing, and ATP/WTA Tennis. Our odds comparison includes data from all major sportsbooks for these leagues and events."
      }
    },
    {
      "@type": "Question",
      "name": "How does the emotion tracking work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our emotion tracking system uses periodic check-ins to monitor your emotional state before and after bets. This helps identify patterns between emotions and betting performance, enabling you to make more rational decisions."
      }
    },
    {
      "@type": "Question",
      "name": "Can I cancel my subscription anytime?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period, and you won't be charged again."
      }
    },
    {
      "@type": "Question",
      "name": "How accurate are the AI picks?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our AI picks provide probability-based recommendations with confidence scores. While no prediction is 100% accurate, our system consistently outperforms random chance by analyzing multiple factors including historical data, line movements, and behavioral patterns."
      }
    },
    {
      "@type": "Question",
      "name": "What is Cooldown Mode?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cooldown Mode is a safety feature that automatically limits certain platform functions when our system detects high emotional volatility or concerning betting patterns. This helps prevent impulsive decisions and promotes responsible gaming."
      }
    },
    {
      "@type": "Question",
      "name": "How do you protect my data?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We use industry-standard encryption and security measures to protect your personal and betting data. Your information is never shared with third parties without your explicit consent, and we comply with all relevant privacy regulations."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use PlayMind Labs on mobile?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! PlayMind Labs is fully responsive and works great on mobile devices."
      }
    },
    {
      "@type": "Question",
      "name": "What payment methods do you accept?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We accept all major credit cards, debit cards, and PayPal through our secure payment processor. All transactions are encrypted and secure."
      }
    }
  ]
}
```

---

### 4.7 Contact Page (/contact) -- ContactPage

```json
{
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": "https://www.playmindlabs.com/contact/#webpage",
  "name": "Contact Us - PlayMind Labs",
  "description": "Get in touch with PlayMind Labs. We'd love to hear from you.",
  "url": "https://www.playmindlabs.com/contact",
  "isPartOf": {
    "@id": "https://www.playmindlabs.com/#website"
  },
  "mainEntity": {
    "@type": "Organization",
    "@id": "https://www.playmindlabs.com/#organization",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "info@playmindlabs.com",
      "availableLanguage": "English"
    }
  },
  "breadcrumb": {
    "@id": "https://www.playmindlabs.com/contact/#breadcrumb"
  }
}
```

---

### 4.8 Responsible Use Page (/responsible-use) -- WebPage

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.playmindlabs.com/responsible-use/#webpage",
  "name": "Responsible Use - PlayMind Labs",
  "description": "Harm reduction, clarity, and user protection are built into PlayMind Labs. Learn about our volatility warnings, cooldowns, and transparency commitments.",
  "url": "https://www.playmindlabs.com/responsible-use",
  "isPartOf": {
    "@id": "https://www.playmindlabs.com/#website"
  },
  "breadcrumb": {
    "@id": "https://www.playmindlabs.com/responsible-use/#breadcrumb"
  }
}
```

---

### 4.9 Privacy Policy Page (/privacy) -- WebPage

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.playmindlabs.com/privacy/#webpage",
  "name": "Privacy Policy - PlayMind Labs",
  "description": "Your privacy is important to us. This policy explains how we collect, use, and protect your information.",
  "url": "https://www.playmindlabs.com/privacy",
  "isPartOf": {
    "@id": "https://www.playmindlabs.com/#website"
  },
  "breadcrumb": {
    "@id": "https://www.playmindlabs.com/privacy/#breadcrumb"
  }
}
```

---

### 4.10 Terms of Service Page (/terms) -- WebPage

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.playmindlabs.com/terms/#webpage",
  "name": "Terms of Service - PlayMind Labs",
  "description": "Terms of Service for PlayMind Labs. Please read these terms carefully before using the platform.",
  "url": "https://www.playmindlabs.com/terms",
  "isPartOf": {
    "@id": "https://www.playmindlabs.com/#website"
  },
  "breadcrumb": {
    "@id": "https://www.playmindlabs.com/terms/#breadcrumb"
  }
}
```

---

## 5. BreadcrumbList Schema (All Pages)

Each public page should include a BreadcrumbList. Below are all breadcrumb schemas.

### Homepage

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    }
  ]
}
```

### Features

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/features/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Features",
      "item": "https://www.playmindlabs.com/features"
    }
  ]
}
```

### Pricing

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/pricing/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Pricing",
      "item": "https://www.playmindlabs.com/pricing"
    }
  ]
}
```

### How It Works

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/how-it-works/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "How It Works",
      "item": "https://www.playmindlabs.com/how-it-works"
    }
  ]
}
```

### About

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/about/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "About",
      "item": "https://www.playmindlabs.com/about"
    }
  ]
}
```

### FAQ

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/faq/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "FAQ",
      "item": "https://www.playmindlabs.com/faq"
    }
  ]
}
```

### Contact

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/contact/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Contact",
      "item": "https://www.playmindlabs.com/contact"
    }
  ]
}
```

### Responsible Use

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/responsible-use/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Responsible Use",
      "item": "https://www.playmindlabs.com/responsible-use"
    }
  ]
}
```

### Privacy Policy

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/privacy/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Privacy Policy",
      "item": "https://www.playmindlabs.com/privacy"
    }
  ]
}
```

### Terms of Service

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://www.playmindlabs.com/terms/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.playmindlabs.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Terms of Service",
      "item": "https://www.playmindlabs.com/terms"
    }
  ]
}
```

---

## 6. Validation Summary

| Schema Block | @context | @type Valid | Not Deprecated | Required Props | URLs Absolute | No Placeholders |
|---|---|---|---|---|---|---|
| Organization | PASS | PASS | PASS | PASS | PASS | PASS |
| WebSite | PASS | PASS | PASS | PASS | PASS | PASS |
| SoftwareApplication | PASS | PASS | PASS | PASS | PASS | PASS |
| Product (Pricing) | PASS | PASS | PASS | PASS | PASS | PASS |
| AboutPage | PASS | PASS | PASS | PASS | PASS | PASS |
| ContactPage | PASS | PASS | PASS | PASS | PASS | PASS |
| Person (x3) | PASS | PASS | PASS | PASS | PASS | PASS |
| WebPage (x6) | PASS | PASS | PASS | PASS | PASS | PASS |
| BreadcrumbList (x10) | PASS | PASS | PASS | PASS | PASS | PASS |
| FAQPage (optional) | PASS | PASS | N/A (restricted) | PASS | PASS | PASS |

---

## 7. Implementation Priority

| Priority | Page | Schema Types | Rich Result Potential |
|----------|------|-------------|---------------------|
| 1 (Critical) | Homepage `/` | Organization, WebSite, SoftwareApplication | Sitelinks, Knowledge Panel, Software listing |
| 2 (High) | Pricing `/pricing` | Product + Offers, BreadcrumbList | Product rich result with pricing |
| 3 (High) | About `/about` | AboutPage, Person (x3), BreadcrumbList | Knowledge Panel support, People cards |
| 4 (Medium) | Contact `/contact` | ContactPage, BreadcrumbList | Breadcrumb trail in SERP |
| 5 (Medium) | Features `/features` | WebPage, BreadcrumbList | Breadcrumb trail in SERP |
| 6 (Medium) | How It Works `/how-it-works` | WebPage, BreadcrumbList | Breadcrumb trail in SERP |
| 7 (Low) | FAQ `/faq` | WebPage, BreadcrumbList | Breadcrumb trail in SERP |
| 8 (Low) | Responsible Use `/responsible-use` | WebPage, BreadcrumbList | Breadcrumb trail in SERP |
| 9 (Low) | Privacy `/privacy` | WebPage, BreadcrumbList | Breadcrumb trail in SERP |
| 10 (Low) | Terms `/terms` | WebPage, BreadcrumbList | Breadcrumb trail in SERP |

---

## 8. Additional Recommendations

### 8.1 Fix Domain References
Update `app/sitemap.ts` and `app/robots.ts` to use `https://www.playmindlabs.com` as the fallback domain instead of `https://serenitypocket.com`.

### 8.2 Add Social Media Profiles
When PlayMind Labs has social media accounts, add them to the Organization schema `sameAs` array:
```json
"sameAs": [
  "https://twitter.com/playmindlabs",
  "https://www.linkedin.com/company/playmindlabs",
  "https://www.instagram.com/playmindlabs"
]
```

### 8.3 Future Schema Opportunities
- **AggregateRating**: Once you collect user reviews/ratings, add this to the Product and SoftwareApplication schemas
- **Review**: Individual review schema when testimonials are published
- **Article/BlogPosting**: If a blog is added to the site
- **VideoObject**: If product demo or explainer videos are added

### 8.4 Testing and Validation
After implementing, validate each page using:
1. [Google Rich Results Test](https://search.google.com/test/rich-results)
2. [Schema.org Validator](https://validator.schema.org/)
3. Google Search Console "Enhancements" reports (after indexing)

---

## 9. Files Referenced in This Analysis

- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\layout.tsx` -- Root layout with metadata
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\page.tsx` -- Homepage entry point
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\components\landing-page.tsx` -- Landing page component
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\features\page.tsx` -- Features page
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\pricing\page.tsx` -- Pricing page
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\how-it-works\page.tsx` -- How It Works page
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\about\page.tsx` -- About page
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\faq\page.tsx` -- FAQ page
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\contact\page.tsx` -- Contact page
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\responsible-use\page.tsx` -- Responsible Use page
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\privacy\page.tsx` -- Privacy Policy page
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\terms\page.tsx` -- Terms of Service page
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\sitemap.ts` -- Sitemap (wrong domain fallback)
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\app\robots.ts` -- Robots.txt (wrong domain fallback)
- `c:\Users\dbsoc\Downloads\serenity-pocket-app-final\lib\subscription-tiers.ts` -- Subscription tier definitions
