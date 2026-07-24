import ExcelJS from "exceljs";

export interface ParsedExcelData {
  headers: string[];
  rows: Record<string, unknown>[];
  sheetName: string;
  totalRows: number;
  preview: Record<string, unknown>[];
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
export async function parseExcelBuffer(
  buffer: ArrayBuffer | Buffer,
  options: ExcelParseOptions = {}
): Promise<ParsedExcelData[]> {
  const {
    sheetIndex,
    sheetName,
    headerRow = 0,
    maxPreviewRows = 10,
    dateFields = [],
  } = options;

  const nodeBuffer = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(buffer);

  if (!isXlsxBuffer(nodeBuffer)) {
    return parseDelimitedBuffer(nodeBuffer, {
      sheetName: sheetName ?? "CSV",
      headerRow,
      maxPreviewRows,
      dateFields,
    });
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(nodeBuffer);

  const results: ParsedExcelData[] = [];

  // Determine which sheets to process
  let worksheetsToProcess = workbook.worksheets;
  if (sheetName) {
    const namedSheet = workbook.getWorksheet(sheetName);
    worksheetsToProcess = namedSheet ? [namedSheet] : [];
  } else if (sheetIndex !== undefined) {
    const indexedSheet = workbook.worksheets[sheetIndex];
    worksheetsToProcess = indexedSheet ? [indexedSheet] : [];
  }

  for (const worksheet of worksheetsToProcess) {
    const rawData: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values: unknown[] = [];
      for (let col = 1; col <= worksheet.columnCount; col++) {
        values.push(normalizeCellValue(row.getCell(col).value));
      }
      rawData.push(values);
    });

    if (rawData.length <= headerRow) {
      results.push({
        headers: [],
        rows: [],
        sheetName: worksheet.name,
        totalRows: 0,
        preview: [],
      });
      continue;
    }

    // Extract headers
    const headers = rawData[headerRow].map((h, i) =>
      String(h || `Column_${i + 1}`).trim()
    );

    // Extract data rows
    const rows: Record<string, unknown>[] = [];
    for (let i = headerRow + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.every((cell) => !cell)) continue; // Skip empty rows

      const rowData: Record<string, unknown> = {};
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
      sheetName: worksheet.name,
      totalRows: rows.length,
      preview: rows.slice(0, maxPreviewRows),
    });
  }

  return results;
}

/**
 * Parse an Excel date value
 */
function parseExcelDate(value: unknown): Date | null {
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
export async function getSheetNames(buffer: ArrayBuffer | Buffer): Promise<string[]> {
  const nodeBuffer = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(buffer);
  if (!isXlsxBuffer(nodeBuffer)) return ["CSV"];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(nodeBuffer);
  return workbook.worksheets.map((worksheet) => worksheet.name);
}

/**
 * Infer column types from data
 */
export function inferColumnTypes(
  data: Record<string, unknown>[]
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
  default?: unknown;
  transform?: (value: unknown) => unknown;
}

export function transformData(
  rows: Record<string, unknown>[],
  mappings: ColumnMapping[]
): { data: Record<string, unknown>[]; errors: string[] } {
  const data: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const transformed: Record<string, unknown> = {};
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

function isXlsxBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

function normalizeCellValue(value: ExcelJS.CellValue): unknown {
  if (value == null) return "";
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return normalizeCellValue(value.result as ExcelJS.CellValue);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("hyperlink" in value && typeof value.hyperlink === "string") return value.hyperlink;
  }
  return String(value);
}

function parseDelimitedBuffer(
  buffer: Buffer,
  options: Required<Pick<ExcelParseOptions, "headerRow" | "maxPreviewRows" | "dateFields">> & {
    sheetName: string;
  },
): ParsedExcelData[] {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(text);
  const rawData = parseDelimitedRows(text, delimiter);

  if (rawData.length <= options.headerRow) {
    return [{
      headers: [],
      rows: [],
      sheetName: options.sheetName,
      totalRows: 0,
      preview: [],
    }];
  }

  const headers = rawData[options.headerRow].map((h, i) =>
    String(h || `Column_${i + 1}`).trim(),
  );
  const rows: Record<string, unknown>[] = [];

  for (let i = options.headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.every((cell) => !cell)) continue;
    const rowData: Record<string, unknown> = {};
    headers.forEach((header, j) => {
      let value: unknown = row[j] ?? "";
      if (options.dateFields.includes(header) && value) {
        const parsed = parseExcelDate(value);
        if (parsed) value = parsed.toISOString();
      }
      rowData[header] = value;
    });
    rows.push(rowData);
  }

  return [{
    headers,
    rows,
    sheetName: options.sheetName,
    totalRows: rows.length,
    preview: rows.slice(0, options.maxPreviewRows),
  }];
}

function detectDelimiter(text: string): "," | "\t" | ";" {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates: Array<"," | "\t" | ";"> = [",", "\t", ";"];
  return candidates.reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length
      ? candidate
      : best,
  );
}

function parseDelimitedRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === delimiter && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
