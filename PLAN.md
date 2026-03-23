# SloGoatsss — Site Rework Plan

## Project
Slovenian Yu-Gi-Oh! Goat Format community site. Built with Jekyll, hosted on GitHub Pages.

---

## Stage 1: AS-IS Refactor ✅ COMPLETE
Refactor existing code using good Jekyll practices and modern standards — **no design or content changes**.

### Completed
- `_config.yml`: fixed `name`→`title`, added `url`, `description`, `lang`, `plugins`, `exclude`
- `Gemfile`: created with `github-pages`, `jekyll-seo-tag`, `jekyll-sitemap`
- `_data/navigation.yml`: created — nav is now data-driven
- `_layouts/default.html`: `<meta charset>`, viewport, `lang`, `{% seo %}`, aria-label, data-driven nav, Unicode footer icons replacing hotlinked images, jQuery moved to `<head>`, inline JS extracted to `assets/js/dropdown.js`
- `_layouts/post.html`: removed inline `<style>` block
- `_includes/analytics.html`: replaced hardcoded wrong-domain UA snippet with GA4, driven by `site.google_analytics`; wired conditionally into layout
- CSS → SCSS: `_sass/main.scss` + `assets/css/main.scss`; fixed CSS bugs (missing `px` units, invalid values, deprecated rules, duplicate media queries)
- `assets/` structure: JS, images, post images all moved to proper locations
- Content: fixed invalid HTML (`font-style=` attr, `p>ul`, `p>h4`, nested LibreOffice DOCTYPEs), removed `console.log()`, removed `bgcolor` attr
- Internal links: all `https://slogoatsss.github.io/...` replaced with relative paths across all HTML and MD files; `http://` → `https://` on external links

---

## Stage 2: Design / UX — UPCOMING
_To be planned. Potential items:_
- Responsive layout improvements
- Typography upgrade
- Better mobile nav
- Player profiles as Jekyll data (`_data/players.yml`) instead of 17 separate HTML files
- Events as Jekyll collections or data instead of manual HTML

## Stage 3: Content & Features — UPCOMING
_To be planned. Potential items:_
- Migrate old articles from `articles/*.html` to Jekyll posts or collection
- Archive content (`not_published/*.docx`) converted to Markdown posts
- Add search
