import {
  AudioLines,
  Check,
  CircleAlert,
  FileSearch,
  GitBranch,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

const previewStyles = {
  sage: {
    shell: "from-[#e8e7ff] via-white to-[#dcf8ee]",
    accent: "bg-[#5b50e6]",
  },
  atelier: {
    shell: "from-[#fff0e7] via-white to-[#f6e9ff]",
    accent: "bg-[#ff6b4a]",
  },
  atlas: {
    shell: "from-[#ece9ff] via-white to-[#e4f4ff]",
    accent: "bg-[#5548d9]",
  },
  "atlas-discovery": {
    shell: "from-[#e8f2ff] via-white to-[#e7f7ef]",
    accent: "bg-[#2b7cc0]",
  },
  "rfp-engine": {
    shell: "from-[#e7f1ff] via-white to-[#e4faf0]",
    accent: "bg-[#3276e8]",
  },
  "rfp-sentry": {
    shell: "from-[#e6f2ff] via-white to-[#fff1dc]",
    accent: "bg-[#2b78b8]",
  },
  sentinel: {
    shell: "from-[#ede9ff] via-white to-[#e7f6ff]",
    accent: "bg-[#6b52d9]",
  },
  janice: {
    shell: "from-[#fff2db] via-white to-[#f1f8df]",
    accent: "bg-[#e98a24]",
  },
  vellum: {
    shell: "from-[#eef0e9] via-white to-[#ece8ff]",
    accent: "bg-[#61705a]",
  },
  "development-intelligence": {
    shell: "from-[#e8f8f3] via-white to-[#e9efff]",
    accent: "bg-[#168a72]",
  },
  press: {
    shell: "from-[#ffe8ef] via-white to-[#eee8ff]",
    accent: "bg-[#e04d7f]",
  },
} as const;

type PreviewSlug = keyof typeof previewStyles;

function WindowChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/8 px-4 py-3">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-black/15" />
        <span className="h-2 w-2 rounded-full bg-black/10" />
        <span className="h-2 w-2 rounded-full bg-black/10" />
      </div>
      <span className="text-[11px] font-medium text-[#575765]">{label}</span>
      <span className="h-2 w-7 rounded-full bg-black/8" aria-hidden="true" />
    </div>
  );
}

