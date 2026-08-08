#!/usr/bin/env node
/**
 * Replaces the brand-breaking gradients with the design token they should have
 * used, and leaves the harmless ones alone.
 *
 * 870 gradients had accumulated across 226 files. They are not all the same
 * problem. Soft neutral fades (gray-50 → white) are a legitimate way to lift a
 * section off the page. Violet → purple → pink is the visual vocabulary of an AI
 * demo, and it is the specific thing that makes operations software look like it
 * cannot be trusted with operations.
 *
 * So this only touches chromatic gradients in the violet/purple/pink/fuchsia/
 * indigo family — 258 of them — and converts each to the solid token equivalent.
 * Neutral fades are left untouched by design, not by omission.
 *
 * Text gradients (bg-clip-text) are handled separately: dropping the gradient
 * without dropping the clip leaves invisible text, which is worse than the
 * gradient was.
 *
 * Dry run unless --apply.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const ROOTS = ["app", "src", "components"];
const CHROMATIC = "(violet|purple|pink|fuchsia|indigo)";

/** A gradient whose colours are the AI-demo palette. */
const BG_GRADIENT = new RegExp(
  `bg-gradient-to-[a-z]+\\s+from-(?:${CHROMATIC}-\\d{2,3}|primary)(?:\\s+via-[a-z]+-\\d{2,3})?\\s+to-[a-z]+-\\d{2,3}`,
  "g",
);

/** Same, but painting text. Needs the clip/transparent pair removed too. */
const TEXT_GRADIENT = new RegExp(
  `bg-gradient-to-[a-z]+\\s+from-(?:${CHROMATIC}-\\d{2,3}|primary)(?:\\s+via-[a-z]+-\\d{2,3})?\\s+to-[a-z]+-\\d{2,3}\\s+bg-clip-text\\s+text-transparent`,
  "g",
);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e.startsWith(".")) continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (e.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));
let bgCount = 0;
let textCount = 0;
const touched = [];

for (const file of files) {
  const before = readFileSync(file, "utf8");
  let after = before;

  // Text first: its pattern is a superset of the background one, so replacing
  // backgrounds first would strand an orphaned bg-clip-text and hide the text.
  after = after.replace(TEXT_GRADIENT, () => {
    textCount += 1;
    return "text-primary";
  });

  after = after.replace(BG_GRADIENT, () => {
    bgCount += 1;
    return "bg-primary";
  });

  if (after !== before) {
    touched.push(file);
    if (APPLY) writeFileSync(file, after);
  }
}

console.log(`files scanned:        ${files.length}`);
console.log(`chromatic bg → solid: ${bgCount}`);
console.log(`chromatic text → solid: ${textCount}`);
console.log(`files changed:        ${touched.length}`);

// Report what was deliberately left, so the number is a decision and not a miss.
let neutral = 0;
for (const file of files) {
  const m = readFileSync(file, "utf8").match(
    /bg-gradient-to-[a-z]+\s+from-(gray|slate|zinc|neutral|stone|white|black)/g,
  );
  neutral += m ? m.length : 0;
}
console.log(`neutral fades kept:   ${neutral}  (deliberate — these are not the problem)`);

if (!APPLY) console.log("\n(dry run — re-run with --apply)");
