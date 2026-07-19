export type HqExecutionErrorCode =
  | 'INVALID_REQUEST'
  | 'QUEUE_ITEM_NOT_FOUND'
  | 'ACTION_NOT_CONFIGURED'
  | 'ACTION_NOT_APPROVED'
  | 'UNSUPPORTED_ACTION'
  | 'INVALID_PAYLOAD'
  | 'PERSISTENCE_UNAVAILABLE'
  | 'EXECUTION_FAILED';

const FRIENDLY_MESSAGES: Record<HqExecutionErrorCode, string> = {
  INVALID_REQUEST: 'This action request is incomplete or invalid.',
  QUEUE_ITEM_NOT_FOUND: 'That HQ queue item no longer exists.',
  ACTION_NOT_CONFIGURED: 'This queue item does not have a complete execution contract yet.',
  ACTION_NOT_APPROVED: 'This action must be approved before it can run.',
  UNSUPPORTED_ACTION: 'This action type is not enabled in HQ.',
  INVALID_PAYLOAD: 'This action contains invalid or incomplete details.',
  PERSISTENCE_UNAVAILABLE: 'HQ could not record the action safely, so nothing was executed.',
  EXECUTION_FAILED: 'The action failed safely. No success was recorded.',
};

export class HqExecutionError extends Error {
  constructor(
    public readonly code: HqExecutionErrorCode,
    message = FRIENDLY_MESSAGES[code],
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'HqExecutionError';
  }
}

export function toFriendlyExecutionError(error: unknown): HqExecutionError {
  if (error instanceof HqExecutionError) return error;
  return new HqExecutionError('EXECUTION_FAILED');
}
