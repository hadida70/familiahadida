import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { CustomList } from '../types';

interface ConfirmDeleteListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: CustomList | null;
  onConfirmDelete: (id: string) => void;
}

export const ConfirmDeleteListModal: React.FC<ConfirmDeleteListModalProps> = ({
  isOpen,
  onClose,
  list,
  onConfirmDelete,
}) => {
  if (!isOpen || !list) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 overflow-hidden"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 text-2xl shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5">
              ¿Eliminar la lista "{list.name}"?
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
              Se eliminará permanentemente la lista <strong className="text-slate-800 dark:text-slate-200">{list.icon} {list.name}</strong> junto con todos sus productos guardados.
            </p>

            <div className="w-full flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirmDelete(list.id);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
