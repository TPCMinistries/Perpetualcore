/**
 * Guided Chat Utilities
 *
 * Builds personalized first-chat experiences after onboarding completion.
 * The "aha moment" — the AI knows the user by name, role, and goals from day one.
 */

const ROLE_LABELS: Record<string, string> = {
  professional: "working professional",
  entrepreneur: "entrepreneur and founder",
  creative: "creative and content creator",
  technical: "developer and engineer",
  student_educator: "student/educator",
  researcher: "researcher and analyst",
  custom: "professional",
};

const GOAL_LABELS: Record<string, string> = {
  // Professional goals
  organize_work: "organize my work documents and information",
  meeting_prep: "prepare for meetings and presentations",
  email_drafts: "draft emails and communications faster",
  research: "research topics and gather information",
  project_tracking: "track projects and tasks",
  knowledge_retention: "remember important conversations and decisions",
  // Entrepreneur goals
  business_docs: "organize business documents and contracts",
  market_research: "research markets and competitors",
  content_marketing: "create marketing and sales content",
  decision_support: "get AI support for business decisions",
  customer_insights: "understand customers better",
  automate_tasks: "automate repetitive business tasks",
  // Creative goals
  ideas: "generate and organize ideas",
  research_topics: "research topics deeply",
  draft_content: "draft content faster",
  repurpose: "repurpose content across platforms",
  organize_projects: "organize creative projects",
  feedback_iteration: "get feedback and iterate on my work",
  // Technical goals
  document_code: "document and organize technical knowledge",
  debug_help: "get help debugging and problem solving",
  learn_tech: "learn new technologies faster",
  architecture: "design and document system architecture",
  code_review: "improve code and review processes",
  api_docs: "create and maintain documentation",
  // Student/educator goals
  study_help: "understand difficult concepts",
  organize_notes: "organize notes and materials",
  research_projects: "research for projects and papers",
  create_content: "create educational content",
  writing_help: "improve writing skills",
  exam_prep: "prepare for exams and lessons",
  // Researcher goals
  literature_review: "organize and review research",
  analyze_data: "analyze data and find insights",
  write_papers: "write and edit papers and reports",
  collaborate: "collaborate with others",
  grant_writing: "write proposals and grants",
  knowledge_base: "build a personal knowledge base",
  // Custom/fallback goals
  organize: "organize information and documents",
  create: "create content and drafts",
  communicate: "communicate more effectively",
  track: "track tasks and projects",
  remember: "remember important information",
};

/**
 * Builds a personalized first message prompt for the user to send.
 * Returns a natural-language opening message that references their name, role, and top goal.
 */
export function buildFirstChatPrompt(profile: {
  preferredName: string;
  userRole: string;
  primaryGoals: string[];
  industry?: string;
}): string {
  const name = profile.preferredName || "there";
  const roleLabel = ROLE_LABELS[profile.userRole] || "professional";
  const topGoal = profile.primaryGoals?.[0];
  const goalLabel = topGoal ? GOAL_LABELS[topGoal] : "accomplish my goals";

  return `Hi! I'm ${name}, a ${roleLabel}. I'm looking to ${goalLabel}. What can you help me with?`;
}

interface QuickSuggestion {
  icon: string;
  text: string;
  prompt: string;
}

/**
 * Returns 3-4 personalized quick-action prompts based on the user's role and goals.
 * These replace the generic QUICK_PROMPTS in EmptyState for guided first-time users.
 */
