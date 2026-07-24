import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  MessagesSquare,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const INPUTS = [
  { label: "Documents", icon: FileText },
  { label: "Conversations", icon: MessagesSquare },
  { label: "Systems of record", icon: Database },
];

const OUTPUTS = [
  { label: "Specialized products", icon: Bot },
  { label: "Governed workflows", icon: Workflow },
  { label: "Verified outcomes", icon: CheckCircle2 },
];

export function OperatingSystemMap() {
  return (
    <figure className="relative overflow-hidden rounded-xl border border-white/15 bg-white/[0.055] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-7">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(75,53,255,0.25),transparent_48%)]"
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-4 border-b border-white/12 pb-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6dd7ff]">
              The operating layer
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              Context moves. Authority stays explicit.
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 text-[#26f2a8]" aria-hidden="true" />
        </div>

        <div className="grid gap-3 py-5 sm:grid-cols-[1fr_1.15fr_1fr] sm:items-stretch">
          <div className="space-y-2">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
              Approved signals
            </p>
            {INPUTS.map((item) => (
              <div
                key={item.label}
                className="flex min-h-12 items-center gap-3 rounded-md border border-white/10 bg-black/15 px-3 text-xs text-white/65"
              >
                <item.icon className="h-4 w-4 text-white/45" aria-hidden="true" />
                {item.label}
              </div>
            ))}
          </div>

          <div className="relative flex min-h-[216px] flex-col justify-center rounded-lg border border-[#6dd7ff]/35 bg-[#11172a] p-5 text-center">
            <div
              aria-hidden="true"
              className="absolute -inset-px rounded-lg bg-[linear-gradient(135deg,rgba(109,215,255,0.18),transparent_40%,rgba(38,242,168,0.12))]"
            />
            <BrainCircuit
              className="relative mx-auto h-7 w-7 text-[#26f2a8]"
              aria-hidden="true"
            />
            <p className="relative mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#6dd7ff]">
              Sage + Company Graph
            </p>
            <p className="relative mt-2 text-lg font-semibold tracking-[-0.02em] text-white">
              Shared context. Bounded receipts. Human authority.
            </p>
            <p className="relative mt-3 text-xs leading-5 text-white/50">
              Raw and protected records remain in their authoritative systems.
            </p>
          </div>

          <div className="space-y-2">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
              Coordinated action
            </p>
            {OUTPUTS.map((item) => (
              <div
                key={item.label}
                className="flex min-h-12 items-center gap-3 rounded-md border border-white/10 bg-black/15 px-3 text-xs text-white/65"
              >
                <item.icon className="h-4 w-4 text-white/45" aria-hidden="true" />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <figcaption className="border-t border-white/12 pt-4 text-xs leading-5 text-white/46">
          Perpetual Core connects approved context across the portfolio without
          collapsing every company, customer, or protected record into one database.
        </figcaption>
      </div>
    </figure>
  );
}
