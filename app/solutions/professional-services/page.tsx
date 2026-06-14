import { AiOsSolutionPage } from "../_components/AiOsSolutionPage";

export const metadata = {
  title: "AI Operating Systems for Professional Services | Perpetual Core",
  description:
    "AI operating-system implementation for professional services firms managing clients, proposals, delivery, knowledge, reporting, and recurring expert work.",
};

export default function ProfessionalServicesPage() {
  return (
    <AiOsSolutionPage
      eyebrow="Professional services · Client delivery"
      title="AI operating systems for service firms that sell expertise."
      subtitle="For firms where client work depends on proposals, intake, research, knowledge reuse, delivery quality, follow-up, and leadership visibility. We turn the firm’s repeated work into an AI-enabled operating layer."
      fit={[
        "Consulting, advisory, agencies, accounting, legal-adjacent, IT services, and expert-led firms.",
        "Teams that repeatedly write proposals, gather requirements, deliver client work, and report outcomes.",
        "Firms with valuable internal knowledge trapped in calls, docs, inboxes, and individual memory.",
        "Partners who want AI to increase leverage without lowering quality or trust.",
      ]}
      operatingAreas={[
        {
          title: "Business development",
          body: "Lead research, account intelligence, proposal drafts, follow-up, case study reuse, and qualification support.",
        },
        {
          title: "Client delivery",
          body: "Intake summaries, project plans, task extraction, meeting notes, deliverable drafts, and quality review workflows.",
        },
        {
          title: "Knowledge reuse",
          body: "Searchable institutional memory across past work, frameworks, decisions, examples, templates, and expert judgment.",
        },
        {
          title: "Leadership reporting",
          body: "Pipeline, utilization signals, delivery risk, client health, open decisions, and what needs partner attention.",
        },
      ]}
      wedge={[
        {
          title: "Proposal OS",
          body: "Turn past language, case studies, qualifications, and client context into faster, stronger proposal output.",
        },
        {
          title: "Client delivery copilot",
          body: "Convert meetings, notes, requirements, and tasks into cleaner delivery operations.",
        },
        {
          title: "Knowledge base",
          body: "Capture the firm’s best thinking so it can be found, reused, and improved by the team.",
        },
      ]}
      outcomes={[
        "Faster proposals without generic copy.",
        "Cleaner project handoffs and task follow-through.",
        "Less partner time spent repeating institutional knowledge.",
        "Better visibility into delivery risk.",
        "More reusable client work.",
        "AI leverage without weakening the firm’s standard of care.",
      ]}
    />
  );
}
