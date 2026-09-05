export const CATEGORIES = ["Next.js application", "Automation / integration"] as const;
export type RepairBrief = {
  category: string;
  systems: string;
  expected: string;
  actual: string;
  reproduction: string;
  name: string;
};
export const LIMITS: Record<keyof RepairBrief, number> = {
  category: 40, systems: 180, expected: 400, actual: 400, reproduction: 600, name: 100,
};
export const EMPTY_BRIEF: RepairBrief = {
  category: "", systems: "", expected: "", actual: "", reproduction: "", name: "",
};
export type BriefErrors = Partial<Record<keyof RepairBrief, string>>;

export function validateBrief(brief: RepairBrief): BriefErrors {
  const errors: BriefErrors = {};
  for (const key of Object.keys(LIMITS) as (keyof RepairBrief)[]) {
    if (key !== "name" && !brief[key].trim()) errors[key] = "Please complete this field.";
    if (brief[key].length > LIMITS[key]) errors[key] = `Use ${LIMITS[key]} characters or fewer.`;
  }
  if (brief.category && !CATEGORIES.some((category) => category === brief.category)) {
    errors.category = "Choose one of the listed repair categories.";
  }
  return errors;
}

export function formatBrief(brief: RepairBrief): string {
  if (Object.keys(validateBrief(brief)).length) throw new Error("Complete the repair brief before exporting it.");
  return [
    "Perpetual Core — repair scope request",
    "Request for inspection only. No purchase or delivery commitment.",
    "The $300 repair applies only to an accepted scope; price and turnaround require written confirmation.",
    "", `Category: ${brief.category}`, `Systems / versions: ${brief.systems.trim()}`,
    "", "Expected behavior:", brief.expected.trim(), "", "Actual behavior:", brief.actual.trim(),
    "", "Sanitized reproduction:", brief.reproduction.trim(),
    ...(brief.name.trim() ? ["", `Name / business: ${brief.name.trim()}`] : []),
  ].join("\n");
}

export function briefMailto(brief: RepairBrief): string {
  const subject = `Repair scope request — ${brief.category}`;
  return `mailto:lorenzo@perpetualcore.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formatBrief(brief))}`;
}
