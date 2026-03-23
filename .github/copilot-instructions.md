# GitHub Copilot Instructions

## Project

**SloGoatsss** — Slovenian Yu-Gi-Oh! Goat Format community site. Built with Jekyll, hosted on GitHub Pages. Site language is Slovenian (`lang: sl`), some posts are in English.

## Session Start

Always read these files first:
- `PLAN.md` — current stage goals and open items
- `CHANGELOG.md` — full history of completed work
- `TODOS.md` — current active todo list

Use the SQL `todos` table for in-session tracking. After completing work, update `CHANGELOG.md` and `PLAN.md`.

## Architecture

The site has three coexisting layers:

| Layer | URL prefix | Layout | Nav data |
|---|---|---|---|
| New dark blog | `/` | `default.html` | `_data/navigation.yml` |
| Old orange site | `/old/` | `old-default.html` | `_data/old_navigation.yml` |

The new dark blog is itself split into two sections:

| Section | URL | Source | Jekyll |
|---|---|---|---|
| Hub | `/` | `index.html` | static page |
| Modern blog | `/blog/` | `blog/index.html` | `_posts/` (built-in) |
| Historic blog | `/historic/` | `historic/index.html` | `_historic/` collection |

**Adding a third section** — 4 steps:
1. Add a collection to `_config.yml`:
   ```yaml
   collections:
     historic:
       output: true
       permalink: /historic/:year/:month/:day/:title
     mysection:           # ← new
       output: true
       permalink: /mysection/:year/:month/:day/:title
   ```
2. Create the `_mysection/` directory (add a `.gitkeep` if empty)
3. Create `mysection/index.html` — copy `historic/index.html`, replace `site.historic` with `site.mysection`
4. Add a nav entry to `_data/navigation.yml`

**Moving an article between sections** — 1 step:
- Move the `.md` file between directories. Jekyll's collection membership is determined solely by which directory the file lives in:
  - `_posts/` → appears at `/blog/YYYY/MM/DD/slug` (modern blog)
  - `_historic/` → appears at `/historic/YYYY/MM/DD/slug` (historic blog)
- No frontmatter changes needed — `layout: post` works in both collections.
- Example: to move a post to historic, `mv _posts/2013-07-06-fortunat-evilswarm.md _historic/`

New site styles are scoped entirely under the `.new-site` body class (set in both `<html>` and `<body>` in `default.html`) to prevent conflicts with the old site's styles in `_sass/main.scss`.

SCSS entry point is `assets/css/main.scss`, which imports:
- `_sass/main.scss` — old site styles
- `_sass/new-site.scss` — new dark blog styles (scoped to `.new-site`)

Navigation is data-driven via `_data/navigation.yml` — never hardcode nav links in `default.html`.

## Layout Behaviour

All new-site pages use a **fixed viewport layout**: header and footer are always visible; only `.site-main` scrolls. This is the default and must be preserved on all new sections unless explicitly decided otherwise.

Implementation: `body.new-site` is `height: 100vh; overflow: hidden; display: flex; flex-direction: column`. `.site-main` has `flex: 1; overflow-y: auto`. Header/footer have `flex-shrink: 0`.

## Post Conventions

File naming: `_posts/YYYY-MM-DD-slug.md`

Frontmatter fields:
```yaml
---
layout: post
title: "Post Title"
date: YYYY-MM-DD
author: "Author Name"   # required — shown on index and post page
categories: [category]  # optional; see categories below
---
```

Known categories: `arhiv` (2013–2017 archived Slovenian articles), `articles` + `english` (English articles by siwski), no category (Slovenian tournament coverage 2018–2019).

Permalink pattern: `/blog/:year/:month/:day/:title`

Post images go in `assets/images/posts/` and are referenced as `/assets/images/posts/filename.jpg`.

## Key Conventions

- **Internal links**: always relative paths (e.g. `/blog/2019/...`), never `https://slogoatsss.github.io/...`
- **External links**: all `target="_blank"` links must include `rel="noopener"`
- **Google Analytics**: add ID to `_config.yml` as `google_analytics: G-XXXXXXX` — the include is wired conditionally in both layouts
- **jQuery 3.3.1**: loaded in `<head>` of `old-default.html`; required by `old/lestvica/index.html`
- **`not_published/`**: excluded from Jekyll build; source `.docx` files follow naming `Yu-Gi-Oh! - Članek - [Author] - [Title].docx` — do not move or rename
- New SCSS variables for the dark theme are in `_sass/new-site.scss` (e.g. `$dark-accent: #f97316`)
- **`future: true`** in `_config.yml` — some posts carry future dates and must still build; do not remove this setting
- **Nav note**: `_data/navigation.yml` is the source of truth for all nav links in `default.html` — add entries here to add new nav links
