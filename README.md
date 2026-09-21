# Dr. Jayesh Sardhara — Neurosurgeon & Spine Surgeon

A premium, modern healthcare website built from scratch. Original design, layout and UX — inspired in quality by Mayo Clinic / Cleveland Clinic / luxury medical brands.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first `@theme`) — custom navy + teal + gold palette
- **Framer Motion** — scroll reveals, staggers, micro-interactions
- **next-themes** — class-based light/dark mode
- **lucide-react** — icons
- Fully static / SSG · SEO-optimised · JSON-LD `Physician` schema · sitemap + robots

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Structure

```
app/
  layout.tsx            Root layout: fonts, theme, nav, footer, WhatsApp, SEO
  page.tsx              Homepage (12 sections)
  about/                Full surgeon profile
  brain-surgery/        Treatment page (data-driven)
  spine-surgery/        Treatment page (data-driven)
  conditions/           Conditions treated
  awards/               Awards & recognition
  testimonials/         Patient stories (video placeholders + reviews)
  blog/                 Listing with search + category filters
  blog/[slug]/          Article template (SSG)
  contact/              Contact + map + form
  appointment/          Booking flow
  sitemap.ts robots.ts not-found.tsx
components/
  layout/               navbar, footer, floating-whatsapp, theme-toggle
  home/                 hero, trust-strip, about, expertise, why-choose,
                        conditions, procedures, testimonials, awards, resources,
                        appointment-cta
  ui/                   button, container, reveal, section-heading, portrait,
                        page-hero, cta-band, faq, icon
  forms/                appointment-form
  blog/                 posts-explorer (search + filter)
  seo/                  json-ld
lib/
  data.ts               Single source of truth for all content
  treatments.ts         Brain / spine treatment data
  utils.ts              cn() class merge
```

## Content & images

The design is an original **editorial** system (numbered sections, hairline rules,
serif display type, asymmetric layouts) — not a generic template.

Real assets sourced from the practice's existing site:
- **Doctor photo** (`public/images/Dr-Image1.png`) — used in hero, home about & about page.
- **9 real blog articles** with real featured images (`public/images/blog/*`) and
  **full sanitised article bodies** in `lib/blog-content.ts` (rendered via the `.article`
  prose styles in `globals.css`).
- **Treatment illustrations** (`brain-surgery.webp`, `spine-surgery.webp`) on the treatment pages.
- **Conference photo** (`clinic-fortis-mulund.jpg`) on the About page leadership section.

To refresh blog content, re-run the import scripts in the scratchpad
(`build-posts.mjs`, `fetch-content.mjs`) against the WordPress REST API.

## Customising

- **Content** lives in `lib/data.ts` and `lib/treatments.ts` — edit copy, stats, awards, posts here.
- **Brand colours / fonts** are defined in `app/globals.css` (`@theme`).
- **Doctor photos**: the `Portrait` component (`components/ui/portrait.tsx`) is a tasteful
  SVG placeholder. Replace it with a real `next/image` photo where it's used
  (hero, about page) once you have licensed imagery.
- **Form submission** (`components/forms/appointment-form.tsx`) is a front-end demo —
  wire it to an API route, email service or CRM for production.
- **Maps**: the contact page embeds a public Google Maps iframe — swap the query for the exact clinic pin.

## Notes

The design, layout, component structure and UX are entirely original. Medical
topics, credentials, awards and expertise reference the practice's real profile.
Content is for demonstration and should be medically reviewed before going live.
