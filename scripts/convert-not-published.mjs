#!/usr/bin/env node
/**
 * convert-not-published.mjs
 *
 * Converts all docx/.DOC files in not_published/ to Jekyll-ready markdown.
 * - Extracts images to assets/images/posts/[slug]/
 * - Generates Jekyll frontmatter from filename
 * - Saves .md files to _converted/
 * - Writes _converted/CONVERSION_LOG.md with per-file status
 *
 * Usage: node scripts/convert-not-published.mjs
 */

import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INPUT_DIR = path.join(ROOT, 'not_published');
const OUTPUT_DIR = path.join(ROOT, '_converted');
const IMAGES_BASE = path.join(ROOT, 'assets', 'images', 'posts');

// Today's date as placeholder
const TODAY = new Date().toISOString().slice(0, 10);

// Slovenian → ASCII normalization for slugs
function normalizeSlovenian(str) {
  return str
    .replace(/[čČ]/g, (c) => (c === 'č' ? 'c' : 'C'))
    .replace(/[šŠ]/g, (c) => (c === 'š' ? 's' : 'S'))
    .replace(/[žŽ]/g, (c) => (c === 'ž' ? 'z' : 'Z'))
    .replace(/[éèêë]/g, 'e')
    .replace(/[àáâã]/g, 'a')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[ñ]/g, 'n')
    .replace(/[ö]/g, 'o');
}

function slugify(str) {
  return normalizeSlovenian(str)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // remove non-alphanumeric except space and hyphen
    .replace(/[\s_]+/g, '-')    // spaces/underscores → hyphens
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')    // trim leading/trailing hyphens
    .slice(0, 80);
}

