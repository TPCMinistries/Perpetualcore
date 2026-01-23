import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Ecosystem Transactions API
 * 
 * Tracks financial transactions across all apps in the ecosystem.
 * Supports revenue, donations, expenses, and transfers.
 */

// POST - Log a transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      app_slug,
      external_transaction_id,
      transaction_type,
      amount,
      currency = 'USD',
      category,
      contact_email,
      description,
      transaction_date,
      metadata = {},
    } = body;

    // Validate required fields
    if (!app_slug || !transaction_type || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: app_slug, transaction_type, amount' },
        { status: 400 }
      );
    }

    // Validate transaction type
    const validTypes = ['revenue', 'donation', 'expense', 'transfer', 'grant'];
    if (!validTypes.includes(transaction_type)) {
      return NextResponse.json(
        { error: `Invalid transaction_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify app exists
    const { data: app, error: appError } = await supabase
      .from('app_connections')
      .select('id, app_name, transaction_tracking_enabled')
      .eq('app_slug', app_slug)
      .eq('is_active', true)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { error: `Unknown app: ${app_slug}` },
        { status: 404 }
      );
    }

    if (!app.transaction_tracking_enabled) {
      return NextResponse.json(
        { error: `Transaction tracking disabled for app: ${app_slug}` },
        { status: 403 }
      );
    }

    // Find contact if email provided
    let contactId = null;
    if (contact_email) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', contact_email)
        .single();
      
      contactId = contact?.id || null;
    }

    // Insert transaction
    const { data: transaction, error: txError } = await supabase
      .from('ecosystem_transactions')
      .insert({
        app_slug,
        external_transaction_id,
        transaction_type,
        amount,
        currency,
        category,
        contact_id: contactId,
        contact_email,
        description,
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
        metadata,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error logging transaction:', txError);
      return NextResponse.json(
        { error: 'Failed to log transaction', details: txError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      app_name: app.app_name,
      transaction_type,
      amount,
      currency,
    });

  } catch (error) {
    console.error('Ecosystem transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Query transactions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const app_slug = searchParams.get('app_slug');
    const transaction_type = searchParams.get('type');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');

    const supabase = createAdminClient();

    let query = supabase
      .from('ecosystem_transactions')
      .select(`
        id,
        app_slug,
        transaction_type,
        amount,
        currency,
        category,
        contact_email,
        description,
        transaction_date,
        created_at
      `)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    // Apply filters
    if (app_slug) {
      query = query.eq('app_slug', app_slug);
    }
    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type);
    }
    if (start_date) {
      query = query.gte('transaction_date', start_date);
    }
    if (end_date) {
      query = query.lte('transaction_date', end_date);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Calculate totals by type
    const totals: Record<string, number> = {};
    transactions?.forEach(tx => {
      totals[tx.transaction_type] = (totals[tx.transaction_type] || 0) + Number(tx.amount);
    });

    return NextResponse.json({
      transactions,
      count: transactions?.length || 0,
      totals,
    });

  } catch (error) {
    console.error('Ecosystem transactions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
