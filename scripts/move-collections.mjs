#!/usr/bin/env node
// scripts/move-collections.mjs
// Moves .md files from old collections into the 4 new collection directories
// based on their lang and categories frontmatter.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Source dirs → all .md files
const SOURCES = ['_posts', '_blog_en', '_sezona', '_historic'];

// Destination dirs
const DEST = {
  clanki: path.join(ROOT, '_clanki'),
  reportaze: path.join(ROOT, '_reportaze'),
  articles: path.join(ROOT, '_articles'),
  reports: path.join(ROOT, '_reports'),
};

// Ensure destination dirs exist
for (const dir of Object.values(DEST)) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = match[1];
  const lang = (fm.match(/^lang:\s*(.+)$/m) ?? [])[1]?.trim();
  const categories = (fm.match(/^categories:\s*\[([^\]]*)\]$/m) ?? [])[1]
    ?.split(',').map(s => s.trim()) ?? [];
  return { lang, categories };
}

function getDestDir(lang, categories) {
  const isEn = lang === 'en';
  const isReport = categories.includes('report');

  if (isEn && !isReport) return DEST.articles;
  if (isEn && isReport) return DEST.reports;
  if (!isEn && !isReport) return DEST.clanki;
  if (!isEn && isReport) return DEST.reportaze;
  return null;
}

const counts = { clanki: 0, reportaze: 0, articles: 0, reports: 0, skipped: 0 };

for (const srcName of SOURCES) {
  const srcDir = path.join(ROOT, srcName);
  if (!fs.existsSync(srcDir)) continue;

  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const content = fs.readFileSync(srcPath, 'utf-8');
    const { lang, categories } = parseFrontmatter(content);
    const destDir = getDestDir(lang, categories);

    if (!destDir) {
      console.warn(`  SKIP (no dest): ${srcName}/${file} lang=${lang} cats=${categories}`);
      counts.skipped++;
      continue;
    }

    const destPath = path.join(destDir, file);
    fs.renameSync(srcPath, destPath);

    const destKey = Object.entries(DEST).find(([, v]) => v === destDir)[0];
    counts[destKey]++;
  }

  // Remove source dir if now empty
  const remaining = fs.readdirSync(srcDir);
  if (remaining.length === 0) {
    fs.rmdirSync(srcDir);
    console.log(`Removed empty dir: ${srcName}/`);
  } else {
    console.log(`WARNING: ${srcName}/ still has ${remaining.length} file(s): ${remaining.join(', ')}`);
  }
}

console.log('\nMoved:');
console.log(`  → _clanki/:    ${counts.clanki}`);
console.log(`  → _reportaze/: ${counts.reportaze}`);
console.log(`  → _articles/:  ${counts.articles}`);
console.log(`  → _reports/:   ${counts.reports}`);
console.log(`  skipped:       ${counts.skipped}`);