export function getFirstChatSuggestions(
  userRole: string,
  primaryGoals: string[]
): QuickSuggestion[] {
  const topGoals = (primaryGoals || []).slice(0, 3);

  // Role + goal combinations produce personalized suggestions
  const roleGoalMap: Record<string, Record<string, QuickSuggestion>> = {
    professional: {
      organize_work: {
        icon: "📁",
        text: "Organize my work",
        prompt: "Help me create a system to organize my work documents and projects",
      },
      meeting_prep: {
        icon: "📋",
        text: "Prep for a meeting",
        prompt: "Help me prepare talking points and an agenda for an upcoming meeting",
      },
      email_drafts: {
        icon: "✍️",
        text: "Draft an email",
        prompt: "Help me draft a professional email to a client or colleague",
      },
      research: {
        icon: "🔍",
        text: "Research a topic",
        prompt: "Help me research and summarize information on a topic for work",
      },
      project_tracking: {
        icon: "📊",
        text: "Track my projects",
        prompt: "Help me set up a simple project tracking system for my current work",
      },
      knowledge_retention: {
        icon: "🧠",
        text: "Capture key insights",
        prompt: "Help me summarize the key decisions and insights from a recent project",
      },
    },
    entrepreneur: {
      market_research: {
        icon: "📈",
        text: "Research competitors",
        prompt: "Help me analyze my competitors and identify market opportunities",
      },
      business_docs: {
        icon: "📄",
        text: "Draft a business doc",
        prompt: "Help me create a professional business document or proposal",
      },
      content_marketing: {
        icon: "📣",
        text: "Create marketing copy",
        prompt: "Help me write compelling marketing copy for my product or service",
      },
      decision_support: {
        icon: "🤔",
        text: "Get business advice",
        prompt: "Help me think through an important business decision I'm facing",
      },
      customer_insights: {
        icon: "👥",
        text: "Understand my customers",
        prompt: "Help me create a customer persona and understand what my customers need",
      },
      automate_tasks: {
        icon: "⚡",
        text: "Automate a process",
        prompt: "Help me identify repetitive tasks in my business I could automate",
      },
    },
    creative: {
      ideas: {
        icon: "💡",
        text: "Brainstorm ideas",
        prompt: "Help me brainstorm creative ideas for my next project",
      },
      draft_content: {
        icon: "✍️",
        text: "Draft content",
        prompt: "Help me write a compelling piece of content for my audience",
      },
      repurpose: {
        icon: "♻️",
        text: "Repurpose content",
        prompt: "Help me adapt one piece of content to work across multiple platforms",
      },
      research_topics: {
        icon: "🔍",
        text: "Research deeply",
        prompt: "Help me research a topic thoroughly for my next creative project",
      },
    },
    technical: {
      debug_help: {
        icon: "🐛",
        text: "Debug an issue",
        prompt: "Help me debug a technical issue I'm currently working on",
      },
      document_code: {
        icon: "📖",
        text: "Document my code",
        prompt: "Help me write clear documentation for a piece of code or system",
      },
      learn_tech: {
        icon: "📚",
        text: "Learn a technology",
        prompt: "Help me create a learning roadmap for a technology I want to master",
      },
      architecture: {
        icon: "🏗️",
        text: "Design a system",
        prompt: "Help me think through the architecture of a system I'm building",
      },
    },
    student_educator: {
      study_help: {
        icon: "🎓",
        text: "Understand a concept",
        prompt: "Help me understand a difficult concept I'm studying",
      },
      organize_notes: {
        icon: "📓",
        text: "Organize my notes",
        prompt: "Help me create a system for organizing my notes and study materials",
      },
      research_projects: {
        icon: "🔬",
        text: "Research a project",
        prompt: "Help me find and synthesize research for an upcoming project or paper",
      },
      create_content: {
        icon: "🎨",
        text: "Create course content",
        prompt: "Help me design engaging educational content or lesson materials",
      },
    },
    researcher: {
      literature_review: {
        icon: "📚",
        text: "Review literature",
        prompt: "Help me organize and synthesize research papers on a specific topic",
      },
      analyze_data: {
        icon: "📊",
        text: "Analyze data",
        prompt: "Help me identify patterns and insights from a dataset I'm working with",
      },
      write_papers: {
        icon: "✍️",
        text: "Write a paper",
        prompt: "Help me structure and write a research paper or report",
      },
      grant_writing: {
        icon: "💰",
        text: "Write a proposal",
        prompt: "Help me draft a compelling grant proposal or research funding application",
      },
    },
  };

  const roleMap = roleGoalMap[userRole] || {};

  // Build suggestions from top goals
  const suggestions: QuickSuggestion[] = [];

  for (const goal of topGoals) {
    if (roleMap[goal]) {
      suggestions.push(roleMap[goal]);
    }
  }

  // Fallback suggestions if not enough goal-matched ones
  const fallbacks: QuickSuggestion[] = [
    {
      icon: "🧠",
      text: "What can you do?",
      prompt: "What can you help me with? Show me your best capabilities.",
    },
    {
      icon: "📁",
      text: "Organize my work",
      prompt: "Help me create a simple system to organize my work and stay on top of things",
    },
    {
      icon: "💡",
      text: "Brainstorm with me",
      prompt: "Let's brainstorm solutions to a challenge I'm currently facing",
    },
    {
      icon: "📝",
      text: "Draft something",
      prompt: "Help me draft a document, email, or piece of content",
    },
  ];

  // Fill to 4 suggestions
  let i = 0;
  while (suggestions.length < 4 && i < fallbacks.length) {
    const fallback = fallbacks[i];
    if (!suggestions.find((s) => s.text === fallback.text)) {
      suggestions.push(fallback);
    }
    i++;
  }

  return suggestions.slice(0, 4);
}
