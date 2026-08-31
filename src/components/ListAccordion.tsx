import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomList, GroceryItem, Member } from '../types';
import { ItemCard } from './ItemCard';
import { ConfirmDeleteListModal } from './ConfirmDeleteListModal';

interface ListAccordionProps {
  lists: CustomList[];
  activeListId: string;
  isAdmin?: boolean;
  onSelectList: (id: string) => void;
  onOpenCreateList: () => void;
  onOpenEditList: (list: CustomList) => void;
  onDeleteList: (id: string) => void;
  onOpenAddItem: (listId?: string) => void;
  onOpenShare: (listId?: string) => void;
  onQuickAddItem: (name: string, listId: string) => void;
  items: GroceryItem[];
  currentMember: Member | null;
  members: Member[];
  onToggleComplete: (item: GroceryItem) => void;
  onReassign: (itemId: string, newMemberId: string) => void;
  onDeleteItem: (itemId: string) => void;
  fontSize: 'normal' | 'large' | 'xlarge';
}

export const ListAccordion: React.FC<ListAccordionProps> = ({
  lists,
  activeListId,
  isAdmin = false,
  onSelectList,
  onOpenCreateList,
  onOpenEditList,
  onDeleteList,
  onOpenShare,
  onQuickAddItem,
  items,
  currentMember,
  members,
  onToggleComplete,
  onReassign,
  onDeleteItem,
  fontSize,
}) => {
  const [quickInputs, setQuickInputs] = useState<Record<string, string>>({});
  const [listToDelete, setListToDelete] = useState<CustomList | null>(null);

  const handleInputChange = (listId: string, value: string) => {
    setQuickInputs((prev) => ({ ...prev, [listId]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    const text = (quickInputs[listId] || '').trim();
    if (!text) return;
    onQuickAddItem(text, listId);
    setQuickInputs((prev) => ({ ...prev, [listId]: '' }));
  };

  return (
    <div className="space-y-2 max-w-3xl mx-auto mb-6">
      {/* Subtle top row for New List */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span className="font-semibold">Listas Familiares</span>
        {isAdmin && (
          <button
            onClick={onOpenCreateList}
            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 text-red-600 border border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva lista</span>
          </button>
        )}
      </div>

      {/* Compact Accordion Items */}
      <div className="space-y-2">
        {lists.map((list) => {
          const isExpanded = list.id === activeListId;
          const listItems = items.filter(
            (i) => i.listId === list.id || (!i.listId && list.id === 'list_supermercado')
          );
          const pendingCount = listItems.filter((i) => !i.completed).length;
          const inputValue = quickInputs[list.id] || '';

          return (
            <div
              key={list.id}
              className={`rounded-2xl border transition-all overflow-hidden bg-white dark:bg-slate-900 ${
                isExpanded
                  ? 'border-red-500/40 shadow-xs ring-1 ring-red-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Clean compact header */}
              <div
                onClick={() => onSelectList(list.id)}
                className="flex items-center justify-between px-3.5 py-3 cursor-pointer select-none"
              >
                {/* Left: Icon & Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-xl leading-none shrink-0">{list.icon}</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {list.name}
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200/60 dark:border-red-900/60">
                      {pendingCount}
                    </span>
                  )}
                </div>

                {/* Right: Actions */}
                <div
                  className="flex items-center gap-1 shrink-0 ml-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShare(list.id);
                    }}
                    title={`Compartir ${list.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditList(list);
                      }}
                      title={`Editar ${list.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {lists.length > 1 && isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setListToDelete(list);
                      }}
                      title="Eliminar lista"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div
                    onClick={() => onSelectList(list.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-red-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80"
                  >
                    {/* Compact input field */}
                    <form
                      onSubmit={(e) => handleFormSubmit(e, list.id)}
                      className="flex items-center gap-2 mb-3 mt-1"
                    >
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleInputChange(list.id, e.target.value)}
                        placeholder={`Agregar producto a ${list.name}...`}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 text-red-600 border border-red-500 font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0 shadow-2xs"
                      >
                        + Agregar
                      </button>
                    </form>

                    {/* Products list */}
                    <div className="space-y-1.5">
                      {listItems.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-3">
                          Lista vacía. Escribe arriba para agregar.
                        </p>
                      ) : (
                        listItems.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            members={members}
                            currentMember={currentMember}
                            onToggleComplete={onToggleComplete}
                            onReassign={onReassign}
                            onDeleteItem={onDeleteItem}
                            fontSize={fontSize}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
