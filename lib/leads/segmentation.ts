/**
 * Lead Segmentation Engine
 * Routes leads to appropriate sales paths based on quiz data
 */

export type LeadSegment = "product" | "consulting" | "enterprise";

export interface QuizData {
  quizScore?: number;
  answers?: Array<{
    questionId: string;
    answer: string;
    points: number;
  }>;
}

export interface SegmentationResult {
  segment: LeadSegment;
  reasoning: string;
  recommendedSequence: string;
  recommendedCTA: string;
  estimatedValue: string;
}

/**
 * Segments a lead based on quiz responses
 */
export function segmentLead(quizData: QuizData, company?: string): SegmentationResult {
  const { quizScore = 0, answers = [] } = quizData;

  // Extract key data points from quiz answers
  const teamSizeAnswer = answers.find(a => a.questionId === "team-size");
  const budgetAnswer = answers.find(a => a.questionId === "budget");
  const aiUsageAnswer = answers.find(a => a.questionId === "ai-usage");
  const goalAnswer = answers.find(a => a.questionId === "growth-stage");

  // Determine team size
  let teamSize = 0;
  if (teamSizeAnswer) {
    if (teamSizeAnswer.answer === "1-5") teamSize = 3;
    else if (teamSizeAnswer.answer === "6-15") teamSize = 10;
    else if (teamSizeAnswer.answer === "16-50") teamSize = 30;
    else if (teamSizeAnswer.answer === "50+") teamSize = 100;
  }

  // Determine budget tier
  let budgetTier = 0;
  if (budgetAnswer) {
    if (budgetAnswer.answer === "under-100") budgetTier = 1;
    else if (budgetAnswer.answer === "100-500") budgetTier = 2;
    else if (budgetAnswer.answer === "500-2000") budgetTier = 3;
    else if (budgetAnswer.answer === "2000+") budgetTier = 4;
  }

  // Check AI maturity
  const isAIBeginner = aiUsageAnswer?.answer === "none" || aiUsageAnswer?.answer === "minimal";

  // Check if scaling is a priority
  const isScalingPriority = goalAnswer?.answer === "scale";

  // Segmentation Logic

  // ENTERPRISE: Large teams (50+) OR high budget (tier 4) OR scaling focus with mid+ size team
  if (
    teamSize >= 50 ||
    budgetTier >= 4 ||
    (isScalingPriority && teamSize >= 15 && budgetTier >= 3)
  ) {
    return {
      segment: "enterprise",
      reasoning: `Team size: ${teamSize}, Budget tier: ${budgetTier}, Scaling priority: ${isScalingPriority}`,
      recommendedSequence: "enterprise_sequence",
      recommendedCTA: "Book Executive Briefing",
      estimatedValue: "$50,000-$200,000",
    };
  }

  // CONSULTING: Mid-size teams (10-50) with implementation needs OR AI beginners with budget
  if (
    (teamSize >= 10 && teamSize < 50) ||
    (isAIBeginner && budgetTier >= 2 && teamSize >= 5) ||
    (quizScore >= 70 && budgetTier >= 2) // High urgency + budget
  ) {
    return {
      segment: "consulting",
      reasoning: `Team size: ${teamSize}, AI maturity: beginner=${isAIBeginner}, Budget tier: ${budgetTier}, Score: ${quizScore}`,
      recommendedSequence: "consulting_sequence",
      recommendedCTA: "Book Strategy Call",
      estimatedValue: "$5,000-$25,000",
    };
  }

  // PRODUCT: Small teams, DIY mindset, or already using AI
  return {
    segment: "product",
    reasoning: `Team size: ${teamSize}, Budget tier: ${budgetTier}, Best fit for self-serve`,
    recommendedSequence: "product_sequence",
    recommendedCTA: "Start Free Trial",
    estimatedValue: "$99-$699/month",
  };
}

/**
 * Gets the email sequence name based on segment and source
 */
export function getSequenceForSegment(segment: LeadSegment, source: string): string {
  // For now, we only have the nurture sequence
  // In the future, we'll have product_sequence, consulting_sequence, enterprise_sequence

  if (source === "quiz") {
    // Quiz users get segmented sequences (when we build them)
    switch (segment) {
      case "product":
        return "AI Productivity Nurture Sequence"; // Will be "Product-Focused Sequence"
      case "consulting":
        return "AI Productivity Nurture Sequence"; // Will be "Consulting-Focused Sequence"
      case "enterprise":
        return "AI Productivity Nurture Sequence"; // Will be "Enterprise-Focused Sequence"
    }
  }

  // Default to nurture sequence
  return "AI Productivity Nurture Sequence";
}

/**
 * Gets custom message for thank you page based on segment
 */
export function getThankYouMessage(segment: LeadSegment): {
  title: string;
  description: string;
  nextSteps: string[];
} {
  switch (segment) {
    case "enterprise":
      return {
        title: "Perfect for Enterprise Implementation",
        description: "Based on your responses, you'd benefit most from our white-glove enterprise solution. We'll send you a custom implementation plan.",
        nextSteps: [
          "Download your personalized 65-page AI guide",
          "Review our enterprise case studies (sent to your email)",
          "Book your executive briefing to discuss custom implementation",
        ],
      };

    case "consulting":
      return {
        title: "Implementation Support Recommended",
        description: "Your team would benefit from guided AI implementation. We'll help you get set up and see results faster.",
        nextSteps: [
          "Download your AI productivity guide with implementation roadmap",
          "Review case studies from similar companies",
          "Book a strategy call to create your custom plan",
        ],
      };

    case "product":
      return {
        title: "Perfect for Self-Service",
        description: "You're a great fit for our product! Get started on your own timeline with our comprehensive guides and templates.",
        nextSteps: [
          "Download your 65-page AI guide and start implementing today",
          "Access free templates and 20+ copy-paste prompts",
          "Start your free trial when you're ready",
        ],
      };
  }
}
