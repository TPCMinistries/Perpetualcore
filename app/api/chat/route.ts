import { createClient, createAdminClient } from "@/lib/supabase/server";
import { streamChatCompletion, ChatMessage, UsageMetadata, ToolCall } from "@/lib/ai/router";
import { AIModel } from "@/types";
import { NextRequest } from "next/server";
import { selectBestModel, isAutoMode } from "@/lib/ai/model-router";
import { AI_MODELS } from "@/lib/ai/config";
import { searchDocuments, buildRAGContext, shouldUseRAG } from "@/lib/documents/rag";
import { calculateCost } from "@/lib/ai/cost-calculator";
import { AVAILABLE_TOOLS, executeToolCall } from "@/lib/ai/tools/registry";
import { loadUserPreferences, applyPreferencesToPrompt } from "@/lib/intelligence/preference-loader";
import { getIntelligenceSummary } from "@/lib/intelligence";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";
import { loadTeamContext, loadUserTeamContext, buildTeamSystemPrompt, LoadedTeamContext } from "@/lib/intelligence/team-context";
import { buildMemoryContext, extractMemoriesFromConversation } from "@/lib/ai/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Build optimized, model-specific system prompts
 * Different models perform better with different prompting strategies
 */
function buildOptimizedSystemPrompt(model: AIModel, userMessage: string): string {
  const msg = userMessage.toLowerCase();
  const isComplexTask = msg.length > 500 ||
    msg.match(/analyze|research|complex|detailed|explain|compare|comprehensive/i);
  const isCodeTask = msg.match(/code|program|function|debug|implement/i);

  // Base capabilities all models have
  const basePrompt = `You are an advanced AI assistant with persistent memory and intelligent capabilities.

CORE CAPABILITIES:
• Persistent Memory: You remember all past conversations in this chat
• Conversation Search: You can search through ALL previous conversations across different chats using the search_conversations tool
• Document Access: You can reference uploaded documents when relevant
• Context Awareness: You maintain full context across the conversation
• Tool Usage: You can create tasks, search the web, query documents, and search conversation history when needed

IMPORTANT - INFINITE MEMORY FEATURE:
When a user asks about previous conversations (e.g., "what did we discuss about X?", "my last conversation about Y", "earlier we talked about Z"), you MUST use the search_conversations tool to find relevant past discussions. This is a core feature that differentiates you from other AI assistants.

RESPONSE QUALITY STANDARDS:
• Be accurate, thorough, and helpful
• Cite sources when referencing documents, web search results, or previous conversations
• Ask clarifying questions if the request is ambiguous
• Structure complex information clearly with headings, lists, and examples
• Admit uncertainty rather than guess`;

  // Model-specific optimizations
  if (model === "claude-opus-4") {
    // Claude Opus: Best for deep reasoning and analysis
    return `${basePrompt}

ADVANCED REASONING MODE:
You are Claude Opus, optimized for complex reasoning and critical thinking.
${isComplexTask ? `
For this complex task:
1. Break down the problem into components
2. Consider multiple perspectives and approaches
3. Show your reasoning process step-by-step
4. Provide comprehensive analysis with nuanced insights
5. Highlight assumptions, limitations, and edge cases` : ''}

Excellence is expected. Provide thorough, well-reasoned responses that demonstrate deep understanding.`;
  }

  if (model === "claude-sonnet-4") {
    // Claude Haiku: Fast and creative
    return `${basePrompt}

PERFORMANCE MODE:
You are Claude Haiku, optimized for speed and creativity while maintaining high quality.
• Provide clear, concise responses
• Use creative problem-solving approaches
• Balance thoroughness with efficiency
• Maintain conversational and helpful tone`;
  }

  if (model === "deepseek-chat") {
    // DeepSeek V3: Exceptional at code and math
    if (isCodeTask) {
      return `${basePrompt}

CODE EXCELLENCE MODE:
You are DeepSeek V3, specialized in code generation and technical problem-solving.
• Write clean, well-documented, production-ready code
• Follow best practices and design patterns
• Include error handling and edge cases
• Explain your implementation choices
• Provide examples and usage instructions
• Consider performance, security, and maintainability`;
    }

    return `${basePrompt}

ANALYTICAL MODE:
You are DeepSeek V3, optimized for logical reasoning and precise analysis.
• Approach problems methodically
• Provide accurate calculations and data analysis
• Use step-by-step reasoning for complex problems
• Be precise with technical details`;
  }

  if (model === "gpt-4o") {
    // GPT-4o: Vision, web search, real-time info
    return `${basePrompt}

MULTIMODAL & REAL-TIME MODE:
You are GPT-4o with advanced capabilities:
• Vision: Analyze images, screenshots, diagrams, and charts in detail
• Web Search: Access real-time information and current events
• Comprehensive Knowledge: Draw from broad, up-to-date information

When analyzing images:
1. Describe what you see in detail
2. Identify key elements, text, and patterns
3. Provide actionable insights based on visual content

When providing current information:
• Cite your sources
• Indicate the recency of information
• Distinguish between facts and analysis`;
  }

  if (model === "gemini-2.0-flash-exp") {
    // Gemini: Massive context window
    return `${basePrompt}

LONG-CONTEXT MODE:
You are Gemini 2.0 Flash with a massive 1M token context window.
• Process and analyze extremely large documents
• Maintain coherence across extensive conversations
• Synthesize information from multiple sources
• Provide comprehensive summaries and insights

When working with large documents:
1. Identify key themes and patterns across the entire content
2. Provide structured summaries with main points
3. Reference specific sections when making claims
4. Highlight connections and relationships in the material`;
  }

  // Default for GPT-4o Mini and others
  return `${basePrompt}

EFFICIENCY MODE:
Provide high-quality responses efficiently.
• Be clear and concise
• Focus on what matters most
• Provide practical, actionable information
• Maintain accuracy and helpfulness`;
}

