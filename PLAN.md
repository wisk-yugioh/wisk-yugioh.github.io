# Wisk Yu-Gi-Oh! — Site Rework Plan

## Project
Slovenian Yu-Gi-Oh! Goat Format community site. Built with Jekyll, hosted on GitHub Pages.

---

## Stage 1: AS-IS Refactor ✅ COMPLETE
## Stage 2: New Site Architecture ✅ COMPLETE
## Stage 3: Dark Blog ✅ COMPLETE
## Stage 6: Subcategory Filtering ✅ COMPLETE
See CHANGELOG.md for full details on all completed stages.

### Current state
```
/                   ← hub page (links to 4 sections)
/clanki/...         ← SLO articles (144 posts, _clanki/ collection)
/reportaze/...      ← SLO reports (49 posts, _reportaze/ collection)
/articles/...       ← EN articles (6 posts, _articles/ collection)
/reports/...        ← EN reports (2 posts, _reports/ collection)
/assets/            ← shared CSS/JS/images
```

All posts have `subcategories: [goat|advanced]`. Sections show subcategory filter buttons
(first auto-selected), with search composing on top.

---

## Stage 4: Extended Features — NEXT

Ideas tracked below, grouped by priority.

---

## Stage 5: Content Migration ← STALLED

### Completed
- Batch conversion of all `not_published/` documents to markdown (`_converted/`)

### Remaining
- 135 posts still carry placeholder date `2013-01-01` (114 in _clanki/, 21 in _reportaze/)
  — real dates need to be researched and corrected per article
- Handle any remaining manually-needed files (PDFs, ODT)

---

## Future Improvements — Ideas & Suggestions

### 🔴 Bugs / Required Fixes — ✅ COMPLETE

~~1. "Back" link on post pages points to hub~~ — fixed: uses `page.collection`
~~2. Subcategory not shown on post page~~ — fixed: shown in accent colour, replaces categories
~~3. Search placeholder Slovenian on EN sections~~ — fixed: uses `page.lang` check

---

### 🟡 Quality-of-Life Improvements

### 🟡 Quality-of-Life Improvements

**4. Prev / next post navigation**
Add previous/next links at the bottom of each post, scoped to the same collection
and subcategory. Jekyll `site.[collection]` can be sorted and indexed.

**5. Hub cards showing post counts**
Each card on `index.html` could show how many articles exist per section/subcategory
(e.g., "144 člankov · Goat / Advanced"). Purely Liquid, zero JS.

**6. Post count / empty-state message on index pages**
When a subcategory is selected, show "X articles" above the list (or "Ni rezultatov"
when search yields nothing). Helps orientation in large collections.

**7. Author name links**
On post pages and index lists, clicking an author name could link to a
`?author=X` query or a dedicated `/avtor/X/` page showing all posts by that author.
(Simplest: client-side JS filter on the index page using a URL hash.)

**8. RSS / Atom feed**
Add `jekyll-feed` to Gemfile for each collection. Goat-format enthusiasts may want
to follow via RSS. GitHub Pages supports `jekyll-feed` natively.

**9. Social / footer links configurable via `_config.yml`**
Currently only YouTube is hardcoded in footer. Move to `_data/social.yml` so links
(YouTube, Facebook, Discord, etc.) can be added without touching layout HTML.

---

### 🟢 Nice-to-Have / Future Stages

**10. About / Kontakt page**
A simple `/about/` page introducing the Wisk community, who runs it, and how to
contribute articles. Could also list all authors.

**11. Author pages**
Dedicated `/avtor/[slug]/` pages listing all posts by a given author. Most useful
for prolific authors (Matej Jakob: 65 articles, Alen Bizjak: 13, etc.).
Requires a custom Jekyll generator plugin or a creative Liquid workaround.

**12. Pagination for large collections**
`_clanki/` has 144 posts rendered into the DOM on every page load. Consider
`jekyll-paginate-v2` (supported on GitHub Pages via Actions) or client-side
virtual scrolling to avoid a heavy initial DOM.

**13. Featured image support in posts**
Add `image:` frontmatter and display it as a header image in `_layouts/post.html`.
`jekyll-seo-tag` already uses `page.image` for Open Graph — adding the `<img>` tag
to the layout is the only missing piece.

**14. Improved post typography**
`_sass/new-site.scss` `.post-content` could get better defaults: blockquotes styled
as pull-quotes, table styling, code blocks with monospace + subtle bg, image
max-width + centering.

**15. Deck profile / card-list format**
Yu-Gi-Oh articles frequently include deck lists (40-card lists). A custom include
or CSS class (`.deck-list`) could render these in a structured, scannable way rather
than plain markdown lists.

**16. Dark/light theme toggle**
The dark theme is the brand identity, but a toggle stored in `localStorage` could
be offered for accessibility. Low priority — dark-only is fine for now.

**17. Related posts**
At the bottom of each post, show 3 posts from the same collection + subcategory.
Pure Liquid: sample `site.[collection]` filtered by `subcategories`, exclude current.

**18. Search across all sections (global search)**
A single search page (`/search/`) that searches across all 4 collections at once.
Could be done with Lunr.js or a simple `site.[collection]` concat in JS.

---

## Priority Order (recommended)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Fix "back" link on post pages | XS | High |
| 2 | Show subcategory on post page | XS | High |
| 3 | Fix search placeholder for EN sections | XS | Low |
| 4 | Post count / empty-state on index | S | Medium |
| 5 | Prev/next post navigation | S | Medium |
| 6 | Social links via `_data/social.yml` | S | Low |
| 7 | Featured image support | S | Medium |
| 8 | Improved post typography | M | High |
| 9 | About page | M | Medium |
| 10 | RSS feed | S | Low |
| 11 | Author filtering (hash-based) | M | Medium |
| 12 | Hub cards with counts | XS | Low |
| 13 | Deck list styling | M | Medium |
| 14 | Related posts | M | Low |
| 15 | Author pages | L | Low |
| 16 | Pagination | L | Low |
| 17 | Global search | L | Medium |
| 18 | Date corrections (135 posts) | XL | High |

