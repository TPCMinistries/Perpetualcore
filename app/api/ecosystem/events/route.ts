import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Ecosystem Events API
 * 
 * Receives and queries events from external apps in the ecosystem.
 * Uses service role for all operations to bypass RLS.
 */

// POST - Receive an event from an external app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      app_slug, 
      event_type, 
      entity_type, 
      entity_id, 
      actor_email, 
      payload = {} 
    } = body;

    // Validate required fields
    if (!app_slug || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: app_slug, event_type' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify app exists and is active
    const { data: app, error: appError } = await supabase
      .from('app_connections')
      .select('id, app_name, events_enabled')
      .eq('app_slug', app_slug)
      .eq('is_active', true)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { error: `Unknown app: ${app_slug}` },
        { status: 404 }
      );
    }

    if (!app.events_enabled) {
      return NextResponse.json(
        { error: `Events disabled for app: ${app_slug}` },
        { status: 403 }
      );
    }

    // Use the database function to log the event
    const { data: eventId, error: eventError } = await supabase
      .rpc('log_external_event', {
        p_app_slug: app_slug,
        p_event_type: event_type,
        p_entity_type: entity_type || null,
        p_entity_id: entity_id || null,
        p_actor_email: actor_email || null,
        p_payload: payload,
      });

    if (eventError) {
      console.error('Error logging event:', eventError);
      return NextResponse.json(
        { error: 'Failed to log event', details: eventError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event_id: eventId,
      app_name: app.app_name,
      event_type,
    });

  } catch (error) {
    console.error('Ecosystem events error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Query events with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const app_slug = searchParams.get('app_slug');
    const event_type = searchParams.get('event_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const since = searchParams.get('since'); // ISO timestamp

    const supabase = createAdminClient();

    let query = supabase
      .from('external_app_events')
      .select(`
        id,
        app_slug,
        event_type,
        entity_type,
        entity_id,
        actor_email,
        payload,
        event_timestamp,
        processed
      `)
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    // Apply filters
    if (app_slug) {
      query = query.eq('app_slug', app_slug);
    }
    if (event_type) {
      query = query.eq('event_type', event_type);
    }
    if (since) {
      query = query.gte('event_timestamp', since);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Get summary counts
    const { data: summary } = await supabase
      .from('external_app_events')
      .select('app_slug, event_type')
      .gte('event_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const eventsByApp: Record<string, number> = {};
    const eventsByType: Record<string, number> = {};

    summary?.forEach(e => {
      eventsByApp[e.app_slug] = (eventsByApp[e.app_slug] || 0) + 1;
      eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;
    });

    return NextResponse.json({
      events,
      count: events?.length || 0,
      summary: {
        last_24h: {
          by_app: eventsByApp,
          by_type: eventsByType,
          total: summary?.length || 0,
        }
      }
    });

  } catch (error) {
    console.error('Ecosystem events GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
