import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Self-contained Telegram sender for the ops slice.
 *
 * Follows the ops philosophy (like executor.ts / stripe-reader.ts): reads its own
 * secret directly rather than relying on Next's process.env, so it works under the
 * headless launchd brief. Token source order:
 *   1. process.env.TELEGRAM_BOT_TOKEN (CI / explicit export)
 *   2. ~/.secrets/brain-bot-token (raw `NNN:AAA…` token, the file Lorenzo already keeps)
 * The token is never logged. Never throws — delivery failure returns false so the
 * brief (vault + deck) is never blocked by a Telegram outage.
 */

let cachedToken: string | null | undefined;

async function resolveToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  const fromEnv = process.env.TELEGRAM_BOT_TOKEN;
  if (fromEnv && fromEnv.trim()) {
    cachedToken = fromEnv.trim();
    return cachedToken;
  }
  try {
    const raw = (await fs.readFile(path.join(os.homedir(), '.secrets', 'brain-bot-token'), 'utf8')).trim();
    // tolerate an accidental KEY=value line as well as a bare token
    cachedToken = raw.includes('=') ? raw.split('=').slice(1).join('=').trim() : raw;
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

/** Telegram hard-caps a message at 4096 chars; keep headroom for safety. */
export function clampTelegram(text: string, max = 3900): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Send a plain-text Telegram message. Returns true on success, false otherwise.
 * Plain text (no parse mode) on purpose — the brief contains $, %, _, and other
 * characters that break Telegram's Markdown parser.
 */
export async function sendOpsTelegram(chatId: string | number, text: string): Promise<boolean> {
  const token = await resolveToken();
  if (!token) {
    console.error('telegram: no bot token (env TELEGRAM_BOT_TOKEN or ~/.secrets/brain-bot-token) — skipping');
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: clampTelegram(text),
        disable_web_page_preview: true,
      }),
    });
    const json = (await res.json()) as { ok: boolean; description?: string };
    if (!json.ok) {
      console.error(`telegram send failed: ${json.description ?? res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`telegram send error: ${(err as Error).message}`);
    return false;
  }
}
