import ExcelJS from "exceljs";

function parseCsvBuffer(fileBuffer) {
  const text = fileBuffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error("Il file CSV non contiene dati");
  }

  const parseCsvLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === "," || ch === ";") {
          result.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  };

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  if (headers.length === 0 || headers.every((h) => !h)) {
    throw new Error("Il file CSV non contiene intestazioni valide");
  }

  const columns = headers.map((h, i) => h || `col_${i + 1}`);

  const jsonData = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const rowData = {};
    columns.forEach((col, idx) => {
      const val = values[idx]?.trim();
      rowData[col] = val === undefined || val === "" ? null : val;
    });
    jsonData.push(rowData);
  }

  return { columns, jsonData };
}

export async function parseExcelFile(fileBuffer, originalName) {
  try {
    const isCsv = originalName && originalName.toLowerCase().endsWith(".csv");

    let cleanColumns;
    let jsonData;

    if (isCsv) {
      const result = parseCsvBuffer(fileBuffer);
      cleanColumns = result.columns;
      jsonData = result.jsonData;
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);

      const sheet = workbook.worksheets[0];
      if (!sheet) {
        throw new Error("Il file Excel non contiene fogli");
      }

      const headerRow = sheet.getRow(1);
      const columns = [];
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        columns[colNumber] = cell.value?.toString() || `col_${colNumber}`;
      });

      if (columns.length === 0) {
        throw new Error("Il file Excel non contiene dati");
      }

      jsonData = [];
      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const colName = columns[colNumber];
          if (colName) {
            let value = cell.value;
            if (value && typeof value === "object") {
              if (value.result !== undefined) value = value.result;
              else if (value.text) value = value.text;
              else if (value instanceof Date) value = value.toISOString();
            }
            rowData[colName] = value ?? null;
          }
        });

        columns.forEach((col) => {
          if (col && !(col in rowData)) {
            rowData[col] = null;
          }
        });

        jsonData.push(rowData);
      });

      cleanColumns = columns.filter(Boolean);
    }

    if (jsonData.length === 0) {
      throw new Error("Il file non contiene dati");
    }

    const sanitizedColumns = cleanColumns.map((col) =>
      col
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/^(\d)/, "col_$1")
        .substring(0, 63)
    );

    const columnMapping = {};
    cleanColumns.forEach((col, idx) => {
      columnMapping[col] = sanitizedColumns[idx];
    });

    const sanitizedRows = jsonData.map((row) => {
      const newRow = {};
      Object.keys(row).forEach((key) => {
        if (columnMapping[key]) {
          newRow[columnMapping[key]] = row[key];
        }
      });
      return newRow;
    });

    return {
      columns: sanitizedColumns,
      originalColumns: cleanColumns,
      columnMapping,
      rows: sanitizedRows,
      rowCount: sanitizedRows.length,
    };
  } catch (error) {
    console.error("FILE PARSE ERROR:", error);
    throw new Error(`Errore nel parsing del file: ${error.message}`);
  }
}

function inferColumnType(rows, colName) {
  const values = rows.map((r) => r[colName]).filter((v) => v != null && v !== '');
  if (values.length === 0) return 'TEXT';

  const allNumeric = values.every((v) => {
    if (typeof v === 'number') return true;
    if (typeof v === 'string') return /^-?\d+(\.\d+)?$/.test(v.trim());
    return false;
  });
  if (allNumeric) {
    const hasDecimal = values.some((v) =>
      typeof v === 'number' ? !Number.isInteger(v) : /\./.test(String(v))
    );
    return hasDecimal ? 'NUMERIC' : 'BIGINT';
  }

  const allDates = values.every((v) => v instanceof Date || (typeof v === 'string' && !isNaN(Date.parse(v)) && /^\d{4}-\d{2}/.test(v)));
  if (allDates) return 'TIMESTAMPTZ';

  const allBool = values.every((v) => typeof v === 'boolean' || (typeof v === 'string' && /^(true|false)$/i.test(v.trim())));
  if (allBool) return 'BOOLEAN';

  return 'TEXT';
}

export function generateCreateTableSQL(tableName, columns, rows = []) {
  const columnDefinitions = columns
    .map((col) => `${col} ${inferColumnType(rows, col)}`)
    .join(",\n    ");

  return `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      row_id SERIAL PRIMARY KEY,
      ${columnDefinitions}
    )
  `;
}

export function generateInsertSQL(tableName, columns, rows) {
  const placeholders = rows
    .map(
      (_, rowIdx) =>
        `(${columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`).join(", ")})`
    )
    .join(",\n    ");

  const values = rows.flatMap((row) => columns.map((col) => row[col]));

  const sql = `
    INSERT INTO ${tableName} (${columns.join(", ")})
    VALUES ${placeholders}
  `;

  return { sql, values };
}
