import React, { useState, useMemo } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Globe,
  ExternalLink,
  Share2,
  Lock,
  User,
  Users,
  Key,
  Mail,
  FileText,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Member, PasswordItem } from '../types';
import { sounds } from '../lib/sound';

interface PasswordsViewProps {
  passwords: PasswordItem[];
  members: Member[];
  activeMember: Member | null;
  isAdmin?: boolean;
  onOpenAddPassword: () => void;
  onEditPassword: (password: PasswordItem) => void;
  onDeletePassword: (id: string) => void;
  onLock?: () => void;
  fontSize?: 'normal' | 'large' | 'xlarge';
}

const POSTIT_THEMES: Record<string, {
  card: string;
  tape: string;
  badge: string;
  actionHover: string;
  borderAccent: string;
  name: string;
}> = {
  yellow: {
    card: 'bg-amber-100/95 dark:bg-amber-950/80 border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 shadow-md shadow-amber-900/5',
    tape: 'bg-amber-300/70 dark:bg-amber-600/40 border border-amber-400/40',
    badge: 'bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 border-amber-300/80',
    actionHover: 'hover:bg-amber-200/90 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-200',
    borderAccent: 'border-amber-400',
    name: 'Amarillo',
  },
  pink: {
    card: 'bg-pink-100/95 dark:bg-pink-950/80 border-pink-300/80 dark:border-pink-700/60 text-pink-950 dark:text-pink-100 shadow-md shadow-pink-900/5',
    tape: 'bg-pink-300/70 dark:bg-pink-600/40 border border-pink-400/40',
    badge: 'bg-pink-200/90 dark:bg-pink-900/80 text-pink-950 dark:text-pink-200 border-pink-300/80',
    actionHover: 'hover:bg-pink-200/90 dark:hover:bg-pink-900/70 text-pink-900 dark:text-pink-200',
    borderAccent: 'border-pink-400',
    name: 'Rosa',
  },
  green: {
    card: 'bg-emerald-100/95 dark:bg-emerald-950/80 border-emerald-300/80 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100 shadow-md shadow-emerald-900/5',
    tape: 'bg-emerald-300/70 dark:bg-emerald-600/40 border border-emerald-400/40',
    badge: 'bg-emerald-200/90 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 border-emerald-300/80',
    actionHover: 'hover:bg-emerald-200/90 dark:hover:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200',
    borderAccent: 'border-emerald-400',
    name: 'Verde',
  },
  blue: {
    card: 'bg-sky-100/95 dark:bg-sky-950/80 border-sky-300/80 dark:border-sky-700/60 text-sky-950 dark:text-sky-100 shadow-md shadow-sky-900/5',
    tape: 'bg-sky-300/70 dark:bg-sky-600/40 border border-sky-400/40',
    badge: 'bg-sky-200/90 dark:bg-sky-900/80 text-sky-950 dark:text-sky-200 border-sky-300/80',
    actionHover: 'hover:bg-sky-200/90 dark:hover:bg-sky-900/70 text-sky-900 dark:text-sky-200',
    borderAccent: 'border-sky-400',
    name: 'Azul',
  },
  purple: {
    card: 'bg-purple-100/95 dark:bg-purple-950/80 border-purple-300/80 dark:border-purple-700/60 text-purple-950 dark:text-purple-100 shadow-md shadow-purple-900/5',
    tape: 'bg-purple-300/70 dark:bg-purple-600/40 border border-purple-400/40',
    badge: 'bg-purple-200/90 dark:bg-purple-900/80 text-purple-950 dark:text-purple-200 border-purple-300/80',
    actionHover: 'hover:bg-purple-200/90 dark:hover:bg-purple-900/70 text-purple-900 dark:text-purple-200',
    borderAccent: 'border-purple-400',
    name: 'Lavanda',
  },
  orange: {
    card: 'bg-orange-100/95 dark:bg-orange-950/80 border-orange-300/80 dark:border-orange-700/60 text-orange-950 dark:text-orange-100 shadow-md shadow-orange-900/5',
    tape: 'bg-orange-300/70 dark:bg-orange-600/40 border border-orange-400/40',
    badge: 'bg-orange-200/90 dark:bg-orange-900/80 text-orange-950 dark:text-orange-200 border-orange-300/80',
    actionHover: 'hover:bg-orange-200/90 dark:hover:bg-orange-900/70 text-orange-900 dark:text-orange-200',
    borderAccent: 'border-orange-400',
    name: 'Naranja',
  },
};

