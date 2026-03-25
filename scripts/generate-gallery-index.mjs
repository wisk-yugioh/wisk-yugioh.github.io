#!/usr/bin/env node
/**
 * generate-gallery-index.mjs
 *
 * Scans assets/images/posts/ for image folders, matches each folder slug to an
 * article in one of the 4 collections (_clanki, _articles, _reportaze, _reports),
 * and writes _data/gallery_index.json for use by the gallery page.
 *
 * Slug overrides for articles that were renamed after image export are read from
 * _data/gallery_overrides.yml (format: "image-folder-slug: article-slug").
 *
 * Usage:
 *   node scripts/generate-gallery-index.mjs           # generate _data/gallery_index.json
 *   node scripts/generate-gallery-index.mjs --audit   # print match status for every folder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const IMAGES_DIR = path.join(ROOT, 'assets', 'images', 'posts');
const OUTPUT_FILE = path.join(ROOT, '_data', 'gallery_index.json');
const OVERRIDES_FILE = path.join(ROOT, '_data', 'gallery_overrides.yml');

const COLLECTIONS = [
  { dir: '_clanki', urlPrefix: '/clanki' },
  { dir: '_articles', urlPrefix: '/articles' },
  { dir: '_reportaze', urlPrefix: '/reportaze' },
  { dir: '_reports', urlPrefix: '/reports' },
  { dir: '_objave', urlPrefix: '/objave' },
  { dir: '_announcements', urlPrefix: '/announcements' },
];

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

const isAudit = process.argv.includes('--audit');

// --- Front matter parsing (no external deps) ---
function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const yaml = match[1];
  const result = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) {
      result[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return result;
}

// --- Override file parsing (simple key: value YAML) ---
function parseOverrides(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && value) result[key] = value;
  }
  return result;
}

// --- Build article lookup: slug -> { title, url } ---
function buildArticleLookup() {
  const lookup = {};
  for (const { dir, urlPrefix } of COLLECTIONS) {
    const collectionDir = path.join(ROOT, dir);
    if (!fs.existsSync(collectionDir)) continue;
    for (const filename of fs.readdirSync(collectionDir)) {
      if (!filename.endsWith('.md') && !filename.endsWith('.html')) continue;
      // filename: YYYY-MM-DD-slug.md
      const slugMatch = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|html)$/);
      if (!slugMatch) continue;
      const [, year, month, day, slug] = slugMatch;
      const filePath = path.join(collectionDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const fm = parseFrontMatter(content);
      const title = fm.title || slug;
      const url = `${urlPrefix}/${year}/${month}/${day}/${slug}`;
      lookup[slug] = { title, url };
    }
  }
  return lookup;
}

// --- Main ---
const overrides = parseOverrides(OVERRIDES_FILE);
const articleLookup = buildArticleLookup();

const imageFolders = fs.readdirSync(IMAGES_DIR)
  .filter(f => fs.statSync(path.join(IMAGES_DIR, f)).isDirectory())
  .sort();

const galleryEntries = [];
const auditRows = [];

for (const folderSlug of imageFolders) {
  // Resolve the article slug: use override if present, else try exact match
  const resolvedSlug = overrides[folderSlug] || folderSlug;
  const article = articleLookup[resolvedSlug];

  const folderPath = path.join(IMAGES_DIR, folderSlug);
  const imageFiles = fs.readdirSync(folderPath)
    .filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => {
      // Sort image-N files numerically
      const numA = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const numB = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return numA - numB;
    });

  if (isAudit) {
    const status = article
      ? (overrides[folderSlug] ? 'OVERRIDE' : 'MATCHED')
      : 'UNMATCHED';
    auditRows.push({ folderSlug, resolvedSlug, status, imageCount: imageFiles.length, articleTitle: article?.title ?? '' });
    continue;
  }

  if (!article) {
    // Skip unmatched folders (user must add to gallery_overrides.yml)
    continue;
  }

  for (const imageFile of imageFiles) {
    galleryEntries.push({
      src: `/assets/images/posts/${folderSlug}/${imageFile}`,
      articleUrl: article.url,
      articleTitle: article.title,
      folderSlug,
    });
  }
}

if (isAudit) {
  const unmatched = auditRows.filter(r => r.status === 'UNMATCHED');
  const matched = auditRows.filter(r => r.status === 'MATCHED');
  const overridden = auditRows.filter(r => r.status === 'OVERRIDE');

  console.log(`\n=== Gallery Index Audit ===`);
  console.log(`Total image folders: ${auditRows.length}`);
  console.log(`  Matched (auto):  ${matched.length}`);
  console.log(`  Matched (override): ${overridden.length}`);
  console.log(`  UNMATCHED:       ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log(`\n--- UNMATCHED folders (add to _data/gallery_overrides.yml) ---`);
    for (const row of unmatched) {
      console.log(`  ${row.folderSlug}: <correct-article-slug>   # ${row.imageCount} images`);
    }
  }
  if (overridden.length > 0) {
    console.log(`\n--- OVERRIDE mappings active ---`);
    for (const row of overridden) {
      console.log(`  ${row.folderSlug} -> ${row.resolvedSlug}  (${row.articleTitle})`);
    }
  }
  console.log('');
} else {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(galleryEntries, null, 2), 'utf8');
  console.log(`Gallery index written: ${OUTPUT_FILE}`);
  console.log(`  ${galleryEntries.length} images from ${imageFolders.length} folders`);
  const skipped = imageFolders.length - [...new Set(galleryEntries.map(e => e.folderSlug))].length;
  if (skipped > 0) {
    console.log(`  WARNING: ${skipped} folder(s) had no article match and were skipped.`);
    console.log(`  Run with --audit to identify them, then add to _data/gallery_overrides.yml`);
  }
}
