import React, { useState, useMemo } from 'react';
import {
  Plus,
  Send,
} from 'lucide-react';
import { Member, PersonalRecord, DataCategory } from '../types';
import { PersonalRecordCard } from './PersonalRecordCard';

interface PersonalRecordsViewProps {
  records: PersonalRecord[];
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
  onViewPhoto: (record: PersonalRecord) => void;
}

export const PersonalRecordsView: React.FC<PersonalRecordsViewProps> = ({
  records,
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
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(activeMember?.id || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Keep member in sync if activeMember changes from outside
  React.useEffect(() => {
    if (!isAdmin && activeMember) {
      setSelectedMemberId(activeMember.id);
    } else if (activeMember && selectedMemberId !== 'all') {
      setSelectedMemberId(activeMember.id);
    }
  }, [activeMember, isAdmin]);

  const handleMemberChange = (id: string) => {
    if (!isAdmin) return;
    setSelectedMemberId(id);
    if (id !== 'all') {
      const found = members.find((m) => m.id === id);
      if (found) onSelectMember(found);
    }
  };

  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
  };

  // Distinct categories from both predefined list and records
  const allCategoryNames = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => set.add(c.name));
    records.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [categories, records]);

  // Filtered records (For non-admins, strictly isolated to activeMember.id)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // If not admin, strictly allow only activeMember records
      if (!isAdmin && activeMember) {
        if (r.memberId && r.memberId !== activeMember.id) {
          return false;
        }
      } else if (selectedMemberId !== 'all' && r.memberId !== selectedMemberId) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && r.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [records, selectedMemberId, selectedCategory, isAdmin, activeMember]);

  // Counts per member
  const recordCountsByMember = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      counts[r.memberId] = (counts[r.memberId] || 0) + 1;
    });
    return counts;
  }, [records]);

  const currentViewingMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div id="personal-records-section" className="space-y-4 max-w-4xl mx-auto mb-10">
      {/* Filter Card: Integrantes + Categorías + Subcategorías Jerárquicas con Botones a la derecha */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left side: Filters (Integrantes y Categorías) */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Member Filter: Only visible for Admin */}
            {isAdmin ? (
              <div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider px-0.5 flex items-center justify-between">
                  <span>Filtrar por Integrante:</span>
                  {selectedMemberId !== 'all' && (
                    <button
                      onClick={() => setSelectedMemberId('all')}
                      className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      Ver todos
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <button
                    onClick={() => handleMemberChange('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border cursor-pointer ${
                      selectedMemberId === 'all'
                        ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Todos</span>
                    <span className="ml-1 text-[10px] opacity-80">({records.length})</span>
                  </button>

                  {members.map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    const count = recordCountsByMember[m.id] || 0;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleMemberChange(m.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{m.name}</span>
                        {count > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                              isSelected
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Documentos personales de:
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    👤 {activeMember?.name}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {filteredRecords.length} {filteredRecords.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider px-0.5 flex items-center justify-between">
                <span>Categoría de Datos:</span>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                  >
                    Todas las categorías
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  📁 Todas ({records.length})
                </button>

                {allCategoryNames.map((catName) => {
                  const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();
                  const catObj = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
                  const countInCat = records.filter(
                    (r) => r.category?.toLowerCase() === catName.toLowerCase()
                  ).length;

                  return (
                    <button
                      key={catName}
                      onClick={() => handleCategoryChange(catName)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all border flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-300'
                      }`}
                    >
                      {catObj?.color && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: catObj.color }}
                        />
                      )}
                      <span>{catName}</span>
                      {countInCat > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {countInCat}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Quick Button to Add New Category (Admin Only) */}
                {isAdmin && (
                  <button
                    onClick={onOpenManageCategories}
                    className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0"
                    title="Gestionar y agregar categorías"
                    aria-label="Agregar o gestionar categorías"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Action Buttons */}
          <div className="flex flex-row md:flex-col items-center justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-4">
            {isAdmin ? (
              <button
                onClick={() => onOpenAddRecord()}
                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center cursor-pointer transition-all shadow-2xs"
                title="Adjuntar / Agregar dato o documento (Admin)"
                aria-label="Adjuntar dato"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <div
                className="hidden md:flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 text-center max-w-[90px]"
                title="Solo el administrador (Jaime) puede subir o eliminar documentos"
              >
                <span>🔒 Solo lectura</span>
              </div>
            )}

            {records.length > 0 && (
              <button
                onClick={() => onOpenSendRecord()}
                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center cursor-pointer transition-all shadow-2xs"
                title="Enviar o compartir datos"
                aria-label="Enviar datos"
              >
                <Send className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Personal Records */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRecords.map((record) => {
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
