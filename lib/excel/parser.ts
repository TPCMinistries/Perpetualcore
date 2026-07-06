import * as XLSX from "xlsx";

export interface ParsedExcelData {
  headers: string[];
  rows: Record<string, any>[];
  sheetName: string;
  totalRows: number;
  preview: Record<string, any>[];
}

export interface ExcelParseOptions {
  sheetIndex?: number;
  sheetName?: string;
  headerRow?: number;
  maxPreviewRows?: number;
  dateFields?: string[];
}

/**
 * Parse an Excel file buffer into structured data
 */
export function parseExcelBuffer(
  buffer: ArrayBuffer,
  options: ExcelParseOptions = {}
): ParsedExcelData[] {
  const {
    sheetIndex,
    sheetName,
    headerRow = 0,
    maxPreviewRows = 10,
    dateFields = [],
  } = options;

  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const results: ParsedExcelData[] = [];

  // Determine which sheets to process
  let sheetsToProcess = workbook.SheetNames;
  if (sheetName) {
    sheetsToProcess = [sheetName];
  } else if (sheetIndex !== undefined) {
    sheetsToProcess = [workbook.SheetNames[sheetIndex]];
  }

  for (const name of sheetsToProcess) {
    const worksheet = workbook.Sheets[name];
    if (!worksheet) continue;

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as any[][];

    if (rawData.length <= headerRow) {
      results.push({
        headers: [],
        rows: [],
        sheetName: name,
        totalRows: 0,
        preview: [],
      });
      continue;
    }

    // Extract headers
    const headers = (rawData[headerRow] as string[]).map((h, i) =>
      String(h || `Column_${i + 1}`).trim()
    );

    // Extract data rows
    const rows: Record<string, any>[] = [];
    for (let i = headerRow + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.every((cell) => !cell)) continue; // Skip empty rows

      const rowData: Record<string, any> = {};
      headers.forEach((header, j) => {
        let value = row[j];

        // Handle date fields
        if (dateFields.includes(header) && value) {
          const parsed = parseExcelDate(value);
          if (parsed) value = parsed.toISOString();
        }

        rowData[header] = value;
      });
      rows.push(rowData);
    }

    results.push({
      headers,
      rows,
      sheetName: name,
      totalRows: rows.length,
      preview: rows.slice(0, maxPreviewRows),
    });
  }

  return results;
}

/**
 * Parse an Excel date value
 */
function parseExcelDate(value: any): Date | null {
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    // Excel serial date
    const utcDays = Math.floor(value - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Get sheet names from an Excel file
 */
export function getSheetNames(buffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  return workbook.SheetNames;
}

/**
 * Infer column types from data
 */
export function inferColumnTypes(
  data: Record<string, any>[]
): Record<string, "string" | "number" | "boolean" | "date" | "mixed"> {
  const types: Record<string, Set<string>> = {};

  for (const row of data) {
    for (const [key, value] of Object.entries(row)) {
      if (!types[key]) types[key] = new Set();

      if (value === null || value === undefined || value === "") {
        continue;
      }

      if (typeof value === "number" && !isNaN(value)) {
        types[key].add("number");
      } else if (typeof value === "boolean") {
        types[key].add("boolean");
      } else if (value instanceof Date) {
        types[key].add("date");
      } else if (typeof value === "string") {
        // Check if it looks like a date
        const dateMatch = /^\d{4}-\d{2}-\d{2}/.test(value);
        if (dateMatch) {
          types[key].add("date");
        } else if (/^-?\d+\.?\d*$/.test(value)) {
          types[key].add("number");
        } else if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
          types[key].add("boolean");
        } else {
          types[key].add("string");
        }
      }
    }
  }

  const result: Record<string, "string" | "number" | "boolean" | "date" | "mixed"> = {};
  for (const [key, typeSet] of Object.entries(types)) {
    if (typeSet.size === 0) {
      result[key] = "string";
    } else if (typeSet.size === 1) {
      result[key] = typeSet.values().next().value as any;
    } else {
      result[key] = "mixed";
    }
  }

  return result;
}

/**
 * Validate and transform data according to a schema
 */
export interface ColumnMapping {
  source: string;
  target: string;
  type?: "string" | "number" | "boolean" | "date";
  required?: boolean;
  default?: any;
  transform?: (value: any) => any;
}

export function transformData(
  rows: Record<string, any>[],
  mappings: ColumnMapping[]
): { data: Record<string, any>[]; errors: string[] } {
  const data: Record<string, any>[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const transformed: Record<string, any> = {};
    let hasError = false;

    for (const mapping of mappings) {
      const sourceValue = row[mapping.source];
      let value = sourceValue;

      // Apply default if empty
      if (value === null || value === undefined || value === "") {
        if (mapping.required) {
          errors.push(`Row ${i + 1}: Required field "${mapping.source}" is empty`);
          hasError = true;
          continue;
        }
        value = mapping.default ?? null;
      }

      // Apply type conversion
      if (value !== null && mapping.type) {
        try {
          switch (mapping.type) {
            case "number":
              value = Number(value);
              if (isNaN(value)) throw new Error("Invalid number");
              break;
            case "boolean":
              value = String(value).toLowerCase() === "true" || value === "1" || value === 1;
              break;
            case "date":
              const date = new Date(value);
              if (isNaN(date.getTime())) throw new Error("Invalid date");
              value = date.toISOString();
              break;
          }
        } catch (e) {
          errors.push(`Row ${i + 1}: Cannot convert "${mapping.source}" to ${mapping.type}`);
          hasError = true;
          continue;
        }
      }

      // Apply custom transform
      if (mapping.transform && value !== null) {
        try {
          value = mapping.transform(value);
        } catch (e) {
          errors.push(`Row ${i + 1}: Transform failed for "${mapping.source}"`);
          hasError = true;
          continue;
        }
      }

      transformed[mapping.target] = value;
    }

    if (!hasError) {
      data.push(transformed);
    }
  }

  return { data, errors };
}
