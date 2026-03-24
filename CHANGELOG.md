# Changelog

## Refactoring Pass

### T1 — Section index pages → shared include + external JS
- Created `_includes/section-index.html` parameterised with `collection` and `lang` (default `sl`); handles subcat buttons, search input, post list, empty state, result count
- Moved 82-line filter/search IIFE to `assets/js/section-filter.js`; `RESULTS_LABEL` now read from `data-results-label` attribute on `#post-list` instead of hardcoded per page
- Reduced `clanki/index.html`, `reportaze/index.html`, `articles/index.html`, `reports/index.html` from ~118 lines each to 6 lines each (~450 lines of duplicated Liquid + 328 lines of duplicated JS eliminated)

### T2 — Simplify `_layouts/post.html`
- Assigned i18n strings (`t_related`, `t_prev`, `t_back`, `t_next`) once at top based on `page.lang`; removed 4 inline `page.lang == "en"` ternaries
- Unified `col_all` and `col_sorted` into single `col_sorted` variable at top of template (was two separate `sort: 'date'` calls)
- Collapsed 3-loop nav pattern into 1 loop to find `curr_idx` + bracket index access for `prev_post` / `next_post`; eliminated 2 full for-loops (~15 lines)
- Removed dead `{% assign prev_post = nil %}` / `{% assign next_post = nil %}`; inlined `back_url` as `/{{ page.collection }}/` directly in `<a href>`
- Broke 160-char subcategory one-liner into readable multi-line block

### T3 — Hub page → `_data/sections.yml`
- Created `_data/sections.yml` with `key`, `title`, `desc`, `count_label`, `cta` fields for all 4 sections
- `index.html` now loops over `site.data.sections`; reduced from 27 content lines to 10
- Changed `<p class="hub-card-title">` / `<p class="hub-card-desc">` to `<span>` (block-level `<p>` inside `<a>` is invalid HTML5); added `display: block` to both in SCSS

### T4 — `default.html` nav deduplication
- Extracted nav loop to `_includes/nav-links.html`; both desktop `<nav>` and `.mobile-nav` now use `{% include nav-links.html %}`
- Fixed `aria-label="Meni"` hardcoded Slovenian → respects `page.lang` (`Menu` for EN pages)

### T5 — `_config.yml` cleanups
- Added `defaults:` block setting `layout: post` and `lang:` per collection type (EN for `articles`/`reports`, SL for `clanki`/`reportaze`)
- Removed `baseurl: ""` (explicit empty string; unnecessary)

