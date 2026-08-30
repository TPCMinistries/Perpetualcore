import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { privacyPolicy } from "@/lib/legal/public-documents";
export const metadata: Metadata = { title: "Privacy Policy", description: privacyPolicy.description };
export default function Page() { return <LegalDocumentPage document={privacyPolicy} />; }
