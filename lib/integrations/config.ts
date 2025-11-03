import { IntegrationConfig, IntegrationProvider } from "@/types";

// Integration configurations
export const INTEGRATION_CONFIGS: Record<IntegrationProvider, IntegrationConfig> = {
  slack: {
    provider: "slack",
    name: "Slack",
    description: "Send messages and notifications to Slack channels",
    icon: "💬",
    color: "bg-purple-500",
    enabled: true,
    scopes: [
      "channels:read",
      "chat:write",
      "chat:write.public",
      "users:read",
      "team:read",
    ],
  },
  zoom: {
    provider: "zoom",
    name: "Zoom",
    description: "Create and manage Zoom meetings",
    icon: "📹",
    color: "bg-blue-500",
    enabled: true,
    scopes: ["meeting:write", "meeting:read", "user:read"],
  },
  google_drive: {
    provider: "google_drive",
    name: "Google Drive",
    description: "Access and sync files from Google Drive",
    icon: "📁",
    color: "bg-green-500",
    enabled: true,
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.file",
    ],
  },
  google: {
    provider: "google",
    name: "Google Workspace",
    description: "Connect Gmail, Calendar, and Drive for seamless productivity",
    icon: "🌐",
    color: "bg-blue-600",
    enabled: true,
    scopes: [
      "Read and send emails",
      "Manage calendar events",
      "Access Drive files",
    ],
  },
  notion: {
    provider: "notion",
    name: "Notion",
    description: "Sync notes, databases, and pages with your workspace",
    icon: "📝",
    color: "bg-gray-800",
    enabled: true,
    scopes: [
      "Read workspace content",
      "Create and update pages",
      "Access databases",
    ],
  },
  microsoft: {
    provider: "microsoft",
    name: "Microsoft 365",
    description: "Connect Outlook, Teams, OneDrive, and Office apps",
    icon: "🏢",
    color: "bg-blue-700",
    enabled: true,
    scopes: [
      "Read and send emails",
      "Manage calendar",
      "Access OneDrive files",
      "Send Teams messages",
    ],
  },
  linear: {
    provider: "linear",
    name: "Linear",
    description: "Create and manage issues, track project progress",
    icon: "🎯",
    color: "bg-indigo-600",
    enabled: true,
    scopes: [
      "Read and create issues",
      "Manage projects",
      "Update issue status",
    ],
  },
  github: {
    provider: "github",
    name: "GitHub",
    description: "Access repositories, create issues, and manage pull requests",
    icon: "🐙",
    color: "bg-gray-900",
    enabled: true,
    scopes: [
      "Access repositories",
      "Create issues and PRs",
      "View commits",
    ],
  },
  stripe: {
    provider: "stripe",
    name: "Stripe",
    description: "Manage payments, invoices, and customer billing",
    icon: "💳",
    color: "bg-purple-600",
    enabled: true,
    scopes: [
      "Read payment data",
      "Create invoices",
      "Manage customers",
    ],
  },
  airtable: {
    provider: "airtable",
    name: "Airtable",
    description: "Sync and manage your bases, tables, and records",
    icon: "📊",
    color: "bg-yellow-500",
    enabled: true,
    scopes: [
      "Read bases and tables",
      "Create and update records",
      "Manage attachments",
    ],
  },
  twilio: {
    provider: "twilio",
    name: "Twilio SMS",
    description: "Send and receive text messages, manage phone numbers",
    icon: "📱",
    color: "bg-red-600",
    enabled: true,
    scopes: [
      "Send SMS messages",
      "Receive messages",
      "Manage phone numbers",
    ],
  },
  dropbox: {
    provider: "dropbox",
    name: "Dropbox",
    description: "Store and sync files with cloud storage",
    icon: "📦",
    color: "bg-blue-500",
    enabled: true,
    scopes: [
      "Read and write files",
      "Create shared folders",
      "Access file metadata",
    ],
  },
  discord: {
    provider: "discord",
    name: "Discord",
    description: "Send messages to channels, manage servers and communities",
    icon: "🎮",
    color: "bg-indigo-500",
    enabled: true,
    scopes: [
      "Send messages to channels",
      "Read server information",
      "Manage webhooks",
    ],
  },
  whatsapp: {
    provider: "whatsapp",
    name: "WhatsApp Business",
    description: "Send and receive WhatsApp messages with customers",
    icon: "💬",
    color: "bg-green-500",
    enabled: true,
    scopes: [
      "Send and receive messages",
      "Manage contacts",
      "Access message templates",
    ],
  },
  telegram: {
    provider: "telegram",
    name: "Telegram",
    description: "Send messages and notifications via Telegram bot",
    icon: "✈️",
    color: "bg-sky-500",
    enabled: true,
    scopes: [
      "Send messages",
      "Receive updates",
      "Manage bot commands",
    ],
  },
};

