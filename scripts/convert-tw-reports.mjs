#!/usr/bin/env node
/**
 * convert-tw-reports.mjs
 *
 * Converts TW tournament reports from tjbtwreports/ to Jekyll markdown posts
 * in _reportaze/, and saves embedded images to assets/images/posts/[slug]/.
 *
 * Supported input formats: .pdf, .docx
 *
 * Usage:
 *   node scripts/convert-tw-reports.mjs
 *   node scripts/convert-tw-reports.mjs --file TW090225.pdf   (single file)
 *   node scripts/convert-tw-reports.mjs --dry-run              (preview, no writes)
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Dependencies ────────────────────────────────────────────────────────────
// All packages are already in node_modules (mammoth, pdf-parse, adm-zip)
const mammoth = require('../node_modules/mammoth');
const AdmZip = require('../node_modules/adm-zip');
const { PDFParse } = require('../node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs');

// ─── Constants ───────────────────────────────────────────────────────────────
const SOURCE_DIR = join(ROOT, 'tjbtwreports');
const OUTPUT_DIR = join(ROOT, '_reportaze');
const IMAGES_DIR = join(ROOT, 'assets', 'images', 'posts');

// TW230325.docx is an unfilled template — skip until content is provided.
const SKIP_FILES = ['TW230325.docx'];

// CLI flags
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SINGLE_FILE = (() => {
  const idx = args.indexOf('--file');
  return idx !== -1 ? args[idx + 1] : null;
})();

// ─── Utility helpers ─────────────────────────────────────────────────────────

/**
 * Parse a Slovenian date string like "9. 2. 2025" or "26. 10. 2025"
 * into an ISO date string "YYYY-MM-DD".
 */
function parseSlDate(str) {
  // Match DD. MM. YYYY with optional spaces around dots
  const m = str.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!m) return null;
  const day = m[1].padStart(2, '0');
  const month = m[2].padStart(2, '0');
  const year = m[3];
  return `${year}-${month}-${day}`;
}

/**
 * Generate a URL slug from a date string "YYYY-MM-DD".
 * e.g. "2025-02-09" → "tw-pomurje-09-02-2025"
 */
function dateToSlug(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `tw-pomurje-${day}-${month}-${year}`;
}

/**
 * Determine the author from the text content.
 * All PDFs and TW261025.docx use the pseudonym "Brežiški pastir" = Alen Vukovič.
 * TW250126.docx was submitted without a name; use "Neznan".
 */
function detectAuthor(filename, text) {
  if (/Brežiški pastir/i.test(text)) return 'Alen Vukovič';
  // The January 2026 report explicitly says "Prvič pišem report" and has no signature
  if (filename.startsWith('TW250126')) return 'Neznan';
  // Fallback: assume Alen Vukovič (all known TW Pomurje reports are by him)
  return 'Alen Vukovič';
}

/**
 * Write a file only when not in --dry-run mode.
 */
function writeFile(path, content) {
  if (DRY_RUN) {
    console.log(`  [dry-run] Would write: ${path.replace(ROOT, '')}`);
    return;
  }
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, content);
  console.log(`  ✓ Written: ${path.replace(ROOT, '')}`);
}

// ─── Markdown table helpers ───────────────────────────────────────────────────

/**
 * Try to parse a PDF-extracted stats table block into a Markdown table.
 *
 * The table is detected by recognising a known header pattern (e.g. "Vrsta decka")
 * followed by rows of: text-tokens then numeric-tokens, ending with "Skupaj".
 *
 * Returns a markdown string, or null if parsing fails / produces unreliable output.
 *
 * @param {string[]} lines  Lines that make up the suspected table block.
 * @param {string[]} headers  Known column headers (first is the name column).
 */
function parseStatsTable(lines, headers) {
  const rows = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split line into tokens
    const tokens = trimmed.split(/\s+/);

    // Determine how many trailing tokens are numbers (could be 0-4)
    let numericCount = 0;
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(tokens[i])) numericCount++;
      else break;
    }

    // The first (tokens.length - numericCount) tokens form the row label
    const label = tokens.slice(0, tokens.length - numericCount).join(' ');
    const numbers = tokens.slice(tokens.length - numericCount);

    // Pad with empty cells up to the number of numeric columns (headers.length - 1)
    const numCols = headers.length - 1; // number of numeric columns
    while (numbers.length < numCols) numbers.unshift('');

    rows.push([label, ...numbers]);
  }

  if (rows.length === 0) return null;

  // Build markdown table
  const sep = headers.map(() => '---').join(' | ');
  const headerRow = headers.join(' | ');
  const dataRows = rows.map(r => r.join(' | ')).join('\n');
  return `| ${headerRow} |\n| ${sep} |\n${dataRows.map(r => `| ${r} |`).join('\n')}`;
}

