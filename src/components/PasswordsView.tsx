import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Copy,
  Check,
  Edit2,
  Edit3,
  Trash2,
  ExternalLink,
  Share2,
  Lock,
  User,
  Users,
  X,
  Filter,
  Sparkles,
  Save,
  Palette,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Table as TableIcon,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from 'lucide-react';
import { Member, PasswordItem } from '../types';
import { sounds } from '../lib/sound';
import { ExcelTableEditor } from './ExcelTableEditor';
import { ExcelTableViewer } from './ExcelTableViewer';
import {
  ExcelTableData,
  TABLE_TEMPLATES,
  isTableContent,
  parseTableContent,
  serializeTableContent,
  tableToTSV,
  tableToWhatsAppText,
  exportTableToCSV,
  exportTableToXLSX,
  naturalCompare,
} from '../lib/tableUtils';

interface PasswordsViewProps {
  passwords: PasswordItem[];
  members: Member[];
  activeMember: Member | null;
  isAdmin?: boolean;
  onAddPassword: (password: Partial<PasswordItem>) => void;
  onUpdatePassword: (id: string, updates: Partial<PasswordItem>) => void;
  onDeletePassword: (id: string) => void;
  onLock?: () => void;
  fontSize?: 'normal' | 'large' | 'xlarge';
}

const POSTIT_COLORS = [
  {
    id: 'yellow',
    name: 'Amarillo',
    card: 'bg-amber-100/95 dark:bg-amber-950/80 border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 shadow-md shadow-amber-900/5',
    tape: 'bg-amber-300/70 dark:bg-amber-600/40 border border-amber-400/40',
    badge: 'bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 border-amber-300/80',
    actionHover: 'hover:bg-amber-200/90 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-200',
    swatchBg: 'bg-amber-300',
    dotClass: 'bg-amber-400 border-amber-500',
    borderFocus: 'focus:border-amber-500 focus:ring-amber-500/30',
  },
  {
    id: 'pink',
    name: 'Rosa',
    card: 'bg-pink-100/95 dark:bg-pink-950/80 border-pink-300/80 dark:border-pink-700/60 text-pink-950 dark:text-pink-100 shadow-md shadow-pink-900/5',
    tape: 'bg-pink-300/70 dark:bg-pink-600/40 border border-pink-400/40',
    badge: 'bg-pink-200/90 dark:bg-pink-900/80 text-pink-950 dark:text-pink-200 border-pink-300/80',
    actionHover: 'hover:bg-pink-200/90 dark:hover:bg-pink-900/70 text-pink-900 dark:text-pink-200',
    swatchBg: 'bg-pink-300',
    dotClass: 'bg-pink-400 border-pink-500',
    borderFocus: 'focus:border-pink-500 focus:ring-pink-500/30',
  },
  {
    id: 'green',
    name: 'Verde',
    card: 'bg-emerald-100/95 dark:bg-emerald-950/80 border-emerald-300/80 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100 shadow-md shadow-emerald-900/5',
    tape: 'bg-emerald-300/70 dark:bg-emerald-600/40 border border-emerald-400/40',
    badge: 'bg-emerald-200/90 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 border-emerald-300/80',
    actionHover: 'hover:bg-emerald-200/90 dark:hover:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200',
    swatchBg: 'bg-emerald-300',
    dotClass: 'bg-emerald-400 border-emerald-500',
    borderFocus: 'focus:border-emerald-500 focus:ring-emerald-500/30',
  },
  {
    id: 'blue',
    name: 'Azul',
    card: 'bg-sky-100/95 dark:bg-sky-950/80 border-sky-300/80 dark:border-sky-700/60 text-sky-950 dark:text-sky-100 shadow-md shadow-sky-900/5',
    tape: 'bg-sky-300/70 dark:bg-sky-600/40 border border-sky-400/40',
    badge: 'bg-sky-200/90 dark:bg-sky-900/80 text-sky-950 dark:text-sky-200 border-sky-300/80',
    actionHover: 'hover:bg-sky-200/90 dark:hover:bg-sky-900/70 text-sky-900 dark:text-sky-200',
    swatchBg: 'bg-sky-300',
    dotClass: 'bg-sky-400 border-sky-500',
    borderFocus: 'focus:border-sky-500 focus:ring-sky-500/30',
  },
  {
    id: 'purple',
    name: 'Lavanda',
    card: 'bg-purple-100/95 dark:bg-purple-950/80 border-purple-300/80 dark:border-purple-700/60 text-purple-950 dark:text-purple-100 shadow-md shadow-purple-900/5',
    tape: 'bg-purple-300/70 dark:bg-purple-600/40 border border-purple-400/40',
    badge: 'bg-purple-200/90 dark:bg-purple-900/80 text-purple-950 dark:text-purple-200 border-purple-300/80',
    actionHover: 'hover:bg-purple-200/90 dark:hover:bg-purple-900/70 text-purple-900 dark:text-purple-200',
    swatchBg: 'bg-purple-300',
    dotClass: 'bg-purple-400 border-purple-500',
    borderFocus: 'focus:border-purple-500 focus:ring-purple-500/30',
  },
  {
    id: 'orange',
    name: 'Naranja',
    card: 'bg-orange-100/95 dark:bg-orange-950/80 border-orange-300/80 dark:border-orange-700/60 text-orange-950 dark:text-orange-100 shadow-md shadow-orange-900/5',
    tape: 'bg-orange-300/70 dark:bg-orange-600/40 border border-orange-400/40',
    badge: 'bg-orange-200/90 dark:bg-orange-900/80 text-orange-950 dark:text-orange-200 border-orange-300/80',
    actionHover: 'hover:bg-orange-200/90 dark:hover:bg-orange-900/70 text-orange-900 dark:text-orange-200',
    swatchBg: 'bg-orange-300',
    dotClass: 'bg-orange-400 border-orange-500',
    borderFocus: 'focus:border-orange-500 focus:ring-orange-500/30',
  },
];

