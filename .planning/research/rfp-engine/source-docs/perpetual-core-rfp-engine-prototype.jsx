import React, { useState, useEffect } from 'react';
import { Search, Sparkles, FileText, Building2, Briefcase, Target, ArrowRight, CheckCircle2, AlertCircle, Loader2, ChevronRight, Zap, Filter } from 'lucide-react';

export default function PerpetualCoreRFPEngine() {
  const [activeView, setActiveView] = useState('discovery');
  const [orgMode, setOrgMode] = useState('nonprofit'); // nonprofit | forprofit | dual
  const [activeOrg, setActiveOrg] = useState('uplift');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [draftSection, setDraftSection] = useState('need_statement');
  const [rfpInput, setRfpInput] = useState('');
  const [draftOutput, setDraftOutput] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState('');

  // Org profiles (in production, pulled from Master Building Kit registries)
  const orgs = {
    uplift: {
      name: 'Uplift Communities',
      type: 'nonprofit',
      naics: ['611430', '624310', '621399'],
      voice: 'Warm, evidence-based, community-rooted. Leads with outcomes.',
      wins: ['DYCD CRED Healthcare Workforce', 'Kingsborough CC Partnership'],
      capacity: '60-student cohorts, CNA/CMAA/EHR/CST/Pharmacy Tech tracks',
    },
    iha: {
      name: 'Institute for Human Advancement',
      type: 'nonprofit',
      naics: ['611710', '624190', '813219'],
      voice: 'Strategic, dignified, frames work as human flourishing.',
      wins: ['UNDP dialogue (Apr 2026)', 'Kenya 2026 Delegation'],
      capacity: 'IHA Academy 5-pillar curriculum, KAIA AI companion',
    },
    perpetual: {
      name: 'The Perpetual Core',
      type: 'forprofit',
      naics: ['541511', '518210', '541512'],
      voice: 'Technical, results-driven, frames AI as infrastructure. Confident without hype.',
      wins: ['Perpetual Core RFP Engine (this product)', 'Herald AI agent stack', 'IHA Global Health platform'],
      capacity: 'Next.js/Vercel/Supabase, MCP integrations, Claude Managed Agents, multi-tenant SaaS infrastructure',
    },
  };

  // Mock opportunities feed (in production: SAM.gov + Grants.gov + state portals + foundations)
  const opportunities = [
    {
      id: 'g1',
      title: 'HHS Healthcare Workforce Resilience Training Program',
      source: 'Grants.gov',
      agency: 'HHS / HRSA',
      type: 'grant',
      amount: '$2.4M ceiling',
      deadline: '2026-07-15',
      fitScore: 94,
      winProb: 0.42,
      naics: '624310',
      forOrg: 'uplift',
      tags: ['healthcare', 'workforce', 'CNA', 'community health'],
      brief: 'Funds CBOs delivering allied health workforce training in underserved communities. Strong alignment with DYCD model.',
    },
    {
      id: 'g2',
      title: 'NYC DYCD Bridge to Health Careers RFP',
      source: 'NYC DYCD',
      agency: 'NYC DYCD',
      type: 'rfp',
      amount: '$650K/year x 3',
      deadline: '2026-06-12',
      fitScore: 98,
      winProb: 0.71,
      naics: '624310',
      forOrg: 'uplift',
      tags: ['workforce', 'youth', 'healthcare', 'DYCD'],
      brief: 'Direct successor to current CRED program. Uplift is incumbent-adjacent. High win probability.',
    },
    {
      id: 'g3',
      title: 'Department of Education AI in K-12 Pilot RFP',
      source: 'SAM.gov',
      agency: 'US DOE',
      type: 'rfp',
      amount: '$1.8M',
      deadline: '2026-08-04',
      fitScore: 87,
      winProb: 0.31,
      naics: '611710',
      forOrg: 'iha',
      tags: ['AI', 'education', 'edtech', 'pilot'],
      brief: 'IHA Academy + KAIA companion is a near-perfect fit. Need a school district co-applicant.',
    },
    {
      id: 'g4',
      title: 'GSA AI/ML Modernization Schedule — IDIQ',
      source: 'SAM.gov',
      agency: 'GSA',
      type: 'contract',
      amount: '$25M ceiling (IDIQ)',
      deadline: '2026-09-30',
      fitScore: 78,
      winProb: 0.18,
      naics: '541511',
      forOrg: 'perpetual',
      tags: ['SaaS', 'AI', 'federal', 'IDIQ'],
      brief: 'Perpetual Core qualifies as a small business AI vendor. Long sales cycle, but IDIQ unlocks 5 years of task orders.',
    },
    {
      id: 'g5',
      title: 'Robert Wood Johnson Foundation — Health Equity Innovation',
      source: 'RWJF',
      agency: 'Foundation',
      type: 'grant',
      amount: '$500K',
      deadline: '2026-07-30',
      fitScore: 91,
      winProb: 0.38,
      naics: '624190',
      forOrg: 'iha',
      tags: ['health equity', 'innovation', 'Africa'],
      brief: 'IHA Global Health + ISfTeH network + Kenya footprint = differentiated narrative.',
    },
    {
      id: 'g6',
      title: 'NSF SBIR Phase I — AI for Education',
      source: 'SBIR.gov',
      agency: 'NSF',
      type: 'rfp',
      amount: '$305K',
      deadline: '2026-06-25',
      fitScore: 85,
      winProb: 0.28,
      naics: '541511',
      forOrg: 'perpetual',
      tags: ['SBIR', 'AI', 'education', 'small business'],
      brief: 'Perpetual Core eligible. Non-dilutive capital. KAIA tech as the IP.',
    },
  ];

  // Mock past wins / artifact vault
  const vaultEntries = {
    uplift: [
      { id: 'v1', type: 'won_proposal', title: 'DYCD CRED 2025 — Need Statement', excerpt: 'Brooklyn experiences a 41% youth unemployment rate, with healthcare-aligned roles offering the fastest pathway to family-sustaining wages...' },
      { id: 'v2', type: 'partner_letter', title: 'KCC MOU Letter', excerpt: 'Kingsborough Community College commits 12 articulated credit hours...' },
      { id: 'v3', type: 'logic_model', title: 'Healthcare Workforce Logic Model', excerpt: 'Inputs → 60 students/cohort, 5 industry tracks → Activities → ...' },
    ],
    iha: [
      { id: 'v4', type: 'concept_note', title: 'Kenya 2026 Concept Note', excerpt: 'IHA partners with TPC Ministries and ISfTeH to deliver dual-track Education and Health interventions...' },
      { id: 'v5', type: 'curriculum', title: 'IHA Academy 5-Pillar Framework', excerpt: 'Aligned to UNESCO SDG 4, AU Agenda 2063, Kenya Vision 2030...' },
    ],
    perpetual: [
      { id: 'v6', type: 'tech_spec', title: 'Perpetual Core Architecture', excerpt: 'Next.js 14 frontend on Vercel, Supabase Postgres + pgvector, Stripe billing with plan-gating, GHL sub-account provisioning per tenant...' },
    ],
  };

  // Section types for drafting (covers all 3 entity types)
  const sectionTypes = {
    nonprofit: [
      { id: 'need_statement', label: 'Need Statement', icon: Target },
      { id: 'approach', label: 'Project Approach', icon: ArrowRight },
      { id: 'logic_model', label: 'Logic Model', icon: ChevronRight },
      { id: 'org_capacity', label: 'Organizational Capacity', icon: Building2 },
      { id: 'eval_plan', label: 'Evaluation Plan', icon: CheckCircle2 },
      { id: 'sustainability', label: 'Sustainability', icon: Zap },
    ],
    forprofit: [
      { id: 'exec_summary', label: 'Executive Summary', icon: FileText },
      { id: 'tech_approach', label: 'Technical Approach', icon: Zap },
      { id: 'past_performance', label: 'Past Performance', icon: CheckCircle2 },
      { id: 'mgmt_plan', label: 'Management Plan', icon: Briefcase },
      { id: 'pricing_narrative', label: 'Pricing Narrative', icon: Target },
      { id: 'differentiators', label: 'Differentiators', icon: Sparkles },
    ],
  };

  const currentOrg = orgs[activeOrg];
  const currentSections = sectionTypes[currentOrg.type];
  const filteredOpps = opportunities.filter(o => {
    if (orgMode === 'dual') return true;
    if (orgMode === 'nonprofit') return orgs[o.forOrg]?.type === 'nonprofit';
    if (orgMode === 'forprofit') return orgs[o.forOrg]?.type === 'forprofit';
    return true;
  });

  // The drafting agent — calls Claude API
  const generateDraft = async () => {
    if (!rfpInput.trim()) {
      setDraftError('Paste a section of the RFP/grant solicitation first.');
      return;
    }
    setIsDrafting(true);
    setDraftError('');
    setDraftOutput('');

    const sectionLabel = currentSections.find(s => s.id === draftSection)?.label || draftSection;
    const vaultContext = (vaultEntries[activeOrg] || []).map(v => `[${v.type}] ${v.title}: ${v.excerpt}`).join('\n\n');

    const systemPrompt = `You are an expert proposal writer for ${currentOrg.name}, a ${currentOrg.type} entity. 

ORG CAPACITY: ${currentOrg.capacity}
ORG VOICE: ${currentOrg.voice}
RECENT WINS: ${currentOrg.wins.join('; ')}
NAICS: ${currentOrg.naics.join(', ')}

VAULT (use as ground truth for past performance, partners, data):
${vaultContext}

RULES:
- Write in the org's documented voice. Concrete, specific, no fluff.
- Cite past wins by name where they support a claim.
- Do NOT fabricate statistics, partners, or outcomes. If something isn't in the vault or capacity, write [VERIFY: ...] in brackets.
- Match the convention for ${currentOrg.type === 'nonprofit' ? 'federal/foundation grant proposals (Need → Approach → Outcomes language)' : 'federal/commercial RFP responses (Understanding → Approach → Differentiators language)'}.
- Length: 2-4 tight paragraphs unless the section requires more.
- Do not include placeholder headers like "[Section Title]". Just write the content.`;

    const userPrompt = `Draft the **${sectionLabel}** section.

Here is the relevant excerpt from the solicitation:

"""
${rfpInput}
"""

Write the section now.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        })
      });
      const data = await response.json();
      const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
      if (!text) {
        setDraftError('No content returned. Try again.');
      } else {
        setDraftOutput(text);
      }
    } catch (err) {
      setDraftError('Draft failed. Check connection and retry.');
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a', fontFamily: "'Fraunces', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .display { font-family: 'Fraunces', Georgia, serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(217, 178, 92, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(217, 178, 92, 0); }
          100% { box-shadow: 0 0 0 0 rgba(217, 178, 92, 0); }
        }
        .live-dot { animation: pulse-ring 2s infinite; }
        .grain {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(217, 178, 92, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(110, 165, 195, 0.04) 0%, transparent 40%);
        }
      `}</style>

      <div className="grain min-h-screen">
        {/* HEADER */}
        <header className="border-b border-white/5 px-8 py-5 flex items-center justify-between" style={{ background: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d9b25c 0%, #b8954a 100%)' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#0a0e1a' }} />
            </div>
            <div>
              <div className="display text-xl font-semibold text-white tracking-tight">Perpetual Core</div>
              <div className="mono text-[10px] uppercase tracking-widest" style={{ color: '#d9b25c' }}>
                RFP &amp; Proposal Engine · Multi-Entity
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot"></span>
              <span className="mono text-[11px] text-white/70">Discovery live</span>
            </div>
          </div>
        </header>

        {/* MODE & ORG SWITCHER */}
        <div className="px-8 py-4 border-b border-white/5 flex items-center gap-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] uppercase tracking-widest text-white/40">Mode</span>
            {[
              { v: 'nonprofit', l: 'Nonprofit' },
              { v: 'forprofit', l: 'For-Profit' },
              { v: 'dual', l: 'Dual' },
            ].map(m => (
              <button
                key={m.v}
                onClick={() => setOrgMode(m.v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  orgMode === m.v ? 'text-[#0a0e1a]' : 'text-white/60 hover:text-white'
                }`}
                style={{
                  background: orgMode === m.v ? '#d9b25c' : 'transparent',
                  border: orgMode === m.v ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {m.l}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] uppercase tracking-widest text-white/40">Active Org</span>
            {Object.entries(orgs).map(([k, o]) => (
              <button
                key={k}
                onClick={() => setActiveOrg(k)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeOrg === k ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
                style={{
                  background: activeOrg === k ? 'rgba(217, 178, 92, 0.12)' : 'transparent',
                  border: activeOrg === k ? '1px solid rgba(217, 178, 92, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {o.type === 'nonprofit' ? <Building2 className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                {o.name}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN VIEW TABS */}
        <div className="px-8 pt-6 flex gap-1">
          {[
            { v: 'discovery', l: 'Discovery', icon: Search },
            { v: 'capture', l: 'Capture Profile', icon: Target },
            { v: 'draft', l: 'Drafting Agent', icon: Sparkles },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.v}
                onClick={() => setActiveView(t.v)}
                className={`px-5 py-3 rounded-t-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  activeView === t.v ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
                style={{
                  background: activeView === t.v ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderBottom: activeView === t.v ? '2px solid #d9b25c' : '2px solid transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                {t.l}
              </button>
            );
          })}
        </div>

        <main className="px-8 pb-12" style={{ background: 'rgba(255,255,255,0.015)' }}>
          {/* DISCOVERY VIEW */}
          {activeView === 'discovery' && (
            <div className="pt-6">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="display text-3xl font-semibold text-white tracking-tight">
                  Live Opportunities <span className="text-white/30 mono text-base font-normal">{filteredOpps.length} matched</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Filter className="w-3.5 h-3.5" />
                  <span className="mono">SAM.gov · Grants.gov · DYCD · NY State · Foundation Directory</span>
                </div>
              </div>

              <div className="grid gap-3">
                {filteredOpps.map(opp => {
                  const oppOrg = orgs[opp.forOrg];
                  return (
                    <div
                      key={opp.id}
                      onClick={() => { setSelectedOpp(opp); setActiveView('draft'); setActiveOrg(opp.forOrg); }}
                      className="group rounded-xl p-5 cursor-pointer transition-all hover:translate-x-1"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded" style={{
                              background: opp.type === 'grant' ? 'rgba(110, 165, 195, 0.12)' : opp.type === 'rfp' ? 'rgba(217, 178, 92, 0.12)' : 'rgba(180, 140, 200, 0.12)',
                              color: opp.type === 'grant' ? '#6ea5c3' : opp.type === 'rfp' ? '#d9b25c' : '#b48cc8',
                            }}>{opp.type}</span>
                            <span className="mono text-[10px] text-white/40">{opp.source}</span>
                            <span className="mono text-[10px] text-white/30">·</span>
                            <span className="mono text-[10px] text-white/40">{opp.agency}</span>
                            <span className="mono text-[10px] text-white/30">·</span>
                            <span className="mono text-[10px] text-white/40">→ {oppOrg?.name}</span>
                          </div>
                          <div className="display text-lg font-medium text-white mb-2 leading-snug">{opp.title}</div>
                          <p className="text-sm text-white/60 mb-3 leading-relaxed">{opp.brief}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {opp.tags.map(t => (
                              <span key={t} className="mono text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="text-right">
                              <div className="mono text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Fit</div>
                              <div className="display text-2xl font-semibold" style={{ color: opp.fitScore >= 90 ? '#86efac' : opp.fitScore >= 80 ? '#d9b25c' : '#fbbf77' }}>
                                {opp.fitScore}
                              </div>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div className="text-right">
                              <div className="mono text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Win prob</div>
                              <div className="display text-2xl font-semibold text-white">{Math.round(opp.winProb * 100)}%</div>
                            </div>
                          </div>
                          <div className="text-right mt-2">
                            <div className="mono text-[10px] text-white/40 uppercase tracking-wider">{opp.amount}</div>
                            <div className="mono text-[11px] text-white/70 mt-0.5">Due {opp.deadline}</div>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-[#d9b25c] opacity-0 group-hover:opacity-100 transition-opacity">
                            Draft response <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CAPTURE PROFILE VIEW */}
          {activeView === 'capture' && (
            <div className="pt-6">
              <h2 className="display text-3xl font-semibold text-white tracking-tight mb-2">{currentOrg.name}</h2>
              <div className="mono text-xs uppercase tracking-widest mb-6" style={{ color: '#d9b25c' }}>
                Capture Profile · {currentOrg.type === 'nonprofit' ? 'Nonprofit Entity' : 'For-Profit Entity'}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-2">Voice fingerprint</div>
                  <p className="text-sm text-white/80 leading-relaxed">{currentOrg.voice}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-2">Capacity</div>
                  <p className="text-sm text-white/80 leading-relaxed">{currentOrg.capacity}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-2">NAICS codes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentOrg.naics.map(n => (
                      <span key={n} className="mono text-xs px-2 py-1 rounded" style={{ background: 'rgba(217, 178, 92, 0.1)', color: '#d9b25c' }}>{n}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-2">Recent wins</div>
                  <ul className="text-sm text-white/80 space-y-1">
                    {currentOrg.wins.map(w => <li key={w} className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#86efac' }} />{w}</li>)}
                  </ul>
                </div>
              </div>

              <div>
                <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-3">Artifact vault · {(vaultEntries[activeOrg] || []).length} items</div>
                <div className="space-y-2">
                  {(vaultEntries[activeOrg] || []).map(v => (
                    <div key={v.id} className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: 'rgba(110, 165, 195, 0.1)', color: '#6ea5c3' }}>{v.type}</span>
                        <span className="text-sm font-medium text-white">{v.title}</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed pl-1">{v.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DRAFTING AGENT VIEW */}
          {activeView === 'draft' && (
            <div className="pt-6">
              <h2 className="display text-3xl font-semibold text-white tracking-tight mb-2">
                Drafting Agent
              </h2>
              <div className="mono text-xs uppercase tracking-widest mb-6" style={{ color: '#d9b25c' }}>
                {currentOrg.name} · {currentOrg.type === 'nonprofit' ? 'Grant / Proposal Mode' : 'RFP Response Mode'}
              </div>

              {selectedOpp && (
                <div className="rounded-xl p-4 mb-5 flex items-center gap-3" style={{ background: 'rgba(217, 178, 92, 0.08)', border: '1px solid rgba(217, 178, 92, 0.2)' }}>
                  <Target className="w-4 h-4 shrink-0" style={{ color: '#d9b25c' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">Drafting against: {selectedOpp.title}</div>
                    <div className="mono text-[10px] text-white/50">{selectedOpp.agency} · Due {selectedOpp.deadline} · {selectedOpp.amount}</div>
                  </div>
                  <button onClick={() => setSelectedOpp(null)} className="text-xs text-white/40 hover:text-white">Clear</button>
                </div>
              )}

              <div className="mb-5">
                <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-2">Section to draft</div>
                <div className="flex flex-wrap gap-2">
                  {currentSections.map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setDraftSection(s.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                          draftSection === s.id ? 'text-[#0a0e1a]' : 'text-white/60 hover:text-white'
                        }`}
                        style={{
                          background: draftSection === s.id ? '#d9b25c' : 'rgba(255,255,255,0.04)',
                          border: draftSection === s.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-2">Solicitation excerpt</div>
                  <textarea
                    value={rfpInput}
                    onChange={(e) => setRfpInput(e.target.value)}
                    placeholder="Paste the relevant section of the RFP, grant solicitation, or funder guidance here. Include the prompt language, evaluation criteria, and any required elements for this section..."
                    className="w-full h-72 p-4 rounded-xl text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: '1.6',
                    }}
                  />
                  <button
                    onClick={generateDraft}
                    disabled={isDrafting}
                    className="mt-3 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{
                      background: isDrafting ? 'rgba(217, 178, 92, 0.4)' : 'linear-gradient(135deg, #d9b25c 0%, #b8954a 100%)',
                      color: '#0a0e1a',
                    }}
                  >
                    {isDrafting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Drafting in {currentOrg.name}'s voice…</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate {currentSections.find(s => s.id === draftSection)?.label}</>
                    )}
                  </button>
                  {draftError && (
                    <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#fbbf77' }}>
                      <AlertCircle className="w-3.5 h-3.5" />{draftError}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center justify-between">
                    <span>Generated section</span>
                    {draftOutput && (
                      <button
                        onClick={() => navigator.clipboard.writeText(draftOutput)}
                        className="text-[10px] hover:text-white transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  <div
                    className="w-full h-72 p-4 rounded-xl text-sm overflow-y-auto"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      lineHeight: '1.7',
                    }}
                  >
                    {isDrafting ? (
                      <div className="h-full flex flex-col items-center justify-center text-white/40 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <div className="mono text-xs">Pulling vault · matching voice · drafting</div>
                      </div>
                    ) : draftOutput ? (
                      <div className="text-white/90 whitespace-pre-wrap">{draftOutput}</div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-white/30 text-center px-4 italic display">
                        Your section will appear here, written in {currentOrg.name}'s voice and grounded in your vault.
                      </div>
                    )}
                  </div>
                  {draftOutput && (
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/10" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                        Run reviewer agent
                      </button>
                      <button className="flex-1 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/10" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                        Save to proposal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-white/5 px-8 py-4 mono text-[10px] text-white/30 flex items-center justify-between">
          <div>Perpetual Core RFP &amp; Proposal Engine · Prototype · Powered by Claude Sonnet 4</div>
          <div>Multi-tenant · Voice-trained · Audit-grade</div>
        </footer>
      </div>
    </div>
  );
}