// ─── PDF conversion ───────────────────────────────────────────────────────────

/**
 * Known deck table header patterns in TW reports.
 * The "Finale" column is omitted in smaller tournaments (Top 4 only).
 */
const DECK_TABLE_HEADERS_FULL  = ['Vrsta decka', 'Reprezentativnost dekov', 'Top 8', 'Top 4', 'Finale'];
const DECK_TABLE_HEADERS_SMALL = ['Vrsta decka', 'Reprezentativnost dekov', 'Top 4', 'Finale'];
const REGION_TABLE_HEADERS_FULL  = ['Regija', 'Reprezentativnost regije', 'Top 8', 'Top 4', 'Finale'];
const REGION_TABLE_HEADERS_SMALL = ['Regija', 'Reprezentativnost regije', 'Top 4', 'Finale'];

/**
 * Convert raw PDF text to clean Markdown.
 *
 * Steps:
 *  1. Split into pages on the "-- N of M --" markers inserted by pdf-parse.
 *  2. Remove per-page headers (the running header in the original PDF, e.g.
 *     "Time Wizard Pomurje 9. 2. 2025 Report" that appears at the top of every page).
 *  3. Re-join all text pages, then post-process the known table blocks.
 *  4. Normalise whitespace and build the final markdown body.
 */
function pdfTextToMarkdown(rawText, title) {
  // The running page header looks like: "Time Wizard Pomurje DD. MM. YYYY Report"
  // We remove it and the trailing "Report" word to avoid 10x repetition.
  // Regex: literal title text followed optionally by " Report"
  // Escape special regex chars in the title (dots, parens are fine here since title
  // contains none, but building from string safely anyway).
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // The running header is the title plus " Report" at the end
  const headerRe = new RegExp(`^\\s*${escapedTitle}\\s+Report\\s*$`, 'm');

  // Split on page markers "-- N of M --"
  const pages = rawText.split(/-- \d+ of \d+ --/);

  // Collect cleaned page content (skip pages that are purely images = nearly empty)
  const cleanedPages = pages.map(page => {
    // Remove running header
    const stripped = page.replace(headerRe, '').trim();
    return stripped;
  }).filter(p => p.length > 0);

  // Join with double newline (preserves logical sections)
  let body = cleanedPages.join('\n\n');

  // Remove the leading title line if it appears at the very top of page 1
  // (the document title on the cover page, not the running header)
  body = body.replace(new RegExp(`^${escapedTitle}\\s*\\n`), '');

  // ── Table detection ───────────────────────────────────────────────────────
  // Replace the raw deck stats block with a proper markdown table.
  body = formatTableBlock(body, 'Vrsta decka', 'Skupaj', DECK_TABLE_HEADERS_FULL, DECK_TABLE_HEADERS_SMALL);
  body = formatTableBlock(body, 'Regija', 'Skupaj', REGION_TABLE_HEADERS_FULL, REGION_TABLE_HEADERS_SMALL);

  // ── Heading promotion ────────────────────────────────────────────────────
  // Short standalone lines that look like section headers (e.g. "Runda 1", "Top 8",
  // "Finale", "Povzetek") become H2 headings.
  body = body.replace(/^([A-ZČŠŽ][^\n]{0,50})\n\n/gm, (match, heading) => {
    // Only promote if the "heading" doesn't contain sentence punctuation
    if (/[.,;:!?]/.test(heading)) return match;
    return `## ${heading}\n\n`;
  });

  // Remove the pseudonym signature line — the author is already in frontmatter
  body = body.replace(/^\s*-\s*Brežiški pastir\s*$/m, '');

  // ── Cleanup ───────────────────────────────────────────────────────────────
  // Collapse runs of 3+ blank lines down to 2
  body = body.replace(/\n{3,}/g, '\n\n');
  // Trim trailing whitespace per line
  body = body.split('\n').map(l => l.trimEnd()).join('\n');

  return body.trim();
}

