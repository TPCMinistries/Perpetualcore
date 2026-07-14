import type { Capability, Finding, OpsCtx, Row } from '../types';
import { BRAIN_TARGET } from '../deck-push';
import { sendOpsTelegram } from '../telegram';
import {
  APPROVED_TEMPLATES,
  FROM_ADDRESSES,
  isSendArmed,
  logTouch,
  loadState,
  maskEmail,
  newDraftId,
  queueDraft,
  resolveResendKey,
  saveState,
  type TemplateVars,
} from '../revenue-crew';

/**
 * speed-to-lead — instant lead acknowledgment, queued-not-sent by default.
 *
 * Inventories new leads (last 72h) from whichever Brain-DB lead tables exist,
 * drafts a personalized acknowledgment per lead into the vault queue, logs
 * every touch to the ledger, and pings Telegram when new leads land.
 *
 * SAFETY: the two-key send gate (env var AND per-template approval) ships
 * default-OFF — in Wave 1 every template is `approved: false`, so the send
 * branch below is physically unreachable. Everything queues as
 * QUEUED-AWAITING-LORENZO per the ratified autonomy charter. Additionally the
 * `pc` from-domain is not confirmed verified in Resend, which independently
 * forces queue-only.
 */

export const SPEED_TO_LEAD_HEADLINE = 'Speed to Lead';

// Owner Telegram chat (Lorenzo) — same default as daily-brief.ts / strategist.
const BRIEF_CHAT_ID = process.env.OPS_BRIEF_CHAT_ID || '6460142816';

/** Candidate lead tables on the Brain target (verified during planning). */
const SOURCES: Array<{ table: string; templateId: string }> = [
  { table: 'leads', templateId: 'stl-leads' },
  { table: 'consultation_bookings', templateId: 'stl-consultation' },
  { table: 'enterprise_demo_requests', templateId: 'stl-demo' },
  { table: 'contact_submissions', templateId: 'stl-contact' },
];

/** Ecosystem lead sources NOT reachable from this repo — inventory only. */
const UNWIRED_SOURCES = ['partner_leads (huma/care-ops)', 'RFP/Academy signups'];

function fieldStr(row: Row, key: string): string | null {
  const v = row[key];
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number') return String(v);
  return null;
}

function leadFirstName(row: Row): string | null {
  const first = fieldStr(row, 'first_name');
  if (first) return first;
  const full = fieldStr(row, 'full_name');
  if (full) return full.split(/\s+/)[0];
  return null;
}

function leadCompany(row: Row): string | null {
  return fieldStr(row, 'company') ?? fieldStr(row, 'company_name');
}

interface NewLead {
  table: string;
  templateId: string;
  key: string;
  email: string;
  firstName: string | null;
  company: string | null;
}

