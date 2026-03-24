# Wisk Yu-Gi-Oh! — Site Rework Plan

## Project
Slovenian Yu-Gi-Oh! Goat Format community site. Built with Jekyll, hosted on GitHub Pages.

---

## Stage 1: AS-IS Refactor ✅ COMPLETE
## Stage 2: New Site Architecture ✅ COMPLETE
## Stage 3: Dark Blog ✅ COMPLETE
See CHANGELOG.md for full details on all completed stages.

### Current state (after Stage 3 + old site removal + category rework + collection restructure)
```
/                   ← hub page (links to 4 sections)
/clanki/...         ← SLO articles (164 posts, _clanki/ collection)
/reportaze/...      ← SLO reports (55 posts, _reportaze/ collection)
/articles/...       ← EN articles (6 posts, _articles/ collection)
/reports/...        ← EN reports (2 posts, _reports/ collection)
/assets/            ← shared CSS/JS/images
```

### Post structure
All ~227 posts have `lang: sl` or `lang: en` and `categories: [article]` or `categories: [report]`. Collection membership determines URL prefix.

| Collection | Count | URL prefix |
|---|---|---|
| `_clanki/` | 164 | `/clanki/` |
| `_reportaze/` | 55 | `/reportaze/` |
| `_articles/` | 6 | `/articles/` |
| `_reports/` | 2 | `/reports/` |

### Post breakdown (49 total)
- 29 original Slovenian blog posts/coverage (2018–2019)
- 6 English articles by siwski (categories: articles, english)
- 14 archived Slovenian articles by various authors (categories: arhiv, 2013–2017)

---

## Stage 6: Subcategory Filtering ✅ COMPLETE

- Added `subcategories: [goat|advanced]` to all 201 posts
- Dynamic subcategory filter buttons on all 4 section index pages
- First subcategory (alphabetically) auto-selected on load; search + subcat compose
- See CHANGELOG.md for full details

---

## Stage 4: Extended Features ← NEXT
_To be planned. Ideas:_
- Tag/category filtering on blog index
- Pagination
- About page
- Improved post typography and images

## Stage 5: Content Migration ← IN PROGRESS

### Completed
- Batch conversion of all `not_published/` documents to markdown (`_converted/`)
- See `_converted/CONVERSION_LOG.md` for status of all 178 files

### Next steps
- Review converted files in `_converted/`, fix dates and authors where needed
- Move reviewed articles to `_historic/` (for older archived content) or `_posts/` (for newer)
- Handle the 4 `needs-manual` files (3 PDFs, 1 ODT) manually
