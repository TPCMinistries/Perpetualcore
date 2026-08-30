import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { legalDocuments } from "@/lib/legal/public-documents";
type LegalSlug = keyof typeof legalDocuments;
export function generateStaticParams() { return Object.keys(legalDocuments).filter((slug) => !["privacy", "terms", "cookies"].includes(slug)).map((document) => ({ document })); }
export async function generateMetadata({ params }: { params: Promise<{ document: string }> }): Promise<Metadata> { const { document } = await params; const item = legalDocuments[document as LegalSlug]; return item ? { title: item.title, description: item.description } : {}; }
export default async function Page({ params }: { params: Promise<{ document: string }> }) { const { document } = await params; const item = legalDocuments[document as LegalSlug]; if (!item || ["privacy", "terms", "cookies"].includes(document)) notFound(); return <LegalDocumentPage document={item} />; }
