import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Send,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Copy,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  Share2,
  User,
  Users,
  X,
  Menu,
  Save,
  Palette,
} from 'lucide-react';
import { Member, PersonalRecord, DataCategory, PasswordItem } from '../types';
import { PersonalRecordCard } from './PersonalRecordCard';
import { sounds } from '../lib/sound';

interface PersonalRecordsViewProps {
  records: PersonalRecord[];
  passwords?: PasswordItem[];
  members: Member[];
  categories?: DataCategory[];
  activeMember: Member | null;
  isAdmin?: boolean;
  onSelectMember: (member: Member) => void;
  onOpenAddRecord: (preset?: { category?: string; subcategory?: string }) => void;
  onOpenSendRecord: (record?: PersonalRecord) => void;
  onOpenManageCategories: () => void;
  onAddCategory?: (category: Partial<DataCategory>) => Promise<void>;
  onAddSubcategory?: (categoryId: string, subcategoryName: string) => Promise<void>;
  onEditRecord: (record: PersonalRecord) => void;
  onDeleteRecord: (id: string) => void;
  onViewPhoto: (record: PersonalRecord, attachmentIndex?: number) => void;
  onUpdateRecordTodos?: (recordId: string, todos: any[]) => void;
  onAddPassword?: (password: Partial<PasswordItem>) => void;
  onUpdatePassword?: (id: string, updates: Partial<PasswordItem>) => void;
  onDeletePassword?: (id: string) => void;
}

const POSTIT_COLORS = [
  {
    id: 'yellow',
    name: 'Amarillo',
    card: 'bg-amber-100/95 dark:bg-amber-950/80 border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 shadow-md shadow-amber-900/5',
    tape: 'bg-amber-300/70 dark:bg-amber-600/40 border border-amber-400/40',
    badge: 'bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 border-amber-300/80',
    actionHover: 'hover:bg-amber-200/90 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-200',
    dotClass: 'bg-amber-400 border-amber-500',
  },
  {
    id: 'pink',
    name: 'Rosa',
    card: 'bg-pink-100/95 dark:bg-pink-950/80 border-pink-300/80 dark:border-pink-700/60 text-pink-950 dark:text-pink-100 shadow-md shadow-pink-900/5',
    tape: 'bg-pink-300/70 dark:bg-pink-600/40 border border-pink-400/40',
    badge: 'bg-pink-200/90 dark:bg-pink-900/80 text-pink-950 dark:text-pink-200 border-pink-300/80',
    actionHover: 'hover:bg-pink-200/90 dark:hover:bg-pink-900/70 text-pink-900 dark:text-pink-200',
    dotClass: 'bg-pink-400 border-pink-500',
  },
  {
    id: 'green',
    name: 'Verde',
    card: 'bg-emerald-100/95 dark:bg-emerald-950/80 border-emerald-300/80 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100 shadow-md shadow-emerald-900/5',
    tape: 'bg-emerald-300/70 dark:bg-emerald-600/40 border border-emerald-400/40',
    badge: 'bg-emerald-200/90 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 border-emerald-300/80',
    actionHover: 'hover:bg-emerald-200/90 dark:hover:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200',
    dotClass: 'bg-emerald-400 border-emerald-500',
  },
  {
    id: 'blue',
    name: 'Azul',
    card: 'bg-sky-100/95 dark:bg-sky-950/80 border-sky-300/80 dark:border-sky-700/60 text-sky-950 dark:text-sky-100 shadow-md shadow-sky-900/5',
    tape: 'bg-sky-300/70 dark:bg-sky-600/40 border border-sky-400/40',
    badge: 'bg-sky-200/90 dark:bg-sky-900/80 text-sky-950 dark:text-sky-200 border-sky-300/80',
    actionHover: 'hover:bg-sky-200/90 dark:hover:bg-sky-900/70 text-sky-900 dark:text-sky-200',
    dotClass: 'bg-sky-400 border-sky-500',
  },
  {
    id: 'purple',
    name: 'Lavanda',
    card: 'bg-purple-100/95 dark:bg-purple-950/80 border-purple-300/80 dark:border-purple-700/60 text-purple-950 dark:text-purple-100 shadow-md shadow-purple-900/5',
    tape: 'bg-purple-300/70 dark:bg-purple-600/40 border border-purple-400/40',
    badge: 'bg-purple-200/90 dark:bg-purple-900/80 text-purple-950 dark:text-purple-200 border-purple-300/80',
    actionHover: 'hover:bg-purple-200/90 dark:hover:bg-purple-900/70 text-purple-900 dark:text-purple-200',
    dotClass: 'bg-purple-400 border-purple-500',
  },
  {
    id: 'orange',
    name: 'Naranja',
    card: 'bg-orange-100/95 dark:bg-orange-950/80 border-orange-300/80 dark:border-orange-700/60 text-orange-950 dark:text-orange-100 shadow-md shadow-orange-900/5',
    tape: 'bg-orange-300/70 dark:bg-orange-600/40 border border-orange-400/40',
    badge: 'bg-orange-200/90 dark:bg-orange-900/80 text-orange-950 dark:text-orange-200 border-orange-300/80',
    actionHover: 'hover:bg-orange-200/90 dark:hover:bg-orange-900/70 text-orange-900 dark:text-orange-200',
    dotClass: 'bg-orange-400 border-orange-500',
  },
];