/**
 * Locate a table block in the body text (from headerKeyword to endKeyword inclusive)
 * and replace it with a Markdown table.  Falls back to leaving the text unchanged
 * if parsing fails.
 *
 * @param {string}   body          Full body text to search within.
 * @param {string}   headerKeyword First word of the header row (e.g. "Vrsta decka").
 * @param {string}   endKeyword    First word of the summary row (e.g. "Skupaj").
 * @param {string[]} headersLarge  Column names when the table has 5 columns (Top 8 + Top 4 + Finale).
 * @param {string[]} headersSmall  Column names when the table has only 4 columns (Top 4 + Finale).
 */
function formatTableBlock(body, headerKeyword, endKeyword, headersLarge, headersSmall) {
  // Find the line containing the header keyword
  const headerIdx = body.indexOf(headerKeyword);
  if (headerIdx === -1) return body;

  // Find the line that starts with endKeyword ("Skupaj") after the header
  const endIdx = body.indexOf('\n' + endKeyword, headerIdx);
  if (endIdx === -1) return body;

  // Include the Skupaj line itself (find its end)
  const afterEnd = body.indexOf('\n', endIdx + 1);
  const tableEnd = afterEnd === -1 ? body.length : afterEnd;

  // Extract the raw table block (everything from headerKeyword to end of Skupaj line)
  // We need the line that contains headerKeyword, so rewind to the start of that line.
  const lineStart = body.lastIndexOf('\n', headerIdx) + 1;
  const rawBlock = body.slice(lineStart, tableEnd);

  const lines = rawBlock.split('\n').filter(l => l.trim());

  // Detect whether this is a "large" table (has Top 8 column) or "small" one.
  // A large table has a header row containing "Top 8".
  const isLarge = rawBlock.includes('Top 8');
  const headers = isLarge ? headersLarge : headersSmall;

  // The actual data rows are everything AFTER the header line
  // (first line contains the header keywords themselves, which we render via `headers`)
  const dataLines = lines.slice(1); // skip the header row from raw text

  const mdTable = parseStatsTableFixed(dataLines, headers);
  if (!mdTable) return body; // fall back if parsing failed

  // Replace the raw block with the markdown table
  return body.slice(0, lineStart) + mdTable + '\n' + body.slice(tableEnd);
}

/**
 * Parse data rows (no header row) into a Markdown table given known column headers.
 *
 * Each line has the format: <name tokens...> <num1> <num2> ...
 * Numbers at the end of the line are the numeric columns.
 * The name may contain spaces so we extract it by subtracting the numeric tail.
 */
function parseStatsTableFixed(lines, headers) {
  // headers[0] is the label column; the rest are numeric columns
  const numericColCount = headers.length - 1;

  // Build table header
  const hdr = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;

  const rows = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tokens = trimmed.split(/\s+/);

    // Count trailing numeric tokens
    let numericCount = 0;
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(tokens[i])) numericCount++;
      else break;
    }

    const label = tokens.slice(0, tokens.length - numericCount).join(' ');
    const nums  = tokens.slice(tokens.length - numericCount);

    // Pad numeric columns to the expected count with empty string
    while (nums.length < numericColCount) nums.push('');

    // Guard against a line that has no label (shouldn't happen in valid tables)
    if (!label) continue;

    rows.push(`| ${label} | ${nums.join(' | ')} |`);
  }

  if (rows.length === 0) return null;
  return [hdr, sep, ...rows].join('\n');
}

/**
 * Convert a PDF file to a Jekyll markdown post.
 *
 * Returns { frontmatter, body, images } where images is an array of
 * { filename, data: Buffer } objects.
 */
