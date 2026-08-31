import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Zap, UserCheck, Sparkles, Layers } from 'lucide-react';
import { Member, GroceryItem, CustomList } from '../types';
import { QUICK_SUGGESTIONS } from '../lib/categories';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Partial<GroceryItem>) => void;
  members: Member[];
  currentMember: Member | null;
  lists: CustomList[];
  activeListId: string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  members,
  currentMember,
  lists,
  activeListId,
}) => {
  const [title, setTitle] = useState('');
  const [selectedListId, setSelectedListId] = useState(activeListId);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedToId, setAssignedToId] = useState<string>(
    members.length > 1 ? members[1].id : members[0]?.id || 'unassigned'
  );
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (activeListId) {
      setSelectedListId(activeListId);
    }
  }, [activeListId, isOpen]);

  if (!isOpen) return null;

  const currentList = lists.find((l) => l.id === selectedListId) || lists[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddItem({
      title: title.trim(),
      listId: selectedListId || lists[0]?.id || 'list_supermercado',
      quantity: quantity.trim(),
      notes: notes.trim(),
      assignedToId,
      urgent,
    });

    // Reset form
    setTitle('');
    setQuantity('');
    setNotes('');
    setUrgent(false);
    onClose();
  };

  const applySuggestion = (s: { name: string; emoji: string }) => {
    setTitle(s.name);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
                {currentList?.icon || '🛒'}
              </div>
              <div>
                <h2 className="font-extrabold text-lg md:text-xl">
                  Agregar a {currentList ? currentList.name : 'Lista'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-emerald-800 text-emerald-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* List Selection (if multiple lists exist) */}
            {lists.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Seleccionar Lista de Destino:</span>
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {lists.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedListId(l.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedListId === l.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{l.icon}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Suggestions Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sugerencias Rápidas:</span>
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {QUICK_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 hover:text-emerald-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <span>{s.emoji}</span> {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre del producto o tarea *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Leche descremada, Clavos 2 pulgadas, Aspirina..."
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-900 dark:text-white font-medium text-base outline-none transition-colors"
              />
            </div>

            {/* Assign Member */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-red-600" />
                <span>Asignar compra a un integrante *</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {members.map((m) => {
                  const isSelected = assignedToId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAssignedToId(m.id)}
                      className={`px-3 py-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 text-red-600 border-2 border-red-600 shadow-xs ring-1 ring-red-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Cantidad / Presentación
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ej. 2 Kilos, 1 Paquete, 500g"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white font-medium text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Notas adicionales
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Marca preferida, detalles..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white font-medium text-sm outline-none"
                />
              </div>
            </div>

            {/* Urgent Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600 fill-amber-500" />
                <div>
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    ¿Marcar como Tarea / Compra Urgente?
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Enviará una alerta push destacada al integrante asignado.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!title.trim()}
                className="px-6 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-red-600 border-2 border-red-600 font-bold text-sm shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Agregar Producto</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
