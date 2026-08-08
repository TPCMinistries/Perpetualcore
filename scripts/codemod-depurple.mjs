#!/usr/bin/env node
/**
 * Replaces decorative purple with the design token, and leaves semantic purple alone.
 *
 * 2,545 purple utilities remained after the gradient pass. They are not one thing:
 *
 *   2,272 decorative — an icon or a heading tinted violet for no reason. Brand drift.
 *     273 semantic   — entries in a category colour map. audit-logs keys `violet:`
 *                      alongside green, red and blue, so replacing it merges two
 *                      distinct categories into one colour and destroys meaning.
 *
 * A blanket find-and-replace would be right 89% of the time, which is the wrong
 * kind of right: the 11% it breaks is exactly where colour is carrying
 * information, and the damage is invisible in a diff.
 *
 * Shade is preserved as intensity rather than flattened. bg-violet-100 is a soft
 * tint and becomes bg-primary/10; bg-violet-600 is a solid fill and becomes
 * bg-primary. Collapsing both to the same value would make every tinted panel
 * shout.
 *
 * Dry run unless --apply.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const ROOTS = ["app", "src", "components"];
const HUES = "violet|purple|fuchsia|indigo";

/**
 * A line defines a colour palette rather than styling one element.
 * Leaving these is the entire point of the codemod.
 */
function isSemantic(line) {
  // Keyed by the colour itself:  violet: "bg-violet-100 text-violet-600"
  if (/\b(violet|purple|indigo|fuchsia)\s*:\s*["'`]/.test(line)) return true;
  if (/^\s*["']?(violet|purple|indigo|fuchsia)["']?\s*:/.test(line)) return true;

  // The commoner shape — the class string is the VALUE of an object property in a
  // category record:  grant: { label: "Grant Research", color: "text-violet-600" }
  // Distinguished from decoration by the absence of className/class on the line:
  // a tint applied to an element is styling, a tint stored under a key is data.
  const inProperty = /\b[A-Za-z_$][\w$]*\s*:\s*["'`][^"'`]*\b(?:bg|text|border|ring|shadow)-(?:violet|purple|fuchsia|indigo)-\d{2,3}/.test(line);
  const isClassName = /class(?:Name)?\s*=/.test(line);
  return inProperty && !isClassName;
}

/** Soft tints stay soft; solid fills stay solid. */
function bgReplacement(shade) {
  const n = Number(shade);
  if (n <= 100) return "bg-primary/10";
  if (n <= 200) return "bg-primary/20";
  if (n <= 300) return "bg-primary/30";
  return "bg-primary";
}
function borderReplacement(shade) {
  return Number(shade) <= 300 ? "border-primary/20" : "border-primary/40";
}

const RULES = [
  // text: every shade reads as "the accent", so one token is correct here
  [new RegExp(`\\btext-(?:${HUES})-\\d{2,3}(/\\d+)?\\b`, "g"), (_m, o) => `text-primary${o ?? ""}`],
  [new RegExp(`\\bbg-(?:${HUES})-(\\d{2,3})(/\\d+)?\\b`, "g"),
    (_m, shade, o) => (o ? `bg-primary${o}` : bgReplacement(shade))],
  [new RegExp(`\\bborder-(?:${HUES})-(\\d{2,3})(/\\d+)?\\b`, "g"),
    (_m, shade, o) => (o ? `border-primary${o}` : borderReplacement(shade))],
  [new RegExp(`\\bring-(?:${HUES})-\\d{2,3}(/\\d+)?\\b`, "g"), (_m, o) => `ring-primary${o ?? ""}`],
  [new RegExp(`\\bshadow-(?:${HUES})-\\d{2,3}(/\\d+)?\\b`, "g"), (_m, o) => `shadow-primary${o ?? ""}`],
  [new RegExp(`\\bdivide-(?:${HUES})-\\d{2,3}(/\\d+)?\\b`, "g"), (_m, o) => `divide-primary${o ?? ""}`],
  [new RegExp(`\\boutline-(?:${HUES})-\\d{2,3}(/\\d+)?\\b`, "g"), (_m, o) => `outline-primary${o ?? ""}`],
];

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e.startsWith(".")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));
let replaced = 0, skipped = 0, changedFiles = 0;

for (const file of files) {
  const before = readFileSync(file, "utf8");
  const lines = before.split("\n");
  let dirty = false;

  const after = lines.map((line) => {
    if (isSemantic(line)) {
      const hits = line.match(new RegExp(`\\b(?:bg|text|border|ring|shadow)-(?:${HUES})-\\d{2,3}`, "g"));
      skipped += hits ? hits.length : 0;
      return line;
    }
    let next = line;
    for (const [re, fn] of RULES) {
      next = next.replace(re, (...a) => { replaced += 1; return fn(...a); });
    }
    if (next !== line) dirty = true;
    return next;
  });

  if (dirty) {
    changedFiles += 1;
    if (APPLY) writeFileSync(file, after.join("\n"));
  }
}

console.log(`decorative replaced: ${replaced}`);
console.log(`semantic preserved:  ${skipped}  (category colour maps — deliberate)`);
console.log(`files changed:       ${changedFiles}`);
if (!APPLY) console.log("\n(dry run — re-run with --apply)");
