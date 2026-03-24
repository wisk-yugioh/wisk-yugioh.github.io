#!/usr/bin/env node
/**
 * convert-remaining.mjs
 *
 * Converts the remaining not_published/ files (PDFs and ODT) to markdown.
 * - PDFs: text extracted via pdfjs-dist, images via JPEG binary scanning
 * - ODT: text + images extracted by unzipping the ODF archive and parsing content.xml
 *
 * Usage: node scripts/convert-remaining.mjs
 */

import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { DOMParser } from 'xmldom';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INPUT_DIR = path.join(ROOT, 'not_published');
const OUTPUT_DIR = path.join(ROOT, '_historic');
const IMAGES_BASE = path.join(ROOT, 'assets', 'images', 'posts');

const TODAY = new Date().toISOString().slice(0, 10);

function normalizeSlovenian(str) {
  return str
    .replace(/[čČ]/g, (c) => (c === 'č' ? 'c' : 'C'))
    .replace(/[šŠ]/g, (c) => (c === 'š' ? 's' : 'S'))
    .replace(/[žŽ]/g, (c) => (c === 'ž' ? 'z' : 'Z'))
    .replace(/[éèêë]/g, 'e').replace(/[àáâã]/g, 'a')
    .replace(/[ùúûü]/g, 'u').replace(/[ìíîï]/g, 'i')
    .replace(/[ñ]/g, 'n').replace(/[ö]/g, 'o');
}

