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

The site has two coexisting layers:

| Layer | URL prefix | Layout | Nav data |
|---|---|---|---|
| New dark blog | `/` | `default.html` | `_data/navigation.yml` |
| Old orange site | `/old/` | `old-default.html` | `_data/old_navigation.yml` |

New site styles are scoped entirely under the `.new-site` body class (set in `default.html`) to prevent conflicts with the old site's styles in `_sass/main.scss`.

SCSS entry point is `assets/css/main.scss`, which imports:
- `_sass/main.scss` — old site styles
- `_sass/new-site.scss` — new dark blog styles (scoped to `.new-site`)

Navigation is data-driven — never hardcode nav links in layouts.

## Post Conventions

File naming: `_posts/YYYY-MM-DD-slug.md`

Frontmatter fields:
```yaml
---
layout: post
title: "Post Title"
date: YYYY-MM-DD
author: "Author Name"   # optional
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
- **Nav note**: `_data/navigation.yml` exists but `default.html` currently hardcodes its two nav links directly — the data file is wired for future expansion
