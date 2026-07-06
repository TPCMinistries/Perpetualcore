import { execFileSync } from 'node:child_process';
import type { DbTarget, Row } from './types';

/**
 * Resolve the Supabase PAT. Prefers the SUPABASE_ACCESS_TOKEN env var (Vercel /
 * CI / explicit export); falls back to the macOS keychain entry Lorenzo already
 * uses for the Management API pattern (service "Supabase Management API",
 * account "supabase"). The value is never logged and never returned to callers.
 */
function resolvePat(): string {
  const fromEnv = process.env.SUPABASE_ACCESS_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return execFileSync(
      'security',
      ['find-generic-password', '-s', 'Supabase Management API', '-w'],
      { encoding: 'utf8' },
    ).trim();
  } catch {
    throw new Error(
      'No Supabase PAT: set SUPABASE_ACCESS_TOKEN, or ensure the macOS keychain ' +
        'entry "Supabase Management API" (account "supabase") exists ' +
        '(see memory: supabase-management-api-pattern).',
    );
  }
}

/**
 * Management API SQL executor.
 *
 * Runs read-only SQL against any Supabase project via the Management API using a
 * Personal Access Token — the pattern from memory `supabase-management-api-pattern`.
 * The PAT is NEVER hardcoded and never logged.
 *
 * This is the ONLY I/O module in the ops slice. Capabilities stay pure by taking
 * `runSql` through OpsCtx; swap this for an MCP-backed executor when driving the
 * same capability from a Claude Code session instead of headless.
 */
export function createManagementExecutor(): (target: DbTarget, sql: string) => Promise<Row[]> {
  const pat = resolvePat();

  return async function runSql(target: DbTarget, sql: string): Promise<Row[]> {
    if (!target.projectRef) return [];
    const res = await fetch(`https://api.supabase.com/v1/projects/${target.projectRef}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
        // Cloudflare in front of the Management API 403s (code 1010) requests with
        // no User-Agent — see memory supabase-management-api-pattern.
        'User-Agent': 'lorenzo-ops/1.0',
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Management API ${res.status} for ${target.key}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as Row[];
  };
}
