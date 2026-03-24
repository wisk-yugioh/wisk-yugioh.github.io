# GitHub Copilot Instructions

## Project

**Wisk Yu-Gi-Oh!** — Slovenian Yu-Gi-Oh! Goat Format community site. Built with Jekyll, hosted on GitHub Pages. Site language is Slovenian (`lang: sl`), some posts are in English.

## Session Start

Always read these files first:
- `PLAN.md` — current stage goals and open items
- `CHANGELOG.md` — full history of completed work
- `TODOS.md` — current active todo list

Use the SQL `todos` table for in-session tracking. After completing work, update `CHANGELOG.md` and `PLAN.md`.

## Architecture

The site uses a single layout (`default.html`) with nav data from `_data/navigation.yml`.

The site has 4 content sections, each backed by a dedicated Jekyll collection:

| Section | URL prefix | Collection dir | Jekyll variable | Content |
|---|---|---|---|---|
| Članki | `/clanki/` | `_clanki/` | `site.clanki` | SLO articles (164) |
| Reportaže | `/reportaze/` | `_reportaze/` | `site.reportaze` | SLO reports (55) |
| Articles | `/articles/` | `_articles/` | `site.articles` | EN articles (6) |
| Reports | `/reports/` | `_reports/` | `site.reports` | EN reports (2) |

Plus the hub:

| Page | URL | Source |
|---|---|---|
| Hub | `/` | `index.html` — static, links to the 4 sections |

**Adding a new section** — 4 steps:
1. Add a collection to `_config.yml`:
   ```yaml
   collections:
     mysection:
       output: true
       permalink: /mysection/:year/:month/:day/:title
   ```
2. Create `_mysection/` directory
3. Create `mysection/index.html` — copy any existing section index, replace `site.clanki` with `site.mysection`
4. Add a nav entry to `_data/navigation.yml`

**Moving a post between sections** — 1 step:
- Move the `.md` file to the correct collection directory. Also update `categories:` and `lang:` in frontmatter if changing content type or language.
- Examples:
  - SLO article: file lives in `_clanki/`
  - SLO report: file lives in `_reportaze/`
  - EN article: file lives in `_articles/`
  - EN report: file lives in `_reports/`

All site styles live in `_sass/new-site.scss`, scoped entirely under the `.new-site` body class (set in both `<html>` and `<body>` in `default.html`).

SCSS entry point is `assets/css/main.scss`, which imports:
- `_sass/new-site.scss` — dark blog styles (scoped to `.new-site`)

Navigation is data-driven via `_data/navigation.yml` — never hardcode nav links in `default.html`.

## Layout Behaviour

All new-site pages use a **fixed viewport layout**: header and footer are always visible; only `.site-main` scrolls. This is the default and must be preserved on all new sections unless explicitly decided otherwise.

Implementation: `body.new-site` is `height: 100vh; overflow: hidden; display: flex; flex-direction: column`. `.site-main` has `flex: 1; overflow-y: auto`. Header/footer have `flex-shrink: 0`.

## Post Conventions

File naming: `YYYY-MM-DD-slug.md` — place in the correct collection directory.

Frontmatter fields:
```yaml
---
layout: post
title: "Post Title"
date: YYYY-MM-DD
author: "Author Name"   # required — shown on index and post page
description: "One sentence summary"  # recommended — used for SEO meta description
lang: sl                # sl for Slovenian, en for English
categories: [article]   # article or report
---
```

Permalink pattern (per collection):
- SLO: `/clanki/:year/:month/:day/:title` or `/reportaze/:year/:month/:day/:title`
- EN: `/articles/:year/:month/:day/:title` or `/reports/:year/:month/:day/:title`

Post images go in `assets/images/posts/` and are referenced as `/assets/images/posts/filename.jpg`.

## Key Conventions

- **Internal links**: always relative paths (e.g. `/clanki/2019/...`), never `https://wisk-yugioh.github.io/...`
- **External links**: all `target="_blank"` links must include `rel="noopener"`
- **Google Analytics**: add ID to `_config.yml` as `google_analytics: G-XXXXXXX` — the include is wired conditionally in `default.html`
- **`not_published/`**: excluded from Jekyll build; source `.docx` files follow naming `Yu-Gi-Oh! - Članek - [Author] - [Title].docx` — do not move or rename
- New SCSS variables for the dark theme are in `_sass/new-site.scss` (e.g. `$dark-accent: #f97316`)
- **`future: true`** in `_config.yml` — some posts carry future dates and must still build; do not remove this setting
- **Nav note**: `_data/navigation.yml` is the source of truth for all nav links in `default.html` — add entries here to add new nav links