export const PasswordsView: React.FC<PasswordsViewProps> = ({
  passwords,
  members,
  activeMember,
  isAdmin = false,
  onOpenAddPassword,
  onEditPassword,
  onDeletePassword,
  onLock,
  fontSize = 'normal',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toggle reveal password for a specific item
  const toggleReveal = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    let text = `📌 *NOTA RÁPIDA / ACCESO*\n` +
      `🏷️ *Título:* ${item.website}\n`;
    if (item.email) {
      text += `👤 *Usuario / Correo:* \`${item.email}\`\n`;
    }
    if (item.password) {
      text += `🔑 *Contraseña / PIN:* \`${item.password}\`\n`;
    }
    if (item.notes) {
      text += `📝 *Nota:* ${item.notes}\n`;
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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
      const matchEmail = (p.email || '').toLowerCase().includes(term);
      const matchNotes = (p.notes || '').toLowerCase().includes(term);
      const matchCat = (p.category || '').toLowerCase().includes(term);
      return matchWeb || matchEmail || matchNotes || matchCat;
    });
  }, [passwords, isAdmin, activeMember, selectedMemberFilter, selectedColorFilter, searchTerm]);

  const formatWebsiteUrl = (web: string) => {
    let clean = web.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('.')) {
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
                  Tablón de Notas Rápidas y Claves
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                  {filteredPasswords.length} {filteredPasswords.length === 1 ? 'nota' : 'notas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdmin
                  ? 'Panel de notas tipo Post-it con escritura libre, claves y asignación de propietario'
                  : `Notas rápidas y accesos asignados a ${activeMember?.name || 'ti'} (Solo Lectura)`}
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

            {/* Add Post-It Button (Admin Only) */}
            {isAdmin && (
              <button
                onClick={onOpenAddPassword}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 border border-amber-600"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nueva Nota Post-It</span>
              </button>
            )}
          </div>
        </div>

        {/* Read-only Member Information Banner */}
        {!isAdmin && (
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Vista de Solo Lectura:</strong> Puedes consultar y copiar tus notas y accesos asignados. Solo el administrador puede crear o modificar notas.
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
              placeholder="Buscar por título, contenido libre, usuario, servicio..."
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
            {Object.entries(POSTIT_THEMES).map(([colorKey, theme]) => {
              const isSelected = selectedColorFilter === colorKey;
              return (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => setSelectedColorFilter(colorKey)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border ${theme.tape} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={`Filtrar por color ${theme.name}`}
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
      {filteredPasswords.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/50 shadow-2xs">
            <StickyNote className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {searchTerm || selectedColorFilter !== 'all' || selectedMemberFilter !== 'all'
                ? 'No se encontraron notas con estos filtros'
                : 'No hay notas adhesivas registradas'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedColorFilter !== 'all' || selectedMemberFilter !== 'all'
                ? 'Intenta restablecer la búsqueda o cambiar los filtros superiores.'
                : isAdmin
                ? 'Crea tu primera nota tipo Post-It para anotar claves WiFi, accesos de streaming o recordatorios.'
                : 'Aún no tienes notas o contraseñas asignadas por el administrador.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={onOpenAddPassword}
              className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs border border-amber-600"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Primera Nota Adhesiva</span>
            </button>
          )}
        </div>
      )}

      {/* ================= POST-IT STICKY NOTES GRID ================= */}
      {filteredPasswords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPasswords.map((item) => {
            const colorKey = item.color && POSTIT_THEMES[item.color] ? item.color : 'yellow';
            const theme = POSTIT_THEMES[colorKey];
            const ownerBadge = getOwnerBadge(item.memberId);
            const isRevealed = !!revealedPasswords[item.id];
            const isCopiedPass = copiedId === `pass_${item.id}`;
            const isCopiedEmail = copiedId === `email_${item.id}`;
            const isCopiedNote = copiedId === `note_${item.id}`;
            const isCopiedAll = copiedId === `all_${item.id}`;
            const webUrl = formatWebsiteUrl(item.website);

            return (
              <div
                key={item.id}
                className={`relative rounded-3xl p-5 border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between group ${theme.card}`}
              >
                {/* Visual Scotch / Washi Tape at Top */}
                <div
                  className={`w-24 h-4 mx-auto -mt-7 mb-3 rounded-xs backdrop-blur-md opacity-85 rotate-[-0.5deg] shadow-2xs ${theme.tape}`}
                />

                {/* Top Bar: Owner Badge & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
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

                  {item.category && item.category !== 'General' && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 opacity-80">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Card Main Body */}
                <div className="space-y-3 flex-1">
                  {/* Title / Service */}
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

                  {/* Free-form Note Text Content */}
                  {item.notes && (
                    <div className="relative p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5 group/note">
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans select-text">
                        {item.notes}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.notes || '', `note_${item.id}`)}
                        className="absolute top-2 right-2 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer"
                        title="Copiar texto de la nota"
                      >
                        {isCopiedNote ? (
                          <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Optional Credential Boxes */}
                  {(item.email || item.password) && (
                    <div className="space-y-2 pt-1">
                      {/* Correo / Usuario */}
                      {item.email && (
                        <div className="flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/5 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            <span className="font-semibold truncate select-all">{item.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.email, `email_${item.id}`)}
                            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                            title="Copiar usuario / correo"
                          >
                            {isCopiedEmail ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 opacity-70" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Contraseña / Clave */}
                      {item.password && (
                        <div className="flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/5 text-xs font-mono">
                          <div className="flex items-center gap-2 min-w-0">
                            <Key className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            <span className="font-bold truncate select-all tracking-wider">
                              {isRevealed ? item.password : '••••••••••••'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleReveal(item.id)}
                              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title={isRevealed ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3.5 h-3.5 opacity-80" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 opacity-80" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.password, `pass_${item.id}`)}
                              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title="Copiar contraseña"
                            >
                              {isCopiedPass ? (
                                <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 opacity-70" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom Bar: Date & Actions */}
                <div className="pt-3 mt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2">
                  {/* Copy All Info Button */}
                  <button
                    type="button"
                    onClick={() => {
                      let full = `📌 ${item.website}\n`;
                      if (item.email) full += `👤 Usuario: ${item.email}\n`;
                      if (item.password) full += `🔑 Clave: ${item.password}\n`;
                      if (item.notes) full += `📝 Nota: ${item.notes}\n`;
                      handleCopy(full.trim(), `all_${item.id}`);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-white/40 dark:bg-black/20 ${theme.actionHover}`}
                    title="Copiar todo el contenido de la nota"
                  >
                    {isCopiedAll ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 opacity-75" />
                        <span>Copiar Todo</span>
                      </>
                    )}
                  </button>

                  {/* Actions Group */}
                  <div className="flex items-center gap-1">
                    {/* Share WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(item)}
                      className={`p-1.5 rounded-xl hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer`}
                      title="Compartir nota por WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Admin Edit Button */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onEditPassword(item)}
                        className={`p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 opacity-75 hover:opacity-100 transition-colors cursor-pointer`}
                        title="Editar nota adhesiva"
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
                        className={`p-1.5 rounded-xl hover:bg-red-500/20 text-red-700 dark:text-red-400 transition-colors cursor-pointer`}
                        title="Eliminar nota adhesiva"
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
