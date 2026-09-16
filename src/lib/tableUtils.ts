import * as XLSX from 'xlsx';

export interface ExcelTableData {
  headers: string[];
  rows: string[][];
}

export const TABLE_JSON_PREFIX = '___EXCEL_TABLE_JSON___:';

/**
 * Checks if a string represents an encoded Excel table
 */
export const isTableContent = (content?: string): boolean => {
  if (!content) return false;
  const trimmed = content.trim();
  if (trimmed.startsWith(TABLE_JSON_PREFIX)) return true;
  if (trimmed.startsWith('{"type":"excel_table"') || trimmed.startsWith('{"type":"table"')) return true;
  return false;
};

/**
 * Parses table content from string to ExcelTableData
 */
export const parseTableContent = (content?: string): ExcelTableData | null => {
  if (!content) return null;
  const trimmed = content.trim();

  try {
    if (trimmed.startsWith(TABLE_JSON_PREFIX)) {
      const jsonStr = trimmed.slice(TABLE_JSON_PREFIX.length);
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
        return {
          headers: parsed.headers.map((h: any) => String(h || '')),
          rows: parsed.rows.map((row: any[]) =>
            Array.isArray(row) ? row.map((cell) => String(cell || '')) : []
          ),
        };
      }
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (
        (parsed.type === 'excel_table' || parsed.type === 'table') &&
        Array.isArray(parsed.headers) &&
        Array.isArray(parsed.rows)
      ) {
        return {
          headers: parsed.headers.map((h: any) => String(h || '')),
          rows: parsed.rows.map((row: any[]) =>
            Array.isArray(row) ? row.map((cell) => String(cell || '')) : []
          ),
        };
      }
    }
  } catch {
    // If parsing fails, return null
  }

  return null;
};

/**
 * Serializes ExcelTableData into a standard string representation
 */
export const serializeTableContent = (table: ExcelTableData): string => {
  const cleanHeaders = table.headers && table.headers.length > 0 ? table.headers : ['Columna 1', 'Columna 2'];
  const colCount = cleanHeaders.length;

  const cleanRows = (table.rows || []).map((r) => {
    const row = [...r];
    while (row.length < colCount) row.push('');
    return row.slice(0, colCount);
  });

  const payload = {
    type: 'excel_table',
    headers: cleanHeaders,
    rows: cleanRows,
  };

  return `${TABLE_JSON_PREFIX}${JSON.stringify(payload)}`;
};

/**
 * Converts TableData to Tab-Separated Values (TSV) - directly pasteable into Microsoft Excel & Google Sheets
 */
export const tableToTSV = (table: ExcelTableData): string => {
  const lines: string[] = [];
  lines.push((table.headers || []).join('\t'));
  for (const row of table.rows || []) {
    lines.push(row.join('\t'));
  }
  return lines.join('\n');
};

/**
 * Converts TableData to CSV string
 */
export const tableToCSV = (table: ExcelTableData): string => {
  const escapeCsv = (val: string) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [];
  lines.push((table.headers || []).map(escapeCsv).join(','));
  for (const row of table.rows || []) {
    lines.push(row.map(escapeCsv).join(','));
  }
  return lines.join('\n');
};

/**
 * Exports TableData to a genuine binary Microsoft Excel .xlsx file
 */
