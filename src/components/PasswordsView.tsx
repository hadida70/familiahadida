import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Copy,
  Check,
  Edit2,
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
} from 'lucide-react';
import { Member, PasswordItem } from '../types';
import { sounds } from '../lib/sound';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // In-line creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newMemberId, setNewMemberId] = useState('all');
  const [newColor, setNewColor] = useState('yellow');
  const newTitleInputRef = useRef<HTMLInputElement>(null);

  // In-line editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editMemberId, setEditMemberId] = useState('all');
  const [editColor, setEditColor] = useState('yellow');

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
    let text = `📌 *${item.website || 'NOTA RÁPIDA'}*\n\n` +
      `${item.notes || ''}\n`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text.trim())}`, '_blank');
  };

  // Start in-line creation
  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setNewTitle('');
    setNewNotes('');
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
    const trimmedNotes = newNotes.trim();
    if (!trimmedTitle && !trimmedNotes) return;

    onAddPassword({
      website: trimmedTitle || (trimmedNotes ? trimmedNotes.slice(0, 30) : 'Nota Rápida'),
      notes: trimmedNotes,
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
    setEditNotes(item.notes || '');
    setEditMemberId(item.memberId || 'all');
    setEditColor(item.color || 'yellow');
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
    const trimmedNotes = editNotes.trim();
    if (!trimmedTitle && !trimmedNotes) return;

    onUpdatePassword(id, {
      website: trimmedTitle || 'Nota Rápida',
      notes: trimmedNotes,
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
                  Tablón de Notas Rápidas
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                  {filteredPasswords.length} {filteredPasswords.length === 1 ? 'nota' : 'notas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdmin
                  ? 'Notas tipo Post-it con escritura libre, títulos y usuario asignado'
                  : `Notas rápidas asignadas a ${activeMember?.name || 'ti'} (Solo Lectura)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
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
                <span>Nueva Nota</span>
              </button>
            )}
          </div>
        </div>

        {/* Read-only Member Information Banner */}
        {!isAdmin && (
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Modo Consulta:</strong> Puedes leer y copiar tus notas rápidas asignadas. Solo el administrador puede crear o modificar notas.
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
              placeholder="Buscar notas por título o texto..."
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

      {/* ================= EMPTY STATE (When no creation & no notes) ================= */}
      {filteredPasswords.length === 0 && !isCreating && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/50 shadow-2xs">
            <StickyNote className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {searchTerm || selectedColorFilter !== 'all' || selectedMemberFilter !== 'all'
                ? 'No se encontraron notas con estos filtros'
                : 'No hay notas registradas'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedColorFilter !== 'all' || selectedMemberFilter !== 'all'
                ? 'Intenta restablecer la búsqueda o cambiar los filtros.'
                : isAdmin
                ? 'Crea tu primera nota adhesiva con escritura libre y asígnala al familiar deseado.'
                : 'Aún no tienes notas asignadas por el administrador.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={handleStartCreate}
              className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs border border-amber-600"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Primera Nota</span>
            </button>
          )}
        </div>
      )}

      {/* ================= POST-IT STICKY NOTES GRID ================= */}
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
                  placeholder="Título de la nota (ej. Clave WiFi, Instrucciones...)"
                  className="w-full px-3 py-2 text-sm sm:text-base font-black bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none focus:ring-2 focus:ring-amber-500/40"
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      handleSaveNewNote();
                    }
                  }}
                />
              </div>

              {/* Free-form Note Textarea */}
              <div>
                <textarea
                  rows={4}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Escribe libremente aquí tu nota, recordatorio, instrucciones o claves..."
                  className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none focus:ring-2 focus:ring-amber-500/40 resize-none font-sans leading-relaxed"
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      handleSaveNewNote();
                    }
                  }}
                />
              </div>
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
                disabled={!newTitle.trim() && !newNotes.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-slate-950 text-white dark:bg-white dark:text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-105 disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Nota</span>
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
                      placeholder="Título de la nota..."
                      className="w-full px-3 py-2 text-sm sm:text-base font-black bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none focus:ring-2 focus:ring-amber-500/40"
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          handleSaveEdit(item.id);
                        }
                      }}
                    />
                  </div>

                  {/* Note Content Textarea */}
                  <div>
                    <textarea
                      rows={4}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Escribe aquí tu nota..."
                      className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none focus:ring-2 focus:ring-amber-500/40 resize-none font-sans leading-relaxed"
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          handleSaveEdit(item.id);
                        }
                      }}
                    />
                  </div>
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
                    disabled={!editTitle.trim() && !editNotes.trim()}
                    className="px-4 py-1.5 rounded-xl text-xs font-black bg-slate-950 text-white dark:bg-white dark:text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-105 disabled:opacity-40"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>
            );
          }

          // ================= VIEW ONLY CARD =================
          return (
            <div
              key={item.id}
              className={`relative rounded-3xl p-5 border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between group ${theme.card}`}
            >
              {/* Visual Scotch Tape */}
              <div
                className={`w-24 h-4 mx-auto -mt-7 mb-3 rounded-xs backdrop-blur-md opacity-85 rotate-[-0.5deg] shadow-2xs ${theme.tape}`}
              />

              {/* Top Bar: Owner Badge */}
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
              </div>

              {/* Card Body: Title & Free-form Notes */}
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

                {/* Free-form Note Content */}
                {item.notes ? (
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
                    const full = `${item.website ? `📌 ${item.website}\n\n` : ''}${item.notes || ''}`.trim();
                    handleCopy(full, `note_${item.id}`);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-white/40 dark:bg-black/20 ${theme.actionHover}`}
                  title="Copiar texto de la nota"
                >
                  {isCopiedNote ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 opacity-75" />
                      <span>Copiar</span>
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
                      title="Editar nota in-line"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Admin Delete Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Seguro que deseas eliminar la nota "${item.website}"?`)) {
                          onDeletePassword(item.id);
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-red-500/20 text-red-700 dark:text-red-400 transition-colors cursor-pointer"
                      title="Eliminar nota"
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
    </div>
  );
};