### T6 — SCSS: remove redundant declarations
- Removed `height: 100%` from `html.new-site` (body `height: 100vh` doesn't require it in modern browsers)
- Removed duplicate `display: none` on `.mobile-nav` inside `@media (max-width: 768px)` (already set unconditionally above)
- Removed `font-family: $font-sans` from `.post-header h1` and `h1–h4` inside `.post-content` (inherited from `.new-site`)
- Removed `color: $dark-text` from `.post-header h1`, `h1–h4`, `p`, `blockquote`, and `blockquote p` inside `.post-content` (inherited from `.post-content`)
- Removed `text-align: left` from `.post-content p` (browser default for LTR)

### T7 — Parameterise `_includes/search.html`
- `search.html` now accepts `include.placeholder` and `include.label` parameters with Slovenian defaults
- Removed hardcoded `page.lang == 'en'` check; called from `section-index.html` with correct strings for each language

---

## Stage 7: Quality-of-Life

### QoL-A: Post page enhancements (`_layouts/post.html`)
- **A1 Prev/next navigation** — three-column nav bar at bottom of posts: ← Prejšnja/Previous | Nazaj/Back | Naslednja/Next →, scoped to same collection sorted by date
- **A2 Related posts** — up to 3 posts from same collection sharing a subcategory, shown as "Podobne objave" / "Related posts" section before the nav
- **A3 Featured image** — if `image:` set in frontmatter, renders as `.post-hero` img below title (OG tag already worked, now visible too)

### QoL-B: Index page enhancements (all 4 section index pages)
- **B1 Live post count** — `"X rezultatov"` / `"X results"` above list, updates on every filter/search change
- **B2 Empty-state** — `"Ni rezultatov."` / `"No results."` shown when filters yield nothing
- **B3 Author hash filter** — author names are clickable links; clicking sets `#author=Name` in URL, filters list to that author; toggles off on second click; restored from URL hash on page load; composes with subcategory + search filters

### QoL-C: Hub + infrastructure
- **C1 Hub post counts** — each hub card shows total post count (`{{ site.clanki | size }} objav`, etc.) via pure Liquid
- **C2 Social links data-driven** — footer in `default.html` now loops over `_data/social.yml`; YouTube entry moved there; add new links without touching HTML
- **C3 About page** — `/about/` page created (`about/index.html`); "O nas" added to `_data/navigation.yml`
- **C4 RSS feed** — `jekyll-feed` added to `Gemfile` and `_config.yml` plugins

### QoL-D: Typography & styling (`_sass/new-site.scss`)
- **D1 pre/code blocks** — fenced code blocks get surface background, border, padding, overflow-x scroll; inner `code` resets to transparent
- **D2 hr styling** — `<hr>` in post content styled to match dark theme (muted border, 2rem margin)
- **D3 Deck list** — `.deck-list` class: two-column monospace compact grid for Yu-Gi-Oh card lists; collapses to one column on mobile
- **D4 Blockquote upgrade** — background tint (`$dark-surface`), rounded right corner, text is `$dark-text` (no longer muted/italic)

### New SCSS classes added
`.post-nav-links`, `.related-posts`, `.post-hero`, `.post-count`, `.post-empty`, `.author-filter-link`, `.deck-list`, `.hub-card-count`

---

## Bug Fixes (post page)

- `_layouts/post.html`: "back" link now uses `page.collection` to navigate to the correct section (`/clanki/`, `/reportaze/`, `/articles/`, `/reports/`) instead of always going to `/`
- `_layouts/post.html`: removed `categories:` from post meta; replaced with `subcategories:` displayed in accent colour (`$dark-accent`)
- `_layouts/post.html`: back link text is `"Nazaj"` for SLO posts and `"Back"` for EN posts (`page.lang == 'en'`)
- `_includes/search.html`: search placeholder and aria-label are now in English on EN section pages (`page.lang == 'en'`)
- `_sass/new-site.scss`: added `.post-subcategory` style (accent colour, capitalize) within `.post-header .post-meta`

---

## Subcategory Filtering Rework

- Added `subcategories: [goat]` or `subcategories: [advanced]` frontmatter to all 201 posts across 4 collections
  - `_clanki/` (144 files): date ≥ 2018-09-25 → `goat`; earlier → `advanced`
  - `_reportaze/` (49 files): 12 specific files → `goat` (GOAT All Day All Night, all Coverage–dd.mm.yyyy reports, Peti SloGoatsss coverage, Coverage–19.1.2019, Diaries of a Monarch Madman); rest → `advanced`
  - `_articles/` (6 files): all → `goat`
  - `_reports/` (2 files): all → `goat`
- Updated all 4 section index pages (`clanki/`, `reportaze/`, `articles/`, `reports/`) with dynamic subcategory filter buttons
  - Liquid collects unique subcategories from each collection and renders buttons automatically
  - Default state: first subcategory (alphabetically) auto-selected on load; clicking again deselects (hides all)
  - Search box composes with subcategory filter (AND logic)
  - Fully extensible: new subcategory in any post's frontmatter auto-creates a new button
- Stripped standalone search JS from `_includes/search.html`; search logic now lives in each index page script (composing with subcategory filter)
- Added `.subcat-filter` and `.subcat-btn` styles to `_sass/new-site.scss`
- Added `scripts/add-subcategories.mjs` — idempotent batch script for frontmatter updates

---

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

### Duplicate Removal
- Identified 14 duplicate articles in `_clanki/` where a `2026-03-24` mass-conversion copy existed alongside an original correctly-dated file
- Deleted all 14 `2026-03-24` duplicates; originals preserved unchanged
- 5 edge-case files kept (`nacetov-nemski-yu-gi-oh-koticek` ×3, `slogoatsss` ×2): same title but different content, no originals exist

---

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

