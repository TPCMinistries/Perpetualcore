import { z } from 'zod';

export const HQ_OUTCOME_DEFINITIONS = {
  cash_collected: { label: 'Cash collected', unit: 'usd', direction: 'increase' },
  pipeline_created: { label: 'Pipeline created', unit: 'usd', direction: 'increase' },
  revenue_risk_avoided: { label: 'Revenue risk avoided', unit: 'usd', direction: 'increase' },
  hours_saved: { label: 'Hours saved', unit: 'hours', direction: 'increase' },
  deadlines_protected: { label: 'Deadlines protected', unit: 'count', direction: 'increase' },
  tasks_completed: { label: 'Tasks completed', unit: 'count', direction: 'increase' },
} as const;

export type HqOutcomeKey = keyof typeof HQ_OUTCOME_DEFINITIONS;

const OUTCOME_KEYS = Object.keys(HQ_OUTCOME_DEFINITIONS) as [HqOutcomeKey, ...HqOutcomeKey[]];

export const outcomeInputSchema = z
  .object({
    actionRunId: z.string().uuid(),
    metricKey: z.enum(OUTCOME_KEYS),
    value: z.coerce.number().positive().max(1_000_000_000),
    note: z.string().trim().max(1_000).optional(),
  })
  .strict();

export type HqOutcomeInput = z.input<typeof outcomeInputSchema>;
export type ParsedHqOutcomeInput = z.output<typeof outcomeInputSchema>;

export function parseOutcomeInput(input: HqOutcomeInput): ParsedHqOutcomeInput {
  return outcomeInputSchema.parse(input);
}
