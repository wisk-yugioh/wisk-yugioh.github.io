# Wisk Yu-Gi-Oh! — Architecture Documentation

## Site Structure

Single layout (`default.html`). Nav from `_data/navigation.yml`. Hub from `_data/sections.yml`.

### Collections

The site has 6 content sections backed by Jekyll collections, in two language groups:

| Section | URL | Collection dir | Jekyll variable | Type |
|---|---|---|---|---|
| Objave | `/objave/` | `_objave/` | `site.objave` | flat |
| Članki | `/clanki/` | `_clanki/` | `site.clanki` | filtered |
| Reportaže | `/reportaze/` | `_reportaze/` | `site.reportaze` | filtered |
| Announcements | `/announcements/` | `_announcements/` | `site.announcements` | flat |
| Articles | `/articles/` | `_articles/` | `site.articles` | filtered |
| Reports | `/reports/` | `_reports/` | `site.reports` | filtered |

**Flat** (objave, announcements): no `subcategories` needed — posts show as a plain searchable list.  
**Filtered** (clanki, reportaze, articles, reports): posts require `subcategories: [goat]`, `[advanced]`, or `[goat, advanced]` — the index renders subcategory filter buttons.

---

## Hub — `_data/sections.yml`

`index.html` loops over this file to render cards. Each entry:

```yaml
- key: clanki           # Jekyll collection name (site.clanki)
  title: Članki
  desc: Članki slovenske Yu-Gi-Oh! skupnosti.
  count_label: objav    # appears after the post count ("144 objav")
  cta: Preberi          # call-to-action before the →
```

A `divider: true` entry renders a full-width horizontal rule instead of a card:

```yaml
- divider: true
```

Current order: objave → clanki → reportaze → `[divider]` → announcements → articles → reports.

---

## Navigation — `_data/navigation.yml`

Each entry is a link or a special element:

```yaml
- title: Članki
  url: /clanki/
  flag: "🇸🇮"     # optional — small flag emoji rendered before this link in desktop nav only

- divider: true   # vertical separator bar in desktop nav; hidden on mobile
```

Current order: 🇸🇮 Objave | Članki | Reportaže | `|` | 🇬🇧 Announcements | Articles | Reports | `|` | O nas

---

## Section Index Pages

All index pages use the shared include:

```liquid
{% include section-index.html collection="clanki" lang="sl" %}
```

- `lang` defaults to `sl`; pass `lang="en"` for English sections
- Renders: subcategory buttons (auto-detected from posts), search box, post list, result count, empty state
- Flat sections with no subcategory data show all posts by default

---

## Adding a New Section

5 steps. **Update `DOCUMENTATION.md` and `copilot-instructions.md` when done.**

1. **`_config.yml`** — add collection + defaults:
   ```yaml
   collections:
     mysection:
       output: true
       permalink: /mysection/:year/:month/:day/:title

   defaults:
     - scope:
         type: mysection
       values:
         layout: post
         lang: sl
   ```

2. **Directory** — create `_mysection/` (add `.gitkeep` if empty)

3. **Index page** — create `mysection/index.html`:
   ```html
   ---
   layout: default
   title: My Section
   ---
   <p class="post-list-heading">My Section</p>
   {% include section-index.html collection="mysection" lang="sl" %}
   ```

4. **Nav** — add entry to `_data/navigation.yml` (with optional `flag:` and `divider:` for grouping)

5. **Hub card** — add entry to `_data/sections.yml` (place a `divider: true` to maintain SLO/EN grouping)

---

## Moving a Post Between Sections

Move the `.md` file to the target collection directory. No frontmatter changes needed — collection membership is determined by directory alone:

| Target | Directory |
|---|---|
| SLO article | `_clanki/` |
| SLO report | `_reportaze/` |
| SLO announcement | `_objave/` |
| EN article | `_articles/` |
| EN report | `_reports/` |
| EN announcement | `_announcements/` |

---

## Post Frontmatter

File naming: `YYYY-MM-DD-slug.md`

```yaml
---
layout: post                  # set automatically by _config.yml defaults
title: "Post Title"
date: YYYY-MM-DD
author: "Author Name"         # required — shown on index and post page
description: "One sentence."  # recommended — SEO meta description
subcategories: [goat]         # required for filtered sections; omit for flat sections
                              # valid values: goat | advanced | [goat, advanced]
image: /assets/images/posts/filename.jpg  # optional — hero image + OG image
lang: sl                      # set automatically by defaults; override only if needed
---
```

`layout` and `lang` are set by `_config.yml` collection defaults — only add to frontmatter when overriding.

Post images go in `assets/images/posts/`.

---

## SCSS

All styles in `_sass/new-site.scss`, scoped to `.new-site` (set on both `<html>` and `<body>` in `default.html`).

Entry point: `assets/css/main.scss` → imports `new-site.scss`.

Key variables:

| Variable | Value |
|---|---|
| `$dark-bg` | `#111827` |
| `$dark-surface` | `#1f2937` |
| `$dark-border` | `#374151` |
| `$dark-text` | `#f9fafb` |
| `$dark-muted` | `#9ca3af` |
| `$dark-accent` | `#f97316` |
| `$content-width` | `720px` |

Hub grid: `repeat(3, 1fr)` → `1fr` at ≤768px. `.hub-divider` uses `grid-column: 1 / -1`.

---

## Layout

Fixed viewport: header and footer always visible; only `.site-main` scrolls.

```
body.new-site       height: 100vh; overflow: hidden; display: flex; flex-direction: column
.site-main          flex: 1; overflow-y: auto
header / footer     flex-shrink: 0
.site-main-inner    max-width: 720px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem
```

All new sections use this layout unless explicitly decided otherwise.

---

## Google Analytics

Add `google_analytics: G-XXXXXXX` to `_config.yml`. The include in `default.html` fires conditionally.
