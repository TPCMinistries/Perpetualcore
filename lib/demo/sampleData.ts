/**
 * Sample Data Generator for Demo Mode
 *
 * This module provides sample data to populate a new account
 * so users can see what the platform looks like with content.
 */

export const sampleDocuments = [
  {
    title: "Product Roadmap 2025",
    content:
      "# Product Roadmap 2025\n\n## Q1 Objectives\n- Launch new AI features\n- Improve user onboarding\n- Expand integrations\n\n## Q2 Goals\n- Mobile app release\n- Enterprise features\n- Advanced analytics",
    file_type: "text/markdown",
  },
  {
    title: "Team Meeting Notes",
    content:
      "# Weekly Team Sync - Jan 15, 2025\n\n## Attendees\n- Sarah (Product)\n- Mike (Engineering)\n- Jessica (Design)\n\n## Discussion Points\n1. New feature proposals\n2. Sprint planning\n3. Customer feedback review\n\n## Action Items\n- [ ] Review design mocks\n- [ ] Set up user testing sessions\n- [ ] Update documentation",
    file_type: "text/markdown",
  },
  {
    title: "Marketing Strategy",
    content:
      "# Marketing Strategy\n\n## Target Audience\n- Small to medium businesses\n- Remote teams\n- Productivity enthusiasts\n\n## Channels\n- Social media (LinkedIn, Twitter)\n- Content marketing (blog posts)\n- Partnerships\n\n## KPIs\n- Website traffic: 50k/month\n- Sign-ups: 1k/month\n- Conversion rate: 15%",
    file_type: "text/markdown",
  },
];

export const sampleTasks = [
  {
    title: "Review Q1 budget proposal",
    description: "Check the financial projections and approve the budget for Q1",
    status: "todo" as const,
    priority: "high" as const,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  },
  {
    title: "Prepare presentation for board meeting",
    description:
      "Create slides covering product updates, metrics, and roadmap",
    status: "in_progress" as const,
    priority: "high" as const,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  },
  {
    title: "Update team on new features",
    description:
      "Send an email to the team about the latest product features and improvements",
    status: "todo" as const,
    priority: "medium" as const,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
  },
  {
    title: "Schedule user interviews",
    description:
      "Coordinate with 5-10 users for feedback sessions on the new dashboard",
    status: "todo" as const,
    priority: "medium" as const,
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
  },
  {
    title: "Review competitor analysis",
    description: "Analyze competitors' features and pricing strategies",
    status: "done" as const,
    priority: "low" as const,
  },
  {
    title: "Onboard new team member",
    description:
      "Set up accounts, introduce to team, and schedule training sessions",
    status: "done" as const,
    priority: "high" as const,
  },
];

export const sampleConversations = [
  {
    title: "How to improve productivity",
    messages: [
      {
        role: "user" as const,
        content:
          "What are some effective strategies to improve team productivity?",
      },
      {
        role: "assistant" as const,
        content:
          "Here are some proven strategies to improve team productivity:\n\n1. **Clear Goals & Priorities**: Set SMART goals and help team members prioritize their work.\n\n2. **Eliminate Distractions**: Use time-blocking techniques and minimize unnecessary meetings.\n\n3. **Leverage Automation**: Automate repetitive tasks using tools like Perpetual Core to save time.\n\n4. **Regular Check-ins**: Hold brief daily standups to align on progress and blockers.\n\n5. **Provide Resources**: Ensure your team has the tools and training they need to succeed.\n\n6. **Encourage Breaks**: Promote work-life balance to prevent burnout.\n\nWould you like me to elaborate on any of these strategies?",
      },
    ],
  },
  {
    title: "Marketing campaign ideas",
    messages: [
      {
        role: "user" as const,
        content:
          "I need creative ideas for our next marketing campaign. We're targeting SMBs in the tech industry.",
      },
      {
        role: "assistant" as const,
        content:
          "Great! Here are some creative campaign ideas for SMBs in tech:\n\n**1. Customer Success Stories**\n- Create video testimonials from happy customers\n- Show real ROI and transformation stories\n- Use before/after comparisons\n\n**2. Educational Webinar Series**\n- Host weekly sessions on industry challenges\n- Invite guest speakers from successful companies\n- Provide actionable takeaways\n\n**3. Limited-Time Free Trial Challenge**\n- \"30-Day Productivity Challenge\"\n- Daily tips and check-ins\n- Community leaderboard\n\n**4. Partnership Program**\n- Co-marketing with complementary tools\n- Bundle offers\n- Referral incentives\n\nWhich direction resonates most with your brand?",
      },
    ],
  },
  {
    title: "Help with task prioritization",
    messages: [
      {
        role: "user" as const,
        content:
          "I have 10 tasks on my plate and I'm feeling overwhelmed. How should I prioritize them?",
      },
      {
        role: "assistant" as const,
        content:
          "Let's use the Eisenhower Matrix to help prioritize your tasks:\n\n**Urgent & Important (Do First)**\n- Tasks with immediate deadlines\n- Crisis situations\n- Critical meetings\n\n**Important but Not Urgent (Schedule)**\n- Strategic planning\n- Relationship building\n- Learning and development\n\n**Urgent but Not Important (Delegate)**\n- Interruptions\n- Some emails and calls\n- Others' priorities\n\n**Not Urgent & Not Important (Eliminate)**\n- Time wasters\n- Busy work\n- Excessive social media\n\nWould you like to share your task list so I can help categorize them?",
      },
    ],
  },
];

export const sampleCalendarEvents = [
  {
    title: "Team Standup",
    description: "Daily sync with the team to discuss progress and blockers",
    start_time: new Date(
      Date.now() + 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000
    ).toISOString(), // Tomorrow at 9 AM
    end_time: new Date(
      Date.now() + 1 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000
    ).toISOString(), // 30 min duration
    location: "Zoom",
  },
  {
    title: "Product Review Meeting",
    description: "Review latest product iterations and gather feedback",
    start_time: new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000
    ).toISOString(), // In 2 days at 2 PM
    end_time: new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000
    ).toISOString(), // 1 hour duration
    location: "Conference Room B",
  },
  {
    title: "1:1 with Sarah",
    description: "Monthly check-in to discuss career growth and feedback",
    start_time: new Date(
      Date.now() + 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000
    ).toISOString(), // In 4 days at 3 PM
    end_time: new Date(
      Date.now() + 4 * 24 * 60 * 60 * 1000 + 15.5 * 60 * 60 * 1000
    ).toISOString(), // 30 min duration
  },
  {
    title: "Customer Discovery Call",
    description: "Interview potential customers about pain points",
    start_time: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
    ).toISOString(), // In 5 days at 10 AM
    end_time: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000
    ).toISOString(), // 1 hour duration
    location: "Google Meet",
  },
];