const THEMES_MAP = POSTIT_COLORS.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<string, typeof POSTIT_COLORS[0]>);

export const PersonalRecordsView: React.FC<PersonalRecordsViewProps> = ({
  records,
  passwords = [],
  members,
  categories = [],
  activeMember,
  isAdmin = false,
  onSelectMember,
  onOpenAddRecord,
  onOpenSendRecord,
  onOpenManageCategories,
  onEditRecord,
  onDeleteRecord,
  onViewPhoto,
  onUpdateRecordTodos,
  onAddPassword,
  onUpdatePassword,
  onDeletePassword,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // In-line note creation & editing state inside Datos
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteMemberId, setNewNoteMemberId] = useState('all');
  const [newNoteColor, setNewNoteColor] = useState('yellow');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteMemberId, setEditNoteMemberId] = useState('all');
  const [editNoteColor, setEditNoteColor] = useState('yellow');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const noteTitleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingNote) {
      setTimeout(() => {
        noteTitleInputRef.current?.focus();
      }, 50);
    }
  }, [isCreatingNote]);

  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    if (id !== 'all') {
      const found = members.find((m) => m.id === id);
      if (found) onSelectMember(found);
    }
  };

  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
  };

  // Filtered passwords/notes for the selected member
  const filteredNotes = useMemo(() => {
    let baseList = passwords;
    if (!isAdmin && activeMember) {
      baseList = passwords.filter(
        (p) => p.memberId === activeMember.id || p.memberId === 'all' || !p.memberId
      );
    }

    if (selectedMemberId !== 'all') {
      baseList = baseList.filter(
        (p) => p.memberId === selectedMemberId || p.memberId === 'all'
      );
    }

    return baseList;
  }, [passwords, isAdmin, activeMember, selectedMemberId]);

  // Distinct categories from both predefined list and records
  const allCategoryNames = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => set.add(c.name));
    records.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [categories, records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedMemberId !== 'all' && r.memberId !== selectedMemberId) {
        return false;
      }
      if (selectedCategory !== 'all' && selectedCategory !== 'notas_claves' && r.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [records, selectedMemberId, selectedCategory]);

  // Counts per member (includes records and notes)
  const memberCounts = useMemo(() => {
    const counts: Record<string, { records: number; notes: number; total: number }> = {};
    members.forEach((m) => {
      counts[m.id] = { records: 0, notes: 0, total: 0 };
    });

    records.forEach((r) => {
      if (counts[r.memberId]) {
        counts[r.memberId].records += 1;
        counts[r.memberId].total += 1;
      }
    });

    passwords.forEach((p) => {
      if (p.memberId && counts[p.memberId]) {
        counts[p.memberId].notes += 1;
        counts[p.memberId].total += 1;
      }
    });

    return counts;
  }, [records, passwords, members]);

  // Group filtered records by Category
  const groupedCategories = useMemo(() => {
    if (selectedCategory === 'notas_claves') {
      return [];
    }

    const groupMap = new Map<string, PersonalRecord[]>();

    filteredRecords.forEach((record) => {
      const cat = record.category || 'General';
      if (!groupMap.has(cat)) {
        groupMap.set(cat, []);
      }
      groupMap.get(cat)!.push(record);
    });

    const result: Array<{
      categoryName: string;
      categoryObj?: DataCategory;
      records: PersonalRecord[];
    }> = [];

    // Push predefined categories that have matching items
    categories.forEach((catObj) => {
      const matchingKey = Array.from(groupMap.keys()).find(
        (k) => k.toLowerCase() === catObj.name.toLowerCase()
      );
      if (matchingKey) {
        result.push({
          categoryName: catObj.name,
          categoryObj: catObj,
          records: groupMap.get(matchingKey) || [],
        });
        groupMap.delete(matchingKey);
      }
    });

    // Push any remaining custom categories
    groupMap.forEach((recList, catName) => {
      result.push({
        categoryName: catName,
        categoryObj: undefined,
        records: recList,
      });
    });

    return result;
  }, [filteredRecords, categories, selectedCategory]);

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    groupedCategories.forEach((g) => {
      allCollapsed[g.categoryName] = true;
    });
    allCollapsed['notas_claves'] = true;
    setCollapsedCategories(allCollapsed);
  };

  const expandAll = () => {
    setCollapsedCategories({});
  };

  // Note copy helper
  const handleCopyNote = (text: string, identifier: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    sounds.playCheckSound();
    setCopiedNoteId(identifier);
    setTimeout(() => {
      setCopiedNoteId((curr) => (curr === identifier ? null : curr));
    }, 2000);
  };

  // Note WhatsApp share helper
  const handleShareNoteWhatsApp = (item: PasswordItem) => {
    let text = `🔑 *${item.website || 'CLAVE'}*\n\n` +
      `${item.notes || ''}\n`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text.trim())}`, '_blank');
  };

  // Note save new
  const handleSaveNewNote = () => {
    if (!onAddPassword) return;
    const trimmedTitle = newNoteTitle.trim();
    const trimmedText = newNoteText.trim();
    if (!trimmedTitle && !trimmedText) return;

    onAddPassword({
      website: trimmedTitle || (trimmedText ? trimmedText.slice(0, 30) : 'Clave'),
      notes: trimmedText,
      memberId: newNoteMemberId || (selectedMemberId !== 'all' ? selectedMemberId : 'all'),
      color: newNoteColor || 'yellow',
      category: 'General',
    });

    sounds.playCheckSound();
    setIsCreatingNote(false);
    setNewNoteTitle('');
    setNewNoteText('');
  };

  // Note save edit
  const handleSaveEditNote = (id: string) => {
    if (!onUpdatePassword) return;
    const trimmedTitle = editNoteTitle.trim();
    const trimmedText = editNoteText.trim();
    if (!trimmedTitle && !trimmedText) return;

    onUpdatePassword(id, {
      website: trimmedTitle || 'Clave',
      notes: trimmedText,
      memberId: editNoteMemberId || 'all',
      color: editNoteColor || 'yellow',
    });

    sounds.playCheckSound();
    setEditingNoteId(null);
  };

  const getOwnerBadge = (memberId?: string) => {
    if (!memberId || memberId === 'all') {
      return {
        label: 'Toda la Familia',
        isAll: true,
        avatarColor: 'bg-amber-600',
      };
    }
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      return {
        label: 'Compartido',
        isAll: true,
        avatarColor: 'bg-slate-500',
      };
    }
    return {
      label: member.name,
      isAll: false,
      avatarColor: member.avatarColor || 'bg-blue-600',
    };
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

  const isNotesCategoryActive = selectedCategory === 'all' || selectedCategory === 'notas_claves';
  const showNotesGroup = isNotesCategoryActive && (filteredNotes.length > 0 || selectedCategory === 'notas_claves' || isCreatingNote);

  const renderSidebarContent = (isMobileDrawer: boolean = false) => {
    const onSelect = () => {
      if (isMobileDrawer) {
        setIsMobileDrawerOpen(false);
      }
    };

    return (
      <div className="space-y-5">
        {/* Quick Action Buttons (Admin + Share) */}
        <div className="space-y-2">
          {isAdmin ? (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onSelect();
                  onOpenAddRecord();
                }}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm shadow-red-500/20 cursor-pointer transition-all group active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
                <span>+ AGREGAR DOCUMENTO</span>
              </button>

              {onAddPassword && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect();
                    setIsCreatingNote(true);
                    setNewNoteMemberId(selectedMemberId !== 'all' ? selectedMemberId : 'all');
                    setNewNoteColor('yellow');
                    setNewNoteTitle('');
                    setNewNoteText('');
                    setCollapsedCategories((prev) => ({ ...prev, notas_claves: false }));
                  }}
                  className="w-full py-2 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs border border-amber-600 cursor-pointer transition-all active:scale-98"
                >
                  <StickyNote className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ NUEVA CLAVE</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500">🔒 Modo Solo Lectura</span>
            </div>
          )}

          {records.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onSelect();
                onOpenSendRecord();
              }}
              className="w-full py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all active:scale-98"
            >
              <Send className="w-3.5 h-3.5 text-red-500" />
              <span>Enviar Datos / Adjuntos</span>
            </button>
          )}
        </div>

        {/* Section: Integrantes de la Familia */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>INTEGRANTES</span>
            </span>
            {selectedMemberId !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMemberId('all');
                  onSelect();
                }}
                className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="space-y-1">
            {/* All Members Button */}
            <button
              type="button"
              onClick={() => {
                handleMemberChange('all');
                onSelect();
              }}
              className={`w-full px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                selectedMemberId === 'all'
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-black shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                  selectedMemberId === 'all' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  👥
                </div>
                <span>Toda la Familia</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                selectedMemberId === 'all'
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {records.length + passwords.length}
              </span>
            </button>

            {/* Individual Members */}
            {members.map((m) => {
              const isSelected = selectedMemberId === m.id;
              const countObj = memberCounts[m.id];
              const totalCount = countObj ? countObj.total : 0;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    handleMemberChange(m.id);
                    onSelect();
                  }}
                  className={`w-full px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-black shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${m.avatarColor || 'bg-blue-600'}`}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{m.name}</span>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold shrink-0 ${
                    isSelected
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {totalCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Categorías de Datos */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>CATEGORÍAS</span>
            </span>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  handleCategoryChange('all');
                  onSelect();
                }}
                className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
              >
                Todas
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto scrollbar-none pr-0.5">
            {/* Todas las categorías */}
            <button
              type="button"
              onClick={() => {
                handleCategoryChange('all');
                onSelect();
              }}
              className={`w-full px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span>📁</span>
                <span>Todas las categorías</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                selectedCategory === 'all'
                  ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {records.length + filteredNotes.length}
              </span>
            </button>

            {/* 🔑 Claves (Sticky Notes) */}
            <button
              type="button"
              onClick={() => {
                handleCategoryChange('notas_claves');
                onSelect();
              }}
              className={`w-full px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                selectedCategory === 'notas_claves'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs border border-amber-600'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/40'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <StickyNote className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Claves</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                selectedCategory === 'notas_claves'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-200/90 text-amber-950 dark:bg-amber-900 dark:text-amber-200'
              }`}>
                {filteredNotes.length}
              </span>
            </button>

            {/* Individual Categories */}
            {allCategoryNames.map((catName) => {
              const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();
              const catObj = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
              const countInCat = records.filter((r) => {
                if (selectedMemberId !== 'all' && r.memberId !== selectedMemberId) return false;
                return r.category?.toLowerCase() === catName.toLowerCase();
              }).length;

              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => {
                    handleCategoryChange(catName);
                    onSelect();
                  }}
                  className={`w-full px-3 py-2 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-black shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: catObj?.color || '#94a3b8' }}
                    />
                    <span className="truncate">{catName}</span>
                  </div>
                  {countInCat > 0 && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold shrink-0 ${
                      isSelected
                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {countInCat}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onSelect();
                onOpenManageCategories();
              }}
              className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 text-slate-600 dark:text-slate-400 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gestionar Categorías</span>
            </button>
          )}
        </div>

        {/* Quick Summary Footnote */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>📄 Documentos:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{records.length}</span>
          </div>
          <div className="flex justify-between">
            <span>📌 Notas & Claves:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{passwords.length}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="personal-records-section" className="w-full mb-10">
      {/* ================= MOBILE TOP BAR WITH HAMBURGER BUTTON (TIPO GMAIL) ================= */}
      <div className="block lg:hidden mb-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {/* Hamburger 3-Stripes Button (tipo Gmail) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-extrabold text-xs transition-all cursor-pointer active:scale-95 border border-slate-200/80 dark:border-slate-700 shadow-2xs"
          >
            <Menu className="w-4 h-4 text-red-600 stroke-[2.5]" />
            <span>Filtros & Categorías</span>
            {(selectedMemberId !== 'all' || selectedCategory !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            )}
          </button>

          {/* Quick Action Buttons for Mobile */}
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onOpenAddRecord()}
                className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="Agregar Documento"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Doc</span>
              </button>
            )}
            {isAdmin && onAddPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNote(true);
                  setNewNoteMemberId(selectedMemberId !== 'all' ? selectedMemberId : 'all');
                  setNewNoteColor('yellow');
                  setNewNoteTitle('');
                  setNewNoteText('');
                  setCollapsedCategories((prev) => ({ ...prev, notas_claves: false }));
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1 shadow-2xs border border-amber-600 cursor-pointer active:scale-95 transition-all"
                title="Nueva Nota Rápida"
              >
                <StickyNote className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nota</span>
              </button>
            )}
            {records.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenSendRecord()}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 transition-all shadow-2xs"
                title="Enviar Datos / Adjuntos"
              >
                <Send className="w-3.5 h-3.5 text-red-500" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Row on Mobile */}
        {(selectedMemberId !== 'all' || selectedCategory !== 'all') && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none text-[11px]">
            <span className="font-bold text-slate-400 shrink-0">Filtro:</span>
            {selectedMemberId !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/60 shrink-0">
                👤 {members.find((m) => m.id === selectedMemberId)?.name || 'Integrante'}
                <button
                  type="button"
                  onClick={() => setSelectedMemberId('all')}
                  className="hover:text-red-800 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 shrink-0">
                {selectedCategory === 'notas_claves' ? '🔑 Claves' : `📁 ${selectedCategory}`}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-red-600 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedMemberId('all');
                setSelectedCategory('all');
              }}
              className="text-[10px] text-red-600 font-bold hover:underline shrink-0 ml-auto cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* ================= MOBILE SLIDE-OVER DRAWER (TIPO GMAIL) ================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Slide-Out Panel */}
          <div className="relative flex flex-col w-[85%] max-w-xs h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-10 overflow-hidden animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm font-bold">
                  <Folder className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Filtros & Categorías
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Familia Hadida</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
              {renderSidebarContent(true)}
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN RESPONSIVE CONTAINER (SIDEBAR ON DESKTOP + MAIN CONTENT) ================= */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        
        {/* ================= DESKTOP LEFT SIDEBAR (lg:flex) ================= */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 sticky top-20 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
          {renderSidebarContent(false)}
        </aside>

        {/* ================= RIGHT MAIN CONTENT AREA ================= */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Active Filter Indicator / Breadcrumb */}
          {(selectedMemberId !== 'all' || selectedCategory !== 'all') && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/40 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-500 dark:text-slate-400">Filtrando por:</span>
                {selectedMemberId !== 'all' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 text-red-600 font-black border border-red-200 shadow-2xs flex items-center gap-1">
                    👤 {members.find((m) => m.id === selectedMemberId)?.name || 'Integrante'}
                    <button
                      type="button"
                      onClick={() => setSelectedMemberId('all')}
                      className="hover:text-red-800 ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 text-red-600 font-black border border-red-200 shadow-2xs flex items-center gap-1">
                    📁 {selectedCategory === 'notas_claves' ? 'Claves' : selectedCategory}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="hover:text-red-800 ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMemberId('all');
                  setSelectedCategory('all');
                }}
                className="text-xs font-black text-red-600 hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* ================= CATEGORY-GROUPED RECORDS & NOTAS VIEW ================= */}
          {(groupedCategories.length > 0 || showNotesGroup) ? (
            <div className="space-y-4">
          {/* Controls to Collapse / Expand All */}
          {(groupedCategories.length + (showNotesGroup ? 1 : 0)) > 1 && (
            <div className="flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold">
                {groupedCategories.length + (showNotesGroup ? 1 : 0)} categorías ({filteredRecords.length + (showNotesGroup ? filteredNotes.length : 0)} registros)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="hover:text-red-600 font-bold transition-colors cursor-pointer"
                >
                  Expandir todas
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-red-600 font-bold transition-colors cursor-pointer"
                >
                  Colapsar todas
                </button>
              </div>
            </div>
          )}

          {/* ================= 🔑 CLAVES POST-IT GROUP ================= */}
          {showNotesGroup && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-2xs overflow-hidden transition-all">
              {/* Notas Category Header */}
              <div
                onClick={() => toggleCategoryCollapse('notas_claves')}
                className="px-4 sm:px-5 py-3.5 bg-amber-50/60 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/60 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-amber-100/50 dark:hover:bg-amber-950/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                    <StickyNote className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        Claves
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-amber-200/90 dark:bg-amber-900 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                        {filteredNotes.length} {filteredNotes.length === 1 ? 'clave' : 'claves'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Admin quick add note */}
                  {isAdmin && onAddPassword && !isCreatingNote && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreatingNote(true);
                        setNewNoteMemberId(selectedMemberId !== 'all' ? selectedMemberId : 'all');
                        setNewNoteColor('yellow');
                        setNewNoteTitle('');
                        setNewNoteText('');
                        setCollapsedCategories((prev) => ({ ...prev, notas_claves: false }));
                      }}
                      className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer border border-amber-600"
                      title="Agregar nueva clave"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="hidden sm:inline">Nueva Clave</span>
                    </button>
                  )}

                  {/* Chevron expand/collapse */}
                  <button
                    type="button"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {collapsedCategories['notas_claves'] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Notas Body: Grid of Post-it Cards */}
              {!collapsedCategories['notas_claves'] && (
                <div className="p-3 sm:p-4 bg-amber-50/20 dark:bg-amber-950/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* In-line creation inside Datos */}
                    {isCreatingNote && (
                      <div
                        className={`relative rounded-3xl p-4 border-2 border-dashed flex flex-col justify-between transition-all duration-200 shadow-xl ${
                          THEMES_MAP[newNoteColor]?.card || THEMES_MAP.yellow.card
                        }`}
                      >
                        {/* Scotch Tape */}
                        <div
                          className={`w-20 h-3.5 mx-auto -mt-6 mb-2 rounded-xs backdrop-blur-md opacity-85 rotate-[-0.5deg] shadow-2xs ${
                            THEMES_MAP[newNoteColor]?.tape || THEMES_MAP.yellow.tape
                          }`}
                        />

                        {/* Controls: Color Dots & Owner */}
                        <div className="space-y-2.5 flex-1">
                          <div className="flex items-center justify-between gap-1.5 flex-wrap pb-1.5 border-b border-black/10 dark:border-white/10">
                            <div className="flex items-center gap-1">
                              {POSTIT_COLORS.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setNewNoteColor(c.id)}
                                  className={`w-4 h-4 rounded-full border border-black/20 cursor-pointer ${c.dotClass} ${
                                    newNoteColor === c.id ? 'scale-125 ring-2 ring-slate-950 dark:ring-white' : 'opacity-70'
                                  }`}
                                  title={c.name}
                                />
                              ))}
                            </div>

                            <select
                              value={newNoteMemberId}
                              onChange={(e) => setNewNoteMemberId(e.target.value)}
                              className="text-[11px] font-bold bg-white/70 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer"
                            >
                              <option value="all">👥 Familia</option>
                              {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                  👤 {m.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <input
                            ref={noteTitleInputRef}
                            type="text"
                            value={newNoteTitle}
                            onChange={(e) => setNewNoteTitle(e.target.value)}
                            placeholder="Título de la clave..."
                            className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-black bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none"
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                handleSaveNewNote();
                              }
                            }}
                          />

                          <textarea
                            rows={3}
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            placeholder="Escribe aquí tu clave..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl placeholder-slate-500/70 outline-none resize-none"
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                handleSaveNewNote();
                              }
                            }}
                          />
                        </div>

                        {/* Actions */}
                        <div className="pt-2 mt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsCreatingNote(false)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-black/10 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveNewNote}
                            disabled={!newNoteTitle.trim() && !newNoteText.trim()}
                            className="px-3 py-1 rounded-lg text-xs font-black bg-slate-950 text-white dark:bg-white dark:text-slate-950 cursor-pointer shadow-xs disabled:opacity-40"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing Notes */}
                    {filteredNotes.map((note) => {
                      const isEditing = editingNoteId === note.id;
                      const colorKey = note.color && THEMES_MAP[note.color] ? note.color : 'yellow';
                      const theme = THEMES_MAP[colorKey];
                      const ownerBadge = getOwnerBadge(note.memberId);
                      const isCopied = copiedNoteId === `datos_note_${note.id}`;
                      const webUrl = formatWebsiteUrl(note.website);

                      if (isEditing) {
                        const editTheme = THEMES_MAP[editNoteColor] || theme;
                        return (
                          <div
                            key={note.id}
                            className={`relative rounded-3xl p-4 border-2 border-amber-400 flex flex-col justify-between transition-all duration-200 shadow-xl ${editTheme.card}`}
                          >
                            <div
                              className={`w-20 h-3.5 mx-auto -mt-6 mb-2 rounded-xs backdrop-blur-md opacity-85 rotate-[-0.5deg] shadow-2xs ${editTheme.tape}`}
                            />

                            <div className="space-y-2.5 flex-1">
                              <div className="flex items-center justify-between gap-1.5 flex-wrap pb-1.5 border-b border-black/10 dark:border-white/10">
                                <div className="flex items-center gap-1">
                                  {POSTIT_COLORS.map((c) => (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => setEditNoteColor(c.id)}
                                      className={`w-4 h-4 rounded-full border border-black/20 cursor-pointer ${c.dotClass} ${
                                        editNoteColor === c.id ? 'scale-125 ring-2 ring-slate-950 dark:ring-white' : 'opacity-70'
                                      }`}
                                      title={c.name}
                                    />
                                  ))}
                                </div>

                                <select
                                  value={editNoteMemberId}
                                  onChange={(e) => setEditNoteMemberId(e.target.value)}
                                  className="text-[11px] font-bold bg-white/70 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer"
                                >
                                  <option value="all">👥 Familia</option>
                                  {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      👤 {m.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <input
                                type="text"
                                value={editNoteTitle}
                                onChange={(e) => setEditNoteTitle(e.target.value)}
                                placeholder="Título de la clave..."
                                className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-black bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl outline-none"
                              />

                              <textarea
                                rows={3}
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                                placeholder="Escribe aquí tu clave..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white/60 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl outline-none resize-none"
                              />
                            </div>

                            <div className="pt-2 mt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-black/10 cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditNote(note.id)}
                                disabled={!editNoteTitle.trim() && !editNoteText.trim()}
                                className="px-3 py-1 rounded-lg text-xs font-black bg-slate-950 text-white dark:bg-white dark:text-slate-950 cursor-pointer shadow-xs disabled:opacity-40"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={note.id}
                          className={`relative rounded-3xl p-4 border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between group ${theme.card}`}
                        >
                          <div
                            className={`w-20 h-3.5 mx-auto -mt-6 mb-2 rounded-xs backdrop-blur-md opacity-85 rotate-[-0.5deg] shadow-2xs ${theme.tape}`}
                          />

                          <div className="flex items-center justify-between gap-1 mb-2">
                            <div
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black border ${theme.badge}`}
                            >
                              {ownerBadge.isAll ? (
                                <Users className="w-3 h-3" />
                              ) : (
                                <span className={`w-2 h-2 rounded-full ${ownerBadge.avatarColor}`} />
                              )}
                              <span>{ownerBadge.label}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs sm:text-sm font-black tracking-tight leading-snug break-words">
                                {note.website}
                              </h4>
                              {webUrl && (
                                <a
                                  href={webUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-0.5 rounded opacity-70 hover:opacity-100 shrink-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {note.notes ? (
                              <div className="p-2.5 rounded-xl bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5">
                                <p className="text-[11px] sm:text-xs whitespace-pre-wrap leading-relaxed font-sans select-text">
                                  {note.notes}
                                </p>
                              </div>
                            ) : null}
                          </div>

                          <div className="pt-2 mt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const full = `${note.website ? `🔑 ${note.website}\n\n` : ''}${note.notes || ''}`.trim();
                                handleCopyNote(full, `datos_note_${note.id}`);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer bg-white/40 dark:bg-black/20 ${theme.actionHover}`}
                              title="Copiar clave"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                                  <span>¡Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5 opacity-75" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleShareNoteWhatsApp(note)}
                                className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer"
                                title="Compartir por WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              {isAdmin && onUpdatePassword && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditNoteTitle(note.website || '');
                                    setEditNoteText(note.notes || '');
                                    setEditNoteMemberId(note.memberId || 'all');
                                    setEditNoteColor(note.color || 'yellow');
                                    setIsCreatingNote(false);
                                  }}
                                  className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-75 hover:opacity-100 transition-colors cursor-pointer"
                                  title="Editar clave"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {isAdmin && onDeletePassword && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`¿Seguro que deseas eliminar la clave "${note.website}"?`)) {
                                      onDeletePassword(note.id);
                                    }
                                  }}
                                  className="p-1 rounded-lg hover:bg-red-500/20 text-red-700 dark:text-red-400 transition-colors cursor-pointer"
                                  title="Eliminar clave"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= REGULAR PERSONAL RECORDS CATEGORY GROUPS ================= */}
          {groupedCategories.map((group) => {
            const isCollapsed = !!collapsedCategories[group.categoryName];
            const catColor = group.categoryObj?.color || '#dc2626';

            return (
              <div
                key={group.categoryName}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-all"
              >
                {/* Category Header Banner */}
                <div
                  onClick={() => toggleCategoryCollapse(group.categoryName)}
                  className="px-4 sm:px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: catColor }}
                    >
                      {isCollapsed ? (
                        <Folder className="w-4 h-4" />
                      ) : (
                        <FolderOpen className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                          {group.categoryName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                          {group.records.length} {group.records.length === 1 ? 'dato' : 'datos'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Admin quick add in this category */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddRecord({ category: group.categoryName });
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-red-600 border border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        title={`Agregar dato en ${group.categoryName}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Agregar</span>
                      </button>
                    )}

                    {/* Chevron expand/collapse */}
                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Group Body: Grid of Records in this Category */}
                {!isCollapsed && (
                  <div className="p-3 sm:p-4 bg-slate-50/30 dark:bg-slate-950/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {group.records.map((record) => {
                        const member = members.find((m) => m.id === record.memberId);
                        return (
                          <PersonalRecordCard
                            key={record.id}
                            record={record}
                            member={member}
                            isAdmin={isAdmin}
                            onEdit={onEditRecord}
                            onDelete={onDeleteRecord}
                            onViewPhoto={onViewPhoto}
                            onSendRecord={onOpenSendRecord}
                            onUpdateRecordTodos={onUpdateRecordTodos}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <Folder className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No se encontraron datos personales ni notas
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedCategory !== 'all'
              ? `No hay datos registrados en la categoría seleccionada.`
              : 'Aún no hay documentos ni notas registradas.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => onOpenAddRecord(selectedCategory !== 'all' && selectedCategory !== 'notas_claves' ? { category: selectedCategory } : undefined)}
              className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar primer dato</span>
            </button>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
