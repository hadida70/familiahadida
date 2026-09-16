import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  ClipboardPaste,
  Sparkles,
  RotateCcw,
  Check,
  HelpCircle,
} from 'lucide-react';
import {
  ExcelTableData,
  TABLE_TEMPLATES,
  parseRawSpreadsheetText,
} from '../lib/tableUtils';
import { sounds } from '../lib/sound';

interface ExcelTableEditorProps {
  tableData: ExcelTableData;
  onChange: (data: ExcelTableData) => void;
  accentColor?: string;
}

export const ExcelTableEditor: React.FC<ExcelTableEditorProps> = ({
  tableData,
  onChange,
  accentColor = 'emerald',
}) => {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Headers & Rows with safe fallbacks
  const headers = tableData.headers && tableData.headers.length > 0
    ? tableData.headers
    : ['Columna 1', 'Columna 2'];
  const rows = tableData.rows && tableData.rows.length > 0
    ? tableData.rows
    : [['', '']];

  // Update a column header
  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    onChange({ headers: newHeaders, rows });
  };

  // Add a new column
  const handleAddColumn = () => {
    const newHeaders = [...headers, `Columna ${headers.length + 1}`];
    const newRows = rows.map((row) => [...row, '']);
    onChange({ headers: newHeaders, rows: newRows });
    sounds.playAddSound();
  };

  // Delete a column
  const handleDeleteColumn = (colIndex: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, idx) => idx !== colIndex);
    const newRows = rows.map((row) => row.filter((_, idx) => idx !== colIndex));
    onChange({ headers: newHeaders, rows: newRows });
    sounds.playDeleteSound();
  };

  // Update a cell value
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      const updatedRow = [...row];
      while (updatedRow.length < headers.length) updatedRow.push('');
      updatedRow[colIndex] = value;
      return updatedRow;
    });
    onChange({ headers, rows: newRows });
  };

  // Add a new row
  const handleAddRow = () => {
    const newRow = new Array(headers.length).fill('');
    onChange({ headers, rows: [...rows, newRow] });
    sounds.playAddSound();
  };

  // Delete a row
  const handleDeleteRow = (rowIndex: number) => {
    if (rows.length <= 1) {
      // Clear instead of deleting if only 1 row
      onChange({ headers, rows: [new Array(headers.length).fill('')] });
      return;
    }
    const newRows = rows.filter((_, idx) => idx !== rowIndex);
    onChange({ headers, rows: newRows });
    sounds.playDeleteSound();
  };

  // Clear all cell values
  const handleClearAll = () => {
    if (window.confirm('¿Deseas limpiar todos los datos de la tabla?')) {
      const emptyRows = [new Array(headers.length).fill('')];
      onChange({ headers, rows: emptyRows });
    }
  };

  // Apply a quick preset template
  const handleApplyTemplate = (templateId: string) => {
    const tpl = TABLE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    onChange({
      headers: [...tpl.table.headers],
      rows: tpl.table.rows.map((r) => [...r]),
    });
    sounds.playAddSound();
  };

  // Process pasted Excel / Sheets / TSV text
  const handleApplyPaste = () => {
    setPasteError('');
    if (!pasteText.trim()) {
      setPasteError('Pega texto de filas y columnas copiado de Excel o Sheets.');
      return;
    }

    const parsed = parseRawSpreadsheetText(pasteText);
    if (!parsed || parsed.headers.length === 0) {
      setPasteError('No se pudo reconocer la estructura de tabla. Asegúrate de copiar celdas de Excel.');
      return;
    }

    onChange(parsed);
    sounds.playCheckSound();
    setPasteSuccess(true);
    setTimeout(() => {
      setPasteSuccess(false);
      setShowPasteModal(false);
      setPasteText('');
    }, 800);
  };

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-white/70 dark:bg-black/40 p-2.5 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-300/80 dark:border-emerald-800">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel / Tabla</span>
          </div>

          {/* Quick Preset Selector */}
          <div className="relative inline-block">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleApplyTemplate(e.target.value);
                  e.target.value = '';
                }
              }}
              className="text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-2.5 py-1 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
              defaultValue=""
            >
              <option value="" disabled>
                ✨ Plantillas rápidas...
              </option>
              {TABLE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Tools: Paste & Clear */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            title="Pegar celdas copiadas directamente desde Excel o Google Sheets"
          >
            <ClipboardPaste className="w-3 h-3" />
            <span>Pegar de Excel</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="p-1 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Limpiar celdas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Paste from Excel Modal Overlay */}
      {showPasteModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowPasteModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Pegar desde Excel o Sheets
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Copia celdas en tu hoja de cálculo y pégalas aquí
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Presiona Ctrl+V aquí para pegar tus filas y columnas de Excel..."
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/30"
                autoFocus
              />
              {pasteError && (
                <p className="text-xs text-red-500 font-bold mt-1">{pasteError}</p>
              )}
              {pasteSuccess && (
                <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> ¡Tabla importada con éxito!
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyPaste}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Importar Tabla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet Interactive Grid */}
      <div className="bg-white/80 dark:bg-slate-900/90 rounded-2xl border border-black/15 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full border-collapse text-left text-xs min-w-[340px]">
            {/* Table Header (Columns) */}
            <thead>
              <tr className="bg-emerald-700 text-white border-b border-emerald-800">
                <th className="w-8 px-2 py-2 text-center text-[10px] font-black text-emerald-200 select-none border-r border-emerald-600/60">
                  #
                </th>
                {headers.map((colName, colIdx) => (
                  <th
                    key={colIdx}
                    className="p-1.5 border-r border-emerald-600/60 min-w-[130px] font-bold"
                  >
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={colName}
                        onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                        placeholder={`Columna ${colIdx + 1}`}
                        className="w-full px-2 py-1 text-xs font-bold bg-emerald-800/80 text-white placeholder-emerald-300/70 rounded-lg outline-none focus:ring-1 focus:ring-white border border-emerald-600/80 transition-all"
                      />
                      {headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(colIdx)}
                          className="p-1 rounded text-emerald-200 hover:text-white hover:bg-red-500/80 transition-colors cursor-pointer shrink-0"
                          title="Eliminar esta columna"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {/* Add Column Button inside Header */}
                <th className="w-10 px-2 py-2 text-center select-none">
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-2xs flex items-center justify-center mx-auto"
                    title="Agregar columna"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </th>
              </tr>
            </thead>

            {/* Table Body (Rows & Cells) */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Row Number */}
                  <td className="w-8 px-2 py-1.5 text-center text-[11px] font-black text-slate-400 dark:text-slate-500 select-none bg-slate-100/60 dark:bg-slate-800/60 border-r border-slate-200 dark:border-slate-800">
                    {rowIdx + 1}
                  </td>

                  {/* Row Cells */}
                  {headers.map((_, colIdx) => (
                    <td
                      key={colIdx}
                      className="p-1 border-r border-slate-200 dark:border-slate-800"
                    >
                      <input
                        type="text"
                        value={row[colIdx] || ''}
                        onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            // If on last row, auto add row
                            if (rowIdx === rows.length - 1 && colIdx === headers.length - 1) {
                              handleAddRow();
                            }
                          }
                        }}
                        placeholder="..."
                        className="w-full px-2.5 py-1.5 text-xs bg-transparent text-slate-900 dark:text-white rounded-lg outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1.5 focus:ring-emerald-500 border border-transparent focus:border-emerald-500 transition-all font-sans"
                      />
                    </td>
                  ))}

                  {/* Delete Row Button */}
                  <td className="w-10 px-1 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rowIdx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Table Toolbar: Add Row & Stats */}
        <div className="p-2 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Agregar Fila</span>
          </button>

          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {headers.length} columnas × {rows.length} filas
          </span>
        </div>
      </div>
    </div>
  );
};
