export type AnalyticsEventType =
  | "page_view"
  | "cta_click"
  | "signup"
  | "onboarding_complete"
  | "first_chat"
  | "first_document"
  | "explore_agents"
  | "trial_started"
  | "trial_converted"
  | "upgrade"
  | "downgrade"
  | "churn";

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  event_name?: string;
  user_id?: string;
  anonymous_id?: string;
  session_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  page_url?: string;
  page_path?: string;
  metadata?: Record<string, unknown>;
  user_agent?: string;
  ip_address?: string;
}

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
}

export interface FunnelStep {
  event_type: AnalyticsEventType;
  label: string;
  count: number;
  unique_users: number;
  conversion_rate: number; // % from previous step
}

export interface FunnelData {
  steps: FunnelStep[];
  period: { start: string; end: string };
  total_visitors: number;
}

export interface AttributionRow {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  visitors: number;
  signups: number;
  activations: number;
  conversions: number;
  signup_rate: number;
  activation_rate: number;
  conversion_rate: number;
}
