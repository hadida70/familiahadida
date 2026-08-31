import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Edit3, Trash2 } from 'lucide-react';
import { CustomList } from '../types';

interface EditListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: CustomList | null;
  onUpdateList: (id: string, updates: Partial<CustomList>) => void;
  onDeleteList?: (id: string) => void;
  canDelete?: boolean;
}

const ICONS = [
  '🛒', '💊', '🔨', '🛍️', '🍎', '🥩', '🥖', '☕',
  '🧼', '📦', '🎂', '✈️', '👔', '💻', '🚗', '🐾',
  '📚', '🏖️', '🎮', '🏠', '🍼', '🪴', '🔧', '🎯'
];

export const EditListModal: React.FC<EditListModalProps> = ({
  isOpen,
  onClose,
  list,
  onUpdateList,
  onDeleteList,
  canDelete = false,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🛒');
  const [description, setDescription] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (list) {
      setName(list.name || '');
      setIcon(list.icon || '🛒');
      setDescription(list.description || '');
      setShowConfirmDelete(false);
    }
  }, [list, isOpen]);

  if (!isOpen || !list) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateList(list.id, {
      name: name.trim(),
      icon,
      description: description.trim(),
    });

    onClose();
  };

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
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Editar Lista
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Modifica el nombre y emoji de tu lista
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
            {/* List Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título de la Lista <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0">
                  {icon}
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Supermercado, Farmacia, Ferretería..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Icon Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Selecciona un Ícono / Emoji
              </label>
              <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-28 overflow-y-auto">
                {ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                      icon === emoji
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 scale-105'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descripción (Opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Compras generales y víveres para el hogar"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:border-emerald-500 outline-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                {canDelete && onDeleteList && (
                  !showConfirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(true)}
                      className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar Lista</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-xl border border-rose-200 dark:border-rose-900">
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 pl-1">
                        ¿Confirmar?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteList(list.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer"
                      >
                        Sí, Borrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(false)}
                        className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs font-bold"
                      >
                        No
                      </button>
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-red-600 border-2 border-red-600 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
