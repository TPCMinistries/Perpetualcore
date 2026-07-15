import { describe, expect, it } from 'vitest';
import { HQ_OUTCOME_DEFINITIONS, outcomeInputSchema, parseOutcomeInput } from '@/lib/hq/outcomes';

describe('HQ verified outcome contract', () => {
  it('coerces owner-entered values and preserves the code-owned metric definition', () => {
    const parsed = parseOutcomeInput({
      actionRunId: '5c033f62-f1f9-4f4a-a44f-5410da20eeb2',
      metricKey: 'hours_saved',
      value: '2.5',
      note: 'Automated the weekly reconciliation.',
    });

    expect(parsed.value).toBe(2.5);
    expect(HQ_OUTCOME_DEFINITIONS[parsed.metricKey]).toEqual({
      label: 'Hours saved',
      unit: 'hours',
      direction: 'increase',
    });
  });

  it('rejects unknown metrics, previews without UUIDs, and non-positive values', () => {
    expect(outcomeInputSchema.safeParse({
      actionRunId: 'not-a-run',
      metricKey: 'vanity_metric',
      value: 0,
    }).success).toBe(false);
  });

  it('rejects unexpected input fields', () => {
    expect(outcomeInputSchema.safeParse({
      actionRunId: '5c033f62-f1f9-4f4a-a44f-5410da20eeb2',
      metricKey: 'tasks_completed',
      value: 1,
      unit: 'usd',
    }).success).toBe(false);
  });
});