function slugify(str) {
  return normalizeSlovenian(str)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function yamlEscape(str) {
  return '"' + str.replace(/"/g, '\\"') + '"';
}

function isPersonName(str) {
  const words = str.trim().split(/\s+/);
  if (words.length < 1 || words.length > 3) return false;
  if (/[\d.#@]/.test(str)) return false;
  const allLower = words.every((w) => w === w.toLowerCase());
  const allCapInitial = words.every(
    (w) => (w[0] >= 'A' && w[0] <= 'Z') || (w[0] >= 'À' && w[0] <= 'Ž')
  );
  if (!allLower && !allCapInitial) return false;
  const eventWords = new Set([
    'Open', 'Cup', 'Liga', 'Turnir', 'Finale', 'Runda', 'Masters',
    'Report', 'Sneak', 'Peek', 'Coverage', 'Regionals', 'Prvak',
    'Championship', 'Summer', 'Winter', 'Spring', 'Fall', 'Državno',
    'Slovensko', 'Slovenian', 'European', 'World', 'National',
  ]);
  if (words.some((w) => eventWords.has(w))) return false;
  return true;
}

function parseNiceName(basename) {
  const noExt = basename.replace(/\.[^.]+$/, '');
  if (!noExt.startsWith('Yu-Gi-Oh!')) return null;
  const parts = noExt.split(' - ');
  if (parts.length < 4) return null;
  const type = parts[1].trim();
  if (type === 'Članek' || type === 'Intervju') {
    return { type, author: parts[2].trim(), title: parts.slice(3).join(' - ').trim() };
  }
  if (type === 'Reportaža') {
    for (let i = parts.length - 2; i >= 2; i--) {
      if (isPersonName(parts[i].trim())) {
        return { type, author: parts[i].trim(), title: parts.slice(i + 1).join(' - ').trim() };
      }
    }
    return { type, author: parts[parts.length - 2].trim(), title: parts[parts.length - 1].trim() };
  }
  return { type, author: parts[2].trim(), title: parts.slice(3).join(' - ').trim() };
}

// ─── PDF ────────────────────────────────────────────────────────────────────

/**
 * Extract embedded JPEGs from raw PDF buffer by scanning for JPEG markers.
 * Returns array of { buffer, index } sorted by file offset.
 */
function extractJpegsFromBuffer(pdfBuf) {
  const jpegs = [];
  let offset = 0;
  while (offset < pdfBuf.length - 4) {
    const pos = pdfBuf.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), offset);
    if (pos === -1) break;
    const end = pdfBuf.indexOf(Buffer.from([0xFF, 0xD9]), pos + 3);
    if (end !== -1 && end - pos > 500) { // skip tiny thumbnails < 500 bytes
      jpegs.push({ buffer: pdfBuf.slice(pos, end + 2), offset: pos });
    }
    offset = pos + 1;
  }
  return jpegs;
}

/**
 * Get page boundaries (byte offsets) for each page using pdfjs operator list.
 * Returns approximate image-to-page mapping based on PDF object offsets.
 * Falls back to distributing images evenly across pages.
 */
async function convertPDF(filePath, filename) {
  const parsed = parseNiceName(filename);
  const title = parsed ? parsed.title : filename.replace(/\.[^.]+$/, '');
  const author = parsed ? parsed.author : 'Neznan';
  const docType = parsed ? parsed.type : null;
  const slug = slugify(title);

  const pdfBuf = fs.readFileSync(filePath);
  const data = new Uint8Array(pdfBuf);
  const doc = await getDocument({ data }).promise;
  const numPages = doc.numPages;

  // Extract text per page
  const pageTexts = [];
  const pageImageCounts = [];
  for (let p = 1; p <= numPages; p++) {
    const page = await doc.getPage(p);

    // Get text
    const content = await page.getTextContent();
    let lastY = null;
    let text = '';
    for (const item of content.items) {
      if ('str' in item) {
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 5) text += '\n';
        text += item.str;
        lastY = y;
      }
    }
    pageTexts.push(text.trim());

    // Count images on this page
    const ops = await page.getOperatorList();
    let imgCount = 0;
    for (let i = 0; i < ops.fnArray.length; i++) {
      if ([OPS.paintImageXObject, OPS.paintJpegXObject, OPS.paintInlineImageXObject].includes(ops.fnArray[i])) {
        imgCount++;
      }
    }
    pageImageCounts.push(imgCount);
  }

  // Extract JPEG images from binary
  const jpegs = extractJpegsFromBuffer(pdfBuf);

  // Save images and build markdown
  const imageDir = path.join(IMAGES_BASE, slug);
  if (jpegs.length > 0) fs.mkdirSync(imageDir, { recursive: true });

  let imgIdx = 0;
  const savedImages = jpegs.map((j, i) => {
    const fname = `image-${i + 1}.jpg`;
    fs.writeFileSync(path.join(imageDir, fname), j.buffer);
    return fname;
  });

  // Distribute images across pages (by page image count)
  const markdownParts = [];
  for (let p = 0; p < numPages; p++) {
    const text = pageTexts[p];
    if (text) markdownParts.push(text + '\n');

    const nImgs = pageImageCounts[p];
    for (let i = 0; i < nImgs && imgIdx < savedImages.length; i++, imgIdx++) {
      markdownParts.push(`\n![](/assets/images/posts/${slug}/${savedImages[imgIdx]})\n`);
    }
  }

  const markdown = markdownParts.join('\n');
  const frontmatter = `---\nlayout: post\ntitle: ${yamlEscape(title)}\ndate: ${TODAY}\nauthor: ${yamlEscape(author)}\ncategories: [arhiv]\n---\n\n`;
  const outFilename = `${TODAY}-${slug}.md`;
  fs.writeFileSync(path.join(OUTPUT_DIR, outFilename), frontmatter + markdown.trimStart(), 'utf8');

  return { status: 'success', title, author, docType, slug, outFilename, imageCount: savedImages.length };
}

// ─── ODT ────────────────────────────────────────────────────────────────────

function odtNodeToMarkdown(node, imageDir, slug, images) {
  if (!node) return '';
  const type = node.nodeType;

  // Text node
  if (type === 3) return node.nodeValue || '';

  const name = node.nodeName || '';
  const children = Array.from(node.childNodes || []);

  // Paragraph → followed by newline
  if (name === 'text:p' || name === 'text:h') {
    const inner = children.map((c) => odtNodeToMarkdown(c, imageDir, slug, images)).join('');
    const headingLevel = node.getAttribute && node.getAttribute('text:outline-level');
    if (headingLevel) {
      return '#'.repeat(parseInt(headingLevel, 10)) + ' ' + inner.trim() + '\n\n';
    }
    return inner.trim() ? inner.trim() + '\n\n' : '';
  }

  // Line break
  if (name === 'text:line-break' || name === 'text:s') return ' ';

  // Tab
  if (name === 'text:tab') return '\t';

  // Span (bold/italic)
  if (name === 'text:span') {
    return children.map((c) => odtNodeToMarkdown(c, imageDir, slug, images)).join('');
  }

  // Image
  if (name === 'draw:image') {
    const href = node.getAttribute && (node.getAttribute('xlink:href') || node.getAttribute('draw:href'));
    if (href) {
      const imgFilename = path.basename(href);
      const destName = `image-${images.length + 1}${path.extname(imgFilename)}`;
      images.push({ src: href, dest: destName });
      return `\n![](/assets/images/posts/${slug}/${destName})\n`;
    }
    return '';
  }

  // Frame (wrapper for images)
  if (name === 'draw:frame') {
    return children.map((c) => odtNodeToMarkdown(c, imageDir, slug, images)).join('');
  }

  // List
  if (name === 'text:list') {
    return children.map((c) => odtNodeToMarkdown(c, imageDir, slug, images)).join('');
  }
  if (name === 'text:list-item') {
    const inner = children.map((c) => odtNodeToMarkdown(c, imageDir, slug, images)).join('').trim();
    return `- ${inner}\n`;
  }

  // Table (basic)
  if (name === 'table:table-row') {
    const cells = children.filter(c => c.nodeName === 'table:table-cell')
      .map(c => Array.from(c.childNodes || []).map(n => odtNodeToMarkdown(n, imageDir, slug, images)).join('').trim());
    return '| ' + cells.join(' | ') + ' |\n';
  }

  // Default: recurse into children
  return children.map((c) => odtNodeToMarkdown(c, imageDir, slug, images)).join('');
}

async function convertODT(filePath, filename) {
  const parsed = parseNiceName(filename);
  const title = parsed ? parsed.title : filename.replace(/\.[^.]+$/, '');
  const author = parsed ? parsed.author : 'Neznan';
  const docType = parsed ? parsed.type : null;
  const slug = slugify(title);

  const zip = new AdmZip(filePath);
  const contentEntry = zip.getEntry('content.xml');
  if (!contentEntry) throw new Error('No content.xml in ODT');

  const xmlStr = contentEntry.getData().toString('utf8');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');

  // Find body content
  const body = xmlDoc.getElementsByTagName('office:body')[0]
    || xmlDoc.getElementsByTagName('body')[0];
  if (!body) throw new Error('No body in content.xml');

  const textElement = body.getElementsByTagName('office:text')[0] || body;
  const images = [];
  const imageDir = path.join(IMAGES_BASE, slug);

  const markdown = odtNodeToMarkdown(textElement, imageDir, slug, images);

  // Extract images from zip
  if (images.length > 0) {
    fs.mkdirSync(imageDir, { recursive: true });
    for (const img of images) {
      const entry = zip.getEntry(img.src) || zip.getEntry(img.src.replace(/^\.\//, ''));
      if (entry) {
        fs.writeFileSync(path.join(imageDir, img.dest), entry.getData());
      }
    }
  }

  const frontmatter = `---\nlayout: post\ntitle: ${yamlEscape(title)}\ndate: ${TODAY}\nauthor: ${yamlEscape(author)}\ncategories: [arhiv]\n---\n\n`;
  const outFilename = `${TODAY}-${slug}.md`;
  fs.writeFileSync(path.join(OUTPUT_DIR, outFilename), frontmatter + markdown.trimStart(), 'utf8');

  return { status: 'success', title, author, docType, slug, outFilename, imageCount: images.length };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const allFiles = fs.readdirSync(INPUT_DIR).sort();
  const results = [];

  console.log(`Converting ${allFiles.length} remaining files...\n`);

  for (const filename of allFiles) {
    const filePath = path.join(INPUT_DIR, filename);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) continue;

    const ext = path.extname(filename).toLowerCase();
    process.stdout.write(`  ${filename} ... `);

    try {
      let result;
      if (ext === '.pdf') {
        result = await convertPDF(filePath, filename);
      } else if (ext === '.odt') {
        result = await convertODT(filePath, filename);
      } else {
        console.log('⚠ skipped (unexpected type)');
        results.push({ status: 'skipped', originalFile: filename });
        continue;
      }
      result.originalFile = filename;
      console.log(`✓ → ${result.outFilename} (${result.imageCount} image(s))`);
      results.push(result);
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`);
      results.push({ status: 'failed', reason: err.message, originalFile: filename });
    }
  }

  const ok = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`\nDone. ✓ ${ok} converted, ✗ ${failed} failed`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
