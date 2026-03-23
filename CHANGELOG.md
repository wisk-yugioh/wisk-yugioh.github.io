# Changelog

## Stage 1 — AS-IS Jekyll Refactor
_Goal: refactor existing code using good Jekyll practices and modern standards. No design or content changes._

### Config & Build
- `_config.yml`: renamed `name` → `title`; added `url`, `baseurl`, `description`, `lang`, `author`, `plugins`, `exclude`; removed broken `jekyll-theme-modernist` theme declaration
- `Gemfile`: created with `github-pages`, `jekyll-seo-tag`, `jekyll-sitemap`

### Layout & Includes
- `_layouts/default.html`: complete rewrite — added `<meta charset="utf-8">`, viewport meta, `lang` attribute on `<html>`, `{% seo %}` tag, `aria-label` on hamburger button, data-driven nav via `{% for item in site.data.navigation %}`, jQuery moved to `<head>`, Unicode emoji footer icons (removed hotlinked Wikipedia/applebase.net images), `rel="noopener"` on external links, analytics wired conditionally via `{% if site.google_analytics %}`
- `_layouts/post.html`: removed inline `<style>` block (moved to SCSS)
- `_includes/analytics.html`: replaced legacy Universal Analytics snippet (wrong domain `jmcglone.com`) with GA4 snippet driven by `{{ site.google_analytics }}` config variable

### CSS → SCSS
- Converted `css/main.css` to `_sass/main.scss` (partials) + `assets/css/main.scss` (entry point)
- Fixed CSS bugs:
  - `.gallery img`: `height: 100` / `width: 100` → `height: auto` / `width: 100%` (missing `px` unit caused broken gallery)
  - `#footer`: removed invalid `text-align: center-left`
  - Removed deprecated `@viewport` rule
  - Removed IE8 `filter: alpha(opacity=...)` hacks
  - Removed unused `-ms-`, `-o-`, `-moz-` vendor prefixes for `transform`
  - Deduplicated identical `@media` blocks for `nav ul, footer ul`
  - Nested media queries with SCSS `&` syntax for clarity
  - Added `.post { text-align: justify }` (moved from post.html inline style)
  - Extracted brand colors into `$brand-color` / `$brand-dark` variables
- Moved `css/scape2.jpg` and `css/border.png` to `assets/images/`

### Assets Structure
- Created `assets/js/`, `assets/images/`, `assets/images/posts/`, `assets/css/`, `_sass/`
- Moved `_layouts/jquery-3.3.1.min.js` → `assets/js/jquery-3.3.1.min.js`
- Moved `_layouts/header.js` → `assets/js/header.js`
- Moved `_layouts/F_icon.png` → `assets/images/F_icon.png`
- Removed duplicate `lestvica/jquery-3.3.1.min.js`
- Moved `_posts/pics/` images → `assets/images/posts/`
- Extracted inline dropdown JS → `assets/js/dropdown.js`

### Data
- `_data/navigation.yml`: created with all 9 nav links — replaces hardcoded `<li>` items in layout

### Content Fixes
- `arhiv/index.html`: `font-style="italic"` invalid HTML attribute → `style="font-style: italic"` CSS
- `eventi/index.html`: removed `<p>` wrappers around `<ul>` (invalid HTML); replaced all `https://slogoatsss.github.io/blog/...` with relative `/blog/...` paths
- `eventi/2018-09-29/index.html`: removed full nested LibreOffice-exported `<!DOCTYPE HTML>` / `<head>` / `<body>` — rewrote as clean HTML fragment
- `uvod/index.html`: same nested DOCTYPE issue — stripped outer document structure, kept only body content
- `articles/index.html`: removed `<p>` wrappers around `<ul>`; replaced absolute internal URLs with relative paths
- `articles/art4-tech2.html`: replaced absolute internal URL with relative path
- `deckliste/index.html`: removed invalid `<p><h4>` nesting
- `index.html`: removed `<p>` wrappers around `<ul>`, upgraded `http://` external links to `https://`, added `rel="noopener"` on `target="_blank"` links
- `lestvica/index.html`: removed `console.log()` debug statements left in production code
- `_posts/2018-10-17-flisek-intervju.md`: updated image path from raw GitHub URL to `/assets/images/posts/`
- `_posts/2019-02-15-nik-report.md`: updated 4 image paths from raw GitHub URLs to `/assets/images/posts/`
- All `_posts/*.md`: replaced all `https://slogoatsss.github.io/blog/...` links with relative `/blog/...` paths

---

## Stage 2 — New Site Architecture

### Deleted
- `izposojevalnica/` directory removed entirely
- Removed from `_data/navigation.yml`

### Layout split
- `_layouts/default.html` → renamed to `_layouts/old-default.html` (old site keeps its look)
- New `_layouts/default.html` created — minimal blank layout for the new site
- `_layouts/post.html` and `_layouts/event.html` updated to use `layout: old-default`
- All 75 old content pages updated: `layout: default` → `layout: old-default`

### Navigation split
- `_data/navigation.yml` → simplified to new site nav (home only)
- New `_data/old_navigation.yml` created with all old nav links prefixed with `/old/`
- `_layouts/old-default.html` updated to use `site.data.old_navigation`

### Content moved under /old/
- `arhiv/`, `articles/`, `blog/`, `deckliste/`, `eventi/`, `lestvica/`, `liga/`, `profili/`, `uvod/` → all moved under `old/`
- `_config.yml` permalink changed to `/old/blog/:year/:month/:day/:title`
- All absolute internal links in old content prefixed with `/old/` (HTML + MD files)

### New site root
- New `index.html` at `/` — blank new site with "Stara spletna stran →" link to `/old/`
- `old/index.html` — old site entry page with original homepage content + "← Nazaj" link
