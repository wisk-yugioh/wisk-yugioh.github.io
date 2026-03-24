/**
 * add-subcategories.mjs
 * Adds `subcategories: [goat]` or `subcategories: [advanced]` to every post
 * in _clanki/, _reportaze/, _articles/, _reports/.
 *
 * Rules:
 *   _clanki/   : date >= 2018-09-25 → goat, else → advanced
 *   _reportaze/: specific files → goat (see GOAT_REPORTAZE set), rest → advanced
 *   _articles/ : all → goat
 *   _reports/  : all → goat
 *
 * Idempotent: skips files that already have a `subcategories:` line.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

// Exact filenames (basenames) of goat reportaze
const GOAT_REPORTAZE = new Set([
  '2017-12-28-goat-all-day-all-night.md',
  '2018-10-01-Coverage-29-9-2018.md',
  '2018-10-21-Coverage-20-10-2018.md',
  '2018-11-18-coverage.md',
  '2018-12-22-dec-coverage.md',
  '2019-01-19-peti-slogoatsss-turnir-coverage.md',
  '2019-01-20-coverage-jan.md',
  '2019-02-15-nik-report.md',
  '2019-02-25-coverage-feb.md',
  '2019-04-27-coverage.md',
  '2019-05-14-coverage.md',
  '2019-06-09-coverage.md',
]);

// Parse YYYY-MM-DD date from a filename like "2018-09-25-some-slug.md"
function parseDateFromFilename(filename) {
  const m = filename.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-/);
  if (!m) return null;
  // Normalise to YYYY-MM-DD with zero-padding for comparison
  const y = m[1].padStart(4, '0');
  const mo = m[2].padStart(2, '0');
  const d = m[3].padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function determineSubcategory(collection, filename) {
  if (collection === 'articles' || collection === 'reports') return 'goat';
  if (collection === 'reportaze') return GOAT_REPORTAZE.has(filename) ? 'goat' : 'advanced';
  if (collection === 'clanki') {
    const date = parseDateFromFilename(filename);
    if (!date) return 'advanced';
    return date >= '2018-09-25' ? 'goat' : 'advanced';
  }
  return 'advanced';
}

function processCollection(collection) {
  const dir = join(ROOT, `_${collection}`);
  let files;
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.md'));
  } catch (e) {
    console.error(`Cannot read _${collection}/: ${e.message}`);
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const filename of files) {
    const filepath = join(dir, filename);
    const content = readFileSync(filepath, 'utf8');

    // Skip if already has subcategories
    if (/^subcategories:/m.test(content)) {
      skipped++;
      continue;
    }

    const subcat = determineSubcategory(collection, filename);

    // Insert `subcategories: [X]` after the `categories:` line if present,
    // otherwise after the closing `---` of frontmatter
    let newContent;
    if (/^categories:/m.test(content)) {
      newContent = content.replace(
        /^(categories:.*)/m,
        `$1\nsubcategories: [${subcat}]`
      );
    } else {
      // Insert before closing --- of frontmatter
      newContent = content.replace(
        /^(---\n[\s\S]*?\n)(---)/m,
        `$1subcategories: [${subcat}]\n$2`
      );
    }

    if (newContent === content) {
      console.warn(`  WARN: Could not insert subcategory into ${filename}`);
      skipped++;
      continue;
    }

    writeFileSync(filepath, newContent, 'utf8');
    updated++;
  }

  console.log(`_${collection}/: ${updated} updated, ${skipped} skipped`);
}

console.log('Adding subcategories to all posts...\n');
for (const col of ['clanki', 'reportaze', 'articles', 'reports']) {
  processCollection(col);
}
console.log('\nDone.');
