import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { termsOfService } from "@/lib/legal/public-documents";
export const metadata: Metadata = { title: "Terms of Service", description: termsOfService.description };
export default function Page() { return <LegalDocumentPage document={termsOfService} />; }
