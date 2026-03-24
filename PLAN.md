# Wisk Yu-Gi-Oh! — Site Rework Plan

## Project
Slovenian Yu-Gi-Oh! Goat Format community site. Built with Jekyll, hosted on GitHub Pages.

---

## Stage 1: AS-IS Refactor ✅ COMPLETE
## Stage 2: New Site Architecture ✅ COMPLETE
## Stage 3: Dark Blog ✅ COMPLETE
## Stage 6: Subcategory Filtering ✅ COMPLETE
## Bugs (post page): Back link, subcategory display, EN search ✅ COMPLETE
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

---

## Stage 7: Quality-of-Life ✅ COMPLETE

- **A1** Prev/next post navigation (same collection, date-sorted)
- **A2** Related posts (up to 3, same collection + subcategory)
- **A3** Featured image support (`image:` frontmatter)
- **B1** Live post count on index pages
- **B2** Empty-state message when filters yield nothing
- **B3** Author hash filter (click author → `#author=Name`, composes with subcategory + search)
- **C1** Hub cards with post counts (pure Liquid)
- **C2** Social links via `_data/social.yml`
- **C3** About/Kontakt page (`/about/`, added to nav)
- **C4** RSS feed (`jekyll-feed`)
- **D1** `pre`/code block styling
- **D2** `hr` styling
- **D3** `.deck-list` class for Yu-Gi-Oh card lists
- **D4** Blockquote upgrade (background tint, no italic)

---

## Stage 7: Quality-of-Life ← NEXT

Grouped into 4 work streams that can be tackled independently.

---

### QoL-A: Post page enhancements
_All changes to `_layouts/post.html` and `_sass/new-site.scss`_

**A1. Prev / next post navigation**
At the bottom of each post, show links to the previous and next post within the same
collection, sorted by date. Pure Liquid — walk `site.[collection]` sorted by date,
find current post by URL, then pick neighbours.

```liquid
{% assign col = site[page.collection] | sort: 'date' %}
{% for p in col %}
  {% if p.url == page.url %}
    {% assign idx = forloop.index0 %}
  {% endif %}
{% endfor %}
```
Display in `.post-nav` alongside the existing "Back" link:
`← Prejšnja | Naslednja →` (or Previous/Next for EN).

**A2. Related posts (same collection + subcategory)**
After `.post-content`, before `.post-nav`, show up to 3 posts from the same
collection that share at least one subcategory with the current post.
Pure Liquid, no JS. Labelled "Podobni članki" / "Related posts".

**A3. Featured image display**
If `page.image` is set in frontmatter, render it as a hero image below the `<h1>`
and above `.post-meta`. `jekyll-seo-tag` already uses `page.image` for OG tags —
this just adds the visible `<img>`.

---

### QoL-B: Index page enhancements
_Changes to all 4 section `index.html` files and the shared JS block_

**B1. Live post count**
Above the post list, show "X rezultatov" (or "X results" for EN) that updates
dynamically as the subcategory or search filter changes.
Implementation: a `<span id="post-count">` updated by `applyFilters()` JS.

**B2. Empty-state message**
When no posts match the current filter+search, show a friendly message
("Ni rezultatov." / "No results.") instead of a blank list.

**B3. Author hash-based filter**
On index pages, make author names clickable: clicking an author appends
`#author=Name` to the URL and filters the list to that author only.
On page load, read the hash and pre-apply the filter.
Composes with the existing subcategory + search filters (three-way AND).

---

### QoL-C: Hub + site infrastructure
_Small wins with good maintainability payoff_

**C1. Hub cards with post counts**
Each hub card on `index.html` shows the total number of posts in that section.
Pure Liquid: `{{ site.clanki | size }}`.

**C2. Social links via `_data/social.yml`**
Move the hardcoded YouTube link in `default.html` footer to `_data/social.yml`:
```yaml
- title: YouTube
  url: https://www.youtube.com/channel/UCAKUK9MYS4TfznStFvWmiIQ
  icon: yt  # optional, for future icon support
```
Footer loops over entries. Adding a Discord/Facebook link then requires no HTML edit.

**C3. About / Kontakt page (`/about/`)**
Static page at `about/index.html` (layout: default). Content:
- Short intro to the Wisk community
- Who runs it, how to submit an article
- Links to YouTube and other social

**C4. RSS feed**
Add `jekyll-feed` to `Gemfile` and `_config.yml` `plugins:`. GitHub Pages supports
it natively. Configure per-collection feeds if needed.

---

### QoL-D: Typography & styling
_All in `_sass/new-site.scss`; no layout or content changes_

**D1. `pre` / code block styling**
Currently only inline `code` is styled. Multi-line fenced code blocks (`pre > code`)
need: block padding, scrollable overflow-x, slightly larger font, border.

**D2. `hr` styling**
Markdown `---` in post content renders as plain browser `<hr>`. Style it to match
the dark theme (subtle border, margin).

**D3. Deck list styling**
Yu-Gi-Oh articles often contain card lists. A `.deck-list` CSS class on a `<ul>`
renders it as a compact two-column grid with monospace font — easy to scan.
Authors apply it via:
```markdown
{:.deck-list}
- Monster (20): Card Name ×3, ...
```

**D4. Blockquote / pull-quote upgrade**
Current blockquote has a left accent border + italic text — functional but plain.
Upgrade: slightly larger font, background tint (`$dark-surface`), rounded right
corner, no italic (better for long quoted text).

---

## Content Debt

**135 posts with placeholder date `2013-01-01`**
- 114 in `_clanki/`, 21 in `_reportaze/`
- Real dates need to be researched per article (original publish date from the old site)
- No development work — pure content editing

---

## Nice-to-Have (post-QoL)

- Author pages `/avtor/[slug]/` — requires Jekyll generator plugin
- Pagination for large collections — `jekyll-paginate-v2`
- Global search across all 4 sections — Lunr.js
- Dark/light theme toggle — very low priority

---

## Stage 5: Content Migration ← STALLED

135 posts with placeholder dates need real dates researched and corrected.
`_converted/` batch conversion work is complete.