async function convertPdf(filePath) {
  const filename = basename(filePath);

  // ── Extract text ──────────────────────────────────────────────────────────
  const textParser = new PDFParse({ url: filePath });
  const textResult = await textParser.getText();
  await textParser.destroy();
  const rawText = textResult.text;

  // ── Extract date from "Datum: DD. MM. YYYY" in the document ──────────────
  const datumMatch = rawText.match(/Datum:\s*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})/);
  if (!datumMatch) throw new Error(`Could not find "Datum:" in ${filename}`);
  const isoDate = parseSlDate(datumMatch[1]);
  if (!isoDate) throw new Error(`Could not parse date from "${datumMatch[1]}" in ${filename}`);

  // ── Build title from the cover line ───────────────────────────────────────
  // The first non-empty line is the running header: "Time Wizard Pomurje D. M. YYYY Report"
  // We want just the part before " Report".
  const firstLine = rawText.split('\n').find(l => l.trim());
  const title = firstLine ? firstLine.replace(/\s+Report\s*$/, '').trim() : `Time Wizard Pomurje ${datumMatch[1]}`;

  // ── Author ────────────────────────────────────────────────────────────────
  const author = detectAuthor(filename, rawText);

  // ── Convert text to markdown ──────────────────────────────────────────────
  const body = pdfTextToMarkdown(rawText, title);

  // ── Extract images ────────────────────────────────────────────────────────
  const imgParser = new PDFParse({ url: filePath });
  const imgResult = await imgParser.getImage();
  await imgParser.destroy();

  // Collect all images across all pages, numbered sequentially.
  // The dataUrl prefix tells us the format: "data:image/png;base64,..." or "data:image/jpeg;base64,..."
  const images = [];
  for (const page of imgResult.pages) {
    for (const img of page.images) {
      const ext = img.dataUrl && img.dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png';
      const idx = images.length + 1;
      images.push({ filename: `image-${idx}.${ext}`, data: img.data });
    }
  }

  return { isoDate, title, author, body, images };
}

// ─── DOCX conversion ──────────────────────────────────────────────────────────

/**
 * Convert a DOCX file to a Jekyll markdown post.
 *
 * Text:   mammoth.convertToHtml() — HTML preserves the Word table structure
 *         which extractRawText() loses (each cell becomes a separate line).
 *         We then convert the HTML to markdown in two passes:
 *           1. Replace <table>…</table> blocks with markdown tables.
 *           2. Strip remaining HTML tags to get the plain text body.
 *
 * Images: extracted directly from the word/media/ folder inside the .docx ZIP,
 *         because mammoth does not process images that are embedded inside Word
 *         drawing shapes / text-boxes.
 */
async function convertDocx(filePath) {
  const filename = basename(filePath);

  // ── Extract text via HTML ──────────────────────────────────────────────────
  // Using convertToHtml instead of extractRawText so that Word tables are
  // converted to <table> elements, allowing accurate markdown table generation.
  // (extractRawText puts each cell on a separate line, breaking table parsing.)
  const htmlResult = await mammoth.convertToHtml({ path: filePath });
  const html = htmlResult.value;

  // ── Extract date from "Datum: DD. MM. YYYY" ──────────────────────────────
  // Retrieve plain text for date/title extraction (easier than parsing HTML)
  const textResult = await mammoth.extractRawText({ path: filePath });
  const rawText = textResult.value;

  const datumMatch = rawText.match(/Datum:\s*(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})/);
  if (!datumMatch) throw new Error(`Could not find "Datum:" in ${filename}`);
  const isoDate = parseSlDate(datumMatch[1]);
  if (!isoDate) throw new Error(`Could not parse date from "${datumMatch[1]}" in ${filename}`);

  // ── Build title ───────────────────────────────────────────────────────────
  const firstLine = rawText.split('\n').find(l => l.trim());
  // If the first line is just "Time Wizard" (no date), build the full title
  // by appending "Pomurje" and the event date, matching the PDF title convention.
  const rawTitle = (firstLine || '').trim();
  const title = /^Time Wizard\s*$/i.test(rawTitle)
    ? `Time Wizard Pomurje ${datumMatch[1].replace(/\s+/g, ' ').trim()}`
    : rawTitle || `Time Wizard Pomurje ${datumMatch[1]}`;

  // ── Author ────────────────────────────────────────────────────────────────
  const author = detectAuthor(filename, rawText);

  // ── Convert HTML to markdown ──────────────────────────────────────────────
  const body = htmlToMarkdown(html, title);

  // ── Extract images from word/media/ via adm-zip ───────────────────────────
  // Mammoth silently drops images that are anchored inside Word drawing shapes
  // (DrawingML / VML). We bypass this by reading word/media/* directly from
  // the ZIP container that every .docx file is.
  const zip = new AdmZip(filePath);
  const mediaEntries = zip.getEntries()
    .filter(e => e.entryName.startsWith('word/media/'))
    // sort ensures image-1, image-2 … follow the order Word assigned them
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  const images = mediaEntries.map((entry, idx) => {
    const ext = extname(entry.entryName).slice(1).toLowerCase(); // e.g. "jpeg" or "png"
    // Normalise .jpeg → .jpg for consistency with the rest of the site
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    return { filename: `image-${idx + 1}.${safeExt}`, data: entry.getData() };
  });

  return { isoDate, title, author, body, images };
}

