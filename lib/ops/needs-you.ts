import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Needs-You extractor — pulls the human-action items out of recent session
 * handoffs so they surface in ONE place instead of scattered across a dozen
 * terminal windows. Read-only over the vault; the handoff markdown stays
 * canonical, this is a derived digest.
 */

export interface NeedsYouItem {
  source: string;   // handoff filename
  heading: string;  // section it came from
  text: string;     // the bullet line
  fileDate: string; // yyyy-mm-dd derived from filename or mtime
}

const HANDOFFS = path.join(os.homedir(), 'dev', 'LDC-Command-Center-Vault', '_claude', 'handoffs');

/** headings whose bullets represent "Lorenzo must act" */
const HEADING_RE = /(needs lorenzo|blockers?\b|pending uat|lorenzo'?s pending|open items|pending lorenzo|needs you)/i;

const MAX_PER_FILE = 6;
const MAX_TOTAL = 40;
const MAX_AGE_DAYS = 14;

export async function extractNeedsYou(now = new Date()): Promise<NeedsYouItem[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(HANDOFFS);
  } catch {
    return [];
  }

  const cutoff = now.getTime() - MAX_AGE_DAYS * 86_400_000;
  const items: NeedsYouItem[] = [];

  // newest first so the freshest asks win the MAX_TOTAL budget
  const dated = (
    await Promise.all(
      files
        .filter((f) => f.endsWith('.md'))
        .map(async (f) => {
          const st = await fs.stat(path.join(HANDOFFS, f));
          return { f, mtime: st.mtimeMs };
        }),
    )
  )
    .filter((x) => x.mtime >= cutoff)
    .sort((a, b) => b.mtime - a.mtime);

  for (const { f, mtime } of dated) {
    if (items.length >= MAX_TOTAL) break;
    const body = await fs.readFile(path.join(HANDOFFS, f), 'utf8');
    const fileDate = f.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? new Date(mtime).toISOString().slice(0, 10);

    let inSection = false;
    let heading = '';
    let perFile = 0;
    for (const line of body.split('\n')) {
      const h = line.match(/^#{1,4}\s+(.*)/);
      if (h) {
        inSection = HEADING_RE.test(h[1]);
        heading = h[1].trim();
        continue;
      }
      if (!inSection || perFile >= MAX_PER_FILE || items.length >= MAX_TOTAL) continue;
      const bullet = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*\S)/);
      if (!bullet) continue;
      const text = bullet[1].replace(/\*\*/g, '').trim();
      // skip struck-through / resolved lines
      if (/^~~.*~~$/.test(text) || /RESOLVED|DONE ?✓?$/i.test(text)) continue;
      items.push({ source: f, heading, text, fileDate });
      perFile++;
    }
  }
  return items;
}