function yamlEscape(str) {
  // Escape double quotes and wrap in double quotes
  return '"' + str.replace(/"/g, '\\"') + '"';
}

/**
 * Returns true if the string looks like a person's name.
 * Used to identify author segments in Reportaža filenames.
 */
function isPersonName(str) {
  const words = str.trim().split(/\s+/);
  if (words.length < 1 || words.length > 3) return false;
  // Reject segments containing digits, dots, hashes
  if (/[\d.#@]/.test(str)) return false;
  // All words must start with uppercase OR it's all lowercase (nickname like "chippy")
  const allLower = words.every((w) => w === w.toLowerCase());
  const allCapInitial = words.every(
    (w) => (w[0] >= 'A' && w[0] <= 'Z') || (w[0] >= 'À' && w[0] <= 'Ž')
  );
  if (!allLower && !allCapInitial) return false;
  // Reject known event/context keywords
  const eventWords = new Set([
    'Open', 'Cup', 'Liga', 'Turnir', 'Finale', 'Runda', 'Masters',
    'Report', 'Sneak', 'Peek', 'Coverage', 'Regionals', 'Prvak',
    'Championship', 'Summer', 'Winter', 'Spring', 'Fall', 'Državno',
    'Slovensko', 'Slovenian', 'European', 'World', 'National',
    'Peti', 'Šesti', 'Sedmi', 'Osmi', 'Deveti',
  ]);
  if (words.some((w) => eventWords.has(w))) return false;
  return true;
}

/**
 * Parse a nicely-named file like:
 * "Yu-Gi-Oh! - Članek - Alen Bizjak - Iz Mete v Goate.docx"
 * "Yu-Gi-Oh! - Reportaža - YCS Milano 2010 - Urh Kovačič - Moj pogled na YCS Milano.docx"
 * Returns { type, author, title } or null if not matching.
 */
function parseNiceName(basename) {
  const noExt = basename.replace(/\.[^.]+$/, '');
  if (!noExt.startsWith('Yu-Gi-Oh!')) return null;
  const parts = noExt.split(' - ');
  if (parts.length < 4) return null;

  const type = parts[1].trim();

  if (type === 'Članek' || type === 'Intervju') {
    // Always: Yu-Gi-Oh! - Type - Author - Title (Title may contain " - ")
    const author = parts[2].trim();
    const title = parts.slice(3).join(' - ').trim();
    return { type, author, title };
  }

  if (type === 'Reportaža') {
    // Format: Yu-Gi-Oh! - Reportaža - Event(s) - Author - Title
    // Scan backwards from second-to-last to find first person name
    for (let i = parts.length - 2; i >= 2; i--) {
      if (isPersonName(parts[i].trim())) {
        const author = parts[i].trim();
        const title = parts.slice(i + 1).join(' - ').trim();
        return { type, author, title };
      }
    }
    // Fallback: second-to-last as author, last as title
    return {
      type,
      author: parts[parts.length - 2].trim(),
      title: parts[parts.length - 1].trim(),
    };
  }

  // Generic fallback
  return {
    type,
    author: parts[2].trim(),
    title: parts.slice(3).join(' - ').trim(),
  };
}

/**
 * Extract title from mammoth markdown output.
 * Tries to find first bold text (**...**) or first non-empty line.
 */
function extractTitleFromContent(markdown) {
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Bold: **text** or __text__
    const boldMatch = line.match(/^\*\*(.+?)\*\*/) || line.match(/^__(.+?)__/);
    if (boldMatch) return boldMatch[1].replace(/\\/g, '').trim();
    // Heading: # text
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) return headingMatch[1].replace(/\\/g, '').trim();
    // First substantial line (not too long, looks like a title)
    const clean = line.replace(/\\/g, '').replace(/[*_]/g, '').trim();
    if (clean.length > 3 && clean.length < 120) return clean;
  }
  return 'Neznan naslov';
}

async function convertFile(filePath, filename) {
  const ext = path.extname(filename).toLowerCase();

  // Skip PDFs and ODT
  if (ext === '.pdf') {
    return { status: 'needs-manual', reason: 'PDF file — manual conversion required', title: filename };
  }
  if (ext === '.odt') {
    return { status: 'needs-manual', reason: 'ODT file — mammoth does not support ODT', title: filename };
  }

  // Try to parse the filename
  const parsed = parseNiceName(filename);
  let author = parsed ? parsed.author : null;
  let title = parsed ? parsed.title : null;
  const docType = parsed ? parsed.type : null;

  // Determine slug (tentative — may be updated after reading content for garbled names)
  let slug = title ? slugify(title) : null;

  // Image counter per document
  let imageCounter = 0;
  // Images are stored under a temp key; we finalise path after we know the slug
  const extractedImages = [];

  // Mammoth convert options with image extraction
  const options = {
    convertImage: mammoth.images.imgElement(async function (image) {
      try {
        const buffer = await image.read();
        const mimeType = image.contentType || 'image/jpeg';
        const extMap = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
          'image/bmp': 'bmp',
          'image/tiff': 'tiff',
          'image/emf': 'emf',
          'image/wmf': 'wmf',
        };
        const imgExt = extMap[mimeType] || 'bin';
        const imgFilename = `image-${++imageCounter}.${imgExt}`;
        extractedImages.push({ filename: imgFilename, buffer, mimeType });
        // Return a placeholder src; we'll fix up the path after we know the slug
        return { src: `__IMGPLACEHOLDER__/${imgFilename}` };
      } catch (e) {
        return { src: 'image-error.png', alt: 'image extraction failed' };
      }
    }),
  };

  let markdownContent;
  try {
    const result = await mammoth.convertToMarkdown({ path: filePath }, options);
    markdownContent = result.value;
    if (result.messages && result.messages.length > 0) {
      const warnings = result.messages.filter((m) => m.type === 'warning');
      if (warnings.length > 0) {
        // Non-fatal — continue
      }
    }
  } catch (err) {
    return { status: 'failed', reason: err.message, title: filename };
  }

  // For garbled filenames, derive title from content
  if (!title) {
    title = extractTitleFromContent(markdownContent);
    slug = slugify(title);
    author = 'Neznan';
  }

  if (!slug || slug.length < 1) {
    slug = slugify(filename.replace(/\.[^.]+$/, ''));
  }

  return {
    status: 'success',
    title,
    author,
    docType,
    slug,
    markdownContent,
    extractedImages,
    imageCount: extractedImages.length,
    originalFile: filename,
  };
}

