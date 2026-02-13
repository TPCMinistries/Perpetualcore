/**
 * Content Templates Library
 *
 * Pre-built prompt templates for common content types.
 * Each template has fill-in fields ({{topic}}, {{audience}}, etc.)
 * that get replaced before generation.
 */

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: "social" | "blog" | "newsletter" | "video" | "email" | "nonprofit";
  contentType: string;
  platform?: string;
  tone: string;
  length: string;
  promptTemplate: string;
  fields: TemplateField[];
  icon: string;
}

export interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea";
  required: boolean;
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  // =====================================================
  // SOCIAL
  // =====================================================
  {
    id: "linkedin-thought-leadership",
    name: "LinkedIn Thought Leadership",
    description: "Contrarian insight post that positions you as an expert. Opens with a bold take, backs it with a framework.",
    category: "social",
    contentType: "linkedin_post",
    platform: "linkedin",
    tone: "thought-leader",
    length: "medium",
    promptTemplate: `Write a LinkedIn thought leadership post about {{topic}}.

Open with a contrarian or surprising insight. Use a framework or historical pattern to make the argument. End with a question that invites discussion.

Target audience: {{audience}}
Key point to make: {{key_point}}`,
    fields: [
      { key: "topic", label: "Topic", placeholder: "e.g., Why most AI implementations fail", type: "text", required: true },
      { key: "audience", label: "Target Audience", placeholder: "e.g., Startup founders and CTOs", type: "text", required: true },
      { key: "key_point", label: "Key Point", placeholder: "e.g., The problem isn't the technology, it's the implementation strategy", type: "text", required: false },
    ],
    icon: "Linkedin",
  },
  {
    id: "twitter-thread",
    name: "Twitter/X Thread",
    description: "Punchy thread that breaks down a topic into digestible tweets. Hook → Value → CTA.",
    category: "social",
    contentType: "twitter_thread",
    platform: "twitter",
    tone: "bold",
    length: "medium",
    promptTemplate: `Write a Twitter/X thread (5-8 tweets) about {{topic}}.

Tweet 1 must be an irresistible hook. Each tweet should stand alone but build on the last. End with a clear takeaway and CTA.

Key insight: {{key_insight}}
Include specific numbers or examples where possible.`,
    fields: [
      { key: "topic", label: "Topic", placeholder: "e.g., 5 AI tools that save me 10+ hours/week", type: "text", required: true },
      { key: "key_insight", label: "Key Insight", placeholder: "e.g., Automation compounds — each tool multiplies the others", type: "text", required: false },
    ],
    icon: "Twitter",
  },
  {
    id: "instagram-carousel",
    name: "Instagram Carousel Script",
    description: "Slide-by-slide carousel copy. Hook slide, 4-6 value slides, CTA slide.",
    category: "social",
    contentType: "instagram_caption",
    platform: "instagram",
    tone: "casual",
    length: "medium",
    promptTemplate: `Write an Instagram carousel post (6-8 slides) about {{topic}}.

Slide 1: Bold hook headline (under 10 words)
Slides 2-6: One key point per slide, short and scannable
Last slide: CTA

Also write the caption (under 2200 chars) with relevant hashtags.

Target audience: {{audience}}`,
    fields: [
      { key: "topic", label: "Topic", placeholder: "e.g., How to build your personal brand with AI", type: "text", required: true },
      { key: "audience", label: "Target Audience", placeholder: "e.g., Young entrepreneurs and creators", type: "text", required: true },
    ],
    icon: "Instagram",
  },
  {
    id: "product-launch",
    name: "Product Launch Announcement",
    description: "Multi-platform launch post. Generates versions for LinkedIn, Twitter, and email.",
    category: "social",
    contentType: "social",
    platform: "linkedin",
    tone: "professional",
    length: "medium",
    promptTemplate: `Write a product launch announcement for {{product_name}}.

What it does: {{description}}
Key benefit: {{key_benefit}}
Who it's for: {{audience}}

Make it exciting without being hyperbolic. Lead with the benefit, not the feature.`,
    fields: [
      { key: "product_name", label: "Product Name", placeholder: "e.g., Perpetual Core 2.0", type: "text", required: true },
      { key: "description", label: "What It Does", placeholder: "e.g., AI-powered content engine that writes in your voice", type: "text", required: true },
      { key: "key_benefit", label: "Key Benefit", placeholder: "e.g., Save 10+ hours/week on content creation", type: "text", required: true },
      { key: "audience", label: "Target Audience", placeholder: "e.g., Busy founders who need content but hate writing it", type: "text", required: true },
    ],
    icon: "Send",
  },

  // =====================================================
  // BLOG / LONG-FORM
  // =====================================================
  {
    id: "blog-how-to",
    name: "How-To Blog Post",
    description: "Step-by-step guide with SEO structure. H2 headers, actionable steps, meta description.",
    category: "blog",
    contentType: "blog",
    platform: "website",
    tone: "professional",
    length: "long",
    promptTemplate: `Write a comprehensive how-to blog post about {{topic}}.

Structure:
- Compelling title (under 60 chars, include primary keyword)
- Meta description (155 chars)
- Introduction that establishes the problem
- Step-by-step guide with H2 headers
- Practical examples or case studies
- Common mistakes to avoid
- Conclusion with key takeaways

Target keyword: {{keyword}}
Target audience: {{audience}}
Desired word count: 1500-2000 words`,
    fields: [
      { key: "topic", label: "Topic", placeholder: "e.g., How to automate your business with AI", type: "text", required: true },
      { key: "keyword", label: "Target Keyword", placeholder: "e.g., AI business automation", type: "text", required: true },
      { key: "audience", label: "Target Audience", placeholder: "e.g., Small business owners new to AI", type: "text", required: true },
    ],
    icon: "FileText",
  },
  {
    id: "case-study",
    name: "Case Study",
    description: "Problem-Solution-Result format. Tells a transformation story with specific metrics.",
    category: "blog",
    contentType: "case_study",
    platform: "website",
    tone: "professional",
    length: "long",
    promptTemplate: `Write a case study about {{client_or_subject}}.

Challenge: {{challenge}}
Solution: {{solution}}
Results: {{results}}

Use the Problem → Solution → Results framework. Include specific numbers and quotes where possible. Make the reader see themselves in the story.`,
    fields: [
      { key: "client_or_subject", label: "Client/Subject", placeholder: "e.g., A mid-size law firm struggling with document review", type: "text", required: true },
      { key: "challenge", label: "Challenge", placeholder: "e.g., 40+ hours/week spent on manual document review", type: "textarea", required: true },
      { key: "solution", label: "Solution", placeholder: "e.g., Implemented AI-powered document analysis", type: "textarea", required: true },
      { key: "results", label: "Results", placeholder: "e.g., 75% time reduction, $200K annual savings", type: "text", required: true },
    ],
    icon: "FileText",
  },

  // =====================================================
  // NEWSLETTER / EMAIL
  // =====================================================
  {
    id: "newsletter-intro",
    name: "Newsletter Introduction",
    description: "Personal, conversational newsletter opener. Hooks the reader, transitions to value.",
    category: "newsletter",
    contentType: "newsletter",
    platform: "email",
    tone: "casual",
    length: "short",
    promptTemplate: `Write a newsletter introduction about {{topic}}.

Open with a personal anecdote, observation, or surprising fact. Transition naturally into the main content. Keep it conversational — like writing to a smart friend.

Main topic: {{topic}}
Key takeaway for readers: {{takeaway}}
Newsletter name/brand: {{newsletter_name}}`,
    fields: [
      { key: "topic", label: "This Week's Topic", placeholder: "e.g., Why I stopped scheduling posts and started posting in real-time", type: "text", required: true },
      { key: "takeaway", label: "Key Takeaway", placeholder: "e.g., Authenticity beats consistency", type: "text", required: true },
      { key: "newsletter_name", label: "Newsletter Name", placeholder: "e.g., The Perpetual Brief", type: "text", required: false },
    ],
    icon: "Mail",
  },
  {
    id: "cold-email",
    name: "Cold Outreach Email",
    description: "Short, personalized cold email. No fluff, clear value prop, soft CTA.",
    category: "email",
    contentType: "email",
    platform: "email",
    tone: "professional",
    length: "short",
    promptTemplate: `Write a cold outreach email to {{recipient_role}} at {{company_type}}.

Value proposition: {{value_prop}}
Desired action: {{desired_action}}

Rules:
- Under 100 words
- No "I hope this finds you well"
- Lead with their problem, not your product
- One clear CTA
- P.S. line optional but effective`,
    fields: [
      { key: "recipient_role", label: "Recipient's Role", placeholder: "e.g., VP of Operations", type: "text", required: true },
      { key: "company_type", label: "Company Type", placeholder: "e.g., mid-size healthcare companies", type: "text", required: true },
      { key: "value_prop", label: "Value Proposition", placeholder: "e.g., We help healthcare orgs cut admin time by 60% with AI", type: "text", required: true },
      { key: "desired_action", label: "Desired Action", placeholder: "e.g., 15-minute discovery call", type: "text", required: true },
    ],
    icon: "Mail",
  },

  // =====================================================
  // VIDEO
  // =====================================================
  {
    id: "youtube-script",
    name: "YouTube Video Script",
    description: "Hook-heavy script with pattern interrupts. Structured for retention.",
    category: "video",
    contentType: "youtube_script",
    platform: "youtube",
    tone: "casual",
    length: "long",
    promptTemplate: `Write a YouTube video script about {{topic}}.

Target length: {{duration}} minutes
Target audience: {{audience}}

Structure:
- Hook (first 30 seconds — make them stay)
- Quick preview of what they'll learn
- Main content with 3-5 sections
- Pattern interrupt every 2-3 minutes
- Call to action (subscribe, comment, link)

Write in spoken English — short sentences, direct address ("you"), conversational.`,
    fields: [
      { key: "topic", label: "Video Topic", placeholder: "e.g., How I built an AI business in 30 days", type: "text", required: true },
      { key: "duration", label: "Target Duration (min)", placeholder: "e.g., 10", type: "text", required: true },
      { key: "audience", label: "Target Audience", placeholder: "e.g., Aspiring entrepreneurs interested in AI", type: "text", required: true },
    ],
    icon: "Youtube",
  },

  // =====================================================
  // NONPROFIT / MISSION
  // =====================================================
  {
    id: "impact-story",
    name: "Nonprofit Impact Story",
    description: "Mission-driven storytelling. Connects operations to impact, donor-ready.",
    category: "nonprofit",
    contentType: "blog",
    platform: "website",
    tone: "pastoral",
    length: "medium",
    promptTemplate: `Write an impact story for {{organization}}.

Who was helped: {{beneficiary}}
What changed: {{transformation}}
How it happened: {{how}}

Frame this through a mission lens — every operational improvement returns time/money to mission. Make donors see the human impact. Use "every X is a Y" pattern for emotional resonance.`,
    fields: [
      { key: "organization", label: "Organization", placeholder: "e.g., Institute for Human Advancement", type: "text", required: true },
      { key: "beneficiary", label: "Who Was Helped", placeholder: "e.g., 50 healthcare students in underserved communities", type: "text", required: true },
      { key: "transformation", label: "What Changed", placeholder: "e.g., Went from 20% to 85% certification pass rate", type: "text", required: true },
      { key: "how", label: "How It Happened", placeholder: "e.g., AI-powered personalized learning paths", type: "textarea", required: true },
    ],
    icon: "FileText",
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category?: string): ContentTemplate[] {
  if (!category) return CONTENT_TEMPLATES;
  return CONTENT_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplate(id: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Fill template fields with values
 */
export function fillTemplate(
  template: ContentTemplate,
  values: Record<string, string>
): string {
  let prompt = template.promptTemplate;
  for (const [key, value] of Object.entries(values)) {
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  // Remove any unfilled placeholders
  prompt = prompt.replace(/\{\{[^}]+\}\}/g, "[not specified]");
  return prompt;
}

/**
 * Get template categories with counts
 */
export function getTemplateCategories(): { id: string; label: string; count: number }[] {
  const categories = [
    { id: "social", label: "Social Media" },
    { id: "blog", label: "Blog / Long-Form" },
    { id: "newsletter", label: "Newsletter" },
    { id: "email", label: "Email" },
    { id: "video", label: "Video" },
    { id: "nonprofit", label: "Nonprofit" },
  ];

  return categories.map((c) => ({
    ...c,
    count: CONTENT_TEMPLATES.filter((t) => t.category === c.id).length,
  }));
}
