import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Fleet scan — local git state across the active project repos. Answers the
 * question that has nearly cost real work twice: "what's uncommitted or
 * unpushed right now?" Pure local reads; never mutates any repo.
 */

export interface FleetRepo {
  key: string;
  label: string;
  path: string;
  branch: string;
  dirty: number;
  unpushed: number | null; // null = no upstream configured
  lastCommitAt: string;
  lastCommitSubject: string;
}

const HOME = os.homedir();
const ACTIVE = path.join(HOME, 'ORGANIZED', '01_PROJECTS', 'ACTIVE');

/** repo roots to scan — existence-checked at runtime, missing ones skipped */
const REPOS: Array<{ key: string; label: string; dir: string }> = [
  { key: 'perpetual-core', label: 'Perpetual Core', dir: path.join(ACTIVE, 'perpetual-core') },
  { key: 'sage-command-center', label: 'Sage Command Center', dir: path.join(HOME, 'sage-command-center') },
  { key: 'sage-saas', label: 'Sage SaaS', dir: path.join(HOME, 'Documents', 'sage-saas') },
  { key: 'workforce', label: 'Uplift Workforce', dir: path.join(ACTIVE, 'uplift-medical-workforce') },
  { key: 'iha-academy', label: 'IHA Academy', dir: path.join(ACTIVE, 'iha-academy') },
  { key: 'iha-website', label: 'IHA Website', dir: path.join(ACTIVE, 'iha-website') },
  { key: 'lorenzodc', label: 'lorenzodc.com', dir: path.join(ACTIVE, 'lorenzodc-personal-site') },
  { key: 'tpc', label: 'TPC Ministries', dir: path.join(HOME, 'tpc-ministries-platform') },
  { key: 'streams-of-grace', label: 'Streams of Grace', dir: path.join(ACTIVE, 'streams-of-grace') },
  { key: 'tmwyb', label: 'TMWYB', dir: path.join(ACTIVE, 'tmwyb') },
  { key: 'uplift-ops', label: 'Uplift Ops', dir: path.join(HOME, 'uplift-ops') },
  { key: 'huma-app', label: 'HUMA / IHA Health', dir: path.join(HOME, 'huma-app') },
  { key: 'mnemosyne', label: 'Mnemosyne', dir: path.join(HOME, 'mnemosyne') },
  { key: 'vault', label: 'Command Center Vault', dir: path.join(HOME, 'dev', 'LDC-Command-Center-Vault') },
];

function git(dir: string, args: string[]): string {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

export function scanFleet(): FleetRepo[] {
  const out: FleetRepo[] = [];
  for (const r of REPOS) {
    if (!existsSync(path.join(r.dir, '.git'))) continue;
    try {
      const branch = git(r.dir, ['branch', '--show-current']) || '(detached)';
      const dirty = git(r.dir, ['status', '--porcelain']).split('\n').filter(Boolean).length;
      let unpushed: number | null = null;
      try {
        unpushed = parseInt(git(r.dir, ['rev-list', '--count', '@{u}..HEAD']), 10);
      } catch {
        unpushed = null; // no upstream
      }
      const lastCommitAt = git(r.dir, ['log', '-1', '--format=%cI']);
      const lastCommitSubject = git(r.dir, ['log', '-1', '--format=%s']);
      out.push({ key: r.key, label: r.label, path: r.dir, branch, dirty, unpushed, lastCommitAt, lastCommitSubject });
    } catch {
      // unreadable repo — skip rather than fail the sweep
    }
  }
  return out;
}
