/**
 * Agent Workspace Types
 * Defines the agent identity and workspace configuration interfaces
 */

export interface AgentIdentity {
  id: string;
  userId: string;
  name: string;                    // e.g., "Jarvis", "Friday", "Atlas"
  persona: string;                 // Full persona description
  communicationStyle: CommunicationStyle;
  boundaries: string[];            // Things the agent should NOT do
  greeting: string;                // How agent introduces itself
  signoff: string;                 // How agent ends conversations
  systemPromptOverride?: string;   // Advanced: custom system prompt additions
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationStyle {
  tone: 'professional' | 'casual' | 'formal' | 'friendly' | 'witty' | 'concise';
  verbosity: 'brief' | 'moderate' | 'detailed';
  useEmoji: boolean;
  language: string;                // default 'en'
  personality: string;             // free-text personality description
}

export interface WorkspaceConfig {
  userId: string;
  identity: AgentIdentity | null;
  activeSkills: string[];
  preferences: Record<string, any>;
}

export interface AgentIdentityUpdate {
  name?: string;
  persona?: string;
  communicationStyle?: Partial<CommunicationStyle>;
  boundaries?: string[];
  greeting?: string;
  signoff?: string;
  systemPromptOverride?: string;
  isActive?: boolean;
}
