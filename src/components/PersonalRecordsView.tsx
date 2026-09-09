import React, { useState, useMemo } from 'react';
import {
  Plus,
  Send,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
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
  onViewPhoto: (record: PersonalRecord, attachmentIndex?: number) => void;
  onUpdateRecordTodos?: (recordId: string, todos: any[]) => void;
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
  onUpdateRecordTodos,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(activeMember?.id || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

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

  // Group filtered records by Category
  const groupedCategories = useMemo(() => {
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
  }, [filteredRecords, categories]);

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
    setCollapsedCategories(allCollapsed);
  };

  const expandAll = () => {
    setCollapsedCategories({});
  };

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

      {/* ================= CATEGORY-GROUPED RECORDS VIEW ================= */}
      {groupedCategories.length > 0 ? (
        <div className="space-y-4">
          {/* Controls to Collapse / Expand All (if more than 1 category) */}
          {groupedCategories.length > 1 && (
            <div className="flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold">
                {groupedCategories.length} {groupedCategories.length === 1 ? 'categoría' : 'categorías'} con datos ({filteredRecords.length} {filteredRecords.length === 1 ? 'registro' : 'registros'})
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            No se encontraron datos personales
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedCategory !== 'all'
              ? `No hay datos registrados en la categoría "${selectedCategory}".`
              : 'Aún no hay documentos ni datos personales registrados.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => onOpenAddRecord(selectedCategory !== 'all' ? { category: selectedCategory } : undefined)}
              className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar primer dato</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
