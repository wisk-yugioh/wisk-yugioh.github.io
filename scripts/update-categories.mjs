#!/usr/bin/env node
// scripts/update-categories.mjs
// Batch-updates frontmatter in all posts:
//   - Sets lang: sl on SLO files (those without lang: en)
//   - Replaces categories with [article] or [report] per classification

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Classification maps ─────────────────────────────────────────────────────

// _posts/ — keyed by filename stem (without date prefix doesn't matter, use full basename)
const POSTS_MAP = {
  '2018-09-15-najava.md': 'article',
  '2018-09-18-Iz-Mete-v-Goate.md': 'article',
  '2018-09-22-Diaries-Uvod.md': 'article',
  '2018-09-25-Zakaj-igram-Goat-Format.md': 'article',
  '2018-10-10-diaries-solutions.md': 'article',
  '2018-10-13-pogoste-napake.md': 'article',
  '2018-10-17-flisek-intervju.md': 'article',
  '2018-11-02-side-deckanje.md': 'article',
  '2018-11-11-goat-deck.md': 'article',
  '2018-11-22-goat-vs-chaos.md': 'article',
  '2018-12-03-BURN v Goat Formatu.md': 'article',
  '2018-12-12-SEŽIGANJE-KOZJIH-PODOBIC.md': 'article',
  '2019-01-28-Kako-igrati-proti-Monarchom.md': 'article',
  '2019-02-15-nik-report.md': 'report',
  '2019-03-06-jaka-interview.md': 'article',
  '2019-03-14-kratka-predstavitev-chaosa.md': 'article',
  '2019-04-16-zakaj-je-goat-control-the-best-deck.md': 'article',
  '2019-09-10-goatformat-ni-bavbav.md': 'article',
};

// _blog_en/ — keyed by basename
const BLOG_EN_MAP = {
  '2019-01-12-colosseum-report.md': 'report',
  '2019-03-01-dealing-with-chaos-turbo.md': 'article',
  '2019-03-08-overview-of-some-goat-control-builds.md': 'article',
  '2019-03-15-goat-control-tech-chaos-sorcerer-and-blade-knight.md': 'article',
  '2019-03-22-goat-control-tech-dekoichi-the-battlechanted-locomotive.md': 'article',
  '2019-04-01-short-guide-on-stalling.md': 'article',
  '2019-04-08-my-thoughts-and-advice-about-standard-goat-control.md': 'article',
  '2019-04-26-Lux-report.md': 'report',
};

// _historic/ real-date files — keyed by basename
const HISTORIC_REAL_MAP = {
  '2013-07-06-fortunat-evilswarm.md': 'article',
  '2013-09-22-kovacic-the-spirit.md': 'article',
  '2014-06-03-fortunat-trg.md': 'article',
  '2014-07-04-fortunat-banlista.md': 'article',
  '2015-05-31-saksida-drzavno.md': 'report',
  '2015-06-12-rostohar-meta.md': 'article',
  '2015-06-14-klemencic-sestavek.md': 'report',
  '2015-06-30-rostohar-priprave.md': 'article',
  '2015-09-01-kovacic-katastrofa.md': 'article',
  '2015-09-07-klemencic-purgatory.md': 'article',
  '2015-10-25-kes-fire-fist.md': 'report',
  '2015-10-25-skok-report.md': 'article',
  '2017-03-27-gruden-ycs-praga.md': 'report',
  '2017-08-26-alenLLDS-report.md': 'report',
};

