import { createClient } from "@/lib/supabase/server";
import { MeterType } from "./metering";
import { sendEmail } from "@/lib/email";

export interface OverageAlert {
  id: string;
  organization_id: string;
  meter_type: MeterType | 'total_cost';
  threshold_percentage: number;
  is_active: boolean;
  alert_sent_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  current_percentage: number;
  notify_email: boolean;
  notify_in_app: boolean;
  notify_webhook: boolean;
  webhook_url: string | null;
}

export interface AlertTrigger {
  alert_id: string;
  meter_type: string;
  threshold_percentage: number;
  current_percentage: number;
  should_send: boolean;
}

export interface AlertNotification {
  id: string;
  organizationId: string;
  meterType: string;
  threshold: number;
  currentPercentage: number;
  message: string;
  severity: 'warning' | 'critical' | 'exceeded';
}

/**
 * Get all alerts for an organization
 */
export async function getOrganizationAlerts(
  organizationId: string
): Promise<OverageAlert[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('overage_alerts')
    .select('*')
    .eq('organization_id', organizationId)
    .order('meter_type')
    .order('threshold_percentage');

  if (error) {
    console.error('[Alerts] Error fetching alerts:', error);
    return [];
  }

  return data as OverageAlert[];
}

/**
 * Check which alerts should be triggered
 */
export async function checkAlerts(
  organizationId: string
): Promise<AlertTrigger[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('check_overage_alerts', {
    p_org_id: organizationId,
  });

  if (error) {
    console.error('[Alerts] Error checking alerts:', error);
    return [];
  }

  return (data as AlertTrigger[]) || [];
}

/**
 * Send alert notifications
 */
export async function sendAlertNotifications(
  organizationId: string
): Promise<AlertNotification[]> {
  const supabase = await createClient();
  const notifications: AlertNotification[] = [];

  // Check which alerts need to fire
  const triggers = await checkAlerts(organizationId);
  const alertsToSend = triggers.filter(t => t.should_send);

  for (const trigger of alertsToSend) {
    // Get full alert config
    const { data: alert } = await supabase
      .from('overage_alerts')
      .select('*')
      .eq('id', trigger.alert_id)
      .single();

    if (!alert) continue;

    // Determine severity
    let severity: 'warning' | 'critical' | 'exceeded' = 'warning';
    if (trigger.threshold_percentage >= 100) {
      severity = 'exceeded';
    } else if (trigger.threshold_percentage >= 90) {
      severity = 'critical';
    }

    // Build message
    const meterLabel = getMeterLabel(trigger.meter_type);
    let message = '';

    if (trigger.threshold_percentage >= 100) {
      message = `You've exceeded your ${meterLabel} quota. Additional usage will incur overage charges.`;
    } else {
      message = `You've used ${trigger.current_percentage.toFixed(0)}% of your ${meterLabel} quota.`;
    }

    const notification: AlertNotification = {
      id: trigger.alert_id,
      organizationId,
      meterType: trigger.meter_type,
      threshold: trigger.threshold_percentage,
      currentPercentage: trigger.current_percentage,
      message,
      severity,
    };

    notifications.push(notification);

    // Mark alert as sent
    await supabase
      .from('overage_alerts')
      .update({
        alert_sent_at: new Date().toISOString(),
        current_percentage: trigger.current_percentage,
      })
      .eq('id', trigger.alert_id);

    // Send notifications based on preferences
    if (alert.notify_in_app) {
      await sendInAppNotification(organizationId, notification);
    }

    if (alert.notify_email) {
      await sendEmailNotification(organizationId, notification);
    }

    if (alert.notify_webhook && alert.webhook_url) {
      await sendWebhookNotification(alert.webhook_url, notification);
    }
  }

  return notifications;
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(
  organizationId: string,
  notification: AlertNotification
): Promise<void> {
  const supabase = await createClient();

  // Get org members to notify
  const { data: members } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('organization_id', organizationId)
    .in('role', ['admin', 'owner']);

  if (!members || members.length === 0) return;

  // Create notifications for admins
  const notificationRecords = members.map(member => ({
    user_id: member.id,
    organization_id: organizationId,
    type: 'usage_alert',
    title: `Usage Alert: ${notification.threshold}% threshold reached`,
    body: notification.message,
    metadata: {
      meter_type: notification.meterType,
      threshold: notification.threshold,
      current_percentage: notification.currentPercentage,
      severity: notification.severity,
    },
    is_read: false,
  }));

  await supabase.from('notifications').insert(notificationRecords);
}

/**
 * Send email notification for usage alerts
 */
async function sendEmailNotification(
  organizationId: string,
  notification: AlertNotification
): Promise<void> {
  const supabase = await createClient();

  // Get org admin emails
  const { data: members } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('organization_id', organizationId)
    .in('role', ['admin', 'owner']);

  if (!members || members.length === 0) return;

  const severityColors = {
    warning: { bg: '#f59e0b', label: 'Warning' },
    critical: { bg: '#ef4444', label: 'Critical' },
    exceeded: { bg: '#dc2626', label: 'Limit Exceeded' },
  };

  const { bg, label } = severityColors[notification.severity];
  const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://perpetualcore.com'}/dashboard/settings/billing`;
  const meterLabel = getMeterLabel(notification.meterType);

  const subject = `${label}: ${meterLabel} at ${notification.currentPercentage.toFixed(0)}% - Perpetual Core`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:${bg};padding:30px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;">Usage ${label}</h1>
        </td></tr>
        <tr><td style="padding:40px 30px;">
          <p style="margin:0 0 20px;color:#4b5563;font-size:16px;line-height:1.6;">
            ${notification.message}
          </p>
          <div style="background:#f3f4f6;border-radius:6px;padding:20px;margin:20px 0;text-align:center;">
            <p style="margin:0 0 10px;color:#6b7280;font-size:14px;">Current Usage</p>
            <p style="margin:0;color:#111827;font-size:36px;font-weight:700;">${notification.currentPercentage.toFixed(0)}%</p>
            <p style="margin:10px 0 0;color:#6b7280;font-size:14px;">${meterLabel}</p>
          </div>
          <div style="text-align:center;margin:30px 0;">
            <a href="${billingUrl}" style="display:inline-block;background:#111827;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">View Billing & Usage</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  for (const member of members) {
    if (member.email) {
      await sendEmail(member.email, subject, html);
    }
  }
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(
  webhookUrl: string,
  notification: AlertNotification
): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'usage.alert',
        timestamp: new Date().toISOString(),
        data: {
          organization_id: notification.organizationId,
          meter_type: notification.meterType,
          threshold: notification.threshold,
          current_percentage: notification.currentPercentage,
          severity: notification.severity,
          message: notification.message,
        },
      }),
    });
  } catch (err) {
    console.error('[Alerts] Webhook notification failed:', err);
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('overage_alerts')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq('id', alertId);

  if (error) {
    console.error('[Alerts] Error acknowledging alert:', error);
    return false;
  }

  return true;
}