export const exportTableToXLSX = (title: string, table: ExcelTableData): void => {
  try {
    const sheetData = [table.headers || [], ...(table.rows || [])];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Auto-fit column widths
    const colWidths = (table.headers || []).map((header, colIdx) => {
      let maxLen = (header || '').length;
      (table.rows || []).forEach((row) => {
        const cell = String(row[colIdx] || '');
        if (cell.length > maxLen) maxLen = cell.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    const sheetName = (title || 'Datos').replace(/[\\/*?:[\]]/g, '').slice(0, 30) || 'Datos';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const safeTitle = (title || 'tabla_datos').replace(/[^a-zA-Z0-9_\-\u00C0-\u017F]/g, '_').toLowerCase();
    const fileName = `${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, fileName);
  } catch (err) {
    console.error('Error al exportar XLSX:', err);
    // Fallback to CSV if XLSX fails
    exportTableToCSV(title, table);
  }
};

/**
 * Exports TableData to a standard UTF-8 CSV file with BOM for Microsoft Excel compatibility
 */
export const exportTableToCSV = (title: string, table: ExcelTableData): void => {
  const csvContent = tableToCSV(table);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = (title || 'tabla_datos').replace(/[^a-zA-Z0-9_\-\u00C0-\u017F]/g, '_').toLowerCase();
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Natural comparator for sorting numbers, strings, and dates
 */
export const naturalCompare = (a: string, b: string): number => {
  const cleanA = (a || '').trim();
  const cleanB = (b || '').trim();

  // Numeric comparison
  const numA = Number(cleanA);
  const numB = Number(cleanB);
  if (!isNaN(numA) && !isNaN(numB) && cleanA !== '' && cleanB !== '') {
    return numA - numB;
  }

  // Date comparison
  const dateA = Date.parse(cleanA);
  const dateB = Date.parse(cleanB);
  if (!isNaN(dateA) && !isNaN(dateB) && cleanA.length >= 8 && cleanB.length >= 8) {
    return dateA - dateB;
  }

  // Standard locale comparison
  return cleanA.localeCompare(cleanB, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Parses raw pasted text from Excel, Google Sheets, TSV, or CSV into ExcelTableData
 */
export const parseRawSpreadsheetText = (rawText: string): ExcelTableData | null => {
  if (!rawText || !rawText.trim()) return null;

  const lines = rawText.trim().split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  // Determine separator: Tab '\t', Semicolon ';', or Comma ','
  const firstLine = lines[0];
  let separator = '\t';
  if (firstLine.includes('\t')) {
    separator = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes('\t')) {
    separator = ';';
  } else if (firstLine.includes(',') && !firstLine.includes('\t')) {
    separator = ',';
  }

  const parsedMatrix = lines.map((line) => {
    if (separator === ',') {
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const row: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        let val = match[1] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        row.push(val.trim());
        if (regex.lastIndex >= line.length) break;
      }
      return row.filter((_, i, arr) => i < arr.length);
    } else {
      return line.split(separator).map((cell) => cell.trim());
    }
  });

  if (parsedMatrix.length === 0) return null;

  const maxCols = Math.max(...parsedMatrix.map((r) => r.length), 1);

  const headers = parsedMatrix[0];
  while (headers.length < maxCols) {
    headers.push(`Columna ${headers.length + 1}`);
  }

  const rows = parsedMatrix.slice(1).map((r) => {
    const row = [...r];
    while (row.length < maxCols) row.push('');
    return row;
  });

  if (parsedMatrix.length === 1) {
    return {
      headers: parsedMatrix[0].map((_, idx) => `Columna ${idx + 1}`),
      rows: [parsedMatrix[0]],
    };
  }

  return {
    headers: headers.map((h, i) => h || `Columna ${i + 1}`),
    rows: rows.length > 0 ? rows : [['', ...Array(maxCols - 1).fill('')]],
  };
};

/**
 * Formats table into a clean human-readable WhatsApp text message
 */
export const tableToWhatsAppText = (title: string, table: ExcelTableData): string => {
  let msg = `🔑 *${title.toUpperCase()}*\n`;
  msg += `📊 _Tabla de Datos:_\n\n`;

  // Format headers
  msg += `*${(table.headers || []).join(' | ')}*\n`;
  msg += `─────────────────────\n`;

  // Format rows
  (table.rows || []).forEach((row, i) => {
    const nonEmpties = row.filter((c) => c && c.trim().length > 0);
    if (nonEmpties.length > 0) {
      msg += `${i + 1}. ${row.join('  •  ')}\n`;
    }
  });

  return msg.trim();
};

/**
 * Predefined Quick Table Templates
 */
export const TABLE_TEMPLATES = [
  {
    id: 'passwords',
    name: '🔑 Claves & Accesos',
    desc: 'Servicio, Usuario, Contraseña, Notas',
    table: {
      headers: ['Servicio / App', 'Usuario / Correo', 'Contraseña / PIN', 'Detalles / Enlace'],
      rows: [
        ['', '', '', ''],
        ['', '', '', ''],
      ],
    },
  },
  {
    id: 'banking',
    name: '💳 Cuentas & Códigos PIN',
    desc: 'Banco, Titular, Nro Cuenta, PIN / ATM',
    table: {
      headers: ['Banco / Entidad', 'Titular', 'Nro Cuenta / Tarjeta', 'PIN / Clave ATM', 'Notas'],
      rows: [
        ['', '', '', '', ''],
        ['', '', '', '', ''],
      ],
    },
  },
  {
    id: 'tramites',
    name: '📄 Trámites & Documentos',
    desc: 'Concepto, Nro Referencia, Fecha, Estado',
    table: {
      headers: ['Concepto / Documento', 'Nro Referencia / Folio', 'Fecha / Vencimiento', 'Estado / Observación'],
      rows: [
        ['', '', '', ''],
        ['', '', '', ''],
      ],
    },
  },
  {
    id: 'wifi_devices',
    name: '📡 WiFi & Dispositivos',
    desc: 'Dispositivo / Red, IP / Usuario, Clave, Ubicación',
    table: {
      headers: ['Dispositivo / Red WiFi', 'IP / Usuario', 'Contraseña de Acceso', 'Ubicación / Notas'],
      rows: [
        ['', '', '', ''],
        ['', '', '', ''],
      ],
    },
  },
  {
    id: 'custom_3x3',
    name: '📊 Tabla Libre (3x3)',
    desc: '3 Columnas y 3 Filas configurables',
    table: {
      headers: ['Columna 1', 'Columna 2', 'Columna 3'],
      rows: [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ],
    },
  },
];