// _historic/ batch (2026-03-24) — keyed by slug (without date prefix)
// Slugs that are REPORTS — everything else is article
const BATCH_REPORT_SLUGS = new Set([
  'dan-turnirja',
  'david-vidic-vs-marko-bela',
  'double-elimination-masters-2012',
  'finale-open-mini',
  'game-3',
  'goat-all-day-all-night-28122017',
  'jaka-fortunat-vs-alain-ly',
  'jutro',
  'llds-dd-vic-26082017',
  'luxury-32-man-goat-format-tournament-report-and-some-other-stuff',
  'luxury-gaming-2018-colosseum-goat-format-tournament-report',
  'masters-2012-finale',
  'masters-2012-tocke',
  'miha-flisek-vs-marko-bela',
  'na-yugioh-championship-series',
  'petek-21-5-2010',
  'peti-slogoatsss-turnir-coverage',
  'ponovni-top-slovenskega-drzavnega-2019-z-ne-top-meta-deckom',
  'regionals-2015-report',
  'regionals-24-10-2015',
  'regionals-vikend-stevilka-ena',
  'reportaza-vikenda-kaj-sem-spoznal',
  'report-drazavno-prvenstvo-2012',
  'report-evropskega-prvenstva-v-yu-gi-oh-2013-in-opis-decka-planter-evilswarmi',
  'report-summer-cupa-2013',
  'round-1',
  'sel-sem-do-prve-mize-in-se-usedel-ceprav-je-bil-en-duel-ze-mimo-sem-nadaljeval-p',
  'slogoatsss',
  'slogoatsss-2',
  'slogoatsss-side-event-vic-1912019',
  'slovenski-3v3-masters-2013',
  'tjb-locals-tour',
  'top-8-slo-nats-kajetan-krnel',
  'vid-gruden-o-openu',
  'winter-challenge-finale-drago-godnjov-vs-karlo-mrvi',
  'winter-challenge-top-4-report-drago-godnjov-vs-rok-vujanovi',
  'winter-challenge-top-8-report-drago-godnjov-vs-jan-kokotec',
  'ycs-gent-report',
  'zmaga',
  'z-malo-zamude',
]);

// ─── Frontmatter updater ─────────────────────────────────────────────────────

function updateFrontmatter(content, category, isEn) {
  // Split into frontmatter and body
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    console.warn('  WARNING: no frontmatter found, skipping');
    return content;
  }

  let fm = match[1];
  const body = match[2];

  // Remove existing categories line(s)
  fm = fm.replace(/^categories:.*\n?/m, '');
  // Remove existing lang line
  fm = fm.replace(/^lang:.*\n?/m, '');

  // Add lang (sl for SLO, en stays)
  const langLine = isEn ? 'lang: en' : 'lang: sl';
  fm = fm.trimEnd() + '\n' + langLine + '\n';

  // Add categories
  fm += `categories: [${category}]\n`;

  return `---\n${fm}---\n${body}`;
}

// ─── Process a directory ─────────────────────────────────────────────────────

function processDir(dir, getCategory, isEn = false) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const category = getCategory(file, dir);
    if (!category) {
      console.log(`  SKIP (no category): ${file}`);
      skipped++;
      continue;
    }

    const filepath = path.join(dir, file);
    const original = fs.readFileSync(filepath, 'utf-8');
    const updated_content = updateFrontmatter(original, category, isEn);

    if (updated_content !== original) {
      fs.writeFileSync(filepath, updated_content, 'utf-8');
      updated++;
    }
  }

  console.log(`  ${updated} updated, ${skipped} skipped`);
  return updated;
}

// ─── Main ────────────────────────────────────────────────────────────────────

let totalUpdated = 0;

// _posts/
console.log('\n[_posts/]');
totalUpdated += processDir(
  path.join(ROOT, '_posts'),
  (file) => POSTS_MAP[file] ?? null,
  false
);

// _blog_en/
console.log('\n[_blog_en/]');
totalUpdated += processDir(
  path.join(ROOT, '_blog_en'),
  (file) => BLOG_EN_MAP[file] ?? null,
  true
);

// _sezona/ — all reports
console.log('\n[_sezona/]');
totalUpdated += processDir(
  path.join(ROOT, '_sezona'),
  (_file) => 'report',
  false
);

// _historic/ — real dates + batch
console.log('\n[_historic/]');
totalUpdated += processDir(
  path.join(ROOT, '_historic'),
  (file) => {
    // Real date files
    if (HISTORIC_REAL_MAP[file]) return HISTORIC_REAL_MAP[file];

    // Batch files (2026-03-24-)
    if (file.startsWith('2026-03-24-')) {
      const slug = file.replace(/^2026-03-24-/, '').replace(/\.md$/, '');
      return BATCH_REPORT_SLUGS.has(slug) ? 'report' : 'article';
    }

    return null;
  },
  false
);

console.log(`\nDone. Total files updated: ${totalUpdated}`);
