---
name: deploy-article
description: Publish a source article to the correct Jekyll collection, including metadata, images, gallery indexing, and build verification.
---

# Deploy an article

1. Read `DOCUMENTATION.md`. Preserve the original source document in `not_published/`; do not move or rename files already there.
2. Convert the article to Markdown and extract any embedded images to `assets/images/posts/<slug>/`. Review the conversion for missing content, broken formatting, and image references.
3. Save it as `YYYY-MM-DD-<slug>.md` in the correct collection: `_clanki/` (Slovenian article) or `_articles/` (English article). Use the article's publication date, not the conversion date. Include `title`, `date`, and `author`; set the appropriate `subcategories` for filtered collections (`goat`, `advanced`, and/or `HAT`). Collection defaults provide `layout` and language.
4. If images were added or updated, run `node scripts/generate-gallery-index.mjs` and keep the generated `_data/gallery_index.json` change. Add a frontmatter `image` only when an image should be the post's hero image.
5. Build with `bundle exec jekyll build` and check the rendered post, metadata, and images. If the build tools are unavailable, state that the build could not be verified.
6. Review `git status` and the diff. Do not stage, commit, or push without explicit user approval.
