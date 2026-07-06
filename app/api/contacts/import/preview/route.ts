import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseExcelBuffer } from '@/lib/excel/parser';
import { parseVCardBuffer, vCardToPreviewFormat } from '@/lib/contacts/parsers/vcard-parser';
import { autoMapColumns, CONTACT_FIELDS } from '@/lib/contacts/field-mapper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PREVIEW_ROWS = 50;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    const fileType = getFileType(fileName);

    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload CSV, Excel, or vCard files.' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    let headers: string[] = [];
    let rows: Record<string, any>[] = [];
    let totalRows = 0;

    // Parse based on file type
    if (fileType === 'vcard') {
      const result = await parseVCardBuffer(buffer);
      const preview = vCardToPreviewFormat(result.contacts);
      headers = preview.headers;
      rows = preview.rows.slice(0, MAX_PREVIEW_ROWS);
      totalRows = result.totalCount;
    } else {
      // CSV or Excel - parseExcelBuffer returns an array (one per sheet)
      const results = parseExcelBuffer(buffer, {
        maxPreviewRows: MAX_PREVIEW_ROWS,
      });

      // Use the first sheet with data
      const firstSheet = results.find(r => r.rows.length > 0) || results[0];
      if (!firstSheet || !firstSheet.headers || firstSheet.headers.length === 0) {
        return NextResponse.json(
          { error: 'No data found in file' },
          { status: 400 }
        );
      }

      headers = firstSheet.headers;
      rows = firstSheet.preview;
      totalRows = firstSheet.totalRows;
    }

    // Auto-map columns to contact fields
    const suggestedMappings = autoMapColumns(headers);

    // Get available target fields
    const targetFields = CONTACT_FIELDS.map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      required: f.required || false,
    }));

    return NextResponse.json({
      success: true,
      fileType,
      fileName: file.name,
      headers,
      preview: rows,
      totalRows,
      suggestedMappings,
      targetFields,
    });
  } catch (error) {
    console.error('Error parsing import file:', error);
    return NextResponse.json(
      { error: 'Failed to parse file. Please check the file format.' },
      { status: 500 }
    );
  }
}

function getFileType(fileName: string): 'csv' | 'excel' | 'vcard' | null {
  if (fileName.endsWith('.csv')) return 'csv';
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return 'excel';
  if (fileName.endsWith('.vcf') || fileName.endsWith('.vcard')) return 'vcard';
  return null;
}