/**
 * Reset alert for next billing period
 */
export async function resetAlertsForBillingPeriod(
  organizationId: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('overage_alerts')
    .update({
      alert_sent_at: null,
      acknowledged_at: null,
      acknowledged_by: null,
      current_percentage: 0,
    })
    .eq('organization_id', organizationId);
}

/**
 * Update alert preferences
 */
export async function updateAlertPreferences(
  alertId: string,
  preferences: {
    is_active?: boolean;
    notify_email?: boolean;
    notify_in_app?: boolean;
    notify_webhook?: boolean;
    webhook_url?: string;
  }
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('overage_alerts')
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) {
    console.error('[Alerts] Error updating preferences:', error);
    return false;
  }

  return true;
}

/**
 * Create custom alert threshold
 */
export async function createCustomAlert(
  organizationId: string,
  meterType: MeterType | 'total_cost',
  thresholdPercentage: number,
  preferences?: {
    notify_email?: boolean;
    notify_in_app?: boolean;
    notify_webhook?: boolean;
    webhook_url?: string;
  }
): Promise<OverageAlert | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('overage_alerts')
    .insert({
      organization_id: organizationId,
      meter_type: meterType,
      threshold_percentage: thresholdPercentage,
      notify_email: preferences?.notify_email ?? true,
      notify_in_app: preferences?.notify_in_app ?? true,
      notify_webhook: preferences?.notify_webhook ?? false,
      webhook_url: preferences?.webhook_url,
    })
    .select()
    .single();

  if (error) {
    console.error('[Alerts] Error creating alert:', error);
    return null;
  }

  return data as OverageAlert;
}

/**
 * Get pending (unsent) alerts
 */
export async function getPendingAlerts(
  organizationId: string
): Promise<OverageAlert[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('overage_alerts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .is('alert_sent_at', null);

  if (error) {
    console.error('[Alerts] Error fetching pending alerts:', error);
    return [];
  }

  return data as OverageAlert[];
}

/**
 * Helper: Get human-readable meter label
 */
function getMeterLabel(meterType: string): string {
  const labels: Record<string, string> = {
    ai_tokens: 'AI tokens',
    api_calls: 'API calls',
    storage_gb: 'storage',
    premium_models: 'premium model',
    agents: 'AI agent',
    total_cost: 'total cost',
  };

  return labels[meterType] || meterType;
}
