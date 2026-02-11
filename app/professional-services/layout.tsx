import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Professional Services - Custom AI Implementation",
  description:
    "Get expert help implementing Perpetual Core. Custom AI workflows, data migration, integration setup, team training, and ongoing support from our professional services team.",
  openGraph: {
    title: "Professional Services | Perpetual Core",
    description:
      "Custom AI implementation, data migration, integration setup, and team training.",
  },
};

export default function ProfessionalServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
