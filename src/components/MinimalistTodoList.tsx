import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Square,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { TodoItem, Member } from '../types';
import { sounds } from '../lib/sound';

interface MinimalistTodoListProps {
  todos: TodoItem[];
  members: Member[];
  activeMember: Member | null;
  isAdmin: boolean;
  onAddTodo: (todo: Partial<TodoItem>) => void;
  onUpdateTodo: (id: string, updates: Partial<TodoItem>) => void;
  onDeleteTodo: (id: string) => void;
  onClearCompleted: () => void;
}

export const MinimalistTodoList: React.FC<MinimalistTodoListProps> = ({
  todos = [],
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onClearCompleted,
}) => {
  // Input state
  const [newText, setNewText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Confirmation state for clearing
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Completed statistics
  const completedCount = todos.filter((t) => t.completed).length;

  // Handle Add Todo
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    onAddTodo({
      text: newText.trim(),
      completed: false,
    });

    setNewText('');
  };

  // Handle Toggle Complete
  const handleToggle = (todo: TodoItem) => {
    const nextCompleted = !todo.completed;
    if (nextCompleted) {
      sounds.playCheckSound();
    }
    onUpdateTodo(todo.id, {
      completed: nextCompleted,
    });
  };

  // Handle Edit Submit
  const handleSaveEdit = (id: string) => {
    if (!editingText.trim()) return;
    onUpdateTodo(id, { text: editingText.trim() });
    setEditingId(null);
    setEditingText('');
  };

  // Filtered Todos (only by search query)
  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos;
    const q = searchQuery.toLowerCase();
    return todos.filter((todo) => todo.text.toLowerCase().includes(q));
  }, [todos, searchQuery]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 pb-16">
      {/* 1. Directly the Input Form to Write the Task */}
      <form
        onSubmit={handleAddSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-2"
      >
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Escribe una tarea y presiona Enter..."
          autoFocus
          className="flex-1 px-3.5 py-2.5 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base font-medium outline-none"
        />
        <button
          type="submit"
          disabled={!newText.trim()}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Agregar</span>
        </button>
      </form>

      {/* Sub-bar: Search & Clear completed if available */}
      {(todos.length > 3 || completedCount > 0) && (
        <div className="flex items-center justify-between gap-2 px-1">
          {/* Search if more than 3 items */}
          {todos.length > 3 ? (
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en la lista..."
                className="w-full pl-7 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl focus:outline-none focus:border-red-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Clear completed button */}
          {completedCount > 0 && (
            <div className="ml-auto">
              {!showClearConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[11px] font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpiar completadas ({completedCount})</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                    ¿Borrar {completedCount}?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearCompleted();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] cursor-pointer"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-1.5 py-0.5 text-slate-500 hover:text-slate-700 text-[11px] font-bold cursor-pointer"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Task List */}
      <div className="space-y-1.5 pt-1">
        <AnimatePresence initial={false}>
          {filteredTodos.length > 0 ? (
            filteredTodos.map((todo) => {
              const isEditing = editingId === todo.id;

              return (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`group bg-white dark:bg-slate-900 rounded-xl px-3.5 py-3 border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                    todo.completed
                      ? 'border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left: Checkbox & Text */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(todo)}
                      className={`p-0.5 rounded-md transition-transform active:scale-90 cursor-pointer shrink-0 ${
                        todo.completed
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : 'text-slate-400 hover:text-red-600'
                      }`}
                      title={todo.completed ? 'Marcar como pendiente' : 'Completar tarea'}
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-500/10 stroke-[2.5]" />
                      ) : (
                        <Square className="w-5 h-5 stroke-[2]" />
                      )}
                    </button>

                    {/* Content or Edit Input */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(todo.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className="w-full px-2.5 py-1 text-sm bg-slate-50 dark:bg-slate-800 border border-red-500 rounded-lg text-slate-900 dark:text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(todo.id)}
                          className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => handleToggle(todo)}
                        className={`text-sm sm:text-base font-medium break-words cursor-pointer select-none transition-all flex-1 ${
                          todo.completed
                            ? 'line-through text-slate-400 dark:text-slate-500 font-normal'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {todo.text}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(todo.id);
                          setEditingText(todo.text);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar tarea"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTodo(todo.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
