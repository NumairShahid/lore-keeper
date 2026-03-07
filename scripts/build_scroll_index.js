#!/usr/bin/env node
/*
Builds a lightweight JSON index from a markdown scroll corpus.

Expected layout (in lore-keeper repo after checkout):
- lore-scrolls/**.md

Outputs:
- data/scroll_index.json

No external dependencies (runs in GitHub Actions).
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.env.LORE_SCROLLS_DIR || path.join(process.cwd(), 'lore-scrolls');
const OUT = process.env.SCROLL_INDEX_OUT || path.join(process.cwd(), 'data', 'scroll_index.json');

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.git')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.md')) out.push(p);
  }
  return out;
}

function parseFrontmatter(md) {
  // Very small YAML-ish parser for common cases.
  // Supports:
  // ---
  // key: value
  // tags: [a, b]
  // ---
  if (!md.startsWith('---')) return { fm: {}, body: md };
  const end = md.indexOf('\n---', 3);
  if (end === -1) return { fm: {}, body: md };
  const raw = md.slice(3, end).trim();
  const body = md.slice(end + 4).replace(/^\s*\n/, '');

  const fm = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();

    // strip quotes
    val = val.replace(/^['"]|['"]$/g, '');

    // basic array support: [a, b]
    if (val.startsWith('[') && val.endsWith(']')) {
      const inside = val.slice(1, -1).trim();
      fm[key] = inside
        ? inside.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
        : [];
    } else {
      fm[key] = val;
    }
  }

  return { fm, body };
}

function stripMarkdown(md) {
  return md
    // code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    // inline code
    .replace(/`[^`]*`/g, ' ')
    // images
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // links (keep text)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // headings / emphasis
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '')
    // blockquotes
    .replace(/^>\s?/gm, '')
    // collapse whitespace
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function firstHeading(md) {
  const m = md.match(/^\s*#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function firstParagraph(text) {
  const parts = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  return parts.length ? parts[0] : '';
}

function inferDateFromPathOrText(relPath, fm, bodyText) {
  if (fm.date) return fm.date;
  // look for YYYY-MM-DD in path
  const m1 = relPath.match(/(\d{4}-\d{2}-\d{2})/);
  if (m1) return m1[1];
  // look for YYYY/MM/DD
  const m2 = relPath.match(/(\d{4})[\/](\d{2})[\/](\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  // look for date in first 2k chars
  const m3 = bodyText.slice(0, 2000).match(/(\d{4}-\d{2}-\d{2})/);
  if (m3) return m3[1];
  return '';
}

function normalizeTags(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
  return String(v)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`No lore scrolls directory found at: ${ROOT}`);
    process.exit(2);
  }

  const files = walk(ROOT);
  const items = [];

  for (const f of files) {
    const rel = path.relative(process.cwd(), f);
    const raw = fs.readFileSync(f, 'utf8');
    const { fm, body } = parseFrontmatter(raw);
    const heading = fm.title || firstHeading(body) || path.basename(f, '.md');
    const clean = stripMarkdown(body);
    const summary = fm.summary || firstParagraph(clean);
    const date = inferDateFromPathOrText(rel, fm, clean);
    const tags = normalizeTags(fm.tags || fm.tag || fm.topics);

    const id = (fm.id || rel)
      .replace(/\\/g, '/')
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_\-./]/g, '')
      .replace(/\//g, '__');

    items.push({
      id: `SCROLL__${id}`,
      title: String(heading).trim(),
      date,
      source: 'lore-scrolls',
      path: rel.replace(/\\/g, '/'),
      tags,
      summary: String(summary).slice(0, 800),
      text_preview: clean.slice(0, 1500)
    });
  }

  // Deterministic order
  items.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(items, null, 2));

  console.log(`Indexed ${items.length} markdown scrolls -> ${path.relative(process.cwd(), OUT)}`);
}

main();
