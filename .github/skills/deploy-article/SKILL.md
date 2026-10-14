---
name: deploy-article
description: Publish a source article to the correct Jekyll collection, including metadata, images, gallery indexing, and build verification.
---

# Deploy an article

1. Read `DOCUMENTATION.md`. Preserve the original source document in `not_published/`; do not move or rename files already there.
2. Convert the article to Markdown and extract any embedded images to `assets/images/posts/<slug>/`. Review the conversion for missing content, broken formatting, and image references.
3. Save it as `YYYY-MM-DD-<slug>.md` in the correct collection: `_clanki/` (Slovenian article) or `_articles/` (English article). Use the article's publication date, not the conversion date. Include `title`, `date`, and `author`; set the appropriate `subcategories` for filtered collections (`goat`, `advanced`, and/or `HAT`). Collection defaults provide `layout` and language.
4. For articles with images, set frontmatter `image` to a representative root-relative asset path. This supplies both the hero and social link preview through `{% seo %}`; inline images and gallery entries alone do not supply preview metadata. The post layout renders this image automatically, so remove its duplicate Markdown insertion but keep other body images. Articles without images need no `image` field.
5. After adding articles or updating images, run `node scripts/generate-gallery-index.mjs` and keep the generated `_data/gallery_index.json` change. If the image folder and article slugs differ, add an override in `_data/gallery_overrides.yml`.
6. Build with `bundle exec jekyll build` and check the rendered post and metadata. For image-bearing articles, verify that the selected hero appears once and that generated `og:image` and `twitter:image` use the correct absolute asset URL. If build tools are unavailable, explicitly report that rendered metadata could not be verified.
7. Review `git status` and the diff. Do not stage, commit, or push without explicit user approval.
