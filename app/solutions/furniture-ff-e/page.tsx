import { AiOsSolutionPage } from "../_components/AiOsSolutionPage";

export const metadata = {
  title: "AI Operating Systems for Furniture, Interiors, and FF&E | Perpetual Core",
  description:
    "AI operating-system implementation for furniture, interiors, commercial workplace, hospitality, and FF&E companies coordinating clients, vendors, projects, delivery, and service.",
};

export default function FurnitureFfePage() {
  return (
    <AiOsSolutionPage
      eyebrow="Furniture · Interiors · FF&E"
      title="AI operating systems for furniture and interiors companies."
      subtitle="For companies coordinating clients, designers, architects, manufacturers, warehouses, project managers, delivery teams, installers, and service issues. We install AI where the work already moves."
      fit={[
        "Commercial furniture, workplace, residential, hospitality, and FF&E teams.",
        "Businesses with sales reps, project managers, vendor coordination, delivery, install, and post-install service.",
        "Operators who need better proposal speed, product knowledge, customer follow-up, and project visibility.",
        "Leadership teams that want AI across the business, not a disconnected chatbot.",
      ]}
      operatingAreas={[
        {
          title: "Sales and account follow-up",
          body: "Lead response, account notes, quote drafts, project history, dormant-account reactivation, next-best action, and handoff from sales to project teams.",
        },
        {
          title: "Proposal and RFP support",
          body: "Drafting, requirements extraction, product fit, compliance checklists, manufacturer data, and reusable language from prior wins.",
        },
        {
          title: "Product and vendor knowledge",
          body: "Searchable knowledge across catalogs, manufacturer relationships, warranties, lead times, specs, constraints, and internal recommendations.",
        },
        {
          title: "Project coordination",
          body: "Client updates, install schedules, delivery exceptions, change orders, service issues, and leadership visibility into where work is stuck.",
        },
      ]}
      wedge={[
        {
          title: "Proposal engine",
          body: "Start where revenue meets coordination: faster proposals, cleaner requirements, better reuse of past work.",
        },
        {
          title: "Sales follow-up OS",
          body: "Turn account notes, missed opportunities, and stale leads into a managed follow-up system.",
        },
        {
          title: "Project visibility layer",
          body: "Give leaders a clearer view of open projects, risks, exceptions, and customer communication gaps.",
        },
      ]}
      outcomes={[
        "Faster response to sales opportunities.",
        "Cleaner handoff from sales to project execution.",
        "Less duplicated admin work across proposals and updates.",
        "Better use of manufacturer and product knowledge.",
        "More consistent customer communication.",
        "Leadership sees risks before they become escalations.",
      ]}
    />
  );
}
