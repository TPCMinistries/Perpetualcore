/**
 * vCard Parser - Parses vCard 3.0/4.0 format files
 * Supports standard vCard properties like FN, EMAIL, TEL, ORG, TITLE, etc.
 */

export interface VCardContact {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  location?: string;
  notes?: string;
  avatar_url?: string;
  // Additional emails/phones stored here
  additional_emails?: string[];
  additional_phones?: string[];
}

export interface VCardParseResult {
  contacts: VCardContact[];
  totalCount: number;
  errors: { line: number; message: string }[];
}

/**
 * Parse a vCard file buffer into contact objects
 */
export function parseVCard(content: string): VCardParseResult {
  const contacts: VCardContact[] = [];
  const errors: { line: number; message: string }[] = [];

  // Split into individual vCards
  const vcardBlocks = content.split(/(?=BEGIN:VCARD)/i);

  for (const block of vcardBlocks) {
    if (!block.trim()) continue;

    // Check if it's a valid vCard block
    if (!block.toUpperCase().includes('BEGIN:VCARD')) continue;
    if (!block.toUpperCase().includes('END:VCARD')) {
      errors.push({ line: 0, message: 'Invalid vCard: missing END:VCARD' });
      continue;
    }

    try {
      const contact = parseVCardBlock(block);
      if (contact.full_name || contact.email || contact.phone) {
        contacts.push(contact);
      }
    } catch (err) {
      errors.push({ line: 0, message: `Failed to parse vCard: ${err}` });
    }
  }

  return {
    contacts,
    totalCount: contacts.length,
    errors,
  };
}

/**
 * Parse a single vCard block
 */
function parseVCardBlock(block: string): VCardContact {
  const contact: VCardContact = {};
  const additionalEmails: string[] = [];
  const additionalPhones: string[] = [];

  // Handle folded lines (lines that continue with whitespace)
  const unfoldedBlock = block.replace(/\r?\n[ \t]/g, '');

  // Split into lines
  const lines = unfoldedBlock.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.toUpperCase() === 'BEGIN:VCARD' || trimmed.toUpperCase() === 'END:VCARD') {
      continue;
    }

    // Parse property
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const propertyPart = trimmed.substring(0, colonIndex);
    const value = trimmed.substring(colonIndex + 1);

    // Handle property parameters (e.g., TEL;TYPE=CELL:+1234567890)
    const semicolonIndex = propertyPart.indexOf(';');
    const property = semicolonIndex === -1
      ? propertyPart.toUpperCase()
      : propertyPart.substring(0, semicolonIndex).toUpperCase();

    // Decode value if needed
    const decodedValue = decodeVCardValue(value, propertyPart);

    switch (property) {
      case 'FN':
        // Formatted name (full name)
        contact.full_name = decodedValue;
        break;

      case 'N':
        // Structured name: Last;First;Middle;Prefix;Suffix
        const nameParts = decodedValue.split(';');
        if (nameParts[0]) contact.last_name = nameParts[0];
        if (nameParts[1]) contact.first_name = nameParts[1];
        // Build full name from parts if FN not set
        if (!contact.full_name && (nameParts[0] || nameParts[1])) {
          contact.full_name = [nameParts[1], nameParts[0]].filter(Boolean).join(' ');
        }
        break;

      case 'NICKNAME':
        contact.nickname = decodedValue;
        break;

      case 'EMAIL':
        if (!contact.email) {
          contact.email = decodedValue.toLowerCase();
        } else {
          additionalEmails.push(decodedValue.toLowerCase());
        }
        break;

      case 'TEL':
        const phone = normalizePhone(decodedValue);
        if (!contact.phone) {
          contact.phone = phone;
        } else {
          additionalPhones.push(phone);
        }
        break;

      case 'ORG':
        // Organization can have multiple components separated by ;
        contact.company = decodedValue.split(';')[0];
        break;

      case 'TITLE':
        contact.job_title = decodedValue;
        break;

      case 'ADR':
        // Address: PO;Extended;Street;City;Region;Postal;Country
        const addrParts = decodedValue.split(';');
        const locationParts = [
          addrParts[3], // City
          addrParts[4], // Region/State
          addrParts[6], // Country
        ].filter(Boolean);
        if (locationParts.length > 0) {
          contact.location = locationParts.join(', ');
        }
        break;

      case 'NOTE':
        contact.notes = decodedValue;
        break;

      case 'PHOTO':
        // Only handle URL photos, not base64
        if (value.startsWith('http')) {
          contact.avatar_url = value;
        }
        break;
    }
  }

  // Add additional contacts
  if (additionalEmails.length > 0) {
    contact.additional_emails = additionalEmails;
  }
  if (additionalPhones.length > 0) {
    contact.additional_phones = additionalPhones;
  }

  return contact;
}

/**
 * Decode vCard encoded values (quoted-printable, base64, etc.)
 */
function decodeVCardValue(value: string, propertyPart: string): string {
  // Check for encoding parameter
  const upperProp = propertyPart.toUpperCase();

  if (upperProp.includes('ENCODING=QUOTED-PRINTABLE')) {
    return decodeQuotedPrintable(value);
  }

  // Handle escaped characters
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Decode quoted-printable encoding
 */
function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\r?\n/g, '') // Remove soft line breaks
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

/**
 * Normalize phone number format
 */
function normalizePhone(phone: string): string {
  // Remove common formatting characters but keep + for international
  return phone
    .replace(/[^\d+]/g, '')
    .replace(/^\+1(\d{10})$/, '+1$1'); // Keep US format
}

/**
 * Parse vCard from a file buffer
 */
export async function parseVCardBuffer(buffer: Buffer): Promise<VCardParseResult> {
  // Try to detect encoding and convert to string
  const content = buffer.toString('utf-8');
  return parseVCard(content);
}

/**
 * Convert parsed vCard contacts to a format suitable for import preview
 */
export function vCardToPreviewFormat(contacts: VCardContact[]): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const headers = [
    'full_name',
    'first_name',
    'last_name',
    'email',
    'phone',
    'company',
    'job_title',
    'location',
    'notes',
  ];

  const rows = contacts.map((contact) => ({
    full_name: contact.full_name || '',
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    company: contact.company || '',
    job_title: contact.job_title || '',
    location: contact.location || '',
    notes: contact.notes || '',
  }));

  return { headers, rows };
}
