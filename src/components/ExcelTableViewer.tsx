import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Copy,
  Check,
  Maximize2,
  Download,
  X,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Trash2,
  Edit3,
  Lock,
  FileDown,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  ExcelTableData,
  tableToTSV,
  exportTableToCSV,
  exportTableToXLSX,
  naturalCompare,
} from '../lib/tableUtils';
import { sounds } from '../lib/sound';

interface ExcelTableViewerProps {
  table: ExcelTableData;
  title?: string;
  themeId?: string;
  compact?: boolean;
  canEdit?: boolean;
  onUpdateTable?: (updatedTable: ExcelTableData) => void;
}

export const ExcelTableViewer: React.FC<ExcelTableViewerProps> = ({
  table,
  title = 'Tabla',
  themeId = 'yellow',
  compact = false,
  canEdit = false,
  onUpdateTable,
}) => {
  // Feedback states
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Filter state
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<number, string>>({});
  const [showColumnFilterRow, setShowColumnFilterRow] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(compact ? 5 : 10);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);
  const [editCellValue, setEditCellValue] = useState('');
  const [isEditModeActive, setIsEditModeActive] = useState(false);
  const cellInputRef = useRef<HTMLInputElement>(null);

  const headers = table.headers || [];
  const rawRows = table.rows || [];

  // Focus inline edit input when active
  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
      cellInputRef.current.select();
    }
  }, [editingCell]);

  // Keep page inside bounds
  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, columnFilters, pageSize]);

  // Handle column header sorting
  const handleSort = (colIdx: number) => {
    if (sortColumn === colIdx) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(colIdx);
      setSortDirection('asc');
    }
    sounds.playCheckSound();
  };

  // Update a column filter
  const handleColumnFilterChange = (colIdx: number, val: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!val) {
        delete next[colIdx];
      } else {
        next[colIdx] = val;
      }
      return next;
    });
  };

  // Reset all filters & sorting
  const handleResetFilters = () => {
    setGlobalSearch('');
    setColumnFilters({});
    setSortColumn(null);
    setSortDirection(null);
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.keys(columnFilters).length + (globalSearch.trim() ? 1 : 0);

  // Process rows: mapping original indexes, filtering, and sorting
  const processedRows = useMemo(() => {
    let list = rawRows.map((row, originalIndex) => ({
      row,
      originalIndex,
    }));

    // 1. Global Search Filter
    const gSearch = globalSearch.toLowerCase().trim();
    if (gSearch) {
      list = list.filter((item) =>
        item.row.some((cell) => String(cell || '').toLowerCase().includes(gSearch))
      );
    }

    // 2. Per-Column Filters
    Object.entries(columnFilters).forEach(([colIdxStr, query]) => {
      const colIdx = Number(colIdxStr);
      const q = String(query || '').toLowerCase().trim();
      if (q) {
        list = list.filter((item) => {
          const val = String(item.row[colIdx] || '').toLowerCase();
          return val.includes(q);
        });
      }
    });

    // 3. Column Sorting
    if (sortColumn !== null && sortDirection) {
      list.sort((a, b) => {
        const valA = String(a.row[sortColumn] || '');
        const valB = String(b.row[sortColumn] || '');
        const res = naturalCompare(valA, valB);
        return sortDirection === 'asc' ? res : -res;
      });
    }

    return list;
  }, [rawRows, globalSearch, columnFilters, sortColumn, sortDirection]);

  // Paginated Rows
  const totalRowsCount = processedRows.length;
  const effectivePageSize = pageSize === 0 ? totalRowsCount : pageSize;
  const totalPages = effectivePageSize > 0 ? Math.ceil(totalRowsCount / effectivePageSize) || 1 : 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedRows = useMemo(() => {
    if (pageSize === 0) return processedRows;
    const start = (safeCurrentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, safeCurrentPage, pageSize]);

  // ================= INLINE EDITING ACTIONS =================
  const startInlineEdit = (originalRowIdx: number, colIdx: number, initialValue: string) => {
    if (!canEdit || !onUpdateTable) return;
    setEditingCell({ rowIdx: originalRowIdx, colIdx });
    setEditCellValue(initialValue);
  };

  const saveInlineEdit = () => {
    if (!editingCell || !onUpdateTable) {
      setEditingCell(null);
      return;
    }

    const { rowIdx, colIdx } = editingCell;
    const currentVal = rawRows[rowIdx]?.[colIdx] || '';
    if (currentVal !== editCellValue) {
      const updatedRows = rawRows.map((r, rIdx) => {
        if (rIdx !== rowIdx) return r;
        const newRow = [...r];
        while (newRow.length < headers.length) newRow.push('');
        newRow[colIdx] = editCellValue;
        return newRow;
      });

      onUpdateTable({
        headers: [...headers],
        rows: updatedRows,
      });
      sounds.playCheckSound();
    }

    setEditingCell(null);
  };

  const saveAndNavigateCell = (direction: 'next' | 'prev' | 'down' | 'up') => {
    if (!editingCell || !onUpdateTable) {
      setEditingCell(null);
      return;
    }

    const { rowIdx, colIdx } = editingCell;
    const currentVal = rawRows[rowIdx]?.[colIdx] || '';
    let updatedRows = rawRows;

    if (currentVal !== editCellValue) {
      updatedRows = rawRows.map((r, rIdx) => {
        if (rIdx !== rowIdx) return r;
        const newRow = [...r];
        while (newRow.length < headers.length) newRow.push('');
        newRow[colIdx] = editCellValue;
        return newRow;
      });

      onUpdateTable({
        headers: [...headers],
        rows: updatedRows,
      });
      sounds.playCheckSound();
    }

    // Determine next target cell
    let nextRow = rowIdx;
    let nextCol = colIdx;

    if (direction === 'next') {
      if (colIdx + 1 < headers.length) {
        nextCol = colIdx + 1;
      } else {
        // Move to first column of next row
        nextCol = 0;
        nextRow = rowIdx + 1;
      }
    } else if (direction === 'prev') {
      if (colIdx - 1 >= 0) {
        nextCol = colIdx - 1;
      } else if (rowIdx - 1 >= 0) {
        nextCol = headers.length - 1;
        nextRow = rowIdx - 1;
      }
    } else if (direction === 'down') {
      nextRow = rowIdx + 1;
    } else if (direction === 'up') {
      if (rowIdx - 1 >= 0) {
        nextRow = rowIdx - 1;
      }
    }

    // If nextRow exceeds current rows, auto-add a new empty row
    if (nextRow >= updatedRows.length) {
      const newEmptyRow = new Array(headers.length).fill('');
      const extendedRows = [...updatedRows, newEmptyRow];
      onUpdateTable({
        headers: [...headers],
        rows: extendedRows,
      });
      setEditingCell({ rowIdx: nextRow, colIdx: nextCol });
      setEditCellValue('');
    } else {
      setEditingCell({ rowIdx: nextRow, colIdx: nextCol });
      setEditCellValue(updatedRows[nextRow]?.[nextCol] || '');
    }
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditCellValue('');
  };

  // Add Row from Table Viewer
  const handleAddRow = () => {
    if (!canEdit || !onUpdateTable) return;
    const newRow = new Array(headers.length).fill('');
    onUpdateTable({
      headers: [...headers],
      rows: [...rawRows, newRow],
    });
    sounds.playAddSound();
  };

  // Delete Row from Table Viewer
  const handleDeleteRow = (originalRowIdx: number) => {
    if (!canEdit || !onUpdateTable) return;
    if (rawRows.length <= 1) {
      onUpdateTable({
        headers: [...headers],
        rows: [new Array(headers.length).fill('')],
      });
      return;
    }
    const newRows = rawRows.filter((_, idx) => idx !== originalRowIdx);
    onUpdateTable({
      headers: [...headers],
      rows: newRows,
    });
    sounds.playDeleteSound();
  };

  // ================= EXPORT ACTIONS =================
  const handleCopyForExcel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const tsv = tableToTSV(table);
    navigator.clipboard.writeText(tsv);
    sounds.playCheckSound();
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyCell = (text: string, cellId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    sounds.playCheckSound();
    setCopiedCell(cellId);
    setTimeout(() => {
      setCopiedCell((curr) => (curr === cellId ? null : curr));
    }, 1500);
  };

  const handleDownloadXLSX = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    exportTableToXLSX(title || 'tabla', table);
    sounds.playAddSound();
    setShowExportMenu(false);
  };

  const handleDownloadCSV = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    exportTableToCSV(title || 'tabla', table);
    sounds.playAddSound();
    setShowExportMenu(false);
  };

  if (headers.length === 0 && rawRows.length === 0) {
    return null;
  }

  // ================= RENDER TABLE VIEW =================
  const renderTableStructure = (isModal = false) => (
    <div className="space-y-2.5">
      {/* Search & Action Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs bg-white/70 dark:bg-black/30 p-2 rounded-2xl border border-black/10 dark:border-white/10">
        {/* Left: Global Search & Filter Toggle */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Buscar en la tabla..."
              className="w-full pl-8 pr-6 py-1.5 text-xs bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Toggle Column Filters */}
          <button
            type="button"
            onClick={() => setShowColumnFilterRow(!showColumnFilterRow)}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border text-xs ${
              showColumnFilterRow || Object.keys(columnFilters).length > 0
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title="Filtrar por columnas individuales"
          >
            <Filter className="w-3 h-3" />
            <span>Filtros</span>
            {Object.keys(columnFilters).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-emerald-800 font-black">
                {Object.keys(columnFilters).length}
              </span>
            )}
          </button>

          {/* Reset Filters if Active */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-1.5 rounded-xl text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Restablecer todos los filtros y orden"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Inline Edit Mode Switch & Add Row */}
        <div className="flex items-center gap-1.5">
          {canEdit && onUpdateTable && (
            <>
              <button
                type="button"
                onClick={() => setIsEditModeActive(!isEditModeActive)}
                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer border text-xs ${
                  isEditModeActive
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-2xs'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                title={isEditModeActive ? 'Modo edición directa activo' : 'Activar edición directa en celdas'}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditModeActive ? 'Editando Celdas' : 'Editar'}</span>
              </button>

              {isEditModeActive && (
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs text-xs"
                  title="Agregar fila a la tabla"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>Fila</span>
                </button>
              )}
            </>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs text-xs"
              title="Descargar o exportar tabla"
            >
              <Download className="w-3 h-3" />
              <span>Exportar</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 space-y-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleDownloadXLSX}
                  className="w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Descargar Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Descargar CSV (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyForExcel}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar para Excel (TSV)</span>
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          {!isModal && (
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Ver tabla en pantalla completa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container with Smooth Scroll */}
      <div className="overflow-x-auto max-w-full rounded-2xl border border-black/15 dark:border-white/15 shadow-2xs bg-white dark:bg-slate-900/90">
        <table className="w-full border-collapse text-left text-xs">
          {/* Table Header with Sort & Column Filter */}
          <thead>
            <tr className="bg-emerald-700 dark:bg-emerald-800 text-white font-black border-b border-emerald-800 dark:border-emerald-900 select-none">
              <th className="w-8 px-2 py-2 text-center text-[10px] text-emerald-200 border-r border-emerald-600/60 font-mono">
                #
              </th>
              {headers.map((col, idx) => {
                const isSorted = sortColumn === idx;
                const hasFilter = Boolean(columnFilters[idx]);

                return (
                  <th
                    key={idx}
                    className="px-3 py-2 border-r border-emerald-600/60 last:border-r-0 tracking-wide text-xs whitespace-nowrap group"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        onClick={() => handleSort(idx)}
                        className="cursor-pointer hover:underline flex items-center gap-1"
                        title={`Ordenar por ${col || `Columna ${idx + 1}`}`}
                      >
                        <span>{col || `Columna ${idx + 1}`}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>

                      {hasFilter && (
                        <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" title="Filtro activo" />
                      )}
                    </div>
                  </th>
                );
              })}

              {/* Actions Column in Edit Mode */}
              {isEditModeActive && canEdit && (
                <th className="w-10 px-2 py-2 text-center text-[10px] text-emerald-200 select-none">
                  Acción
                </th>
              )}
            </tr>

            {/* Per-Column Filter Input Row */}
            {showColumnFilterRow && (
              <tr className="bg-emerald-800/90 dark:bg-emerald-900/90 border-b border-emerald-700 select-none">
                <th className="px-2 py-1.5 text-center text-[10px] text-emerald-300 border-r border-emerald-700/60 font-mono">
                  <Filter className="w-3 h-3 mx-auto opacity-70" />
                </th>
                {headers.map((_, idx) => (
                  <th key={idx} className="p-1 border-r border-emerald-700/60 last:border-r-0">
                    <input
                      type="text"
                      value={columnFilters[idx] || ''}
                      onChange={(e) => handleColumnFilterChange(idx, e.target.value)}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-[11px] bg-emerald-950/60 text-white placeholder-emerald-400/60 rounded-lg outline-none focus:ring-1 focus:ring-white border border-emerald-600/60"
                    />
                  </th>
                ))}
                {isEditModeActive && canEdit && <th className="p-1" />}
              </tr>
            )}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + (isEditModeActive ? 2 : 1)}
                  className="p-8 text-center text-slate-400 dark:text-slate-500 italic text-xs"
                >
                  {activeFiltersCount > 0
                    ? 'No hay registros que coincidan con los filtros aplicados.'
                    : 'La tabla no contiene datos.'}
                </td>
              </tr>
            ) : (
              paginatedRows.map(({ row, originalIndex }, rIdx) => {
                const globalRowNumber = pageSize === 0 ? rIdx + 1 : (safeCurrentPage - 1) * pageSize + rIdx + 1;

                return (
                  <tr
                    key={originalIndex}
                    className={`hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-colors group ${
                      rIdx % 2 === 1 ? 'bg-black/[0.02] dark:bg-white/[0.02]' : ''
                    }`}
                  >
                    {/* Row Index */}
                    <td className="w-8 px-2 py-1.5 text-center text-[10px] font-bold text-slate-400 select-none bg-slate-100/50 dark:bg-slate-800/40 border-r border-slate-200/80 dark:border-slate-800">
                      {globalRowNumber}
                    </td>

                    {/* Table Cells */}
                    {headers.map((_, cIdx) => {
                      const cellVal = row[cIdx] || '';
                      const cellId = `cell_${originalIndex}_${cIdx}`;
                      const isCopied = copiedCell === cellId;
                      const isEditingThisCell =
                        editingCell?.rowIdx === originalIndex && editingCell?.colIdx === cIdx;

                      // Inline input when actively editing this specific cell
                      if (isEditingThisCell) {
                        return (
                          <td
                            key={cIdx}
                            className="p-1 border-r border-slate-200/80 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/40"
                          >
                            <input
                              ref={cellInputRef}
                              type="text"
                              value={editCellValue}
                              onChange={(e) => setEditCellValue(e.target.value)}
                              onBlur={saveInlineEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  saveAndNavigateCell(e.shiftKey ? 'prev' : 'next');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveAndNavigateCell(e.shiftKey ? 'up' : 'down');
                                } else if (e.key === 'Escape') {
                                  cancelInlineEdit();
                                }
                              }}
                              className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg border-2 border-emerald-500 outline-none shadow-xs"
                            />
                          </td>
                        );
                      }

                      // Normal / Click-to-edit Cell View
                      return (
                        <td
                          key={cIdx}
                          onClick={(e) => {
                            if (isEditModeActive && canEdit) {
                              startInlineEdit(originalIndex, cIdx, cellVal);
                            } else {
                              handleCopyCell(cellVal, cellId, e);
                            }
                          }}
                          onDoubleClick={() => {
                            if (canEdit && onUpdateTable) {
                              startInlineEdit(originalIndex, cIdx, cellVal);
                            }
                          }}
                          className={`px-3 py-2 text-xs border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 select-text cursor-pointer transition-colors relative group/cell ${
                            isEditModeActive
                              ? 'hover:bg-amber-100/70 dark:hover:bg-amber-950/50 hover:ring-1 hover:ring-amber-400'
                              : 'hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                          }`}
                          title={
                            isEditModeActive
                              ? 'Clic para editar celda'
                              : 'Clic para copiar valor • Doble clic para editar'
                          }
                        >
                          <div className="flex items-center justify-between gap-1.5 min-w-[60px]">
                            <span className="font-mono text-slate-800 dark:text-slate-100 break-words leading-relaxed">
                              {cellVal || (
                                <span className="text-slate-300 dark:text-slate-600 italic">-</span>
                              )}
                            </span>

                            {/* Quick copy indicator or edit icon */}
                            {isEditModeActive ? (
                              <span className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded text-amber-600 shrink-0">
                                <Edit3 className="w-3 h-3" />
                              </span>
                            ) : (
                              cellVal && (
                                <span className="opacity-0 group-hover/cell:opacity-100 transition-opacity p-0.5 rounded bg-black/10 dark:bg-white/10 shrink-0">
                                  {isCopied ? (
                                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-500" />
                                  )}
                                </span>
                              )
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Delete Row Button in Edit Mode */}
                    {isEditModeActive && canEdit && (
                      <td className="w-10 px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(originalIndex)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= PAGINATION & SUMMARY FOOTER ================= */}
      <div className="flex items-center justify-between gap-3 flex-wrap text-xs bg-slate-50/90 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
        {/* Left: Rows info & Page Size Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-[11px]">
            {totalRowsCount === rawRows.length
              ? `Total: ${rawRows.length} filas`
              : `Filtradas: ${totalRowsCount} de ${rawRows.length} filas`}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option value={5}>5 por pág.</option>
              <option value={10}>10 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
              <option value={0}>Todas</option>
            </select>
          </div>
        </div>

        {/* Right: Pagination Controls */}
        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Primera página"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 py-1 text-[11px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              {safeCurrentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Página siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Última página"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Table Main Render */}
      {renderTableStructure(false)}

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center border border-emerald-300">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Vista interactiva de tabla ({rawRows.length} filas × {headers.length} columnas)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadXLSX}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with Full Interactive Table */}
            <div className="flex-1 overflow-y-auto overflow-x-auto pr-1">
              {renderTableStructure(true)}
            </div>

            {/* Modal Footer Tips */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>
                  {canEdit
                    ? 'Haz doble clic o activa "Editar" para modificar celdas al instante.'
                    : 'Haz clic en cualquier celda para copiar su contenido.'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
