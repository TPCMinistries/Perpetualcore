import {
  Lightbulb,
  Code,
  FileText,
  Search,
  Languages,
  BookOpen,
  Briefcase,
  Mail,
  PenTool,
  BarChart,
  MessageSquare,
  Sparkles,
  Brain,
  Database,
  GitBranch,
  Bug,
  Rocket,
  Target,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  icon: any;
  variables?: string[];
  tags: string[];
  featured?: boolean;
}

export const promptCategories = [
  { id: "creative", name: "Creative", icon: Lightbulb },
  { id: "code", name: "Code", icon: Code },
  { id: "writing", name: "Writing", icon: PenTool },
  { id: "analysis", name: "Analysis", icon: BarChart },
  { id: "research", name: "Research", icon: Search },
  { id: "business", name: "Business", icon: Briefcase },
  { id: "learning", name: "Learning", icon: BookOpen },
  { id: "productivity", name: "Productivity", icon: Target },
];

export const promptTemplates: PromptTemplate[] = [
  // Creative Prompts
  {
    id: "brainstorm",
    title: "Brainstorm Ideas",
    description: "Generate creative ideas for any topic",
    category: "creative",
    prompt: "Help me brainstorm creative and innovative ideas for {topic}. Please provide at least 10 unique ideas with brief explanations for each.",
    icon: Lightbulb,
    variables: ["topic"],
    tags: ["ideas", "creative", "brainstorm"],
    featured: true,
  },
  {
    id: "story-gen",
    title: "Story Generator",
    description: "Create engaging stories with plot twists",
    category: "creative",
    prompt: "Write an engaging short story about {theme} with an unexpected plot twist. Include vivid descriptions and character development.",
    icon: BookOpen,
    variables: ["theme"],
    tags: ["story", "creative", "narrative"],
  },
  {
    id: "creative-names",
    title: "Name Generator",
    description: "Generate creative names for projects, products, or businesses",
    category: "creative",
    prompt: "Generate 20 creative and memorable names for a {type} related to {topic}. For each name, provide a brief explanation of its meaning and appeal.",
    icon: Sparkles,
    variables: ["type", "topic"],
    tags: ["naming", "branding", "creative"],
  },

  // Code Prompts
  {
    id: "debug-code",
    title: "Debug Code",
    description: "Find and fix bugs in your code",
    category: "code",
    prompt: "Please analyze this code and help me debug it:\n\n{code}\n\nIdentify any bugs, potential issues, or improvements. Provide the corrected code with explanations.",
    icon: Bug,
    variables: ["code"],
    tags: ["debug", "code", "fix"],
    featured: true,
  },
  {
    id: "code-review",
    title: "Code Review",
    description: "Get detailed code review with best practices",
    category: "code",
    prompt: "Review this code following best practices:\n\n{code}\n\nProvide feedback on:\n- Code quality and readability\n- Performance optimization\n- Security concerns\n- Design patterns\n- Suggested improvements",
    icon: GitBranch,
    variables: ["code"],
    tags: ["review", "code", "best-practices"],
  },
  {
    id: "explain-code",
    title: "Explain Code",
    description: "Get clear explanations of complex code",
    category: "code",
    prompt: "Explain this code in detail:\n\n{code}\n\nBreak down:\n- What it does\n- How it works\n- Key concepts used\n- Use cases",
    icon: Code,
    variables: ["code"],
    tags: ["explain", "code", "learning"],
  },
  {
    id: "optimize-code",
    title: "Optimize Performance",
    description: "Improve code performance and efficiency",
    category: "code",
    prompt: "Optimize this code for better performance:\n\n{code}\n\nFocus on:\n- Time complexity\n- Space complexity\n- Algorithm efficiency\n- Provide benchmarks if possible",
    icon: Rocket,
    variables: ["code"],
    tags: ["optimize", "performance", "code"],
    featured: true,
  },

  // Writing Prompts
  {
    id: "improve-writing",
    title: "Improve Writing",
    description: "Enhance clarity, tone, and impact",
    category: "writing",
    prompt: "Please improve this text:\n\n{text}\n\nEnhance:\n- Clarity and conciseness\n- Grammar and style\n- Tone and impact\n- Professional polish",
    icon: PenTool,
    variables: ["text"],
    tags: ["writing", "improve", "edit"],
    featured: true,
  },
  {
    id: "write-email",
    title: "Professional Email",
    description: "Compose professional emails",
    category: "writing",
    prompt: "Write a professional email about {topic} to {recipient}. The tone should be {tone}. Include a clear subject line.",
    icon: Mail,
    variables: ["topic", "recipient", "tone"],
    tags: ["email", "professional", "communication"],
  },
  {
    id: "summarize",
    title: "Summarize Content",
    description: "Create concise summaries",
    category: "writing",
    prompt: "Summarize the following content in {length} sentences:\n\n{content}\n\nHighlight the key points and main takeaways.",
    icon: FileText,
    variables: ["content", "length"],
    tags: ["summary", "concise", "tldr"],
  },

  // Analysis Prompts
  {
    id: "data-analysis",
    title: "Analyze Data",
    description: "Extract insights from data",
    category: "analysis",
    prompt: "Analyze this data and provide insights:\n\n{data}\n\nInclude:\n- Key patterns and trends\n- Statistical analysis\n- Visualizations (if applicable)\n- Actionable recommendations",
    icon: BarChart,
    variables: ["data"],
    tags: ["data", "analysis", "insights"],
    featured: true,
  },
  {
    id: "competitive-analysis",
    title: "Competitive Analysis",
    description: "Analyze competitors and market position",
    category: "analysis",
    prompt: "Provide a competitive analysis for {company/product} in the {industry} market. Include:\n- Key competitors\n- Strengths and weaknesses\n- Market positioning\n- Opportunities and threats\n- Strategic recommendations",
    icon: TrendingUp,
    variables: ["company/product", "industry"],
    tags: ["competitive", "market", "strategy"],
  },
  {
    id: "pros-cons",
    title: "Pros & Cons",
    description: "Balanced evaluation of options",
    category: "analysis",
    prompt: "Provide a detailed pros and cons analysis of {topic}. Be objective and comprehensive. Include potential risks and opportunities.",
    icon: CheckCircle,
    variables: ["topic"],
    tags: ["decision", "evaluation", "analysis"],
  },

  // Research Prompts
  {
    id: "research-topic",
    title: "Research Assistant",
    description: "Comprehensive research on any topic",
    category: "research",
    prompt: "Research {topic} and provide:\n- Overview and background\n- Key facts and statistics\n- Current trends and developments\n- Expert perspectives\n- Reliable sources and citations",
    icon: Search,
    variables: ["topic"],
    tags: ["research", "facts", "sources"],
    featured: true,
  },
  {
    id: "explain-concept",
    title: "Explain Like I'm 5",
    description: "Simple explanations of complex topics",
    category: "research",
    prompt: "Explain {concept} in simple terms that anyone can understand. Use analogies and examples. Avoid jargon.",
    icon: Brain,
    variables: ["concept"],
    tags: ["explain", "simple", "eli5"],
  },
  {
    id: "compare-concepts",
    title: "Compare & Contrast",
    description: "Compare different concepts or options",
    category: "research",
    prompt: "Compare and contrast {item1} vs {item2}. Include:\n- Similarities and differences\n- Use cases for each\n- Recommendations on which to choose\n- Visual comparison table",
    icon: Database,
    variables: ["item1", "item2"],
    tags: ["compare", "contrast", "decision"],
  },

  // Business Prompts
  {
    id: "business-plan",
    title: "Business Plan",
    description: "Create comprehensive business plans",
    category: "business",
    prompt: "Create a business plan for {business_idea}. Include:\n- Executive summary\n- Market analysis\n- Target audience\n- Revenue model\n- Marketing strategy\n- Financial projections\n- Risks and mitigation",
    icon: Briefcase,
    variables: ["business_idea"],
    tags: ["business", "plan", "startup"],
  },
  {
    id: "marketing-strategy",
    title: "Marketing Strategy",
    description: "Develop marketing campaigns",
    category: "business",
    prompt: "Develop a marketing strategy for {product/service} targeting {audience}. Include:\n- Key messaging\n- Channel strategy\n- Content ideas\n- Success metrics\n- Budget recommendations",
    icon: Target,
    variables: ["product/service", "audience"],
    tags: ["marketing", "strategy", "campaign"],
    featured: true,
  },

  // Learning Prompts
  {
    id: "study-guide",
    title: "Study Guide",
    description: "Create comprehensive study materials",
    category: "learning",
    prompt: "Create a comprehensive study guide for {subject}. Include:\n- Key concepts and definitions\n- Important formulas or principles\n- Practice questions\n- Study tips\n- Additional resources",
    icon: BookOpen,
    variables: ["subject"],
    tags: ["study", "learning", "education"],
  },
  {
    id: "lesson-plan",
    title: "Lesson Plan",
    description: "Design engaging lessons",
    category: "learning",
    prompt: "Create a lesson plan to teach {topic} to {audience}. Include:\n- Learning objectives\n- Materials needed\n- Step-by-step activities\n- Assessment methods\n- Differentiation strategies",
    icon: BookOpen,
    variables: ["topic", "audience"],
    tags: ["teaching", "lesson", "education"],
  },

  // Productivity Prompts
  {
    id: "todo-organize",
    title: "Task Organizer",
    description: "Organize and prioritize tasks",
    category: "productivity",
    prompt: "Help me organize these tasks:\n\n{tasks}\n\nPrioritize using the Eisenhower Matrix (Urgent/Important). Provide a structured plan with time estimates.",
    icon: CheckCircle,
    variables: ["tasks"],
    tags: ["productivity", "organize", "tasks"],
  },
  {
    id: "meeting-agenda",
    title: "Meeting Agenda",
    description: "Create effective meeting agendas",
    category: "productivity",
    prompt: "Create a meeting agenda for {meeting_topic} with {participants}. Include:\n- Objectives\n- Time allocations\n- Discussion points\n- Action items template\n- Success criteria",
    icon: MessageSquare,
    variables: ["meeting_topic", "participants"],
    tags: ["meeting", "agenda", "productivity"],
  },

  // Translation & Language
  {
    id: "translate",
    title: "Translate Text",
    description: "Accurate translation with context",
    category: "writing",
    prompt: "Translate this text from {source_lang} to {target_lang}:\n\n{text}\n\nMaintain tone, context, and cultural nuances. Provide both literal and natural translations if different.",
    icon: Languages,
    variables: ["source_lang", "target_lang", "text"],
    tags: ["translate", "language", "localization"],
  },
];

export const quickActions = [
  {
    id: "summarize",
    label: "Summarize",
    icon: FileText,
    prompt: "Please summarize the following text concisely:\n\n{selection}",
  },
  {
    id: "explain",
    label: "Explain",
    icon: Brain,
    prompt: "Explain this in simple terms:\n\n{selection}",
  },
  {
    id: "improve",
    label: "Improve",
    icon: Sparkles,
    prompt: "Improve this text for clarity and impact:\n\n{selection}",
  },
  {
    id: "translate",
    label: "Translate",
    icon: Languages,
    prompt: "Translate this to {language}:\n\n{selection}",
  },
  {
    id: "expand",
    label: "Expand",
    icon: TrendingUp,
    prompt: "Expand on this topic with more detail:\n\n{selection}",
  },
];
