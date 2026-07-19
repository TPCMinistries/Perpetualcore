import { z } from 'zod';
import type { HqActionDefinition } from './types';

const createInternalTaskPayload = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(4_000).optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    dueDate: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();

const createInternalTask: HqActionDefinition<typeof createInternalTaskPayload> = {
  type: 'internal.create_task',
  label: 'Create internal task',
  risk: 'low',
  approvalRequired: true,
  schema: createInternalTaskPayload,
  async execute(payload, context) {
    if (context.dryRun) {
      return {
        summary: `Preview: create internal task “${payload.title}”.`,
        result: { preview: true, task: payload },
        evidence: { sideEffectPerformed: false },
      };
    }

    const task = await context.createInternalTask({
      requestedBy: context.requestedBy,
      title: payload.title,
      description: payload.description ?? null,
      priority: payload.priority,
      dueDate: payload.dueDate ?? null,
      sourceReference: context.queueItemId,
    });
    return {
      summary: `Created internal task “${payload.title}”.`,
      result: { taskId: task.id },
      evidence: { table: 'tasks', id: task.id, sideEffectPerformed: true },
    };
  },
};

export const HQ_ACTION_REGISTRY = {
  'internal.create_task': createInternalTask,
} as const;

export type HqActionType = keyof typeof HQ_ACTION_REGISTRY;

export function getHqActionDefinition(type: string): HqActionDefinition | null {
  return Object.prototype.hasOwnProperty.call(HQ_ACTION_REGISTRY, type)
    ? (HQ_ACTION_REGISTRY[type as HqActionType] as HqActionDefinition)
    : null;
}

export function listHqActionPolicies() {
  return Object.values(HQ_ACTION_REGISTRY).map(({ type, label, risk, approvalRequired }) => ({
    type,
    label,
    risk,
    approvalRequired,
  }));
}
