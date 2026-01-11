import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectDuplicates, DuplicateMatch } from '@/lib/contacts/duplicate-detector';
import { Contact } from '@/types/contacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contacts } = body as { contacts: Partial<Contact>[] };

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: 'Invalid contacts data' }, { status: 400 });
    }

    // Fetch existing contacts for this user
    const { data: existingContacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    // Detect duplicates
    const result = detectDuplicates(contacts, existingContacts || []);

    // Transform duplicates for response
    const duplicates = result.duplicates.map((d: DuplicateMatch) => ({
      importRowIndex: d.importRowIndex,
      importData: d.importData,
      existingContact: {
        id: d.existingContact.id,
        full_name: d.existingContact.full_name,
        email: d.existingContact.email,
        phone: d.existingContact.phone,
        company: d.existingContact.company,
        job_title: d.existingContact.job_title,
      },
      matchType: d.matchType,
      matchConfidence: d.matchConfidence,
      matchDetails: d.matchDetails,
    }));

    return NextResponse.json({
      success: true,
      duplicates,
      uniqueRowIndices: result.uniqueRows,
      stats: {
        totalImportRows: contacts.length,
        duplicatesFound: duplicates.length,
        uniqueRows: result.uniqueRows.length,
      },
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
}
