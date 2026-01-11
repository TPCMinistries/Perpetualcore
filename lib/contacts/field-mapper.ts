/**
 * Contact Field Mapper - Auto-maps imported columns to contact fields
 */

export interface ContactFieldMapping {
  sourceColumn: string;
  targetField: string;
  confidence: 'exact' | 'high' | 'medium' | 'low';
}

export interface TargetField {
  name: string;
  label: string;
  type: 'string' | 'email' | 'phone' | 'date' | 'array';
  required?: boolean;
}

// Available contact fields for mapping
export const CONTACT_FIELDS: TargetField[] = [
  { name: 'full_name', label: 'Full Name', type: 'string', required: true },
  { name: 'first_name', label: 'First Name', type: 'string' },
  { name: 'last_name', label: 'Last Name', type: 'string' },
  { name: 'nickname', label: 'Nickname', type: 'string' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'phone' },
  { name: 'company', label: 'Company', type: 'string' },
  { name: 'job_title', label: 'Job Title', type: 'string' },
  { name: 'location', label: 'Location', type: 'string' },
  { name: 'timezone', label: 'Timezone', type: 'string' },
  { name: 'how_we_met', label: 'How We Met', type: 'string' },
  { name: 'first_met_date', label: 'First Met Date', type: 'date' },
  { name: 'contact_type', label: 'Contact Type', type: 'string' },
  { name: 'relationship_strength', label: 'Relationship Strength', type: 'string' },
  { name: 'linkedin_url', label: 'LinkedIn URL', type: 'string' },
  { name: 'twitter_handle', label: 'Twitter Handle', type: 'string' },
  { name: 'website', label: 'Website', type: 'string' },
  { name: 'tags', label: 'Tags', type: 'array' },
  { name: 'skills', label: 'Skills', type: 'array' },
  { name: 'interests', label: 'Interests', type: 'array' },
  { name: 'notes', label: 'Notes', type: 'string' },
];

// Mapping rules: column name patterns → target field
const MAPPING_RULES: Record<string, { patterns: RegExp[]; confidence: 'exact' | 'high' | 'medium' }> = {
  full_name: {
    patterns: [
      /^(full[_\s]?name|name|contact[_\s]?name|display[_\s]?name)$/i,
    ],
    confidence: 'exact',
  },
  first_name: {
    patterns: [
      /^(first[_\s]?name|given[_\s]?name|firstname|fname)$/i,
    ],
    confidence: 'exact',
  },
  last_name: {
    patterns: [
      /^(last[_\s]?name|family[_\s]?name|surname|lastname|lname)$/i,
    ],
    confidence: 'exact',
  },
  nickname: {
    patterns: [
      /^(nickname|nick[_\s]?name|alias)$/i,
    ],
    confidence: 'exact',
  },
  email: {
    patterns: [
      /^(email|e[_\s-]?mail|email[_\s]?address|mail)$/i,
    ],
    confidence: 'exact',
  },
  phone: {
    patterns: [
      /^(phone|telephone|tel|mobile|cell|phone[_\s]?number)$/i,
    ],
    confidence: 'exact',
  },
  company: {
    patterns: [
      /^(company|organization|org|employer|business|company[_\s]?name)$/i,
    ],
    confidence: 'exact',
  },
  job_title: {
    patterns: [
      /^(title|job[_\s]?title|position|role|designation)$/i,
    ],
    confidence: 'exact',
  },
  location: {
    patterns: [
      /^(location|city|address|place)$/i,
    ],
    confidence: 'high',
  },
  linkedin_url: {
    patterns: [
      /^(linkedin|linkedin[_\s]?url|linkedin[_\s]?profile)$/i,
    ],
    confidence: 'exact',
  },
  twitter_handle: {
    patterns: [
      /^(twitter|twitter[_\s]?handle|twitter[_\s]?username)$/i,
    ],
    confidence: 'exact',
  },
  website: {
    patterns: [
      /^(website|url|web|homepage)$/i,
    ],
    confidence: 'high',
  },
  tags: {
    patterns: [
      /^(tags?|labels?|categories?)$/i,
    ],
    confidence: 'high',
  },
  notes: {
    patterns: [
      /^(notes?|comments?|description|memo)$/i,
    ],
    confidence: 'high',
  },
  how_we_met: {
    patterns: [
      /^(how[_\s]?we[_\s]?met|source|origin|met[_\s]?at)$/i,
    ],
    confidence: 'medium',
  },
  contact_type: {
    patterns: [
      /^(type|contact[_\s]?type|category)$/i,
    ],
    confidence: 'medium',
  },
};

/**
 * Auto-map source columns to target contact fields
 */
export function autoMapColumns(headers: string[]): ContactFieldMapping[] {
  const mappings: ContactFieldMapping[] = [];
  const usedFields = new Set<string>();

  for (const header of headers) {
    const normalizedHeader = header.trim().toLowerCase();
    let bestMatch: ContactFieldMapping | null = null;

    // Check each mapping rule
    for (const [fieldName, rule] of Object.entries(MAPPING_RULES)) {
      if (usedFields.has(fieldName)) continue;

      for (const pattern of rule.patterns) {
        if (pattern.test(normalizedHeader)) {
          bestMatch = {
            sourceColumn: header,
            targetField: fieldName,
            confidence: rule.confidence,
          };
          break;
        }
      }

      if (bestMatch) break;
    }

    if (bestMatch) {
      mappings.push(bestMatch);
      usedFields.add(bestMatch.targetField);
    } else {
      // No match found, suggest as unmapped
      mappings.push({
        sourceColumn: header,
        targetField: '',
        confidence: 'low',
      });
    }
  }

  return mappings;
}

/**
 * Apply field mappings to transform a row of data
 */
export function applyMappings(
  row: Record<string, any>,
  mappings: ContactFieldMapping[]
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const mapping of mappings) {
    if (!mapping.targetField) continue;

    const value = row[mapping.sourceColumn];
    if (value === undefined || value === null || value === '') continue;

    const field = CONTACT_FIELDS.find((f) => f.name === mapping.targetField);
    if (!field) continue;

    // Transform value based on field type
    switch (field.type) {
      case 'array':
        // Split comma-separated values into array
        if (typeof value === 'string') {
          result[mapping.targetField] = value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        } else if (Array.isArray(value)) {
          result[mapping.targetField] = value;
        }
        break;

      case 'email':
        result[mapping.targetField] = String(value).toLowerCase().trim();
        break;

      case 'phone':
        // Basic phone normalization
        result[mapping.targetField] = String(value).replace(/[^\d+\-() ]/g, '').trim();
        break;

      case 'date':
        // Try to parse date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          result[mapping.targetField] = date.toISOString().split('T')[0];
        }
        break;

      default:
        result[mapping.targetField] = String(value).trim();
    }
  }

  // Generate full_name from first + last if not mapped
  if (!result.full_name && (result.first_name || result.last_name)) {
    result.full_name = [result.first_name, result.last_name].filter(Boolean).join(' ');
  }

  return result;
}

/**
 * Validate a mapped contact has required fields
 */
export function validateMappedContact(contact: Record<string, any>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Must have at least a name or email
  if (!contact.full_name && !contact.first_name && !contact.email) {
    errors.push('Contact must have a name or email');
  }

  // Validate email format if present
  if (contact.email && !isValidEmail(contact.email)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
