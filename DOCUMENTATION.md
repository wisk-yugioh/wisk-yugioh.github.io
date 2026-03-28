# Wisk Yu-Gi-Oh! — Architecture Documentation

## Site Structure

Single layout (`default.html`). Nav from `_data/navigation.yml`.

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

4 steps. **Update `DOCUMENTATION.md` and `copilot-instructions.md` when done.**

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

Entry point: `assets/css/main.scss` → imports `new-site.scss` and `gallery.scss`.

---

## Gallery — `/gallery/`

A client-side image slideshow showing all article images with a link back to the source article.

### How it works

1. `scripts/generate-gallery-index.mjs` scans `assets/images/posts/*/` and matches each folder slug to an article in one of the 6 collections (exact slug match). The result is written to `_data/gallery_index.json`.
2. Jekyll injects `gallery_index.json` into the page as a JS variable (`window.GALLERY_IMAGES`).
3. `assets/js/gallery.js` drives the slideshow: prev/next buttons, keyboard ← →, touch swipe, and a jump-to-number input.

### Regenerating the index

Run this whenever articles are added or images are updated:

```bash
node scripts/generate-gallery-index.mjs
```

Commit the updated `_data/gallery_index.json`.

### Handling renamed articles

If an article's filename slug no longer matches its image folder slug, add a mapping to `_data/gallery_overrides.yml`:

```yaml
old-image-folder-slug: current-article-slug
```

Run with `--audit` to identify unmatched folders:

```bash
node scripts/generate-gallery-index.mjs --audit
```

### Files

| File | Purpose |
|---|---|
| `scripts/generate-gallery-index.mjs` | Build script — generates the image index |
| `_data/gallery_index.json` | Generated image list (commit this) |
| `_data/gallery_overrides.yml` | Manual slug overrides for renamed articles |
| `gallery/index.html` | The `/gallery/` page |
| `assets/js/gallery.js` | Slideshow JS (navigation, jump input) |
| `_sass/gallery.scss` | Gallery-specific styles |

---

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

Spotlight row: `repeat(3, 1fr)` → `1fr` at ≤640px. Sits at the top of `index.html`.

---

## Homepage Spotlight — `index.html`

Three spotlight cards appear on the homepage.

### Latest Article card

Pure Liquid — no data file needed. Merges all 6 collections, sorts by `date`, takes the last (newest) entry:

```liquid
{% assign all_posts = site.clanki | concat: site.articles | ... | sort: "date" %}
{% assign latest_post = all_posts | last %}
```

Displays title, date, author, and a "Read →" link. Wrapped in `.spotlight-card.spotlight-card--article`.

### Latest Video card

Rendered from `_data/latest_video.yml` (auto-updated by GitHub Actions). Displays thumbnail, title, channel, date, and a "Watch →" link. Wrapped in `.spotlight-card.spotlight-card--video`.

### Daily Spotlight card

Picks one article per day from `clanki + reportaze + articles + reports` (excludes objave/announcements). Selection is deterministic: `day_of_year % pool_size`. The pool is sorted by date before slicing, so the cycle is stable and reproducible.

```liquid
{% assign spotlight_pool = site.clanki | concat: site.reportaze | concat: site.articles | concat: site.reports | sort: "date" %}
{% assign spotlight_index = site.time | date: "%j" | plus: 0 | modulo: spotlight_pool.size %}
{% assign daily_post = spotlight_pool | slice: spotlight_index %}
```

Image lookup uses `_data/gallery_index.json` (the same file the gallery page uses). Matches on `folderSlug == post.slug`:

```liquid
{% assign daily_image_match = site.data.gallery_index | where: "folderSlug", daily_post.slug %}
{% assign daily_image = daily_image_match[0].src %}
```

If no image exists for the post, the card renders without a thumbnail. Wrapped in `.spotlight-card.spotlight-card--daily`.

### Data files

| File | Purpose |
|---|---|
| `_data/youtube_channels.yml` | List of YouTube channels (handle + channel_id). Add entries here to include more channels. |
| `_data/latest_video.yml` | Auto-generated — the single most-recent video across all configured channels. **Do not edit manually.** |
| `_data/gallery_index.json` | Generated image list used for daily spotlight image lookup. Regenerate with `node scripts/generate-gallery-index.mjs`. |

`_data/youtube_channels.yml` format:

```yaml
- handle: siwski666
  channel_id: UCAKUK9MYS4TfznStFvWmiIQ
- handle: Tempest93
  channel_id: UCLhKbVtM90B7th8jJSMlxpQ
```

### GitHub Actions workflow — `fetch-youtube.yml`

`.github/workflows/fetch-youtube.yml` runs every 6 hours (and can be triggered manually from the Actions tab). It:

1. Runs `scripts/fetch-youtube.js` — fetches YouTube RSS for each channel in `_data/youtube_channels.yml` (no API key required)
2. Picks the most-recent video by `<published>` date
3. Writes to `_data/latest_video.yml`
4. Commits and pushes if the data changed → triggers a GitHub Pages rebuild

To trigger manually: **Actions → Fetch latest YouTube video → Run workflow**.

### SCSS classes

`.spotlight-row` — three-column grid (`repeat(3, 1fr)`, collapses to `1fr` at ≤640px).  
`.spotlight-card` — base card style.  
`.spotlight-card--video` — adds `.spotlight-thumb` (16:9 thumbnail image).  
`.spotlight-card--daily` — adds `.spotlight-thumb` (same 16:9 thumbnail, only rendered when an image exists).

---

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

---

## Comments (Disqus)

All article pages show a Disqus comment widget (embedded in `_layouts/post.html`). Visitors can comment using Google, Facebook, Twitter, Apple, or email.

### One-time setup (do this once per site)

1. Go to **https://disqus.com** → **Get Started** → **Sign up**
2. After logging in, go to **https://disqus.com/profile/signup/intent/**
3. Click **"I want to install Disqus on my site"**
4. Fill in:
   - **Website Name:** `Wisk Yu-Gi-Oh!`
   - **Unique Disqus URL (shortname):** e.g. `wisk-yugioh` ← note this exactly
   - **Category:** Entertainment
5. Click **Create Site** → choose **Basic (Free)** → **Subscribe with Basic**
6. On the platform screen, scroll down → **"I don't see my platform, install manually"**
7. Click **Configure**, set **Website URL** to `https://wisk-yugioh.github.io`, then **Complete Setup**

### Wire up the shortname

Open `_layouts/post.html` and replace the placeholder on the `s.src` line:

```js
// before
s.src = 'https://YOUR-DISQUS-SHORTNAME.disqus.com/embed.js';

// after (example)
s.src = 'https://wisk-yugioh.disqus.com/embed.js';
```

### Moderation

Go to `https://disqus.com/home/forums/YOUR-SHORTNAME/settings/moderation/` to:
- Enable **pre-moderation** (approve before publish)
- Configure **email notifications** for new comments
- Manage **blocklists**
