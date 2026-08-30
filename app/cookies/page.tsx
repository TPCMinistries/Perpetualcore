import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { cookiePolicy } from "@/lib/legal/public-documents";
export const metadata: Metadata = { title: "Cookie Notice", description: cookiePolicy.description };
export default function Page() { return <LegalDocumentPage document={cookiePolicy} />; }
