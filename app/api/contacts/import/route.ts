import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mergeContacts } from '@/lib/contacts/duplicate-detector';
import { Contact } from '@/types/contacts';
import { logActivity } from '@/lib/activity-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImportRequest {
  contacts: Partial<Contact>[];
  duplicateDecisions: Record<number, 'skip' | 'merge' | 'create'>;
  duplicateExistingIds: Record<number, string>;
  defaultTags?: string[];
  source: 'csv' | 'excel' | 'vcard' | 'google' | 'outlook';
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  merged: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    const body: ImportRequest = await req.json();
    const {
      contacts,
      duplicateDecisions = {},
      duplicateExistingIds = {},
      defaultTags = [],
      source = 'csv',
    } = body;

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: 'Invalid contacts data' }, { status: 400 });
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      merged: 0,
      failed: 0,
      errors: [],
    };

    // Process each contact
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const decision = duplicateDecisions[i];
      const existingId = duplicateExistingIds[i];

      try {
        // Validate minimum required fields
        if (!contact.full_name && !contact.email) {
          result.errors.push({ row: i, message: 'Missing name or email' });
          result.failed++;
          continue;
        }

        // Add default tags if specified
        if (defaultTags.length > 0) {
          contact.tags = [...new Set([...(contact.tags || []), ...defaultTags])];
        }

        // Handle based on duplicate decision
        if (decision === 'skip') {
          result.skipped++;
          continue;
        }

        if (decision === 'merge' && existingId) {
          // Fetch existing contact
          const { data: existing } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', existingId)
            .eq('user_id', user.id)
            .single();

          if (existing) {
            // Merge contacts
            const merged = mergeContacts(existing, contact, 'merge_arrays');

            const { error: updateError } = await supabase
              .from('contacts')
              .update({
                ...merged,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingId);

            if (updateError) {
              throw updateError;
            }

            result.merged++;
            continue;
          }
        }

        // Parse full_name into first_name and last_name
        let firstName = contact.first_name;
        let lastName = contact.last_name;

        if (!firstName && contact.full_name) {
          const nameParts = contact.full_name.trim().split(/\s+/);
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ') || null;
        }

        if (!firstName) {
          firstName = contact.email?.split('@')[0] || 'Unknown';
        }

        // Create new contact (either no duplicate or decision is 'create')
        const { error: insertError } = await supabase.from('contacts').insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName || null,
          email: contact.email || null,
          phone: contact.phone || null,
          company: contact.company || null,
          job_title: contact.job_title || null,
          city: contact.location || null,
          timezone: contact.timezone || null,
          contact_type: contact.contact_type || 'contact',
          relationship_strength: 50,
          relationship_status: 'active',
          linkedin_url: contact.linkedin_url || null,
          tags: contact.tags || [],
          source: source,
          source_details: `Imported from ${source} file`,
          notes: contact.notes || null,
          custom_fields: contact.custom_fields || {},
        });

        if (insertError) {
          throw insertError;
        }

        result.imported++;
      } catch (error: any) {
        result.errors.push({
          row: i,
          message: error.message || 'Unknown error',
        });
        result.failed++;
      }
    }

    // Log the import activity
    try {
      await logActivity({
        supabase,
        userId: user.id,
        action: 'uploaded',
        entityType: 'contact',
        entityId: 'import-batch',
        entityName: `${result.imported} contacts from ${source}`,
        metadata: {
          source,
          total: contacts.length,
          imported: result.imported,
          merged: result.merged,
          skipped: result.skipped,
          failed: result.failed,
        },
      });
    } catch (e) {
      // Don't fail the import if activity logging fails
      console.error('Failed to log import activity:', e);
    }

    result.success = result.failed === 0;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing contacts:', error);
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    );
  }
}