/**
 * Convert mammoth HTML output to Markdown.
 *
 * Handles:
 *  - <table> → markdown table (cells properly extracted from <td>/<th>)
 *  - <h1>…<h6> → ## headings (we normalise all headings to H2)
 *  - <p>, <br> → paragraph breaks
 *  - <strong>, <em> → **bold**, _italic_
 *  - All other tags stripped
 *
 * @param {string} html    Raw HTML from mammoth.convertToHtml()
 * @param {string} title   Document title (removed from the body, lives in frontmatter)
 */
function htmlToMarkdown(html, title) {
  let md = html;

  // Replace <table>…</table> blocks with markdown tables BEFORE stripping tags
  md = md.replace(/<table>([\s\S]*?)<\/table>/g, (_, inner) => {
    return htmlTableToMarkdown(inner) + '\n\n';
  });

  // Headings → ## (we don't distinguish h1/h2/etc, all become h2 for posts)
  md = md.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g, (_, content) => {
    // Strip any inner tags from heading content
    const text = stripTags(content).trim();
    return `## ${text}\n\n`;
  });

  // Inline formatting
  md = md.replace(/<strong>([\s\S]*?)<\/strong>/g, (_, c) => `**${stripTags(c)}**`);
  md = md.replace(/<b>([\s\S]*?)<\/b>/g, (_, c) => `**${stripTags(c)}**`);
  md = md.replace(/<em>([\s\S]*?)<\/em>/g, (_, c) => `_${stripTags(c)}_`);
  md = md.replace(/<i>([\s\S]*?)<\/i>/g, (_, c) => `_${stripTags(c)}_`);

  // Links — drop the href since these are internal document links we don't need
  md = md.replace(/<a[^>]*>([\s\S]*?)<\/a>/g, (_, c) => stripTags(c));

  // Block elements → double newline
  md = md.replace(/<\/p>/g, '\n\n');
  md = md.replace(/<\/li>/g, '\n');
  md = md.replace(/<br\s*\/?>/g, '\n');
  md = md.replace(/<\/h[1-6]>/g, '\n\n');

  // Strip all remaining tags
  md = stripTags(md);

  // Decode common HTML entities
  md = md
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Remove the document title line (it goes into frontmatter).
  // The title may appear in plain text, **bold**, or as a ## heading, so we
  // strip any surrounding markdown formatting before comparing.
  // Match: optional whitespace, optional ** or ## prefix, the title text,
  //        optional ** or ## suffix, then a newline.
  md = md.replace(
    new RegExp(`^\\s*(?:\\*\\*|##\\s*)?${escapeRegex(title)}(?:\\*\\*)?\\s*\n`),
    ''
  );
  // Also strip "Time Wizard" if it survived as a standalone bold line
  // (TW261025.docx starts with "Time Wizard" on its own, which becomes **Time Wizard**)
  md = md.replace(/^\s*\*\*Time Wizard\*\*\s*\n/m, '');

  // Remove the pseudonym signature line — the author is already in frontmatter
  md = md.replace(/^\s*-\s*Brežiški pastir\s*$/m, '');

  // Collapse extra blank lines
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.split('\n').map(l => l.trimEnd()).join('\n');

  return md.trim();
}

/**
 * Convert a mammoth HTML <table> inner content (everything between <table> tags)
 * into a Markdown table.
 *
 * Expected input: sequence of <tr> rows each containing <td> or <th> cells.
 * Cell content may include <p> tags and inline formatting.
 */
