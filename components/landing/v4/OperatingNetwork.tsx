import {
  BrainCircuit,
  FileSearch,
  Mic2,
  SearchCheck,
  UsersRound,
} from "lucide-react";

const NODES = [
  {
    name: "RFP Engine",
    detail: "Opportunity intelligence",
    status: "LIVE",
    icon: FileSearch,
    position: "left-[2%] top-[7%]",
    accent: "#4ea7ff",
  },
  {
    name: "Sentinel",
    detail: "Diligence intelligence",
    status: "LIVE",
    icon: SearchCheck,
    position: "right-[1%] top-[17%]",
    accent: "#54e6b1",
  },
  {
    name: "Janice",
    detail: "People operations",
    status: "LIVE",
    icon: UsersRound,
    position: "left-[0%] bottom-[14%]",
    accent: "#ffb85c",
  },
  {
    name: "Press",
    detail: "Media production",
    status: "PRIVATE",
    icon: Mic2,
    position: "right-[3%] bottom-[5%]",
    accent: "#ff7ca8",
  },
] as const;

export function OperatingNetwork() {
  return (
    <figure className="relative mx-auto min-h-[510px] w-full max-w-[720px] overflow-hidden border border-white/10 bg-[#07070a]/72 p-4 shadow-[0_45px_140px_rgba(0,0,0,0.46)] sm:min-h-[600px] sm:p-6">
      <div className="pc-v4-grid absolute inset-0 opacity-28" aria-hidden="true" />
      <div className="pc-v4-scan absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#54e6b1]/60 to-transparent motion-reduce:hidden" aria-hidden="true" />

      <div className="relative flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[9px] uppercase tracking-[0.15em] text-white/32">
        <span>Network topology / authorized view</span>
        <span className="inline-flex items-center gap-2 text-[#54e6b1]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#54e6b1]" />
          operating
        </span>
      </div>

      <svg
        className="absolute inset-x-[8%] top-[14%] h-[72%] w-[84%]"
        viewBox="0 0 600 480"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M116 74C194 132 224 177 288 232" stroke="rgba(139,124,255,.34)" strokeWidth="1" />
        <path d="M492 121C420 160 382 192 316 233" stroke="rgba(139,124,255,.34)" strokeWidth="1" />
        <path d="M106 386C184 338 229 298 288 256" stroke="rgba(139,124,255,.34)" strokeWidth="1" />
        <path d="M498 420C421 352 375 305 315 258" stroke="rgba(139,124,255,.34)" strokeWidth="1" />
        <path d="M300 66V414" stroke="rgba(84,230,177,.18)" strokeWidth="1" strokeDasharray="3 7" />
        <circle cx="300" cy="244" r="100" stroke="rgba(255,255,255,.06)" />
        <circle cx="300" cy="244" r="150" stroke="rgba(255,255,255,.035)" />
      </svg>

      {NODES.map((node) => (
        <div
          key={node.name}
          className={`group absolute ${node.position} z-10 w-[152px] border border-white/12 bg-[#0c0c11]/94 p-3 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/28 sm:w-[190px] sm:p-4`}
        >
          <div className="flex items-start justify-between gap-3">
            <node.icon className="h-4 w-4" style={{ color: node.accent }} aria-hidden="true" />
            <span className="font-mono text-[8px] tracking-[0.12em]" style={{ color: node.accent }}>
              {node.status}
            </span>
          </div>
          <p className="mt-8 text-sm font-semibold text-white">{node.name}</p>
          <p className="mt-1 hidden text-[10px] text-white/38 sm:block">{node.detail}</p>
        </div>
      ))}

      <div className="absolute left-1/2 top-1/2 z-20 h-[226px] w-[142px] -translate-x-1/2 -translate-y-1/2 border border-[#8b7cff]/46 bg-[#0d0c16] shadow-[0_0_80px_rgba(109,91,255,0.24)] sm:h-[270px] sm:w-[174px]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8b7cff] to-transparent" />
        <div className="flex h-full flex-col p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <BrainCircuit className="h-5 w-5 text-[#8b7cff]" aria-hidden="true" />
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#54e6b1]">
              Core
            </span>
          </div>
          <div className="mt-auto">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/34">
              Intelligence layer
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">
              Sage
            </p>
            <p className="mt-3 text-[10px] leading-5 text-white/42">
              Approved context moves. Authority stays explicit.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[8px] uppercase tracking-[0.13em] text-white/24 sm:bottom-6 sm:left-6 sm:right-6">
        <span>Evidence linked</span>
        <span>Boundaries preserved</span>
        <span>Human authority</span>
      </div>
    </figure>
  );
}
