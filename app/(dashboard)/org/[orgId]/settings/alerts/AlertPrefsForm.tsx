'use client';

/**
 * Phase 05-07 — Alert preferences form.
 *
 * Two columns:
 *   • Org default (left)    — disabled unless caller is owner. Subtitle:
 *                             "Applies to everyone in this org unless they
 *                              override."
 *   • My override  (right)  — always enabled for members. Subtitle: "These
 *                             trump the org default for you alone."
 *
 * Each column has the same fields:
 *   threshold slider (60-100, step 5) → email toggle + address →
 *   telegram toggle + chat_id → discord toggle + webhook → digest_mode →
 *   Save button.
 *
 * Save posts to /api/rfp/orgs/[orgId]/alert-prefs?scope=org|me. Errors
 * surface inline; success shows a brief "Saved" indicator that auto-clears.
 */

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface PrefsRow {
  id: string;
  org_id: string;
  user_id: string | null;
  threshold: number;
  email_enabled: boolean;
  email_address: string | null;
  telegram_enabled: boolean;
  telegram_chat_id: string | null;
  discord_enabled: boolean;
  discord_webhook: string | null;
  digest_mode: boolean;
}

interface AlertPrefsFormProps {
  orgId: string;
  userEmailHint: string | null;
  isOwner: boolean;
  telegramConfigured: boolean;
  orgDefault: PrefsRow | null;
  myOverride: PrefsRow | null;
}

interface FormState {
  threshold: number;
  email_enabled: boolean;
  email_address: string;
  telegram_enabled: boolean;
  telegram_chat_id: string;
  discord_enabled: boolean;
  discord_webhook: string;
  digest_mode: boolean;
}

function rowToState(row: PrefsRow | null, emailHint: string | null): FormState {
  return {
    threshold: row?.threshold ?? 80,
    email_enabled: row?.email_enabled ?? true,
    email_address: row?.email_address ?? emailHint ?? '',
    telegram_enabled: row?.telegram_enabled ?? false,
    telegram_chat_id: row?.telegram_chat_id ?? '',
    discord_enabled: row?.discord_enabled ?? false,
    discord_webhook: row?.discord_webhook ?? '',
    digest_mode: row?.digest_mode ?? false,
  };
}

/** Build the API body — only include fields that have meaningful values. */
function stateToBody(state: FormState): Record<string, unknown> {
  return {
    threshold: state.threshold,
    email_enabled: state.email_enabled,
    email_address: state.email_address.trim() || null,
    telegram_enabled: state.telegram_enabled,
    telegram_chat_id: state.telegram_chat_id.trim() || null,
    discord_enabled: state.discord_enabled,
    discord_webhook: state.discord_webhook.trim() || null,
    digest_mode: state.digest_mode,
  };
}

export function AlertPrefsForm(props: AlertPrefsFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PrefsColumn
        scope="org"
        title="Org default"
        eyebrow="ORG DEFAULT"
        subtitle="Applies to everyone in this org unless they override."
        initial={rowToState(props.orgDefault, null)}
        existed={!!props.orgDefault}
        disabled={!props.isOwner}
        disabledReason={
          props.isOwner ? null : 'Only org owners can edit the default.'
        }
        orgId={props.orgId}
        telegramConfigured={props.telegramConfigured}
      />
      <PrefsColumn
        scope="me"
        title="My override"
        eyebrow="MY OVERRIDE"
        subtitle="These trump the org default for you alone."
        initial={rowToState(props.myOverride, props.userEmailHint)}
        existed={!!props.myOverride}
        disabled={false}
        disabledReason={null}
        orgId={props.orgId}
        telegramConfigured={props.telegramConfigured}
      />
    </div>
  );
}

interface PrefsColumnProps {
  scope: 'org' | 'me';
  title: string;
  eyebrow: string;
  subtitle: string;
  initial: FormState;
  existed: boolean;
  disabled: boolean;
  disabledReason: string | null;
  orgId: string;
  telegramConfigured: boolean;
}