function htmlTableToMarkdown(inner) {
  // Extract all rows
  const rows = [];
  const rowRe = /<tr>([\s\S]*?)<\/tr>/g;
  let rowMatch;
  while ((rowMatch = rowRe.exec(inner)) !== null) {
    const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      // Strip inner <p> tags and all other HTML, decode entities
      const text = stripTags(cellMatch[1])
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
      cells.push(text);
    }
    if (cells.length > 0) rows.push(cells);
  }

  if (rows.length === 0) return '';

  // First row is the header
  const headerRow = rows[0];
  const colCount = headerRow.length;

  // Build separator row
  const sep = Array(colCount).fill('---').join(' | ');

  // Build all rows as markdown
  const mdHeader = `| ${headerRow.join(' | ')} |`;
  const mdSep = `| ${sep} |`;
  const mdRows = rows.slice(1).map(r => {
    // Pad/trim to column count
    while (r.length < colCount) r.push('');
    return `| ${r.slice(0, colCount).join(' | ')} |`;
  });

  return [mdHeader, mdSep, ...mdRows].join('\n');
}

/** Strip all HTML tags from a string. */
function stripTags(str) {
  return str.replace(/<[^>]+>/g, '');
}

/** Escape special regex characters in a string. */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

/**
 * Process one source file and write its output files.
 */
async function processFile(filename) {
  if (SKIP_FILES.includes(filename)) {
    console.log(`⏭  Skipping ${filename} (template — not yet filled in)`);
    return;
  }

  const filePath = join(SOURCE_DIR, filename);
  const ext = extname(filename).toLowerCase();

  console.log(`\n📄 Processing: ${filename}`);

  let result;
  if (ext === '.pdf') {
    result = await convertPdf(filePath);
  } else if (ext === '.docx') {
    result = await convertDocx(filePath);
  } else {
    console.log(`  ⚠ Unknown extension "${ext}" — skipping`);
    return;
  }

  const { isoDate, title, author, body, images } = result;

  const slug = dateToSlug(isoDate);
  const mdFilename = `${isoDate}-${slug}.md`;
  const imgDir = join(IMAGES_DIR, slug);

  // ── Save images ────────────────────────────────────────────────────────────
  if (images.length > 0) {
    if (!DRY_RUN && !existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });
    for (const img of images) {
      writeFile(join(imgDir, img.filename), img.data);
    }
  }

  // ── Build image references for end of markdown ─────────────────────────────
  // Images are appended at the bottom, matching the convention used by all other
  // articles on this site (see e.g. 2021-01-01-tjb-locals-tour.md).
  const imageRefs = images
    .map(img => `![${img.filename}](/assets/images/posts/${slug}/${img.filename})`)
    .join('\n\n');

  // ── Build Jekyll frontmatter ───────────────────────────────────────────────
  // `layout` and `lang: sl` are injected by _config.yml defaults — omit here.
  const frontmatter = [
    '---',
    `title: "${title}"`,
    `date: ${isoDate}`,
    `author: "${author}"`,
    `categories: [report]`,
    `subcategories: [goat]`,
    '---',
  ].join('\n');

  // ── Assemble full markdown file ────────────────────────────────────────────
  const sections = [frontmatter, body];
  if (imageRefs) sections.push(imageRefs);
  const fullContent = sections.join('\n\n') + '\n';

  writeFile(join(OUTPUT_DIR, mdFilename), fullContent);

  console.log(`  ✅ ${mdFilename} (${images.length} image${images.length !== 1 ? 's' : ''})`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────
(async () => {
  if (DRY_RUN) console.log('🔍 Dry-run mode — no files will be written.\n');

  let files;
  if (SINGLE_FILE) {
    files = [SINGLE_FILE];
  } else {
    files = readdirSync(SOURCE_DIR)
      .filter(f => /\.(pdf|docx)$/i.test(f))
      .sort(); // process in chronological order (files are named TW + DDMMYY)
  }

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of files) {
    try {
      await processFile(filename);
      if (SKIP_FILES.includes(filename)) skipped++;
      else ok++;
    } catch (err) {
      console.error(`  ❌ Error processing ${filename}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Done. Converted: ${ok}  Skipped: ${skipped}  Errors: ${errors}`);
  if (!DRY_RUN && ok > 0) {
    console.log(`\n💡 Don't forget to regenerate the gallery index:`);
    console.log(`   node scripts/generate-gallery-index.mjs`);
  }
})();