// OAuth endpoints (to be configured in .env)
export const getOAuthConfig = (provider: IntegrationProvider) => {
  const configs: Record<IntegrationProvider, any> = {
    slack: {
      authUrl: "https://slack.com/oauth/v2/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.access",
      clientId: process.env.SLACK_CLIENT_ID || "",
      clientSecret: process.env.SLACK_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
    },
    zoom: {
      authUrl: "https://zoom.us/oauth/authorize",
      tokenUrl: "https://zoom.us/oauth/token",
      clientId: process.env.ZOOM_CLIENT_ID || "",
      clientSecret: process.env.ZOOM_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/zoom/callback`,
    },
    google_drive: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-drive/callback`,
    },
    google: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
    },
    notion: {
      authUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      clientId: process.env.NOTION_CLIENT_ID || "",
      clientSecret: process.env.NOTION_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`,
    },
    microsoft: {
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/microsoft/callback`,
    },
    linear: {
      authUrl: "https://linear.app/oauth/authorize",
      tokenUrl: "https://api.linear.app/oauth/token",
      clientId: process.env.LINEAR_CLIENT_ID || "",
      clientSecret: process.env.LINEAR_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linear/callback`,
    },
    github: {
      authUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/github/callback`,
    },
    stripe: {
      authUrl: "https://connect.stripe.com/oauth/authorize",
      tokenUrl: "https://connect.stripe.com/oauth/token",
      clientId: process.env.STRIPE_CLIENT_ID || "",
      clientSecret: process.env.STRIPE_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/stripe/callback`,
    },
    airtable: {
      authUrl: "https://airtable.com/oauth2/v1/authorize",
      tokenUrl: "https://airtable.com/oauth2/v1/token",
      clientId: process.env.AIRTABLE_CLIENT_ID || "",
      clientSecret: process.env.AIRTABLE_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/airtable/callback`,
    },
    twilio: {
      // Twilio uses API keys, not OAuth, but we'll handle this specially
      authUrl: "",
      tokenUrl: "",
      clientId: process.env.TWILIO_ACCOUNT_SID || "",
      clientSecret: process.env.TWILIO_AUTH_TOKEN || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/twilio/callback`,
    },
    dropbox: {
      authUrl: "https://www.dropbox.com/oauth2/authorize",
      tokenUrl: "https://api.dropboxapi.com/oauth2/token",
      clientId: process.env.DROPBOX_CLIENT_ID || "",
      clientSecret: process.env.DROPBOX_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dropbox/callback`,
    },
    discord: {
      authUrl: "https://discord.com/api/oauth2/authorize",
      tokenUrl: "https://discord.com/api/oauth2/token",
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/discord/callback`,
    },
    whatsapp: {
      // WhatsApp Business API uses different auth flow
      authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
      clientId: process.env.WHATSAPP_CLIENT_ID || "",
      clientSecret: process.env.WHATSAPP_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/whatsapp/callback`,
    },
    telegram: {
      // Telegram uses bot token, not OAuth
      authUrl: "",
      tokenUrl: "",
      clientId: process.env.TELEGRAM_BOT_TOKEN || "",
      clientSecret: process.env.TELEGRAM_BOT_TOKEN || "",
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/telegram/callback`,
    },
  };

  return configs[provider];
};

// Check if integration is configured
export const isIntegrationConfigured = (provider: IntegrationProvider): boolean => {
  const config = getOAuthConfig(provider);
  return !!(config.clientId && config.clientSecret);
};

// Get authorization URL
export const getAuthorizationUrl = (
  provider: IntegrationProvider,
  state: string
): string => {
  const config = getOAuthConfig(provider);
  const integrationConfig = INTEGRATION_CONFIGS[provider];

  if (!config.clientId) {
    throw new Error(`${provider} integration is not configured. Please set environment variables.`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
  });

  // Provider-specific parameters
  switch (provider) {
    case "slack":
      params.append("scope", integrationConfig.scopes.join(","));
      params.append("user_scope", "");
      break;
    case "zoom":
      params.append("response_type", "code");
      break;
    case "google_drive":
    case "google":
      params.append("response_type", "code");
      params.append("scope", integrationConfig.scopes.join(" "));
      params.append("access_type", "offline");
      params.append("prompt", "consent");
      break;
    case "notion":
      params.append("response_type", "code");
      params.append("owner", "user");
      break;
    case "microsoft":
      params.append("response_type", "code");
      params.append("scope", "User.Read Mail.ReadWrite Calendars.ReadWrite Files.ReadWrite.All Chat.ReadWrite");
      params.append("response_mode", "query");
      break;
    case "linear":
      params.append("response_type", "code");
      params.append("scope", "read,write");
      break;
    case "github":
      params.append("scope", "repo,read:user,read:org");
      break;
    case "stripe":
      params.append("response_type", "code");
      params.append("scope", "read_write");
      break;
    case "airtable":
      params.append("response_type", "code");
      params.append("code_challenge_method", "S256");
      break;
    case "twilio":
      // Twilio doesn't use OAuth, skip
      break;
    case "dropbox":
      params.append("response_type", "code");
      params.append("token_access_type", "offline");
      break;
    case "discord":
      params.append("response_type", "code");
      params.append("scope", "bot messages.read guilds identify");
      break;
    case "whatsapp":
      params.append("response_type", "code");
      params.append("scope", "whatsapp_business_management whatsapp_business_messaging");
      break;
    case "telegram":
      // Telegram uses bot token, skip
      break;
  }

  return `${config.authUrl}?${params.toString()}`;
};

// Exchange code for tokens
export const exchangeCodeForTokens = async (
  provider: IntegrationProvider,
  code: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  team?: any;
  authed_user?: any;
}> => {
  const config = getOAuthConfig(provider);

  const params = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });

  // Provider-specific parameters - most providers use authorization_code grant type
  if (
    provider === "slack" ||
    provider === "zoom" ||
    provider === "google_drive" ||
    provider === "google" ||
    provider === "notion" ||
    provider === "microsoft" ||
    provider === "linear" ||
    provider === "github" ||
    provider === "stripe" ||
    provider === "airtable" ||
    provider === "dropbox" ||
    provider === "discord" ||
    provider === "whatsapp"
  ) {
    params.append("grant_type", "authorization_code");
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return response.json();
};

// Refresh access token
export const refreshAccessToken = async (
  provider: IntegrationProvider,
  refreshToken: string
): Promise<{
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
}> => {
  const config = getOAuthConfig(provider);

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
};