export const speedToLead: Capability = {
  id: 'speed-to-lead',
  label: 'SPEED TO LEAD',
  cadence: '0 * * * *',
  destructive: false,
  run: async (ctx: OpsCtx): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const push = (f: Finding | null): void => {
      if (f) findings.push(f);
    };

    const { state, finding: stateFinding } = await loadState();
    push(stateFinding);

    // --- 1) Probe which candidate tables exist (never assume) ----------------
    let existingTables = new Set<string>();
    let probeOk = false;
    try {
      const tableList = SOURCES.map((s) => `'${s.table}'`).join(',');
      const rows = await ctx.runSql(
        BRAIN_TARGET,
        `select table_name from information_schema.tables
          where table_schema = 'public' and table_name in (${tableList})`,
      );
      existingTables = new Set(rows.map((r) => String(r.table_name)));
      probeOk = true;
    } catch (err) {
      findings.push({
        severity: 'warn',
        project: SPEED_TO_LEAD_HEADLINE,
        summary: 'Could not probe lead tables on Brain target — no sources read this run',
        detail: (err as Error).message.slice(0, 200),
      });
    }

    // --- 2) Read each existing table in isolation ----------------------------
    const newLeads: NewLead[] = [];
    let sourcesRead = 0;
    let sourcesSkipped = 0;

    for (const source of SOURCES) {
      if (!probeOk) {
        sourcesSkipped += 1;
        continue;
      }
      if (!existingTables.has(source.table)) {
        sourcesSkipped += 1;
        findings.push({
          severity: 'info',
          project: SPEED_TO_LEAD_HEADLINE,
          summary: `Table public.${source.table} does not exist on Brain target — skipped`,
        });
        continue;
      }
      try {
        const rows = await ctx.runSql(
          BRAIN_TARGET,
          `select * from public.${source.table}
            where created_at > now() - interval '72 hours'
            order by created_at desc
            limit 50`,
        );
        sourcesRead += 1;
        for (const row of rows) {
          const email = fieldStr(row, 'email');
          if (!email || !email.includes('@')) continue; // nothing to acknowledge without an address
          const id = fieldStr(row, 'id');
          const key = `${source.table}:${id ?? email}`;
          if (state.speedToLead.touchedLeadKeys.includes(key)) continue;
          newLeads.push({
            table: source.table,
            templateId: source.templateId,
            key,
            email,
            firstName: leadFirstName(row),
            company: leadCompany(row),
          });
        }
      } catch (err) {
        sourcesSkipped += 1;
        findings.push({
          severity: 'warn',
          project: SPEED_TO_LEAD_HEADLINE,
          summary: `Could not read public.${source.table} (other sources unaffected)`,
          detail: (err as Error).message.slice(0, 200),
        });
      }
    }

    // --- 3) Unwired ecosystem sources — explicit, never silent ---------------
    for (const name of UNWIRED_SOURCES) {
      findings.push({
        severity: 'info',
        project: SPEED_TO_LEAD_HEADLINE,
        summary: `${name}: source not wired from this repo — inventory only`,
      });
    }

    // --- 4) Draft acknowledgments: queue by default, send only past the gate --
    let queued = 0;
    let sent = 0;
    const fromEntry = FROM_ADDRESSES.pc; // all Brain-DB lead tables are PC property

    for (const lead of newLeads) {
      const template = APPROVED_TEMPLATES[lead.templateId];
      if (!template) {
        findings.push({
          severity: 'warn',
          project: SPEED_TO_LEAD_HEADLINE,
          summary: `No template "${lead.templateId}" for ${lead.table} — lead inventoried, no draft`,
        });
        continue;
      }
      const vars: TemplateVars = {
        firstName: lead.firstName ?? '',
        company: lead.company ?? '',
        source: lead.table,
      };
      const subject = template.subject(vars);
      const body = template.body(vars);
      const draftId = newDraftId('speed-to-lead');

      let delivered = false;
      // Two-key gate AND verified from-domain — unreachable in Wave 1 (all
      // templates ship approved: false), built so approval is a one-line flip.
      if (isSendArmed(lead.templateId) && fromEntry.verified) {
        const apiKey = resolveResendKey();
        if (!apiKey) {
          findings.push({
            severity: 'warn',
            project: SPEED_TO_LEAD_HEADLINE,
            summary: 'Send armed but RESEND_API_KEY not found (env or .env.local) — draft queued instead',
          });
        } else {
          try {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: fromEntry.from, to: [lead.email], subject, text: body }),
            });
            if (!res.ok) throw new Error(`Resend ${res.status}`);
            delivered = true;
            sent += 1;
          } catch (err) {
            findings.push({
              severity: 'warn',
              project: SPEED_TO_LEAD_HEADLINE,
              summary: `Resend send failed for ${maskEmail(lead.email)} — draft queued instead`,
              detail: (err as Error).message.slice(0, 200),
            });
          }
        }
      }

      if (!delivered) {
        push(
          await queueDraft({
            id: draftId,
            ts: ctx.now,
            capability: 'speed-to-lead',
            source: lead.table,
            to: lead.email,
            from: fromEntry.from,
            subject,
            body,
          }),
        );
        queued += 1;
      }

      push(
        await logTouch({
          ts: ctx.now,
          capability: 'speed-to-lead',
          source: lead.table,
          leadRef: lead.email,
          action: delivered ? `sent acknowledgment (${draftId})` : `queued acknowledgment (${draftId})`,
        }),
      );
      state.speedToLead.touchedLeadKeys.push(lead.key);
    }

    // --- 5) One Telegram ping when new leads landed ---------------------------
    if (newLeads.length > 0) {
      const bySource = new Map<string, number>();
      for (const l of newLeads) bySource.set(l.table, (bySource.get(l.table) ?? 0) + 1);
      const sourceBits = [...bySource.entries()].map(([t, n]) => `${t} ×${n}`).join(' · ');
      const ok = await sendOpsTelegram(
        BRIEF_CHAT_ID,
        `⚡ Speed to Lead: ${newLeads.length} new lead(s) — ${sourceBits}\n` +
          `Drafts queued in revenue-crew-queue.md (dry-run — nothing sent).`,
      );
      if (!ok) {
        findings.push({
          severity: 'warn',
          project: 'Telegram',
          summary: 'New-lead ping could not be delivered (drafts still queued)',
        });
      }
    }

    // --- 6) Persist state + headline ------------------------------------------
    state.speedToLead.lastRunIso = ctx.now;
    push(await saveState(state));

    findings.unshift({
      severity: 'ok',
      project: SPEED_TO_LEAD_HEADLINE,
      summary:
        `${newLeads.length} new lead(s) — ${queued} queued, ${sent} sent (dry-run) · ` +
        `${sourcesRead} source(s) read, ${sourcesSkipped} skipped`,
    });

    return findings;
  },
};
