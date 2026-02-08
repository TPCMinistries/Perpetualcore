/**
 * Contact Duplicate Detector - Finds potential duplicate contacts
 */

import { Contact } from '@/types/contacts';

export type MatchType = 'email' | 'phone' | 'name_company' | 'name_only';
export type MatchConfidence = 'exact' | 'likely' | 'possible';

export interface DuplicateMatch {
  importRowIndex: number;
  importData: Partial<Contact>;
  existingContact: Contact;
  matchType: MatchType;
  matchConfidence: MatchConfidence;
  matchDetails: string;
}

export interface DuplicateCheckResult {
  duplicates: DuplicateMatch[];
  uniqueRows: number[];
}

/**
 * Check a list of import rows against existing contacts for duplicates
 */
export function detectDuplicates(
  importRows: Partial<Contact>[],
  existingContacts: Contact[]
): DuplicateCheckResult {
  const duplicates: DuplicateMatch[] = [];
  const uniqueRows: number[] = [];

  // Build lookup indexes for faster matching
  const emailIndex = new Map<string, Contact>();
  const phoneIndex = new Map<string, Contact>();
  const nameCompanyIndex = new Map<string, Contact>();

  for (const contact of existingContacts) {
    if (contact.email) {
      emailIndex.set(normalizeEmail(contact.email), contact);
    }
    if (contact.phone) {
      phoneIndex.set(normalizePhone(contact.phone), contact);
    }
    if (contact.full_name) {
      const key = createNameCompanyKey(contact.full_name, contact.company);
      nameCompanyIndex.set(key, contact);
    }
  }

  // Check each import row
  for (let i = 0; i < importRows.length; i++) {
    const row = importRows[i];
    let foundDuplicate = false;

    // Check email match (highest priority)
    if (row.email) {
      const normalizedEmail = normalizeEmail(row.email);
      const match = emailIndex.get(normalizedEmail);
      if (match) {
        duplicates.push({
          importRowIndex: i,
          importData: row,
          existingContact: match,
          matchType: 'email',
          matchConfidence: 'exact',
          matchDetails: `Email matches: ${row.email}`,
        });
        foundDuplicate = true;
        continue;
      }
    }

    // Check phone match
    if (row.phone) {
      const normalizedPhone = normalizePhone(row.phone);
      const match = phoneIndex.get(normalizedPhone);
      if (match) {
        duplicates.push({
          importRowIndex: i,
          importData: row,
          existingContact: match,
          matchType: 'phone',
          matchConfidence: 'exact',
          matchDetails: `Phone matches: ${row.phone}`,
        });
        foundDuplicate = true;
        continue;
      }
    }

    // Check name + company match
    if (row.full_name) {
      const key = createNameCompanyKey(row.full_name, row.company);
      const match = nameCompanyIndex.get(key);
      if (match) {
        const confidence: MatchConfidence = row.company ? 'likely' : 'possible';
        duplicates.push({
          importRowIndex: i,
          importData: row,
          existingContact: match,
          matchType: row.company ? 'name_company' : 'name_only',
          matchConfidence: confidence,
          matchDetails: row.company
            ? `Name and company match: ${row.full_name} at ${row.company}`
            : `Name matches: ${row.full_name}`,
        });
        foundDuplicate = true;
        continue;
      }
    }

    if (!foundDuplicate) {
      uniqueRows.push(i);
    }
  }

  return { duplicates, uniqueRows };
}

/**
 * Check a single contact for duplicates
 */
export function findDuplicatesForContact(
  contact: Partial<Contact>,
  existingContacts: Contact[]
): DuplicateMatch[] {
  const result = detectDuplicates([contact], existingContacts);
  return result.duplicates;
}

/**
 * Merge two contacts, preferring non-empty values from the import
 */
export function mergeContacts(
  existing: Contact,
  imported: Partial<Contact>,
  strategy: 'prefer_existing' | 'prefer_imported' | 'merge_arrays' = 'merge_arrays'
): Partial<Contact> {
  const merged: Partial<Contact> = { ...existing };

  const arrayFields = ['tags', 'skills', 'interests', 'can_help_with', 'looking_for'];

  const existingRecord = existing as Record<string, unknown>;
  const mergedRecord = merged as Record<string, unknown>;

  for (const [key, importedValue] of Object.entries(imported)) {
    if (importedValue === undefined || importedValue === null || importedValue === '') {
      continue;
    }

    const existingValue = existingRecord[key];

    // Handle array fields
    if (arrayFields.includes(key)) {
      if (strategy === 'merge_arrays') {
        const existingArray = Array.isArray(existingValue) ? existingValue : [];
        const importedArray = Array.isArray(importedValue) ? importedValue : [];
        mergedRecord[key] = [...new Set([...existingArray, ...importedArray])];
      } else if (strategy === 'prefer_imported') {
        mergedRecord[key] = importedValue;
      }
      // prefer_existing keeps the existing value (no change)
      continue;
    }

    // Handle other fields
    if (strategy === 'prefer_imported') {
      mergedRecord[key] = importedValue;
    } else if (strategy === 'prefer_existing') {
      // Only use imported if existing is empty
      if (!existingValue) {
        mergedRecord[key] = importedValue;
      }
    } else {
      // Default: prefer non-empty, imported wins ties
      if (!existingValue) {
        mergedRecord[key] = importedValue;
      }
    }
  }

  return merged;
}

// Helper functions

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Remove leading +1 for US numbers to normalize
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    return cleaned.substring(2);
  }
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return cleaned.substring(1);
  }
  return cleaned;
}

function createNameCompanyKey(name: string, company?: string | null): string {
  const normalizedName = name.toLowerCase().trim();
  const normalizedCompany = company?.toLowerCase().trim() || '';
  return `${normalizedName}|${normalizedCompany}`;
}

/**
 * Calculate similarity score between two strings (0-1)
 * Used for fuzzy matching
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Use Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}
