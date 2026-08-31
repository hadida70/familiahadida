import React from 'react';
import { motion } from 'motion/react';
import { Check, Trash2 } from 'lucide-react';
import { GroceryItem, Member } from '../types';
import { sounds } from '../lib/sound';

interface ItemCardProps {
  item: GroceryItem;
  members?: Member[];
  currentMember?: Member | null;
  isAdmin?: boolean;
  onToggleComplete: (item: GroceryItem) => void;
  onReassign?: (itemId: string, newMemberId: string) => void;
  onDeleteItem: (itemId: string) => void;
  fontSize?: 'normal' | 'large' | 'xlarge';
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  currentMember,
  isAdmin = false,
  onToggleComplete,
  onDeleteItem,
}) => {
  const isEffectiveAdmin = isAdmin || currentMember?.role === 'admin';

  const handleCheckboxClick = () => {
    if (!item.completed) {
      sounds.playCheckSound();
    }
    onToggleComplete(item);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`group flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl transition-colors select-none ${
        item.completed
          ? 'bg-slate-50/70 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500'
          : 'bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
      }`}
    >
      <div
        onClick={handleCheckboxClick}
        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
      >
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
            item.completed
              ? 'bg-white dark:bg-slate-900 border-2 border-red-600 text-red-600'
              : 'border border-slate-300 dark:border-slate-600 group-hover:border-red-500 bg-white dark:bg-slate-900'
          }`}
        >
          {item.completed && <Check className="w-3.5 h-3.5 stroke-[3] text-red-600" />}
        </div>

        <span
          className={`text-sm font-medium truncate ${
            item.completed ? 'line-through text-slate-400' : ''
          }`}
        >
          {item.title}
        </span>
      </div>

      {isEffectiveAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteItem(item.id);
          }}
          className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors shrink-0 cursor-pointer opacity-80 group-hover:opacity-100"
          title="Eliminar producto (Administrador)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
};