const THEMES_MAP = POSTIT_COLORS.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<string, typeof POSTIT_COLORS[0]>);

export const PasswordsView: React.FC<PasswordsViewProps> = ({
  passwords,
  members,
  activeMember,
  isAdmin = false,
  onAddPassword,
  onUpdatePassword,
  onDeletePassword,
  onLock,
  fontSize = 'normal',
}) => {
  // View mode: Grid / Post-its vs Master Table
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // In-line creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newMode, setNewMode] = useState<'text' | 'excel'>('text');
  const [newTableData, setNewTableData] = useState<ExcelTableData>(TABLE_TEMPLATES[0].table);
  const [newMemberId, setNewMemberId] = useState('all');
  const [newColor, setNewColor] = useState('yellow');
  const newTitleInputRef = useRef<HTMLInputElement>(null);

  // In-line editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editMode, setEditMode] = useState<'text' | 'excel'>('text');
  const [editTableData, setEditTableData] = useState<ExcelTableData>(TABLE_TEMPLATES[0].table);
  const [editMemberId, setEditMemberId] = useState('all');
  const [editColor, setEditColor] = useState('yellow');

  // Master Table View specific states
  const [tableSortKey, setTableSortKey] = useState<'website' | 'type' | 'notes' | 'member' | null>('website');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [inlineEditingRowId, setInlineEditingRowId] = useState<string | null>(null);
  const [inlineRowTitle, setInlineRowTitle] = useState('');
  const [inlineRowNotes, setInlineRowNotes] = useState('');
  const [inlineRowMemberId, setInlineRowMemberId] = useState('all');

  // Auto-focus when creation mode starts
  useEffect(() => {
    if (isCreating) {
      setTimeout(() => {
        newTitleInputRef.current?.focus();
      }, 50);
    }
  }, [isCreating]);

  // Copy text to clipboard with sound and feedback
  const handleCopy = (text: string, identifier: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    sounds.playCheckSound();
    setCopiedId(identifier);
    setTimeout(() => {
      setCopiedId((curr) => (curr === identifier ? null : curr));
    }, 2000);
  };

  // WhatsApp Share helper
  const handleShareWhatsApp = (item: PasswordItem) => {
    let text = '';
    if (isTableContent(item.notes)) {
      const parsed = parseTableContent(item.notes);
      if (parsed) {
        text = tableToWhatsAppText(item.website || 'CLAVE', parsed);
      }
    }

    if (!text) {
      text = `🔑 *${item.website || 'CLAVE'}*\n\n${item.notes || ''}\n`;
    }

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text.trim())}`, '_blank');
  };

  // Start in-line creation
  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setNewTitle('');
    setNewNotes('');
    setNewMode('text');
    setNewTableData({
      headers: ['Servicio / App', 'Usuario / Correo', 'Contraseña / PIN', 'Notas'],
      rows: [
        ['', '', '', ''],
        ['', '', '', ''],
      ],
    });
    setNewMemberId(selectedMemberFilter !== 'all' ? selectedMemberFilter : 'all');
    setNewColor(selectedColorFilter !== 'all' ? selectedColorFilter : 'yellow');
    sounds.playAddSound();
  };

  // Cancel in-line creation
  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewTitle('');
    setNewNotes('');
  };

  // Submit in-line creation
  const handleSaveNewNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = newTitle.trim();
    let finalNotes = '';

    if (newMode === 'excel') {
      finalNotes = serializeTableContent(newTableData);
    } else {
      finalNotes = newNotes.trim();
    }

    if (!trimmedTitle && !finalNotes) return;

    onAddPassword({
      website: trimmedTitle || (newMode === 'excel' ? 'Tabla Excel' : (finalNotes ? finalNotes.slice(0, 30) : 'Clave')),
      notes: finalNotes,
      memberId: newMemberId || 'all',
      color: newColor || 'yellow',
      email: '',
      password: '',
      category: 'General',
    });

    sounds.playCheckSound();
    setIsCreating(false);
    setNewTitle('');
    setNewNotes('');
  };

  // Start in-line editing of an existing note
  const handleStartEdit = (item: PasswordItem) => {
    setIsCreating(false);
    setEditingId(item.id);
    setEditTitle(item.website || '');
    setEditMemberId(item.memberId || 'all');
    setEditColor(item.color || 'yellow');

    if (isTableContent(item.notes)) {
      const parsed = parseTableContent(item.notes);
      setEditMode('excel');
      setEditTableData(parsed || TABLE_TEMPLATES[0].table);
      setEditNotes('');
    } else {
      setEditMode('text');
      setEditNotes(item.notes || '');
      setEditTableData({
        headers: ['Servicio / App', 'Usuario / Correo', 'Contraseña / PIN', 'Notas'],
        rows: [
          ['', '', '', ''],
          ['', '', '', ''],
        ],
      });
    }

    sounds.playAddSound();
  };

  // Cancel in-line editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditNotes('');
  };

  // Submit in-line editing
  const handleSaveEdit = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = editTitle.trim();
    let finalNotes = '';

    if (editMode === 'excel') {
      finalNotes = serializeTableContent(editTableData);
    } else {
      finalNotes = editNotes.trim();
    }

    if (!trimmedTitle && !finalNotes) return;

    onUpdatePassword(id, {
      website: trimmedTitle || (editMode === 'excel' ? 'Tabla Excel' : 'Clave'),
      notes: finalNotes,
      memberId: editMemberId || 'all',
      color: editColor || 'yellow',
    });

    sounds.playCheckSound();
    setEditingId(null);
  };

  // Filter passwords based on permissions, search term, member, and color
  const filteredPasswords = useMemo(() => {
    // 1. Permission check: Non-admins strictly see notes assigned to them or to 'all'
    let baseList = passwords;
    if (!isAdmin && activeMember) {
      baseList = passwords.filter(
        (p) => p.memberId === activeMember.id || p.memberId === 'all' || !p.memberId
      );
    }

    // 2. Member filter (for admin)
    if (isAdmin && selectedMemberFilter !== 'all') {
      baseList = baseList.filter((p) => p.memberId === selectedMemberFilter);
    }

    // 3. Color filter
    if (selectedColorFilter !== 'all') {
      baseList = baseList.filter((p) => (p.color || 'yellow') === selectedColorFilter);
    }

    // 4. Search term filter
    const term = searchTerm.toLowerCase().trim();
    if (!term) return baseList;

    return baseList.filter((p) => {
      const matchWeb = (p.website || '').toLowerCase().includes(term);
      const matchNotes = (p.notes || '').toLowerCase().includes(term);
      return matchWeb || matchNotes;
    });
  }, [passwords, isAdmin, activeMember, selectedMemberFilter, selectedColorFilter, searchTerm]);

  // Master Table view: Sorted & Paginated passwords
  const tableSortedPasswords = useMemo(() => {
    const list = [...filteredPasswords];
    if (tableSortKey) {
      list.sort((a, b) => {
        let valA = '';
        let valB = '';

        if (tableSortKey === 'website') {
          valA = a.website || '';
          valB = b.website || '';
        } else if (tableSortKey === 'type') {
          valA = isTableContent(a.notes) ? 'Tabla Excel' : 'Texto Libre';
          valB = isTableContent(b.notes) ? 'Tabla Excel' : 'Texto Libre';
        } else if (tableSortKey === 'notes') {
          valA = a.notes || '';
          valB = b.notes || '';
        } else if (tableSortKey === 'member') {
          valA = a.memberId || 'all';
          valB = b.memberId || 'all';
        }

        const res = naturalCompare(valA, valB);
        return tableSortDir === 'asc' ? res : -res;
      });
    }
    return list;
  }, [filteredPasswords, tableSortKey, tableSortDir]);

  const totalTablePages = tablePageSize === 0 ? 1 : Math.ceil(tableSortedPasswords.length / tablePageSize) || 1;
  const safeTablePage = Math.min(Math.max(tablePage, 1), totalTablePages);

  const paginatedMasterTablePasswords = useMemo(() => {
    if (tablePageSize === 0) return tableSortedPasswords;
    const start = (safeTablePage - 1) * tablePageSize;
    return tableSortedPasswords.slice(start, start + tablePageSize);
  }, [tableSortedPasswords, safeTablePage, tablePageSize]);

  // Master Table Sort Trigger
  const handleMasterTableSort = (key: 'website' | 'type' | 'notes' | 'member') => {
    if (tableSortKey === key) {
      setTableSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTableSortKey(key);
      setTableSortDir('asc');
    }
    sounds.playCheckSound();
  };

  // Master Table Inline Edit
  const handleStartInlineRowEdit = (item: PasswordItem) => {
    if (!isAdmin) return;
    setInlineEditingRowId(item.id);
    setInlineRowTitle(item.website || '');
    setInlineRowNotes(item.notes || '');
    setInlineRowMemberId(item.memberId || 'all');
  };

  const handleSaveInlineRowEdit = (id: string) => {
    onUpdatePassword(id, {
      website: inlineRowTitle.trim() || 'Clave',
      notes: inlineRowNotes.trim(),
      memberId: inlineRowMemberId || 'all',
    });
    sounds.playCheckSound();
    setInlineEditingRowId(null);
  };

  // Export all passwords to XLSX
  const handleExportAllToXLSX = () => {
    const tableData: ExcelTableData = {
      headers: ['Título / Servicio', 'Categoría', 'Usuario / Correo', 'Contraseña / PIN', 'Notas / Contenido', 'Tipo', 'Asignado a', 'Fecha'],
      rows: filteredPasswords.map((p) => {
        const isTab = isTableContent(p.notes);
        const owner = getOwnerBadge(p.memberId).label;
        let content = p.notes || '';
        if (isTab) {
          const parsed = parseTableContent(p.notes);
          if (parsed) {
            content = `[Tabla: ${parsed.headers.join(' | ')}]`;
          }
        }
        return [
          p.website || 'Clave',
          p.category || 'General',
          p.email || '',
          p.password || '',
          content,
          isTab ? 'Tabla Excel' : 'Texto Libre',
          owner,
          p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        ];
      }),
    };
    exportTableToXLSX('catalogo_claves', tableData);
    sounds.playAddSound();
  };

  // Export all passwords to CSV
  const handleExportAllToCSV = () => {
    const tableData: ExcelTableData = {
      headers: ['Título / Servicio', 'Categoría', 'Usuario / Correo', 'Contraseña / PIN', 'Notas / Contenido', 'Tipo', 'Asignado a', 'Fecha'],
      rows: filteredPasswords.map((p) => {
        const isTab = isTableContent(p.notes);
        const owner = getOwnerBadge(p.memberId).label;
        return [
          p.website || 'Clave',
          p.category || 'General',
          p.email || '',
          p.password || '',
          p.notes || '',
          isTab ? 'Tabla Excel' : 'Texto Libre',
          owner,
          p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        ];
      }),
    };
    exportTableToCSV('catalogo_claves', tableData);
    sounds.playAddSound();
  };

  const formatWebsiteUrl = (web: string) => {
    let clean = (web || '').trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('.') && !clean.includes(' ')) {
        clean = 'https://' + clean;
      } else {
        return null;
      }
    }
    return clean;
  };

  const getOwnerBadge = (memberId?: string) => {
    if (!memberId || memberId === 'all') {
      return {
        label: 'Toda la Familia',
        isAll: true,
        avatarColor: 'bg-amber-600',
        initial: '👥',
      };
    }
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      return {
        label: 'Compartido',
        isAll: true,
        avatarColor: 'bg-slate-500',
        initial: '👤',
      };
    }
    return {
      label: member.name,
      isAll: false,
      avatarColor: member.avatarColor || 'bg-blue-600',
      initial: member.avatarInitial || member.name.charAt(0).toUpperCase(),
    };
  };

  return (
    <div id="passwords-management-section" className="space-y-4 max-w-6xl mx-auto mb-16 px-1 sm:px-0">
      {/* ================= HEADER & CONTROLS ================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/60 shadow-2xs">
              <StickyNote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Tablón de Claves & Tablas
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                  {filteredPasswords.length} {filteredPasswords.length === 1 ? 'clave' : 'claves'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdmin
                  ? 'Claves con texto libre, tablas interactivas tipo Excel y asignación a familiares'
                  : `Claves asignadas a ${activeMember?.name || 'ti'} (Solo Lectura)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto flex-wrap">
            {/* View Layout Toggle: Grid vs Master Table */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewLayout === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Vista Cuadrícula / Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewLayout === 'table'
                    ? 'bg-emerald-600 text-white shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Vista Tabla General con ordenamiento y exportación"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabla General</span>
              </button>
            </div>

            {onLock && (
              <button
                type="button"
                onClick={onLock}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Bloquear sección"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Bloquear</span>
              </button>
            )}

            {/* Add Post-It In-Line Button (Admin Only) */}
            {isAdmin && !isCreating && (
              <button
                onClick={handleStartCreate}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 border border-amber-600"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nueva Clave</span>
              </button>
            )}
          </div>
        </div>

        {/* Read-only Member Information Banner */}
        {!isAdmin && (
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Modo Consulta:</strong> Puedes leer y copiar tus claves y tablas asignadas. Solo el administrador puede crear o modificar registros.
            </span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar claves por título o contenido..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Color Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedColorFilter('all')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                selectedColorFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              Todos los Colores
            </button>
            {POSTIT_COLORS.map((c) => {
              const isSelected = selectedColorFilter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColorFilter(c.id)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border ${c.tape} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={`Filtrar por color ${c.name}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-black/20" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin Member Filter Bar */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none text-xs border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3 h-3" />
              <span>Propietario:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedMemberFilter('all')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                selectedMemberFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              👥 Todos ({passwords.length})
            </button>
            {members.map((m) => {
              const count = passwords.filter((p) => p.memberId === m.id).length;
              const isSelected = selectedMemberFilter === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemberFilter(m.id)}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${m.avatarColor || 'bg-blue-500'}`} />
                  <span>{m.name}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= EMPTY STATE ================= */}
      {filteredPasswords.length === 0 && !isCreating && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/50 shadow-2xs">
            <StickyNote className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {searchTerm || selectedColorFilter !== 'all' || selectedMemberFilter !== 'all'
                ? 'No se encontraron claves con estos filtros'
                : 'No hay claves registradas'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedColorFilter !== 'all' || selectedMemberFilter !== 'all'
                ? 'Intenta restablecer la búsqueda o cambiar los filtros.'
                : isAdmin
                ? 'Crea tu primera clave o tabla de datos y asígnala al familiar deseado.'
                : 'Aún no tienes claves asignadas por el administrador.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={handleStartCreate}
              className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs border border-amber-600"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Primera Clave</span>
            </button>
          )}
        </div>
      )}

      {/* ================= MASTER TABLE VIEW ================= */}
      {viewLayout === 'table' && filteredPasswords.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Table Header Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-emerald-600" />
                <span>Catálogo Completo de Claves</span>
              </span>
              <span className="text-slate-400 text-xs">
                ({filteredPasswords.length} {filteredPasswords.length === 1 ? 'registro' : 'registros'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportAllToXLSX}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Exportar todas las claves a Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportAllToCSV}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Exportar a CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Master Table Grid */}
          <div className="overflow-x-auto max-w-full rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-black border-b border-slate-200 dark:border-slate-700 select-none">
                  <th className="w-8 px-2.5 py-2.5 text-center text-slate-400 font-mono">#</th>
                  <th
                    onClick={() => handleMasterTableSort('website')}
                    className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Título / Servicio</span>
                      {tableSortKey === 'website' ? (
                        tableSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleMasterTableSort('type')}
                    className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tipo</span>
                      {tableSortKey === 'type' ? (
                        tableSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleMasterTableSort('notes')}
                    className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors min-w-[200px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Contenido / Datos</span>
                      {tableSortKey === 'notes' ? (
                        tableSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleMasterTableSort('member')}
                    className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Asignado a</span>
                      {tableSortKey === 'member' ? (
                        tableSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="px-3.5 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedMasterTablePasswords.map((item, idx) => {
                  const isInlineEditing = inlineEditingRowId === item.id;
                  const isTable = isTableContent(item.notes);
                  const owner = getOwnerBadge(item.memberId);
                  const rowNumber = (safeTablePage - 1) * tablePageSize + idx + 1;

                  if (isInlineEditing) {
                    return (
                      <tr key={item.id} className="bg-amber-50/70 dark:bg-amber-950/30">
                        <td className="px-2.5 py-2 text-center text-xs font-mono text-slate-400">{rowNumber}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={inlineRowTitle}
                            onChange={(e) => setInlineRowTitle(e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs font-bold text-slate-500">
                          {isTable ? 'Tabla Excel' : 'Texto Libre'}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={inlineRowNotes}
                            onChange={(e) => setInlineRowNotes(e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={inlineRowMemberId}
                            onChange={(e) => setInlineRowMemberId(e.target.value)}
                            className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1"
                          >
                            <option value="all">👥 Toda la Familia</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                👤 {m.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveInlineRowEdit(item.id)}
                              className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              title="Guardar"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEditingRowId(null)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="px-2.5 py-2.5 text-center text-xs font-mono text-slate-400">{rowNumber}</td>
                      <td
                        onDoubleClick={() => handleStartInlineRowEdit(item)}
                        className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white select-text cursor-pointer"
                        title="Doble clic para editar"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${THEMES_MAP[item.color || 'yellow']?.swatchBg || 'bg-amber-300'}`}
                          />
                          <span>{item.website || 'Clave'}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        {isTable ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>Tabla Excel</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <FileText className="w-3 h-3" />
                            <span>Texto</span>
                          </span>
                        )}
                      </td>
                      <td
                        onDoubleClick={() => handleStartInlineRowEdit(item)}
                        className="px-3.5 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300 select-text max-w-xs truncate cursor-pointer"
                        title={item.notes || ''}
                      >
                        {isTable ? (
                          <span className="italic text-emerald-700 dark:text-emerald-400 font-sans">
                            [Tabla interactiva con filas y columnas]
                          </span>
                        ) : (
                          item.notes || '-'
                        )}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {owner.isAll ? <Users className="w-3 h-3" /> : <span className={`w-2 h-2 rounded-full ${owner.avatarColor}`} />}
                          <span>{owner.label}</span>
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(item.notes || item.website || '', `row_${item.id}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                            title="Copiar"
                          >
                            {copiedId === `row_${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Seguro que deseas eliminar "${item.website}"?`)) {
                                  onDeletePassword(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Master Table Pagination Footer */}
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <span className="font-bold text-[11px]">
              Mostrando {tableSortedPasswords.length > 0 ? (safeTablePage - 1) * tablePageSize + 1 : 0} -{' '}
              {Math.min(safeTablePage * tablePageSize, tableSortedPasswords.length)} de {tableSortedPasswords.length} claves
            </span>

            {totalTablePages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeTablePage <= 1}
                  onClick={() => setTablePage(1)}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeTablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 py-1 text-[11px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                  {safeTablePage} / {totalTablePages}
                </span>
                <button
                  type="button"
                  disabled={safeTablePage >= totalTablePages}
                  onClick={() => setTablePage((p) => Math.min(p + 1, totalTablePages))}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeTablePage >= totalTablePages}
                  onClick={() => setTablePage(totalTablePages)}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= POST-IT STICKY NOTES GRID ================= */}
      {viewLayout === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* ================= IN-LINE CREATION CARD ================= */}
          {isCreating && (
            <div
              className={`relative rounded-3xl p-5 border-2 border-dashed flex flex-col justify-between transition-all duration-200 shadow-xl ${
                THEMES_MAP[newColor]?.card || THEMES_MAP.yellow.card
              }`}
            >
              {/* Visual Scotch Tape */}
              <div
                className={`w-24 h-4 mx-auto -mt-7 mb-3 rounded-xs backdrop-blur-md opacity-85 rotate-[-0.5deg] shadow-2xs ${
                  THEMES_MAP[newColor]?.tape || THEMES_MAP.yellow.tape
                }`}
              />

              {/* In-line Controls: Color Dots & Owner Select */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-black/10 dark:border-white/10">
                  {/* Color Selector Dots */}
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 opacity-60 mr-0.5" />
                    {POSTIT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewColor(c.id)}
                        className={`w-5 h-5 rounded-full border border-black/20 transition-transform cursor-pointer ${c.dotClass} ${
                          newColor === c.id ? 'scale-125 ring-2 ring-slate-950 dark:ring-white' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>

                  {/* Owner Select */}
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 opacity-60" />
                    <select
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      className="text-xs font-bold bg-white/70 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value="all">👥 Toda la Familia</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          👤 {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <input
                    ref={newTitleInputRef}
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Título de la clave o tabla (ej. Clave WiFi, Accesos Bancarios...)"
                    className="w-full px-3 py-2 text-sm sm:text-base font-black bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none focus:ring-2 focus:ring-amber-500/40"
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        handleSaveNewNote();
                      }
                    }}
                  />
                </div>

                {/* Mode Switcher: Texto Libre vs Modo Excel / Tabla */}
                <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setNewMode('text')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newMode === 'text'
                        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Texto Libre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMode('excel')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newMode === 'excel'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Modo Excel / Tabla</span>
                  </button>
                </div>

                {/* Dynamic Body based on Mode */}
                {newMode === 'excel' ? (
                  <div className="pt-1">
                    <ExcelTableEditor
                      tableData={newTableData}
                      onChange={setNewTableData}
                    />
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={4}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Escribe libremente aquí tu clave, recordatorio, instrucciones o códigos de acceso..."
                      className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none focus:ring-2 focus:ring-amber-500/40 resize-none font-sans leading-relaxed"
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          handleSaveNewNote();
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* In-line Bottom Actions */}
              <div className="pt-3 mt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelCreate}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveNewNote()}
                  disabled={!newTitle.trim() && (newMode === 'text' ? !newNotes.trim() : false)}
                  className="px-4 py-1.5 rounded-xl text-xs font-black bg-slate-950 text-white dark:bg-white dark:text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-105 disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Clave</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= EXISTING POST-IT NOTES ================= */}
          {filteredPasswords.map((item) => {
            const isBeingEdited = editingId === item.id;
            const colorKey = item.color && THEMES_MAP[item.color] ? item.color : 'yellow';
            const theme = THEMES_MAP[colorKey];
            const ownerBadge = getOwnerBadge(item.memberId);
            const isCopiedNote = copiedId === `note_${item.id}`;
            const webUrl = formatWebsiteUrl(item.website);
            const isTable = isTableContent(item.notes);
            const parsedTable = isTable ? parseTableContent(item.notes) : null;

            // Render in-line editor if this note is being edited
            if (isBeingEdited) {
              const editTheme = THEMES_MAP[editColor] || theme;
              return (
                <div
                  key={item.id}
                  className={`relative rounded-3xl p-5 border-2 border-amber-400 flex flex-col justify-between transition-all duration-200 shadow-xl ${editTheme.card}`}
                >
                  {/* Visual Scotch Tape */}
                  <div
                    className={`w-24 h-4 mx-auto -mt-7 mb-3 rounded-xs backdrop-blur-md opacity-85 rotate-[-0.5deg] shadow-2xs ${editTheme.tape}`}
                  />

                  {/* Edit Controls: Color Dots & Owner Select */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-black/10 dark:border-white/10">
                      {/* Color Dots */}
                      <div className="flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 opacity-60 mr-0.5" />
                        {POSTIT_COLORS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setEditColor(c.id)}
                            className={`w-5 h-5 rounded-full border border-black/20 transition-transform cursor-pointer ${c.dotClass} ${
                              editColor === c.id ? 'scale-125 ring-2 ring-slate-950 dark:ring-white' : 'opacity-70 hover:opacity-100'
                            }`}
                            title={c.name}
                          />
                        ))}
                      </div>

                      {/* Owner Select */}
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 opacity-60" />
                        <select
                          value={editMemberId}
                          onChange={(e) => setEditMemberId(e.target.value)}
                          className="text-xs font-bold bg-white/70 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-2 py-1 outline-none cursor-pointer"
                        >
                          <option value="all">👥 Toda la Familia</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              👤 {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Title Input */}
                    <div>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Título de la clave o tabla..."
                        className="w-full px-3 py-2 text-sm sm:text-base font-black bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none focus:ring-2 focus:ring-amber-500/40"
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            handleSaveEdit(item.id);
                          }
                        }}
                      />
                    </div>

                    {/* Mode Switcher for Editing */}
                    <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setEditMode('text')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          editMode === 'text'
                            ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-black'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Texto Libre</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode('excel')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          editMode === 'excel'
                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                            : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Modo Excel / Tabla</span>
                      </button>
                    </div>

                    {/* Note Content / Excel Grid based on mode */}
                    {editMode === 'excel' ? (
                      <div className="pt-1">
                        <ExcelTableEditor
                          tableData={editTableData}
                          onChange={setEditTableData}
                        />
                      </div>
                    ) : (
                      <div>
                        <textarea
                          rows={4}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Escribe aquí tu clave o recordatorio..."
                          className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none focus:ring-2 focus:ring-amber-500/40 resize-none font-sans leading-relaxed"
                          onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                              handleSaveEdit(item.id);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Edit Bottom Actions */}
                  <div className="pt-3 mt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(item.id)}
                      disabled={!editTitle.trim() && (editMode === 'text' ? !editNotes.trim() : false)}
                      className="px-4 py-1.5 rounded-xl text-xs font-black bg-slate-950 text-white dark:bg-white dark:text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-105 disabled:opacity-40"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                </div>
              );
            }

            {/* ================= VIEW ONLY CARD ================= */}
            return (
              <div
                key={item.id}
                className={`relative rounded-3xl p-5 border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between group ${theme.card}`}
              >
                {/* Visual Scotch Tape */}
                <div
                  className={`w-24 h-4 mx-auto -mt-7 mb-3 rounded-xs backdrop-blur-md opacity-85 rotate-[-0.5deg] shadow-2xs ${theme.tape}`}
                />

                {/* Top Bar: Owner Badge & Type Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black border backdrop-blur-xs ${theme.badge}`}
                  >
                    {ownerBadge.isAll ? (
                      <Users className="w-3 h-3" />
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${ownerBadge.avatarColor}`} />
                    )}
                    <span>{ownerBadge.label}</span>
                  </div>

                  {isTable && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Excel</span>
                    </span>
                  )}
                </div>

                {/* Card Body: Title & Content */}
                <div className="space-y-2.5 flex-1">
                  {/* Title */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug break-words">
                      {item.website}
                    </h2>
                    {webUrl && (
                      <a
                        href={webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100 shrink-0"
                        title={`Abrir enlace: ${item.website}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Content: Excel Table or Free-form Note */}
                  {isTable && parsedTable ? (
                    <div className="pt-1">
                      <ExcelTableViewer
                        table={parsedTable}
                        title={item.website}
                        themeId={item.color}
                        canEdit={isAdmin}
                        onUpdateTable={(updatedTable) => {
                          onUpdatePassword(item.id, {
                            notes: serializeTableContent(updatedTable),
                          });
                        }}
                      />
                    </div>
                  ) : item.notes ? (
                    <div className="p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5">
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans select-text">
                        {item.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 text-xs italic opacity-40">Sin contenido adicional</div>
                  )}
                </div>

                {/* Card Bottom Bar: Copy & Actions */}
                <div className="pt-3 mt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2">
                  {/* Copy Note Button */}
                  <button
                    type="button"
                    onClick={() => {
                      let full = '';
                      if (isTable && parsedTable) {
                        full = tableToTSV(parsedTable);
                      } else {
                        const parts: string[] = [];
                        if (item.website) parts.push(`🔑 ${item.website}`);
                        if (item.email) parts.push(`👤 Usuario: ${item.email}`);
                        if (item.password) parts.push(`🔒 Contraseña: ${item.password}`);
                        if (item.notes) parts.push(`📝 ${item.notes}`);
                        full = parts.join('\n\n').trim() || item.website || '';
                      }
                      handleCopy(full, `note_${item.id}`);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-white/40 dark:bg-black/20 ${theme.actionHover}`}
                    title={isTable ? 'Copiar tabla en formato Excel' : 'Copiar clave'}
                  >
                    {isCopiedNote ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 opacity-75" />
                        <span>{isTable ? 'Copiar Tabla' : 'Copiar'}</span>
                      </>
                    )}
                  </button>

                  {/* Actions Group */}
                  <div className="flex items-center gap-1">
                    {/* Share WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(item)}
                      className="p-1.5 rounded-xl hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer"
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Admin Edit Button (In-Line) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 opacity-75 hover:opacity-100 transition-colors cursor-pointer"
                        title="Editar clave"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Admin Delete Button */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas eliminar la clave "${item.website}"?`)) {
                            onDeletePassword(item.id);
                          }
                        }}
                        className="p-1.5 rounded-xl hover:bg-red-500/20 text-red-700 dark:text-red-400 transition-colors cursor-pointer"
                        title="Eliminar clave"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
