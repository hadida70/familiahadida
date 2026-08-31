import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, Share2 } from 'lucide-react';
import { CustomList, GroceryItem, Member } from '../types';
import { ConfirmDeleteListModal } from './ConfirmDeleteListModal';

interface ListTabsBarProps {
  lists: CustomList[];
  activeListId: string;
  isAdmin?: boolean;
  onSelectList: (id: string) => void;
  onOpenCreateList: () => void;
  onOpenEditList: (list: CustomList) => void;
  onDeleteList: (id: string) => void;
  onOpenAddItem: () => void;
  onOpenShare: () => void;
  items: GroceryItem[];
  currentMember: Member | null;
}

export const ListTabsBar: React.FC<ListTabsBarProps> = ({
  lists,
  activeListId,
  isAdmin = false,
  onSelectList,
  onOpenCreateList,
  onOpenEditList,
  onDeleteList,
  onOpenAddItem,
  onOpenShare,
  items,
  currentMember,
}) => {
  const [listToDelete, setListToDelete] = useState<CustomList | null>(null);
  const isEffectiveAdmin = isAdmin || currentMember?.role === 'admin';

  return (
    <div
      id="list-tabs-bar"
      className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200 dark:border-slate-800 mb-4"
    >
      {/* Top right action: Nueva Lista button (Admin only) */}
      {isEffectiveAdmin && (
        <div className="flex items-center justify-end mb-2.5">
          <button
            onClick={onOpenCreateList}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Nueva Lista</span>
          </button>
        </div>
      )}

      {/* Vertical List of Categories/Lists */}
      <div className="flex flex-col gap-2.5">
        {lists.map((list) => {
          const isActive = list.id === activeListId;
          const listItems = items.filter(
            (i) => i.listId === list.id || (!i.listId && list.id === 'list_supermercado')
          );
          const pendingCount = listItems.filter((i) => !i.completed).length;
          const totalCount = listItems.length;

          return (
            <div
              key={list.id}
              onClick={() => onSelectList(list.id)}
              className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none flex-wrap sm:flex-nowrap gap-2 ${
                isActive
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {/* Left Info: Icon, Name & Action Buttons (Agregar Producto & Compartir Lista) */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
                <span className="text-xl leading-none shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 dark:bg-black/20">
                  {list.icon}
                </span>

                <div className="flex items-center gap-2 min-w-fit">
                  <span className="font-bold text-sm truncate">{list.name}</span>
                  {isActive && (
                    <span className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500 text-white dark:bg-white dark:text-emerald-900">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      Activa
                    </span>
                  )}
                </div>

                {/* Inline Buttons next to Title for this specific list */}
                <div
                  className="flex items-center gap-1.5 ml-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectList(list.id);
                      onOpenAddItem();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-xs'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                    title={`Agregar producto a ${list.name}`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span className="hidden sm:inline">Agregar</span>
                    <span className="sm:hidden">+</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectList(list.id);
                      onOpenShare();
                    }}
                    className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                        : 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                    }`}
                    title={`Compartir ${list.name} por WhatsApp / SMS`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Compartir</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Badges and Admin Actions */}
              <div
                className="flex items-center gap-2 shrink-0 ml-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Count badge */}
                <div
                  className={`px-2 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title={`${pendingCount} pendientes de ${totalCount} artículos`}
                >
                  <span>{pendingCount}</span>
                  <span className="text-[10px] opacity-75 font-normal">/ {totalCount}</span>
                </div>

                {/* Edit Button (Admin only) */}
                {isEffectiveAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditList(list);
                    }}
                    title={`Editar ${list.name}`}
                    className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'text-white/90 hover:text-white hover:bg-white/20'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}

                {/* Delete Button (if admin and more than 1 list) */}
                {lists.length > 1 && isEffectiveAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setListToDelete(list);
                    }}
                    title="Eliminar lista"
                    className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'text-rose-300 hover:text-white hover:bg-rose-600/40'
                        : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteListModal
        isOpen={!!listToDelete}
        onClose={() => setListToDelete(null)}
        list={listToDelete}
        onConfirmDelete={(id) => {
          onDeleteList(id);
          setListToDelete(null);
        }}
      />
    </div>
  );
};
