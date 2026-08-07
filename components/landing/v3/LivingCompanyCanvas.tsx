import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CircleAlert,
  FileSearch,
  Mic2,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

const PRODUCT_NODES = [
  { name: "RFP Engine", icon: FileSearch, color: "#3276e8", position: "left-[4%] top-[17%]" },
  { name: "Sentinel", icon: Search, color: "#6b52d9", position: "right-[4%] top-[14%]" },
  { name: "Atelier", icon: BriefcaseBusiness, color: "#ff6b4a", position: "left-[2%] bottom-[19%]" },
  { name: "Janice", icon: UsersRound, color: "#e98a24", position: "right-[4%] bottom-[18%]" },
] as const;

export function LivingCompanyCanvas() {
  return (
    <figure className="relative mx-auto w-full max-w-[650px]">
      <div
        className="absolute inset-x-[10%] top-[6%] h-[76%] rounded-full bg-[#7c6ff0]/16 blur-[70px]"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white/88 shadow-[0_35px_100px_rgba(58,49,110,0.16)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-black/8 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5548d9] text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-[#1d1d22]">Company view</p>
              <p className="text-[10px] text-[#70707c]">Approved context across the portfolio</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e2f8ed] px-2.5 py-1 text-[10px] font-semibold text-[#17684f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22a77a]" />
            Sources connected
          </span>
        </div>

        <div className="grid min-h-[420px] lg:grid-cols-[1fr_196px]">
          <div className="relative min-h-[310px] overflow-hidden border-b border-black/8 bg-[radial-gradient(circle_at_50%_48%,rgba(91,80,230,0.12),transparent_36%)] p-4 lg:border-b-0 lg:border-r">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 500 340"
              fill="none"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <path d="M130 78C175 105 194 129 235 158" stroke="#b9b5db" strokeWidth="1.5" strokeDasharray="5 6" />
              <path d="M370 76C324 107 307 126 267 157" stroke="#b9b5db" strokeWidth="1.5" strokeDasharray="5 6" />
              <path d="M120 270C171 235 198 209 235 184" stroke="#b9b5db" strokeWidth="1.5" strokeDasharray="5 6" />
              <path d="M380 268C331 231 304 207 266 183" stroke="#b9b5db" strokeWidth="1.5" strokeDasharray="5 6" />
            </svg>

            {PRODUCT_NODES.map((node) => (
              <div
                key={node.name}
                className={`absolute ${node.position} flex w-[112px] items-center gap-2 rounded-2xl border border-black/8 bg-white p-2.5 shadow-[0_12px_35px_rgba(34,31,53,0.10)] sm:w-[128px]`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: node.color }}
                >
                  <node.icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="text-[10px] font-semibold text-[#34343c] sm:text-[11px]">
                  {node.name}
                </span>
              </div>
            ))}

            <div className="absolute left-1/2 top-1/2 w-[154px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-[#5548d9]/25 bg-[#17151f] p-4 text-white shadow-[0_24px_70px_rgba(45,37,111,0.28)]">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6d5df5]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-[9px] font-medium text-white/70">Sage</span>
              </div>
              <p className="mt-6 text-sm font-semibold leading-5">The context stays connected.</p>
              <p className="mt-2 text-[10px] leading-4 text-white/68">
                Decisions remain yours.
              </p>
            </div>
          </div>

          <div className="bg-[#faf9fc] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[#303039]">Needs attention</p>
              <span className="rounded-full bg-[#eeeafd] px-2 py-1 text-[9px] font-semibold text-[#5548d9]">
                3 items
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="rounded-2xl border border-black/8 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <CircleAlert className="h-3.5 w-3.5 text-[#ff6b4a]" aria-hidden="true" />
                  <p className="text-[10px] font-semibold text-[#34343c]">Proposal date changed</p>
                </div>
                <p className="mt-2 text-[9px] leading-4 text-[#777781]">
                  RFP Engine found an amendment. Review the new deadline.
                </p>
              </div>

              <div className="rounded-2xl border border-black/8 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Mic2 className="h-3.5 w-3.5 text-[#168a72]" aria-hidden="true" />
                  <p className="text-[10px] font-semibold text-[#34343c]">Coaching note ready</p>
                </div>
                <p className="mt-2 text-[9px] leading-4 text-[#777781]">
                  Evidence is linked. Human approval is required before sharing.
                </p>
              </div>

              <div className="rounded-2xl border border-[#5548d9]/16 bg-[#f2efff] p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#5548d9]" aria-hidden="true" />
                  <p className="text-[10px] font-semibold text-[#34343c]">Authority stays explicit</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5548d9] text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-[9px] text-[#635e79]">Protected actions wait for review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 flex items-center justify-between px-2 text-[11px] text-[#686874]">
        <span>Representative operating view</span>
        <span className="inline-flex items-center gap-1 font-medium text-[#4f46c8]">
          Products work together <ArrowUpRight className="h-3 w-3" />
        </span>
      </figcaption>
    </figure>
  );
}
