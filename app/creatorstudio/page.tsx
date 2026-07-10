import { redirect } from "next/navigation";

// Request-time redirect so the Location header is set for all clients,
// not just hydrated browsers (static prerender swallows it).
export const dynamic = "force-dynamic";

export default function CreatorStudioBareRedirect() {
  redirect("/products/creatorstudio");
}
