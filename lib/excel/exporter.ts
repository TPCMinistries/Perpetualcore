import ExcelJS from "exceljs";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
  format?: (value: any) => any;
}

export interface ExportOptions {
  sheetName?: string;
  columns?: ExportColumn[];
  title?: string;
  subtitle?: string;
  headerStyle?: Partial<ExcelJS.Style>;
  includeTimestamp?: boolean;
  freezeHeader?: boolean;
  autoFilter?: boolean;
}

const DEFAULT_HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: "FFFFFF" } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "4F46E5" } },
  alignment: { horizontal: "center", vertical: "middle" },
  border: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  },
};

/**
 * Export data to Excel buffer
 */
export async function exportToExcel(
  data: Record<string, any>[],
  options: ExportOptions = {}
): Promise<Buffer> {
  const {
    sheetName = "Sheet1",
    columns,
    title,
    subtitle,
    headerStyle = DEFAULT_HEADER_STYLE,
    includeTimestamp = true,
    freezeHeader = true,
    autoFilter = true,
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Perpetual Core";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);

  // Track starting row for data
  let startRow = 1;

  // Add title if provided
  if (title) {
    const titleRow = worksheet.addRow([title]);
    titleRow.font = { bold: true, size: 16 };
    titleRow.height = 24;
    startRow++;

    if (subtitle) {
      const subtitleRow = worksheet.addRow([subtitle]);
      subtitleRow.font = { italic: true, size: 11, color: { argb: "666666" } };
      startRow++;
    }

    // Add timestamp
    if (includeTimestamp) {
      const timestampRow = worksheet.addRow([
        `Generated: ${new Date().toLocaleString()}`,
      ]);
      timestampRow.font = { size: 10, color: { argb: "888888" } };
      startRow++;
    }

    // Empty row
    worksheet.addRow([]);
    startRow++;
  }

  // Determine columns
  let exportColumns: ExportColumn[];
  if (columns) {
    exportColumns = columns;
  } else if (data.length > 0) {
    // Auto-generate columns from first row
    exportColumns = Object.keys(data[0]).map((key) => ({
      header: formatHeader(key),
      key,
      width: Math.max(formatHeader(key).length + 2, 12),
    }));
  } else {
    exportColumns = [];
  }

  // Set up worksheet columns
  worksheet.columns = exportColumns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
    style: col.style,
  }));

  // Style header row
  const headerRowNum = startRow;
  const headerRow = worksheet.getRow(headerRowNum);
  headerRow.eachCell((cell) => {
    Object.assign(cell, { style: headerStyle });
  });
  headerRow.height = 22;

  // Add data rows
  for (const row of data) {
    const values: any[] = [];
    for (const col of exportColumns) {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value);
      }
      values.push(value ?? "");
    }
    worksheet.addRow(values);
  }

  // Freeze header row
  if (freezeHeader) {
    worksheet.views = [{ state: "frozen", ySplit: headerRowNum }];
  }

  // Add auto-filter
  if (autoFilter && data.length > 0) {
    const lastCol = String.fromCharCode(64 + exportColumns.length);
    const lastRow = headerRowNum + data.length;
    worksheet.autoFilter = {
      from: { row: headerRowNum, column: 1 },
      to: { row: lastRow, column: exportColumns.length },
    };
  }

  // Apply alternating row colors for readability
  for (let i = headerRowNum + 1; i <= headerRowNum + data.length; i++) {
    if (i % 2 === 0) {
      const row = worksheet.getRow(i);
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F8FAFC" },
        };
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export multiple sheets to Excel
 */
export async function exportMultiSheet(
  sheets: {
    name: string;
    data: Record<string, any>[];
    options?: Omit<ExportOptions, "sheetName">;
  }[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Perpetual Core";
  workbook.created = new Date();

  for (const sheet of sheets) {
    const {
      columns,
      title,
      headerStyle = DEFAULT_HEADER_STYLE,
      freezeHeader = true,
      autoFilter = true,
    } = sheet.options || {};

    const worksheet = workbook.addWorksheet(sheet.name);

    let startRow = 1;

    if (title) {
      const titleRow = worksheet.addRow([title]);
      titleRow.font = { bold: true, size: 14 };
      startRow++;
      worksheet.addRow([]);
      startRow++;
    }

    // Determine columns
    let exportColumns: ExportColumn[];
    if (columns) {
      exportColumns = columns;
    } else if (sheet.data.length > 0) {
      exportColumns = Object.keys(sheet.data[0]).map((key) => ({
        header: formatHeader(key),
        key,
        width: Math.max(formatHeader(key).length + 2, 12),
      }));
    } else {
      exportColumns = [];
    }

    worksheet.columns = exportColumns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    const headerRowNum = startRow;
    const headerRow = worksheet.getRow(headerRowNum);
    headerRow.eachCell((cell) => {
      Object.assign(cell, { style: headerStyle });
    });

    for (const row of sheet.data) {
      const values: any[] = [];
      for (const col of exportColumns) {
        let value = row[col.key];
        if (col.format) {
          value = col.format(value);
        }
        values.push(value ?? "");
      }
      worksheet.addRow(values);
    }

    if (freezeHeader) {
      worksheet.views = [{ state: "frozen", ySplit: headerRowNum }];
    }

    if (autoFilter && sheet.data.length > 0) {
      worksheet.autoFilter = {
        from: { row: headerRowNum, column: 1 },
        to: { row: headerRowNum + sheet.data.length, column: exportColumns.length },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Format a key into a readable header
 */
function formatHeader(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Pre-built column configurations for common entities
 */
export const ENTITY_COLUMNS = {
  tasks: [
    { header: "Title", key: "title", width: 40 },
    { header: "Status", key: "status", width: 12 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Due Date", key: "due_date", width: 15 },
    { header: "Assignee", key: "assignee_name", width: 20 },
    { header: "Project", key: "project_name", width: 25 },
    { header: "Description", key: "description", width: 50 },
    { header: "Created", key: "created_at", width: 18 },
  ] as ExportColumn[],

  contacts: [
    { header: "First Name", key: "first_name", width: 15 },
    { header: "Last Name", key: "last_name", width: 15 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Company", key: "company", width: 25 },
    { header: "Job Title", key: "job_title", width: 20 },
    { header: "Type", key: "contact_type", width: 12 },
    { header: "Status", key: "relationship_status", width: 12 },
    { header: "Tags", key: "tags", width: 25, format: (v: any) => Array.isArray(v) ? v.join(", ") : v },
    { header: "Notes", key: "notes", width: 40 },
  ] as ExportColumn[],

  projects: [
    { header: "Name", key: "name", width: 35 },
    { header: "Stage", key: "current_stage", width: 15 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Start Date", key: "start_date", width: 15 },
    { header: "Target Date", key: "target_date", width: 15 },
    { header: "Team", key: "team_name", width: 20 },
    { header: "Type", key: "project_type", width: 15 },
    { header: "Description", key: "description", width: 50 },
  ] as ExportColumn[],
};
