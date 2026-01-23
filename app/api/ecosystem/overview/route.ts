import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Ecosystem Overview API
 * 
 * Returns a comprehensive view of the entire ecosystem:
 * - All connected apps with their status
 * - Recent events across apps
 * - Financial totals (revenue, donations)
 * - Active users and engagement metrics
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    const supabase = createAdminClient();

    // Get ecosystem overview (all apps with their status)
    const { data: apps, error: appsError } = await supabase
      .from('ecosystem_overview')
      .select('*');

    if (appsError) {
      console.error('Error fetching ecosystem overview:', appsError);
      // Fallback to direct query if view doesn't exist
      const { data: fallbackApps } = await supabase
        .from('app_connections')
        .select('*')
        .eq('is_active', true);
      
      return NextResponse.json({
        apps: fallbackApps || [],
        totals: { total_revenue: 0, total_donations: 0, total_events: 0, total_active_users: 0, apps_active: fallbackApps?.length || 0 },
        recent_events: [],
        daily_metrics: [],
      });
    }

    // Get ecosystem totals
    const { data: totals, error: totalsError } = await supabase
      .rpc('get_ecosystem_totals', {
        p_start_date: startDate,
        p_end_date: endDate,
      });

    // Get recent events (last 20)
    const { data: recentEvents } = await supabase
      .from('external_app_events')
      .select(`
        id,
        app_slug,
        event_type,
        entity_type,
        actor_email,
        event_timestamp
      `)
      .order('event_timestamp', { ascending: false })
      .limit(20);

    // Get daily metrics for the period
    const { data: dailyMetrics } = await supabase
      .from('daily_ecosystem_metrics')
      .select('*')
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: false });

    // Calculate summary stats
    const eventsByApp: Record<string, number> = {};
    const eventsByType: Record<string, number> = {};

    recentEvents?.forEach(e => {
      eventsByApp[e.app_slug] = (eventsByApp[e.app_slug] || 0) + 1;
      eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;
    });

    return NextResponse.json({
      apps: apps || [],
      totals: totals?.[0] || {
        total_revenue: 0,
        total_donations: 0,
        total_events: 0,
        total_active_users: 0,
        apps_active: apps?.length || 0,
      },
      recent_events: recentEvents || [],
      daily_metrics: dailyMetrics || [],
      event_summary: {
        by_app: eventsByApp,
        by_type: eventsByType,
      },
      period: {
        start: startDate,
        end: endDate,
      },
    });

  } catch (error) {
    console.error('Ecosystem overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
