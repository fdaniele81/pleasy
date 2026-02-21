import ExcelJS from "exceljs";

export async function parseExcelFile(fileBuffer) {
  try {
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

    const jsonData = [];
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

    if (jsonData.length === 0) {
      throw new Error("Il file Excel non contiene dati");
    }

    const cleanColumns = columns.filter(Boolean);

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
    console.error("EXCEL PARSE ERROR:", error);
    throw new Error(`Errore nel parsing del file Excel: ${error.message}`);
  }
}

export function generateCreateTableSQL(tableName, columns) {
  const columnDefinitions = columns
    .map((col) => `${col} TEXT`)
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
