import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Ecosystem People API
 * 
 * Syncs people/contacts between external apps and Perpetual Core.
 * Creates unified contact records with crosswalk mappings.
 */

// POST - Sync a person from an external app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      app_slug, 
      external_user_id, 
      email, 
      name,
      metadata = {} 
    } = body;

    // Validate required fields
    if (!app_slug || !external_user_id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: app_slug, external_user_id, email' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify app exists
    const { data: app, error: appError } = await supabase
      .from('app_connections')
      .select('id, app_name, people_sync_enabled')
      .eq('app_slug', app_slug)
      .eq('is_active', true)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { error: `Unknown app: ${app_slug}` },
        { status: 404 }
      );
    }

    if (!app.people_sync_enabled) {
      return NextResponse.json(
        { error: `People sync disabled for app: ${app_slug}` },
        { status: 403 }
      );
    }

    // Use the database function to sync the person
    const { data: contactId, error: syncError } = await supabase
      .rpc('sync_external_person', {
        p_app_slug: app_slug,
        p_external_user_id: external_user_id,
        p_email: email,
        p_name: name || '',
        p_metadata: metadata,
      });

    if (syncError) {
      console.error('Error syncing person:', syncError);
      return NextResponse.json(
        { error: 'Failed to sync person', details: syncError.message },
        { status: 500 }
      );
    }

    // Update last sync time
    await supabase
      .from('app_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('app_slug', app_slug);

    return NextResponse.json({
      success: true,
      contact_id: contactId,
      app_name: app.app_name,
      email,
    });

  } catch (error) {
    console.error('Ecosystem people sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Look up crosswalk data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const contact_id = searchParams.get('contact_id');
    const app_slug = searchParams.get('app_slug');
    const external_user_id = searchParams.get('external_user_id');

    if (!email && !contact_id && !(app_slug && external_user_id)) {
      return NextResponse.json(
        { error: 'Must provide email, contact_id, or (app_slug + external_user_id)' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Build query based on provided params
    if (contact_id) {
      // Get all crosswalk entries for a contact
      const { data: crosswalk, error } = await supabase
        .from('contact_app_crosswalk')
        .select(`
          id,
          app_slug,
          external_user_id,
          external_email,
          external_data,
          last_synced_at,
          app_connections (
            app_name,
            app_url
          )
        `)
        .eq('contact_id', contact_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch crosswalk' }, { status: 500 });
      }

      // Also get the contact details
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .eq('id', contact_id)
        .single();

      return NextResponse.json({
        contact,
        apps: crosswalk,
      });
    }

    if (email) {
      // Find contact by email and get all crosswalk entries
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .eq('email', email)
        .single();

      if (!contact) {
        return NextResponse.json({ contact: null, apps: [] });
      }

      const { data: crosswalk } = await supabase
        .from('contact_app_crosswalk')
        .select(`
          id,
          app_slug,
          external_user_id,
          external_email,
          external_data,
          last_synced_at,
          app_connections (
            app_name,
            app_url
          )
        `)
        .eq('contact_id', contact.id);

      return NextResponse.json({
        contact,
        apps: crosswalk || [],
      });
    }

    if (app_slug && external_user_id) {
      // Look up by app-specific ID
      const { data: crosswalk, error } = await supabase
        .from('contact_app_crosswalk')
        .select(`
          id,
          contact_id,
          external_email,
          external_data,
          last_synced_at,
          contacts (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('app_slug', app_slug)
        .eq('external_user_id', external_user_id)
        .single();

      if (error || !crosswalk) {
        return NextResponse.json({ found: false });
      }

      return NextResponse.json({
        found: true,
        contact: crosswalk.contacts,
        crosswalk: {
          id: crosswalk.id,
          contact_id: crosswalk.contact_id,
          external_email: crosswalk.external_email,
          external_data: crosswalk.external_data,
          last_synced_at: crosswalk.last_synced_at,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });

  } catch (error) {
    console.error('Ecosystem people GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