/**
 * Build intelligence context from learned insights, patterns, and preferences
 * This context makes the AI aware of what it has learned about the user
 */
function buildIntelligenceContext(intelligence: {
  insights: any[];
  patterns: any[];
  preferences: any[];
  suggestions: any[];
}): string | null {
  const contextParts: string[] = [];

  // Add relevant insights
  if (intelligence.insights && intelligence.insights.length > 0) {
    const insightSummaries = intelligence.insights
      .slice(0, 3)
      .map((i: any) => `• ${i.title} (${i.insight_type})`)
      .join("\n");
    contextParts.push(`LEARNED INSIGHTS ABOUT THIS USER:\n${insightSummaries}`);
  }

  // Add recognized patterns
  if (intelligence.patterns && intelligence.patterns.length > 0) {
    const patternSummaries = intelligence.patterns
      .slice(0, 3)
      .map((p: any) => `• ${p.pattern_name} (observed ${p.occurrence_count} times)`)
      .join("\n");
    contextParts.push(`RECOGNIZED PATTERNS:\n${patternSummaries}`);
  }

  // Add pending suggestions (so AI can proactively mention relevant ones)
  if (intelligence.suggestions && intelligence.suggestions.length > 0) {
    const topSuggestion = intelligence.suggestions[0];
    if (topSuggestion && topSuggestion.relevance_score > 0.7) {
      contextParts.push(`PROACTIVE SUGGESTION: You may want to proactively mention: "${topSuggestion.suggestion_text}" if relevant to the conversation.`);
    }
  }

  if (contextParts.length === 0) return null;

  return `\n\n--- PERSONALIZATION CONTEXT (from learned intelligence) ---\n${contextParts.join("\n\n")}\n\nUse this context to provide more personalized, relevant responses. Don't explicitly mention that you're using learned intelligence unless asked.`;
}

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  try {
    // Check if at least one AI provider is configured
    const hasAIProvider = !!(
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY
    );

    if (!hasAIProvider) {
      console.error("❌ No AI provider configured. Add ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY to environment variables.");
      return new Response(
        JSON.stringify({
          error: "AI service not configured",
          message: "Please configure at least one AI provider (Anthropic, OpenAI, or Google) in environment variables.",
          hint: "Add ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY to your Vercel environment variables."
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Rate limiting - 30 requests per minute for chat API
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.chat);
    if (rateLimitResponse) return rateLimitResponse;

    if (isDev) console.log("📨 Chat API called");
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's profile, create if doesn't exist
    // Use admin client to bypass RLS for profile creation
    if (isDev) console.log("🔍 Checking for profile for user:", user.id);

    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "SUPABASE_SERVICE_ROLE_KEY is not configured. Please add it to your Vercel environment variables."
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    let adminSupabase;
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      adminSupabase = createAdminClient();
      if (isDev) console.log("✅ Admin client created");
    } catch (error: any) {
      console.error("❌ Failed to create admin client:", error);
      if (isDev) console.error("Error stack:", error?.stack);
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details: error?.message || "Failed to initialize admin client. Check SUPABASE_SERVICE_ROLE_KEY in environment variables."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    let { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (isDev) console.log("🔍 Profile query result:", {
      found: !!profile,
      error: profileError?.message,
      userId: user.id
    });

    // If profile doesn't exist, create it using admin client (bypasses RLS)
    if (profileError || !profile) {
      if (isDev) console.log("Profile not found, creating one with admin client...");
      
      // Create profile with minimal required fields
      const profileData: any = {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      };
      
      // Try to create organization if user has org name in metadata
      const orgName = user.user_metadata?.organization_name;
      if (orgName) {
        // Check if org exists
        const { data: existingOrg } = await adminSupabase
          .from("organizations")
          .select("id")
          .eq("name", orgName)
          .single();
        
        if (existingOrg) {
          profileData.organization_id = existingOrg.id;
        } else {
          // Create new organization
          const orgSlug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
          const { data: newOrg, error: orgError } = await adminSupabase
            .from("organizations")
            .insert({
              name: orgName,
              slug: orgSlug,
            })
            .select()
            .single();
          
          if (!orgError && newOrg) {
            profileData.organization_id = newOrg.id;
          }
        }
      }
      
      const { data: newProfile, error: createError } = await adminSupabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        if (isDev) console.error("Error creating profile:", createError);
        if (isDev) console.error("Profile data attempted:", profileData);
        return new Response(
          JSON.stringify({ 
            error: "Failed to create profile", 
            details: createError.message,
            code: createError.code,
            hint: createError.hint
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      profile = newProfile;
      if (isDev) console.log("✅ Profile created successfully:", profile.id);
    }

    // Allow personal chat without organization
    // If no org, we'll use user_id as org_id for RAG search
    const organizationId = profile?.organization_id || user.id;

    const {
      messages,
      model: selectedModel,
      conversationId,
      attachments,
      mentionedContactIds,
    }: {
      messages: ChatMessage[];
      model: AIModel;
      conversationId?: string;
      attachments?: Array<{
        name: string;
        type: "image" | "document";
        data: string;
        mimeType: string;
      }>;
      mentionedContactIds?: string[];
    } = await req.json();

    // Determine which model to use
    const userMessage = messages[messages.length - 1].content;
    let modelSelection;

    // Auto-select model based on attachments if present
    if (attachments && attachments.length > 0) {
      const hasImages = attachments.some((a) => a.type === "image");
      const hasLargeDoc = attachments.some(
        (a) => a.type === "document" && a.data.length > 100000
      );

      if (hasImages && isAutoMode(selectedModel)) {
        // Images -> GPT-4o (vision capable)
        modelSelection = {
          model: "gpt-4o",
          provider: "openai",
          reason: "Image analysis with vision",
          displayName: AI_MODELS["gpt-4o"].name,
          icon: AI_MODELS["gpt-4o"].icon,
        };
      } else if (hasLargeDoc && isAutoMode(selectedModel)) {
        // Large documents -> Gemini (massive context)
        modelSelection = {
          model: "gemini-2.0-flash-exp",
          provider: "google",
          reason: "Large document processing",
          displayName: AI_MODELS["gemini-2.0-flash-exp"].name,
          icon: AI_MODELS["gemini-2.0-flash-exp"].icon,
        };
      } else if (isAutoMode(selectedModel)) {
        modelSelection = selectBestModel(userMessage);
      } else {
        const modelInfo = AI_MODELS[selectedModel];
        modelSelection = {
          model: selectedModel,
          provider: modelInfo.provider,
          reason: "Manually selected",
          displayName: modelInfo.name,
          icon: modelInfo.icon,
        };
      }
    } else if (isAutoMode(selectedModel)) {
      // Auto-select best model
      modelSelection = selectBestModel(userMessage);
    } else {
      // User manually selected a model
      const modelInfo = AI_MODELS[selectedModel];
      modelSelection = {
        model: selectedModel,
        provider: modelInfo.provider,
        reason: "Manually selected",
        displayName: modelInfo.name,
        icon: modelInfo.icon,
      };
    }

    const model = modelSelection.model as AIModel;

    // Process attachments
    let messagesWithContext = messages;
    if (attachments && attachments.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const hasImages = attachments.some((a) => a.type === "image");
      const hasDocuments = attachments.some((a) => a.type === "document");

      // For images with vision-capable models (GPT-4o), format for vision API
      if (hasImages && model === "gpt-4o") {
        const imageContents = attachments
          .filter((a) => a.type === "image")
          .map((a) => ({
            type: "image_url" as const,
            image_url: {
              url: a.data,
            },
          }));

        // Replace last message with vision format
        messagesWithContext = [
          ...messages.slice(0, -1),
          {
            role: "user" as const,
            content: [
              { type: "text" as const, text: lastMessage.content },
              ...imageContents,
            ] as any,
          },
        ];
      }
      // For images with non-vision models, add descriptive text
      else if (hasImages) {
        const imageNames = attachments
          .filter((a) => a.type === "image")
          .map((a) => a.name)
          .join(", ");

        messagesWithContext = [
          ...messages.slice(0, -1),
          {
            role: "user" as const,
            content: `${lastMessage.content}\n\n[User uploaded images: ${imageNames}. Note: This model cannot view images. Consider using GPT-4o for image analysis.]`,
          },
        ];
      }

      // For documents, extract text and add as context
      if (hasDocuments) {
        const documentTexts = attachments
          .filter((a) => a.type === "document")
          .map((a) => {
            // Check if it's a PDF
            const isPDF = a.mimeType === "application/pdf" || a.name.toLowerCase().endsWith(".pdf");
            const isDOCX = a.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || a.name.toLowerCase().endsWith(".docx");

            if (isPDF || isDOCX) {
              return `[Document: ${a.name}]

⚠️ Quick attachments don't support ${isPDF ? 'PDF' : 'Word'} parsing yet.

💡 For best results with ${isPDF ? 'PDF' : 'Word'} files:
1. Go to Knowledge → Documents in the sidebar
2. Upload your ${isPDF ? 'PDF' : 'Word'} file there for full processing with embeddings
3. It will be automatically searchable via RAG in all future chats

Or, you can copy and paste the text content directly into this chat.`;
            }

            // Decode base64 and extract text (for .txt, .csv files)
            try {
              const base64Data = a.data.split(",")[1];
              if (!base64Data) {
                return `[Document: ${a.name}]\n(No content available)`;
              }
              const decodedText = atob(base64Data);
              // Try to extract readable text (works for .txt, .csv)
              const readableText = decodedText.replace(/[^\x20-\x7E\n\r\t]/g, '');
              if (readableText.trim().length > 50) {
                return `[Document: ${a.name}]\n\n${readableText.substring(0, 15000)}`; // Increased limit
              }
              return `[Document: ${a.name}]\n(Could not extract readable text. File type: ${a.mimeType})`;
            } catch (error) {
              if (isDev) console.error(`Error extracting text from ${a.name}:`, error);
              return `[Document: ${a.name}]\n(Unable to extract text)`;
            }
          })
          .join("\n\n");

        // Add documents as system context (prepend to existing if images were also handled)
        const documentContext = `The user has uploaded the following documents:\n\n${documentTexts}`;

        if (hasImages && model === "gpt-4o") {
          // If we already formatted for vision, add document context as system message
          messagesWithContext = [
            { role: "system" as const, content: documentContext },
            ...messagesWithContext,
          ];
        } else if (!hasImages || model !== "gpt-4o") {
          // Otherwise replace the messages
          messagesWithContext = [
            { role: "system" as const, content: documentContext },
            ...messages,
          ];
        }
      }
    }

    // Build model-specific optimized system prompt
    let systemPrompt = buildOptimizedSystemPrompt(model, userMessage);

    // Helper function to add timeout to promises to prevent hangs
    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
      ]);
    };

    // Load and apply user intelligence (preferences, patterns, insights)
    // Use timeout to prevent intelligence queries from blocking chat if tables don't exist or RLS hangs
    try {
      if (isDev) console.log("🧠 Loading user intelligence...");
      const [preferences, intelligence] = await Promise.all([
        withTimeout(loadUserPreferences(user.id), 3000, {}),
        withTimeout(getIntelligenceSummary(organizationId, user.id), 3000, { insights: [], patterns: [], preferences: [], suggestions: [] }),
      ]);

      // Apply learned preferences to system prompt
      if (Object.keys(preferences).length > 0) {
        if (isDev) console.log("🎯 Applying user preferences:", Object.keys(preferences));
        systemPrompt = applyPreferencesToPrompt(systemPrompt, preferences);
      }

      // Inject relevant intelligence context
      const intelligenceContext = buildIntelligenceContext(intelligence);
      if (intelligenceContext) {
        if (isDev) console.log("💡 Injecting intelligence context");
        systemPrompt += intelligenceContext;
      }
    } catch (error) {
      if (isDev) console.error("⚠️ Intelligence loading error (non-fatal):", error);
      // Continue without intelligence - this should not block chat
    }

    // Load and inject AI memory context (persistent knowledge about the user)
    try {
      const memoryContext = await buildMemoryContext(supabase, user.id);
      if (memoryContext) {
        if (isDev) console.log("🧠 Injecting AI memory context");
        systemPrompt += "\n\n" + memoryContext;
      }
    } catch (error) {
      if (isDev) console.error("⚠️ Memory loading error (non-fatal):", error);
    }

    // Check if message context suggests contact-related topics for proactive suggestions
    const contactRelatedKeywords = /\b(contact|reach out|follow up|email|call|meeting|connect|introduce|network|relationship|client|prospect|lead|customer|partner|investor|advisor|mentor|colleague|coworker|vendor|supplier|recruiter|hire|hiring|talent)\b/i;
    const shouldSuggestContacts = contactRelatedKeywords.test(userMessage) && !mentionedContactIds?.length;

    // Proactively fetch relevant contacts if the message context suggests it
    if (shouldSuggestContacts) {
      try {
        if (isDev) console.log("🔍 Checking for proactively relevant contacts...");

        // Get contacts needing follow-up
        const { data: followupContacts } = await supabase
          .from("contacts")
          .select("first_name, last_name, company, job_title, next_followup_date")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .lte("next_followup_date", new Date().toISOString().split("T")[0])
          .order("next_followup_date", { ascending: true })
          .limit(3);

        // Get inner circle contacts not contacted recently
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: dormantInnerCircle } = await supabase
          .from("contacts")
          .select("first_name, last_name, company, job_title, last_contacted_at")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .gte("relationship_strength", 80)
          .lt("last_contacted_at", thirtyDaysAgo.toISOString())
          .order("last_contacted_at", { ascending: true })
          .limit(3);

        const suggestions: string[] = [];

        if (followupContacts && followupContacts.length > 0) {
          const names = followupContacts.map((c: any) =>
            `${c.first_name}${c.last_name ? ' ' + c.last_name : ''}${c.company ? ` (${c.company})` : ''}`
          ).join(", ");
          suggestions.push(`Contacts with overdue follow-ups: ${names}`);
        }

        if (dormantInnerCircle && dormantInnerCircle.length > 0) {
          const names = dormantInnerCircle.map((c: any) =>
            `${c.first_name}${c.last_name ? ' ' + c.last_name : ''}${c.company ? ` (${c.company})` : ''}`
          ).join(", ");
          suggestions.push(`Inner circle contacts you haven't reached out to in 30+ days: ${names}`);
        }

        if (suggestions.length > 0) {
          const proactiveContext = `
--- PROACTIVE CONTACT SUGGESTIONS ---
Based on your relationship data, here are contacts that might be relevant:
${suggestions.map(s => `• ${s}`).join('\n')}

You can use the search_contacts tool to find more specific contacts, or suggest these to the user if relevant to their query.
---`;
          systemPrompt += "\n\n" + proactiveContext;
          if (isDev) console.log("✅ Added proactive contact suggestions");
        }
      } catch (error) {
        if (isDev) console.error("⚠️ Proactive contact suggestions error (non-fatal):", error);
      }
    }

    // Load and inject mentioned contact context
    let mentionedContactsData: any[] = [];
    if (mentionedContactIds && mentionedContactIds.length > 0) {
      try {
        if (isDev) console.log("👤 Loading mentioned contacts:", mentionedContactIds);
        const { data: contacts, error: contactsError } = await supabase
          .from("contacts")
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            company,
            job_title,
            department,
            industry,
            city,
            state,
            country,
            relationship_strength,
            relationship_status,
            lead_status,
            lead_score,
            linkedin_url,
            twitter_url,
            bio,
            notes,
            tags,
            preferred_contact_method,
            last_contacted_at,
            next_followup_date,
            first_contact_date
          `)
          .eq("user_id", user.id)
          .in("id", mentionedContactIds);

        if (!contactsError && contacts && contacts.length > 0) {
          mentionedContactsData = contacts;

          // Build contact context string
          const contactContextParts = contacts.map((contact: any) => {
            const fullName = `${contact.first_name}${contact.last_name ? ' ' + contact.last_name : ''}`;
            const parts = [`**${fullName}**`];

            if (contact.job_title && contact.company) {
              parts.push(`Role: ${contact.job_title} at ${contact.company}`);
            } else if (contact.job_title) {
              parts.push(`Role: ${contact.job_title}`);
            } else if (contact.company) {
              parts.push(`Company: ${contact.company}`);
            }

            if (contact.industry) {
              parts.push(`Industry: ${contact.industry}`);
            }

            if (contact.email) {
              parts.push(`Email: ${contact.email}`);
            }

            if (contact.phone) {
              parts.push(`Phone: ${contact.phone}`);
            }

            if (contact.city || contact.state || contact.country) {
              const location = [contact.city, contact.state, contact.country].filter(Boolean).join(", ");
              parts.push(`Location: ${location}`);
            }

            // Relationship info
            if (contact.relationship_strength !== null && contact.relationship_strength !== undefined) {
              let strengthLabel = "New";
              if (contact.relationship_strength >= 80) strengthLabel = "Inner Circle";
              else if (contact.relationship_strength >= 60) strengthLabel = "Close";
              else if (contact.relationship_strength >= 40) strengthLabel = "Connected";
              else if (contact.relationship_strength >= 20) strengthLabel = "Acquaintance";
              parts.push(`Relationship: ${strengthLabel} (${contact.relationship_strength}/100)`);
            }

            if (contact.relationship_status) {
              parts.push(`Status: ${contact.relationship_status}`);
            }

            if (contact.lead_status) {
              parts.push(`Lead Status: ${contact.lead_status} (Score: ${contact.lead_score || 0})`);
            }

            // Social links
            const socialLinks = [];
            if (contact.linkedin_url) socialLinks.push("LinkedIn");
            if (contact.twitter_url) socialLinks.push("Twitter");
            if (socialLinks.length > 0) {
              parts.push(`Social: ${socialLinks.join(", ")}`);
            }

            // Communication preferences
            if (contact.preferred_contact_method) {
              parts.push(`Preferred Contact: ${contact.preferred_contact_method}`);
            }

            // Dates
            if (contact.last_contacted_at) {
              const lastContact = new Date(contact.last_contacted_at);
              const daysSince = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
              parts.push(`Last Contact: ${daysSince} days ago`);
            }

            if (contact.next_followup_date) {
              const followup = new Date(contact.next_followup_date);
              const daysUntil = Math.floor((followup.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              if (daysUntil < 0) {
                parts.push(`⚠️ Follow-up Overdue: ${Math.abs(daysUntil)} days`);
              } else if (daysUntil === 0) {
                parts.push(`📅 Follow-up Due Today`);
              } else {
                parts.push(`Next Follow-up: in ${daysUntil} days`);
              }
            }

            if (contact.tags && contact.tags.length > 0) {
              parts.push(`Tags: ${contact.tags.join(", ")}`);
            }

            if (contact.bio) {
              parts.push(`Bio: ${contact.bio.substring(0, 200)}${contact.bio.length > 200 ? '...' : ''}`);
            }

            if (contact.notes) {
              parts.push(`Notes: ${contact.notes.substring(0, 300)}${contact.notes.length > 300 ? '...' : ''}`);
            }

            return parts.join("\n");
          });

          const contactContext = `
--- MENTIONED CONTACTS CONTEXT ---
The user has mentioned the following contacts in their message. Use this information to provide personalized, context-aware responses about these people:

${contactContextParts.join("\n\n---\n\n")}

When discussing these contacts:
• Reference their role, company, and relationship to provide relevant advice
• Consider their lead status for sales-related queries
• Suggest follow-up actions if they're overdue
• Use their preferred contact method when suggesting outreach
• Consider their location for timezone-appropriate suggestions
---`;

          systemPrompt += "\n\n" + contactContext;
          if (isDev) console.log(`✅ Injected context for ${contacts.length} mentioned contact(s)`);
        }
      } catch (error) {
        if (isDev) console.error("⚠️ Contact context loading error (non-fatal):", error);
      }
    }

    // Load and apply team context if user has an active team context set
    let activeTeamContext: LoadedTeamContext | null = null;
    try {
      if (profile?.active_team_context) {
        if (isDev) console.log("👥 Loading team context:", profile.active_team_context);
        activeTeamContext = await withTimeout(
          loadTeamContext(profile.active_team_context),
          3000,
          null
        );

        if (activeTeamContext) {
          if (isDev) console.log("✅ Team context loaded:", activeTeamContext.teamName);
          systemPrompt = buildTeamSystemPrompt(systemPrompt, activeTeamContext);
        }
      }
    } catch (error) {
      if (isDev) console.error("⚠️ Team context loading error (non-fatal):", error);
      // Continue without team context - this should not block chat
    }

    // Check if we should use RAG
    let relevantDocs: any[] = [];
    if (isDev) console.log("🔍 Checking RAG for query:", userMessage);
    const useRAG = shouldUseRAG(userMessage);
    if (isDev) console.log("🔍 shouldUseRAG returned:", useRAG);

    if (useRAG) {
      try {
        if (isDev) console.log("🔍 Searching documents for org:", organizationId, "user:", user.id);
        // Search for relevant documents with enhanced context-aware RAG
        // Lower threshold (0.3) to be more inclusive - let the AI decide what's relevant
        // Use timeout to prevent RAG from blocking chat if vector DB hangs
        // Build RAG options with optional team filtering
        const ragOptions: {
          scope: 'all' | 'personal' | 'team';
          conversationId?: string;
          teamId?: string;
        } = {
          scope: activeTeamContext ? 'team' : 'all', // Filter to team if active context
          conversationId: conversationId || undefined,
        };

        // Add team filter if team context is active
        if (activeTeamContext) {
          ragOptions.teamId = activeTeamContext.teamId;
          if (isDev) console.log("🔍 RAG filtered to team:", activeTeamContext.teamName);
        }

        relevantDocs = await withTimeout(
          searchDocuments(
            userMessage,
            organizationId, // Use organizationId variable (user.id if no org)
            user.id, // Pass user ID for permission checking
            10, // Get more chunks for better context
            0.3, // Lower threshold = more permissive, like NotebookLM
            ragOptions
          ),
          5000, // 5 second timeout for RAG
          [] // Return empty array on timeout
        );
        if (isDev) console.log("🔍 Search results:", relevantDocs.length, "documents found");

        if (relevantDocs.length > 0) {
          if (isDev) console.log("✅ RAG: Injecting", relevantDocs.length, "document chunks into context");
          // Build RAG context
          const ragContext = buildRAGContext(relevantDocs);

          // Prepend RAG context to system prompt
          systemPrompt = ragContext + "\n\n" + systemPrompt;
        } else {
          if (isDev) console.log("⚠️ RAG: No relevant documents found");
        }
      } catch (error) {
        // Fail gracefully if RAG isn't set up yet
        if (isDev) console.error("❌ RAG search error:", error);
      }
    } else {
      if (isDev) console.log("⏭️ RAG: Skipped (query doesn't match criteria)");
    }

    // Inject system prompt
    const existingSystemMessage = messagesWithContext.find(
      (m) => m.role === "system"
    );
    if (existingSystemMessage) {
      existingSystemMessage.content = systemPrompt + "\n\n" + existingSystemMessage.content;
    } else {
      messagesWithContext = [
        { role: "system" as const, content: systemPrompt },
        ...messagesWithContext,
      ];
    }

    // Create or update conversation
    let convId = conversationId;
    if (!convId) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          title: messages[0]?.content.substring(0, 100) || "New conversation",
          model,
        })
        .select()
        .single();

      if (convError) throw convError;
      convId = newConv.id;
    }

    // Save user message
    const lastUserMessage = messages[messages.length - 1];
    const { data: savedMessage } = await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: lastUserMessage.content,
    }).select().single();

    // Auto-extract tasks from user message (async, don't wait)
    if (savedMessage) {
      import("@/lib/tasks/extractor").then(({ extractTasksFromChatMessage }) => {
        extractTasksFromChatMessage(
          lastUserMessage.content,
          savedMessage.id,
          user.id,
          organizationId
        ).catch((err) => isDev && console.error("Task extraction error:", err));
      });
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let conversationMessages = [...messagesWithContext];
        let maxIterations = 5; // Prevent infinite tool calling loops
        let totalUsage: UsageMetadata = { inputTokens: 0, outputTokens: 0 };
        let finalResponse = "";

        try {
          // Send model selection info first
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                modelUsed: {
                  name: modelSelection.displayName,
                  reason: modelSelection.reason,
                  model: modelSelection.model,
                  icon: modelSelection.icon,
                },
              }) + "\n"
            )
          );

          // Send RAG info if documents were used
          if (relevantDocs.length > 0) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  ragUsed: true,
                  documentsCount: relevantDocs.length,
                }) + "\n"
              )
            );
          }

          // Send team context info if active
          if (activeTeamContext) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  teamContext: {
                    teamId: activeTeamContext.teamId,
                    teamName: activeTeamContext.teamName,
                    teamEmoji: activeTeamContext.teamEmoji,
                    teamColor: activeTeamContext.teamColor,
                  },
                }) + "\n"
              )
            );
          }

          // Tool execution loop - allows multi-turn tool use
          while (maxIterations > 0) {
            let fullResponse = "";
            let toolCallsToExecute: ToolCall[] = [];
            let usage: UsageMetadata | undefined;

            // Stream AI response with tools
            for await (const chunk of streamChatCompletion(
              model,
              conversationMessages,
              AVAILABLE_TOOLS // Pass available tools
            )) {
              // Handle fallback events
              if ((chunk as any).fallback) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      fallback: {
                        from: (chunk as any).from,
                        to: (chunk as any).to,
                        reason: (chunk as any).reason,
                      },
                    }) + "\n"
                  )
                );
                continue;
              }

              if (chunk.done) {
                usage = chunk.usage;
                break;
              }

              // Stream content to user
              if (chunk.content) {
                fullResponse += chunk.content;
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      content: chunk.content,
                      conversationId: convId,
                    }) + "\n"
                  )
                );
              }

              // Collect tool calls
              if (chunk.tool_calls) {
                toolCallsToExecute = chunk.tool_calls;
              }
            }

            // Accumulate usage
            if (usage) {
              totalUsage.inputTokens += usage.inputTokens;
              totalUsage.outputTokens += usage.outputTokens;
            }

            // If no tool calls, we're done
            if (toolCallsToExecute.length === 0) {
              finalResponse = fullResponse;
              break;
            }

            // Execute tool calls
            if (isDev) console.log(`🔧 Executing ${toolCallsToExecute.length} tool call(s)`);
            const toolResults: string[] = [];

            for (const toolCall of toolCallsToExecute) {
              // Show user what tool is being called
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    tool_status: `Calling ${toolCall.name}...`,
                  }) + "\n"
                )
              );

              try {
                const params = JSON.parse(toolCall.arguments);
                const result = await executeToolCall(toolCall.name, params, {
                  userId: user.id,
                  organizationId: organizationId,
                  conversationId: convId,
                });

                toolResults.push(result);

                // Show user the tool result
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      tool_result: { name: toolCall.name, result },
                    }) + "\n"
                  )
                );

                if (isDev) console.log(`✅ Tool ${toolCall.name} executed successfully`);
              } catch (error: any) {
                if (isDev) console.error(`❌ Tool ${toolCall.name} failed:`, error);
                const errorMsg = `Error: ${error.message}`;
                toolResults.push(errorMsg);

                // Show error to user
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      tool_result: { name: toolCall.name, result: errorMsg },
                    }) + "\n"
                  )
                );
              }
            }

            // Add AI response with tool calls to conversation
            conversationMessages.push({
              role: "assistant",
              content:
                fullResponse ||
                `Called tools: ${toolCallsToExecute.map((t) => t.name).join(", ")}`,
            });

            // Add tool results to conversation
            conversationMessages.push({
              role: "user",
              content: `Tool results:\n${toolResults
                .map((r, i) => `${toolCallsToExecute[i].name}: ${r}`)
                .join("\n\n")}`,
            });

            maxIterations--;
            // Loop continues - model will process tool results and potentially call more tools
          }

          // Calculate cost if usage data is available
          let costData: {
            tokens_used?: number;
            cost_usd?: string;
            model_used?: string;
          } = {};
          if (totalUsage.inputTokens > 0 || totalUsage.outputTokens > 0) {
            const cost = calculateCost(
              model,
              totalUsage.inputTokens,
              totalUsage.outputTokens
            );
            costData = {
              model_used: model,
              tokens_used: cost.totalTokens,
              cost_usd: cost.totalCost.toFixed(6),
            };
            if (isDev) console.log(
              `💰 Usage tracked: ${cost.totalTokens} tokens, $${cost.totalCost.toFixed(6)} for ${model}`
            );
          }

          // Save assistant message with cost tracking
          const { data: savedAssistantMessage } = await supabase.from("messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: finalResponse,
            user_id: user.id,
            ...costData,
          }).select("id").single();

          // Send final chunk with conversation ID and message ID for feedback
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                done: true,
                conversationId: convId,
                messageId: savedAssistantMessage?.id,
              }) + "\n"
            )
          );

          // Process conversation for intelligence (async, don't wait)
          if (profile?.organization_id) {
            import("@/lib/intelligence")
              .then(({ processConversationForIntelligence }) => {
                processConversationForIntelligence(
                  convId,
                  profile.organization_id,
                  user.id
                ).catch((err) =>
                  isDev && console.error("Error processing intelligence:", err)
                );
              })
              .catch((err) =>
                isDev && console.error("Error importing intelligence module:", err)
              );
          }
        } catch (error) {
          if (isDev) console.error("Streaming error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    if (isDev) console.error("❌ Chat API error:", error);
    if (isDev) console.error("Error stack:", error?.stack);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error?.message || "Unknown error",
        type: error?.constructor?.name
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
