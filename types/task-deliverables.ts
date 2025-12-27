// Task Deliverables type definitions
// Stores AI-generated content like social posts, emails, documents

export type DeliverableContentType =
  | "social_post"
  | "email"
  | "document"
  | "plan"
  | "research"
  | "image"
  | "other";

export type DeliverablePlatform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "threads"
  | "tiktok"
  | null;

export type DeliverableFormat = "plain" | "markdown" | "html" | "json";

export type DeliverableStatus = "draft" | "published" | "archived";

export interface TaskDeliverable {
  id: string;
  task_id: string;
  user_id: string;

  // Content
  content_type: DeliverableContentType;
  title?: string;
  content: string;

  // Metadata for specific content types
  platform?: DeliverablePlatform;
  format: DeliverableFormat;
  metadata: DeliverableMetadata;

  // Status tracking
  status: DeliverableStatus;
  published_at?: string;

  // Version tracking
  version: number;
  parent_id?: string;

  // AI metadata
  ai_generated: boolean;
  ai_model?: string;
  ai_prompt_context?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Metadata structure for different content types
export interface DeliverableMetadata {
  // Email-specific
  subject?: string;
  recipients?: string[];
  cc?: string[];

  // Social post-specific
  hashtags?: string[];
  mentions?: string[];
  char_count?: number;
  max_chars?: number;
  media_urls?: string[];

  // Document-specific
  word_count?: number;
  sections?: string[];

  // General
  tone?: string;
  keywords?: string[];
  [key: string]: unknown;
}

// Input types for creating/updating deliverables
export interface CreateDeliverableInput {
  task_id: string;
  content_type: DeliverableContentType;
  title?: string;
  content: string;
  platform?: DeliverablePlatform;
  format?: DeliverableFormat;
  metadata?: Partial<DeliverableMetadata>;
  ai_generated?: boolean;
  ai_model?: string;
  ai_prompt_context?: string;
}

export interface UpdateDeliverableInput {
  title?: string;
  content?: string;
  platform?: DeliverablePlatform;
  format?: DeliverableFormat;
  metadata?: Partial<DeliverableMetadata>;
  status?: DeliverableStatus;
}

// Response types from APIs
export interface DeliverableWithTask extends TaskDeliverable {
  task?: {
    id: string;
    title: string;
    status: string;
  };
}

// Platform-specific configuration
export const PLATFORM_CONFIG: Record<
  NonNullable<DeliverablePlatform>,
  { maxChars: number; label: string; icon: string }
> = {
  twitter: { maxChars: 280, label: "Twitter/X", icon: "twitter" },
  linkedin: { maxChars: 3000, label: "LinkedIn", icon: "linkedin" },
  instagram: { maxChars: 2200, label: "Instagram", icon: "instagram" },
  facebook: { maxChars: 63206, label: "Facebook", icon: "facebook" },
  threads: { maxChars: 500, label: "Threads", icon: "at-sign" },
  tiktok: { maxChars: 2200, label: "TikTok", icon: "video" },
};

// Content type display configuration
export const CONTENT_TYPE_CONFIG: Record<
  DeliverableContentType,
  { label: string; icon: string; description: string }
> = {
  social_post: {
    label: "Social Post",
    icon: "share-2",
    description: "Social media content",
  },
  email: {
    label: "Email",
    icon: "mail",
    description: "Email message",
  },
  document: {
    label: "Document",
    icon: "file-text",
    description: "Long-form document",
  },
  plan: {
    label: "Plan",
    icon: "clipboard-list",
    description: "Project plan or strategy",
  },
  research: {
    label: "Research",
    icon: "search",
    description: "Research findings",
  },
  image: {
    label: "Image",
    icon: "image",
    description: "Generated image",
  },
  other: {
    label: "Other",
    icon: "file",
    description: "Other content type",
  },
};
