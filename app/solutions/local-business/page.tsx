import { AiOsSolutionPage } from "../_components/AiOsSolutionPage";

export const metadata = {
  title: "AI Operating Systems for Local Businesses | Perpetual Core",
  description:
    "Practical AI systems for owner-led businesses that need better follow-up, faster response, cleaner operations, and organized company knowledge.",
};

export default function LocalBusinessPage() {
  return (
    <AiOsSolutionPage
      eyebrow="Local business · Owner-led operators"
      title="AI systems that help smaller companies sell more and run cleaner."
      subtitle="For owner-led companies where the same few people carry sales, customer service, marketing, admin, delivery, and follow-up. We install practical AI around the work that already matters."
      fit={[
        "Local and regional businesses with real customers, real follow-up, and limited team capacity.",
        "Owners who know opportunities are getting lost in texts, inboxes, spreadsheets, and memory.",
        "Teams that need AI to support everyday operations without adding a new layer of complexity.",
        "Companies that may start small but want the system designed to expand.",
      ]}
      operatingAreas={[
        {
          title: "Lead follow-up",
          body: "Capture, response, reminders, reactivation, quote follow-up, review requests, and next-step prompts.",
        },
        {
          title: "Customer communication",
          body: "Draft replies, service updates, appointment reminders, issue summaries, and consistent customer language.",
        },
        {
          title: "Operations support",
          body: "Task tracking, internal requests, basic reporting, delivery/service issues, and manager visibility.",
        },
        {
          title: "Marketing engine",
          body: "Social posts, email campaigns, promotions, customer stories, local content, and repurposing from everyday business activity.",
        },
      ]}
      wedge={[
        {
          title: "Missed-lead recovery",
          body: "Start by fixing the follow-up gap that already costs money every month.",
        },
        {
          title: "Quote and response assistant",
          body: "Help the team respond faster and more consistently without rewriting the same messages.",
        },
        {
          title: "Owner dashboard",
          body: "Give leadership one place to see leads, open customer issues, reminders, and operating priorities.",
        },
      ]}
      outcomes={[
        "More leads followed up on time.",
        "Faster customer response.",
        "Less admin work for the owner.",
        "Cleaner tracking of open issues.",
        "More consistent marketing output.",
        "A system that can grow beyond the first workflow.",
      ]}
    />
  );
}
