# Wisk Yu-Gi-Oh! — Site Rework Plan

## Project
Slovenian Yu-Gi-Oh! Goat Format community site. Built with Jekyll, hosted on GitHub Pages.

---

## Stage 1: AS-IS Refactor ✅ COMPLETE
## Stage 2: New Site Architecture ✅ COMPLETE
## Stage 3: Dark Blog ✅ COMPLETE
See CHANGELOG.md for full details on all completed stages.

### Current state (after Stage 3 + old site removal + category rework)
```
/                  ← new dark blog hub
/clanki/           ← SLO articles index (from _posts/ + _historic/)
/reportaze/        ← SLO reports index (from _posts/ + _historic/ + _sezona/)
/articles/         ← EN articles index (from _blog_en/)
/reports/          ← EN reports index (from _blog_en/)
/assets/           ← shared CSS/JS/images
```

### Post breakdown
All ~190 posts now have `lang: sl` or `lang: en` and `categories: [article]` or `categories: [report]`.
- `_posts/` (18): SLO, mostly articles
- `_blog_en/` (8): EN, mix of articles/reports
- `_sezona/` (9): SLO, all reports
- `_historic/` (14 real + ~150 batch): SLO, mix

### Post breakdown (49 total)
- 29 original Slovenian blog posts/coverage (2018–2019)
- 6 English articles by siwski (categories: articles, english)
- 14 archived Slovenian articles by various authors (categories: arhiv, 2013–2017)

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
