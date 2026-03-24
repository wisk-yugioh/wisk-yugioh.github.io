# Changelog

## Stages 1–4 ✅ COMPLETE

---

## Collection Restructure

- Moved all 227 posts into 4 dedicated collection directories matching the navigation sections:
  - `_clanki/` (164 SLO articles) — from `_posts/` + `_historic/`
  - `_reportaze/` (55 SLO reports) — from `_posts/` + `_sezona/` + `_historic/`
  - `_articles/` (6 EN articles) — from `_blog_en/`
  - `_reports/` (2 EN reports) — from `_blog_en/`
- Updated `_config.yml`: replaced old collections (`historic`, `sezona`, `blog_en`) with 4 new ones; removed global `permalink:` for empty `_posts/`
- Updated all 4 section index pages to use `site.clanki` / `site.reportaze` / `site.articles` / `site.reports` directly (no more cross-collection concat+filter)
- Updated `index.html` hub page to link to the 4 new sections
- Removed old collection dirs (`_posts/`, `_blog_en/`, `_sezona/`, `_historic/`) and old section index dirs (`blog/`, `blog-en/`, `sezona/`, `historic/`)
- Updated `.github/copilot-instructions.md` to reflect new 4-collection architecture
- All post URLs now follow collection prefix pattern (e.g. `/clanki/`, `/reportaze/`, `/articles/`, `/reports/`)

---

- Standardized all ~190 post frontmatters: `lang: sl`/`lang: en` + `categories: [article]` or `categories: [report]`
- Dropped old categories (`arhiv`, `articles`, `english`) in favour of the two-category system
- Batch update script: `scripts/update-categories.mjs` (227 files updated)
- Created 4 new section index pages: `/clanki/`, `/reportaze/`, `/articles/`, `/reports/`
  - SLO pages use Liquid `concat` to combine across collections (`_posts/` + `_historic/` [+ `_sezona/`]) and filter by category
- Updated `_data/navigation.yml`: replaced Blog (SLO), Blog (ENG), 2018/19 Sezona, Arhiv with Članki, Reportaže, Articles, Reports
- Old section pages (`/blog/`, `/blog-en/`, `/sezona/`, `/historic/`) remain on disk but removed from nav

---

- Deleted `old/` directory and all its contents (~130 files — old orange site)
- Deleted `_layouts/old-default.html` and `_layouts/event.html`
- Deleted `_data/old_navigation.yml`
- Deleted `_sass/main.scss` (old orange theme styles)
- Removed `@import "main"` from `assets/css/main.scss`
- Removed "Stara stran → /old/" entry from `_data/navigation.yml`
- Updated `.github/copilot-instructions.md`, `PLAN.md` to reflect single-layer architecture

---

## Stage 5 — Content Migration (in progress)

### not_published/ → Markdown Batch Conversion
- Wrote `scripts/convert-not-published.mjs` — Node.js script using the `mammoth` npm package
- Converted 174 docx/.DOC files from `not_published/` to Jekyll-ready markdown in `_converted/`
- Images extracted per-document to `assets/images/posts/[slug]/` with inline `![]()` references
- Frontmatter auto-generated: `layout: post`, `title`, `author`, `date: 2026-03-24` (placeholder), `categories: [arhiv]`
- Garbled 8.3 filenames (`YU*.DOC`): title extracted from document content; author set to "Neznan"
- Reportaža files: smart author detection (scans backwards for person-name segment)
- Slug deduplication: collisions resolved with `-2`, `-3` suffixes
- 4 files logged as `needs-manual`: 3 PDFs + 1 ODT
- `_converted/CONVERSION_LOG.md` written with full per-file status table
- `_converted/` and `scripts/` added to `exclude:` in `_config.yml`

### Stage 1 — AS-IS Jekyll Refactor
Converted a working-but-messy site into proper Jekyll: valid HTML, SCSS, data-driven nav, asset structure, GA4 analytics include, Gemfile, cleaned all posts.

### Stage 2 — New Site Architecture
Split layout into `default.html` (new) + `old-default.html` (old). Moved all old content under `/old/`. Separated navigation data files.

### Stage 3 — Dark Blog
New `_sass/new-site.scss` dark theme (scoped to `.new-site` body class). New `_layouts/default.html` and `_layouts/post.html`. Converted 20 articles from HTML/DOCX to `_posts/*.md`. Total: 49 posts.

### Stage 4 — Two-Blog Architecture
- Hub page at `/` with two section cards
- Modern blog at `/blog/` (all 49 posts, existing URLs unchanged)
- Historic blog at `/historic/` via Jekyll `historic` collection (empty, ready for content migration)
- Navigation fully data-driven via `_data/navigation.yml`
- `.github/copilot-instructions.md` created
- Bug fixes: dark background not covering full scroll height; footer floating mid-screen

---

## Next: Stage 5 — Historic Blog Content Migration
Migrate DOCX articles from `not_published/` into `_historic/` as Markdown posts.