function SagePreview() {
  return (
    <div className="grid h-full grid-cols-[76px_1fr]">
      <div className="border-r border-black/8 p-3">
        <div className="h-7 w-7 rounded-lg bg-[#5b50e6]" />
        <div className="mt-5 space-y-2">
          {[28, 36, 24, 32].map((width) => (
            <div key={width} className="h-1.5 rounded-full bg-black/10" style={{ width }} />
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#6a6a78]">
              Today
            </p>
            <p className="mt-1 text-sm font-semibold text-[#17171b]">Operator brief</p>
          </div>
          <span className="rounded-full bg-[#daf7ea] px-2 py-1 text-[10px] font-semibold text-[#17674f]">
            5 sources connected
          </span>
        </div>
        <div className="mt-4 rounded-xl border border-black/8 bg-white/80 p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#5b50e6]" />
            <p className="text-xs font-semibold text-[#232329]">Three items need your review</p>
          </div>
          <div className="mt-3 space-y-2">
            {["Proposal deadline moved", "Hiring packet ready", "Recording processed"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-[#f6f5fb] px-2.5 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5b50e6]" />
                  <span className="text-[10px] text-[#545461]">{item}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RfpPreview() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-[#3276e8]" />
          <p className="text-xs font-semibold text-[#20242b]">Opportunity pipeline</p>
        </div>
        <span className="text-[10px] font-medium text-[#667085]">Needs review</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Qualified", "8"],
          ["Drafting", "3"],
          ["Ready", "1"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-black/8 bg-white/80 p-2.5">
            <p className="text-base font-semibold text-[#17191e]">{value}</p>
            <p className="mt-1 text-[9px] text-[#6a707d]">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-black/8 bg-white/80 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-[#343842]">Workforce innovation grant</span>
          <span className="rounded-full bg-[#e4f8ef] px-2 py-1 text-[9px] font-semibold text-[#17674f]">
            Strong fit
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e8eaf0]">
          <div className="h-full w-4/5 rounded-full bg-[#3276e8]" />
        </div>
      </div>
    </div>
  );
}

function SentinelPreview() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#6b52d9]" />
        <p className="text-xs font-semibold text-[#22212a]">Evidence trail</p>
      </div>
      <div className="mt-4 space-y-2">
        {[
          ["Primary source", "Verified", Check],
          ["Public record", "2 conflicts", CircleAlert],
          ["Analyst note", "Review", MessageSquareText],
        ].map(([label, status, Icon]) => {
          const RowIcon = Icon as typeof Check;
          return (
            <div key={label as string} className="flex items-center justify-between rounded-xl border border-black/8 bg-white/80 p-3">
              <span className="flex items-center gap-2 text-[10px] font-medium text-[#3f3f49]">
                <RowIcon className="h-3.5 w-3.5 text-[#6b52d9]" />
                {label as string}
              </span>
              <span className="text-[9px] text-[#6b6b77]">{status as string}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PeoplePreview({ development = false }: { development?: boolean }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {development ? (
            <MessageSquareText className="h-4 w-4 text-[#168a72]" />
          ) : (
            <UsersRound className="h-4 w-4 text-[#e98a24]" />
          )}
          <p className="text-xs font-semibold text-[#25251f]">
            {development ? "Development review" : "People journey"}
          </p>
        </div>
        <span className="text-[9px] text-[#74746b]">Human approval</span>
      </div>
      <div className="mt-4 rounded-xl border border-black/8 bg-white/80 p-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${
              development ? "bg-[#168a72]" : "bg-[#e98a24]"
            }`}
          >
            LD
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#292923]">
              {development ? "Coaching note ready" : "Onboarding in progress"}
            </p>
            <p className="mt-0.5 text-[9px] text-[#77776d]">
              {development ? "Evidence linked · not yet shared" : "4 of 6 steps complete"}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-1.5 rounded-full ${
                item < 3
                  ? development
                    ? "bg-[#168a72]"
                    : "bg-[#e98a24]"
                  : "bg-black/8"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PressPreview() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <AudioLines className="h-4 w-4 text-[#e04d7f]" />
        <p className="text-xs font-semibold text-[#2a2226]">Recording workspace</p>
      </div>
      <div className="mt-4 rounded-xl border border-black/8 bg-white/80 p-3">
        <div className="flex h-12 items-center gap-1" aria-hidden="true">
          {[16, 28, 20, 38, 25, 44, 30, 20, 36, 24, 16, 32, 20, 40, 26, 18].map(
            (height, index) => (
              <span
                key={`${height}-${index}`}
                className="w-1 flex-1 rounded-full bg-[#e04d7f]/70"
                style={{ height }}
              />
            )
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-[9px] text-[#77666d]">
          <span>Transcript aligned</span>
          <span>3 clips for review</span>
        </div>
      </div>
    </div>
  );
}

function AtelierPreview() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-[#ff6b4a]" />
        <p className="text-xs font-semibold text-[#2a2421]">Flow builder</p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {["Intake", "Agent", "Review"].map((item, index) => (
          <div key={item} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex-1 rounded-xl border border-black/8 bg-white/80 p-3 text-center text-[9px] font-medium text-[#5d514b]">
              {item}
            </div>
            {index < 2 ? <span className="text-[#ff6b4a]">→</span> : null}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-[#fff5f0] px-3 py-2 text-[9px] text-[#8a4d3e]">
        Approval required before publishing
      </div>
    </div>
  );
}

function SystemPreview({
  label,
  accent,
}: {
  label: string;
  accent: string;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-4 w-4 rounded-md ${accent}`} aria-hidden="true" />
          <p className="text-xs font-semibold text-[#25252b]">{label} workspace</p>
        </div>
        <span className="text-[9px] text-[#73737d]">Representative view</span>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_0.78fr] gap-2">
        <div className="rounded-xl border border-black/8 bg-white/80 p-3">
          <div className="h-2 w-20 rounded-full bg-black/12" />
          <div className="mt-4 space-y-2">
            {[72, 90, 58].map((width) => (
              <div key={width} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${accent}`} />
                <span className="h-1.5 rounded-full bg-black/8" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-black/8 bg-white/80 p-3">
          <p className="text-[9px] font-medium text-[#60606a]">Next action</p>
          <div className={`mt-3 h-8 rounded-lg ${accent} opacity-90`} />
          <p className="mt-2 text-[8px] text-[#7b7b84]">Review required</p>
        </div>
      </div>
    </div>
  );
}

export function ProductPreview({
  slug,
  label,
  className = "",
}: {
  slug: string;
  label: string;
  className?: string;
}) {
  const safeSlug: PreviewSlug =
    slug in previewStyles ? (slug as PreviewSlug) : "sage";
  const style = previewStyles[safeSlug];
  const hasDedicatedPreview = [
    "sage",
    "rfp-engine",
    "sentinel",
    "janice",
    "development-intelligence",
    "press",
    "atelier",
  ].includes(safeSlug);

  return (
    <div
      className={`overflow-hidden rounded-[20px] border border-black/8 bg-gradient-to-br ${style.shell} shadow-[0_20px_55px_rgba(26,24,38,0.08)] ${className}`}
      aria-label={`${label} representative product interface`}
    >
      <WindowChrome label={label} />
      <div className="h-[168px]">
        {safeSlug === "sage" ? <SagePreview /> : null}
        {safeSlug === "rfp-engine" ? <RfpPreview /> : null}
        {safeSlug === "sentinel" ? <SentinelPreview /> : null}
        {safeSlug === "janice" ? <PeoplePreview /> : null}
        {safeSlug === "development-intelligence" ? <PeoplePreview development /> : null}
        {safeSlug === "press" ? <PressPreview /> : null}
        {safeSlug === "atelier" ? <AtelierPreview /> : null}
        {!hasDedicatedPreview ? (
          <SystemPreview label={label} accent={style.accent} />
        ) : null}
      </div>
    </div>
  );
}
