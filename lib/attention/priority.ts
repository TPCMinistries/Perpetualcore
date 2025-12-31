/**
 * AI Priority Scoring for Attention Items
 * Calculates priority based on multiple factors
 */

export type AttentionItemType =
  | "task"
  | "email"
  | "notification"
  | "automation"
  | "mention"
  | "team_request"
  | "ai_suggestion";

export interface AttentionItem {
  id: string;
  type: AttentionItemType;
  sourceId: string;
  title: string;
  preview?: string;
  createdAt: string;
  dueAt?: string;
  source: string;
  isResolved: boolean;
  metadata: Record<string, any>;
  aiPriorityScore?: number;
}

export interface PriorityFactors {
  urgency: number; // 0-1 based on due date
  importance: number; // 0-1 based on source/sender importance
  recency: number; // 0-1 based on how recent
  contextual: number; // 0-1 based on user's current context
  engagement: number; // 0-1 based on historical engagement
}

/**
 * Calculate overall priority score for an attention item
 */
export function calculatePriorityScore(item: AttentionItem): number {
  const factors = getPriorityFactors(item);

  // Weighted average with configurable weights
  const weights = {
    urgency: 0.35,
    importance: 0.25,
    recency: 0.15,
    contextual: 0.15,
    engagement: 0.10,
  };

  const score =
    factors.urgency * weights.urgency +
    factors.importance * weights.importance +
    factors.recency * weights.recency +
    factors.contextual * weights.contextual +
    factors.engagement * weights.engagement;

  return Math.min(Math.max(score, 0), 1);
}

/**
 * Get individual priority factors for an item
 */
function getPriorityFactors(item: AttentionItem): PriorityFactors {
  return {
    urgency: calculateUrgency(item),
    importance: calculateImportance(item),
    recency: calculateRecency(item),
    contextual: calculateContextual(item),
    engagement: calculateEngagement(item),
  };
}

/**
 * Calculate urgency based on due date
 */
function calculateUrgency(item: AttentionItem): number {
  if (!item.dueAt) {
    // Default urgency based on type
    const typeUrgency: Record<AttentionItemType, number> = {
      task: 0.5,
      email: 0.4,
      notification: 0.3,
      automation: 0.6, // Failed automations are urgent
      mention: 0.5,
      team_request: 0.7,
      ai_suggestion: 0.2,
    };
    return typeUrgency[item.type] || 0.3;
  }

  const now = Date.now();
  const due = new Date(item.dueAt).getTime();
  const hoursUntilDue = (due - now) / (1000 * 60 * 60);

  if (hoursUntilDue < 0) return 1.0; // Overdue
  if (hoursUntilDue < 1) return 0.95;
  if (hoursUntilDue < 4) return 0.85;
  if (hoursUntilDue < 24) return 0.7;
  if (hoursUntilDue < 48) return 0.5;
  if (hoursUntilDue < 168) return 0.3; // Within a week

  return 0.2;
}

/**
 * Calculate importance based on source and type
 */
function calculateImportance(item: AttentionItem): number {
  let score = 0.5;

  // Type-based importance
  const typeImportance: Record<AttentionItemType, number> = {
    task: 0.6,
    email: 0.5,
    notification: 0.3,
    automation: 0.7,
    mention: 0.6,
    team_request: 0.8,
    ai_suggestion: 0.4,
  };
  score = typeImportance[item.type] || 0.5;

  // Boost for failed automations
  if (item.type === "automation" && item.metadata?.status === "failed") {
    score += 0.2;
  }

  // Boost for VIP contacts
  if (item.metadata?.isVip) {
    score += 0.2;
  }

  // Boost for high-priority tasks
  if (item.metadata?.priority === "high") {
    score += 0.2;
  }

  return Math.min(score, 1);
}

/**
 * Calculate recency factor
 */
function calculateRecency(item: AttentionItem): number {
  const now = Date.now();
  const created = new Date(item.createdAt).getTime();
  const hoursAgo = (now - created) / (1000 * 60 * 60);

  if (hoursAgo < 1) return 1.0;
  if (hoursAgo < 4) return 0.8;
  if (hoursAgo < 24) return 0.6;
  if (hoursAgo < 48) return 0.4;
  if (hoursAgo < 168) return 0.2;

  return 0.1;
}

/**
 * Calculate contextual relevance
 * This would ideally use current page context, time of day, etc.
 */
function calculateContextual(item: AttentionItem): number {
  // Base contextual score
  let score = 0.5;

  // Morning: boost emails and tasks
  const hour = new Date().getHours();
  if (hour >= 8 && hour <= 11) {
    if (item.type === "email" || item.type === "task") {
      score += 0.2;
    }
  }

  // Afternoon: boost team requests
  if (hour >= 14 && hour <= 17) {
    if (item.type === "team_request" || item.type === "mention") {
      score += 0.2;
    }
  }

  return Math.min(score, 1);
}

/**
 * Calculate engagement factor based on historical patterns
 * This would ideally use user's historical engagement data
 */
function calculateEngagement(item: AttentionItem): number {
  // Placeholder - would use ML model in production
  return 0.5;
}

/**
 * Get priority label from score
 */
export function getPriorityLabel(score: number): {
  label: string;
  variant: "destructive" | "default" | "secondary" | "outline";
} {
  if (score >= 0.8) return { label: "Critical", variant: "destructive" };
  if (score >= 0.6) return { label: "High", variant: "default" };
  if (score >= 0.4) return { label: "Medium", variant: "secondary" };
  return { label: "Low", variant: "outline" };
}

/**
 * Sort attention items by priority
 */
export function sortByPriority(items: AttentionItem[]): AttentionItem[] {
  return [...items].sort((a, b) => {
    const scoreA = a.aiPriorityScore ?? calculatePriorityScore(a);
    const scoreB = b.aiPriorityScore ?? calculatePriorityScore(b);
    return scoreB - scoreA;
  });
}

/**
 * Group items by priority tier
 */
export function groupByPriority(items: AttentionItem[]): {
  critical: AttentionItem[];
  high: AttentionItem[];
  medium: AttentionItem[];
  low: AttentionItem[];
} {
  const result = {
    critical: [] as AttentionItem[],
    high: [] as AttentionItem[],
    medium: [] as AttentionItem[],
    low: [] as AttentionItem[],
  };

  for (const item of items) {
    const score = item.aiPriorityScore ?? calculatePriorityScore(item);
    if (score >= 0.8) result.critical.push(item);
    else if (score >= 0.6) result.high.push(item);
    else if (score >= 0.4) result.medium.push(item);
    else result.low.push(item);
  }

  return result;
}