function PrefsColumn(props: PrefsColumnProps) {
  const [state, setState] = useState<FormState>(props.initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (props.disabled) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(
        `/api/rfp/orgs/${props.orgId}/alert-prefs?scope=${props.scope}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stateToBody(state)),
        }
      );
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const errString =
          data && typeof data === 'object' && 'error' in data
            ? String((data as { error: unknown }).error)
            : `HTTP ${res.status}`;
        setError(errString);
        return;
      }
      setSaved(true);
      // Auto-clear the saved indicator after 2.5s so it doesn't linger.
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-6"
      aria-label={`${props.title} alert preferences`}
    >
      <header>
        <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-500">
          {props.eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900">
          {props.title}
        </h2>
        <p
          className="mt-1 text-sm text-zinc-600"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          {props.subtitle}
        </p>
        {props.disabled && props.disabledReason && (
          <p className="mt-2 text-xs text-amber-700">{props.disabledReason}</p>
        )}
        {!props.existed && !props.disabled && (
          <p className="mt-2 text-xs text-zinc-500">
            No row yet — saving creates one.
          </p>
        )}
      </header>

      {/* Threshold */}
      <fieldset className="space-y-2" disabled={props.disabled || saving}>
        <div className="flex items-baseline justify-between">
          <Label
            htmlFor={`${props.scope}-threshold`}
            className="text-zinc-700"
          >
            Threshold
          </Label>
          <span className="text-sm font-mono text-emerald-600">
            ≥ {state.threshold}
          </span>
        </div>
        <Slider
          id={`${props.scope}-threshold`}
          min={60}
          max={100}
          step={5}
          value={[state.threshold]}
          onValueChange={(v) => set('threshold', v[0] ?? 80)}
          aria-label="Alert fit-score threshold"
        />
        <p className="text-xs text-zinc-500">
          Alerts fire when fit score is at or above this number. Range 60-100.
        </p>
      </fieldset>

      {/* Email channel */}
      <ChannelBlock
        label="Email"
        enabled={state.email_enabled}
        onEnabledChange={(v) => set('email_enabled', v)}
        disabled={props.disabled || saving}
        scope={props.scope}
        channel="email"
      >
        <Input
          id={`${props.scope}-email-address`}
          type="email"
          placeholder="alerts@example.org"
          value={state.email_address}
          onChange={(e) => set('email_address', e.target.value)}
          disabled={props.disabled || saving || !state.email_enabled}
        />
        <p className="text-xs text-zinc-500">
          Leave blank to use the account email on file.
        </p>
      </ChannelBlock>

      {/* Telegram channel */}
      <ChannelBlock
        label="Telegram"
        enabled={state.telegram_enabled}
        onEnabledChange={(v) => set('telegram_enabled', v)}
        disabled={props.disabled || saving || !props.telegramConfigured}
        scope={props.scope}
        channel="telegram"
      >
        <Input
          id={`${props.scope}-telegram-chat-id`}
          type="text"
          placeholder="e.g. 987654321"
          value={state.telegram_chat_id}
          onChange={(e) => set('telegram_chat_id', e.target.value)}
          disabled={
            props.disabled ||
            saving ||
            !state.telegram_enabled ||
            !props.telegramConfigured
          }
        />
        <p className="text-xs text-zinc-500">
          {props.telegramConfigured
            ? 'Message our bot once and run /start to get your chat_id.'
            : 'Telegram unavailable — set TELEGRAM_BOT_TOKEN in env.'}
        </p>
      </ChannelBlock>

      {/* Discord channel */}
      <ChannelBlock
        label="Discord"
        enabled={state.discord_enabled}
        onEnabledChange={(v) => set('discord_enabled', v)}
        disabled={props.disabled || saving}
        scope={props.scope}
        channel="discord"
      >
        <Input
          id={`${props.scope}-discord-webhook`}
          type="url"
          placeholder="https://discord.com/api/webhooks/…"
          value={state.discord_webhook}
          onChange={(e) => set('discord_webhook', e.target.value)}
          disabled={props.disabled || saving || !state.discord_enabled}
        />
        <p className="text-xs text-zinc-500">
          Create a webhook in your Discord server → Settings → Integrations →
          Webhooks.
        </p>
      </ChannelBlock>

      {/* Digest mode */}
      <fieldset
        className="flex items-start justify-between gap-3 rounded border border-zinc-200 bg-zinc-50 p-3"
        disabled={props.disabled || saving}
      >
        <div className="space-y-1">
          <Label
            htmlFor={`${props.scope}-digest-mode`}
            className="text-zinc-700"
          >
            Digest mode
          </Label>
          <p className="text-xs text-zinc-500">
            Batch alerts into a once-per-day digest instead of individual sends.
          </p>
        </div>
        <Switch
          id={`${props.scope}-digest-mode`}
          checked={state.digest_mode}
          onCheckedChange={(v) => set('digest_mode', v)}
          disabled={props.disabled || saving}
        />
      </fieldset>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] text-zinc-400">
          Slack support is on the roadmap — coming after MVP.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm text-emerald-600">
            Saved.
          </p>
        )}

        <Button
          type="submit"
          disabled={props.disabled || saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white self-start"
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

interface ChannelBlockProps {
  label: string;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  disabled: boolean;
  scope: 'org' | 'me';
  channel: 'email' | 'telegram' | 'discord';
  children: React.ReactNode;
}

function ChannelBlock(props: ChannelBlockProps) {
  return (
    <fieldset
      className="space-y-2 rounded border border-zinc-200 bg-zinc-50 p-3"
      disabled={props.disabled}
    >
      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor={`${props.scope}-${props.channel}-enabled`}
          className="text-zinc-700"
        >
          {props.label}
        </Label>
        <Switch
          id={`${props.scope}-${props.channel}-enabled`}
          checked={props.enabled}
          onCheckedChange={props.onEnabledChange}
          disabled={props.disabled}
          aria-label={`Toggle ${props.label} alerts`}
        />
      </div>
      {props.children}
    </fieldset>
  );
}
