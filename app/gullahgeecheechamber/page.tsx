import type { Metadata } from "next";

const CHAMBER_SITE_URL =
  "https://gullah-geechee-chamber-2026.gdimedia.chatgpt.site";

export const metadata: Metadata = {
  title: "Gullah Geechee Chamber of Commerce",
  description:
    "The Gullah Geechee Chamber of Commerce supports entrepreneurship, advocacy, and economic development across the Gullah Geechee community.",
};

export default function GullahGeecheeChamberPage() {
  return (
    <main className="h-[100svh] w-full overflow-hidden bg-[#f5efe3]">
      <iframe
        src={CHAMBER_SITE_URL}
        title="Gullah Geechee Chamber of Commerce"
        className="h-full w-full border-0"
        allow="clipboard-write; fullscreen"
      />
    </main>
  );
}