/** Write the converted result to disk with the final (deduplicated) slug. */
function writeResult(result, finalSlug) {
  const { markdownContent, extractedImages, title, author } = result;

  // Save extracted images
  const imageDir = path.join(IMAGES_BASE, finalSlug);
  let content = markdownContent;
  if (extractedImages.length > 0) {
    fs.mkdirSync(imageDir, { recursive: true });
    for (const img of extractedImages) {
      fs.writeFileSync(path.join(imageDir, img.filename), img.buffer);
    }
    content = content.replace(/__IMGPLACEHOLDER__\//g, `/assets/images/posts/${finalSlug}/`);
  }

  const titleEscaped = yamlEscape(title);
  const authorEscaped = yamlEscape(author || 'Neznan');
  const frontmatter = `---\nlayout: post\ntitle: ${titleEscaped}\ndate: ${TODAY}\nauthor: ${authorEscaped}\ncategories: [arhiv]\n---\n\n`;

  const outFilename = `${TODAY}-${finalSlug}.md`;
  fs.writeFileSync(path.join(OUTPUT_DIR, outFilename), frontmatter + content.trimStart(), 'utf8');
  return outFilename;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allFiles = fs.readdirSync(INPUT_DIR).sort();

  const results = [];
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const usedSlugs = new Map(); // slug → count

  console.log(`Processing ${allFiles.length} files...\n`);

  for (const filename of allFiles) {
    const filePath = path.join(INPUT_DIR, filename);
    // Skip directories
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) continue;

    process.stdout.write(`  ${filename} ... `);

    try {
      const result = await convertFile(filePath, filename);
      result.originalFile = result.originalFile || filename;

      if (result.status === 'success') {
        // Deduplicate slugs before writing
        const baseSlug = result.slug;
        let finalSlug = baseSlug;
        if (usedSlugs.has(baseSlug)) {
          const count = usedSlugs.get(baseSlug) + 1;
          usedSlugs.set(baseSlug, count);
          finalSlug = `${baseSlug}-${count}`;
        } else {
          usedSlugs.set(baseSlug, 1);
        }
        const outFilename = writeResult(result, finalSlug);
        result.slug = finalSlug;
        result.outFilename = outFilename;
        successCount++;
        console.log(`✓ → ${outFilename}${result.imageCount > 0 ? ` (${result.imageCount} image(s))` : ''}`);
      } else if (result.status === 'needs-manual') {
        skippedCount++;
        console.log(`⚠ needs-manual: ${result.reason}`);
      } else {
        failedCount++;
        console.log(`✗ FAILED: ${result.reason}`);
      }

      results.push(result);
    } catch (err) {
      failedCount++;
      console.log(`✗ EXCEPTION: ${err.message}`);
      results.push({ status: 'failed', reason: err.message, originalFile: filename, title: filename });
    }
  }

  // Write CONVERSION_LOG.md
  const logLines = [
    '# Conversion Log',
    '',
    `Converted: **${TODAY}**  `,
    `Total: ${allFiles.length} | ✓ Success: ${successCount} | ✗ Failed: ${failedCount} | ⚠ Needs manual: ${skippedCount}`,
    '',
    '---',
    '',
    '## ✓ Successful Conversions',
    '',
    '| Output file | Title | Author | Type | Images |',
    '|---|---|---|---|---|',
  ];

  for (const r of results.filter((r) => r.status === 'success')) {
    logLines.push(
      `| \`${r.outFilename}\` | ${r.title} | ${r.author || '-'} | ${r.docType || '-'} | ${r.imageCount || 0} |`
    );
  }

  logLines.push('', '## ✗ Failed', '', '| Original file | Reason |', '|---|---|');
  for (const r of results.filter((r) => r.status === 'failed')) {
    logLines.push(`| \`${r.originalFile}\` | ${r.reason} |`);
  }

  logLines.push('', '## ⚠ Needs Manual Conversion', '', '| Original file | Reason |', '|---|---|');
  for (const r of results.filter((r) => r.status === 'needs-manual')) {
    logLines.push(`| \`${r.originalFile}\` | ${r.reason} |`);
  }

  const logPath = path.join(OUTPUT_DIR, 'CONVERSION_LOG.md');
  fs.writeFileSync(logPath, logLines.join('\n') + '\n', 'utf8');

  console.log(`\n---`);
  console.log(`Done. ✓ ${successCount} converted, ✗ ${failedCount} failed, ⚠ ${skippedCount} needs-manual`);
  console.log(`Log written to: _converted/CONVERSION_LOG.md`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
