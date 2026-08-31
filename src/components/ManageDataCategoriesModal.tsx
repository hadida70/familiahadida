import React, { useState } from 'react';
import {
  X,
  Plus,
  Folder,
  Tag,
  Trash2,
  Edit2,
  Check,
  FolderPlus,
  Layers,
  Sparkles,
  CheckCircle2,
  Info,
  AlertTriangle,
  FileText,
  Palette,
  Search,
} from 'lucide-react';
import { DataCategory, PersonalRecord } from '../types';

interface ManageDataCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DataCategory[];
  records: PersonalRecord[];
  onAddCategory: (category: Partial<DataCategory>) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<DataCategory>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddSubcategory: (categoryId: string, subcategoryName: string) => Promise<void>;
  onRenameSubcategory?: (
    categoryId: string,
    oldSubcategoryName: string,
    newSubcategoryName: string,
    updateRecords?: boolean
  ) => Promise<void>;
  onDeleteSubcategory: (categoryId: string, subcategoryName: string) => Promise<void>;
}

const COLOR_OPTIONS = [
  { name: 'Rojo / Alerta', value: '#dc2626', bgClass: 'bg-red-600' },
  { name: 'Azul / Principal', value: '#2563eb', bgClass: 'bg-blue-600' },
  { name: 'Rosa / Salud', value: '#e11d48', bgClass: 'bg-rose-600' },
  { name: 'Verde / Finanzas', value: '#059669', bgClass: 'bg-emerald-600' },
  { name: 'Ámbar / Vehículos', value: '#d97706', bgClass: 'bg-amber-600' },
  { name: 'Índigo / Educación', value: '#4f46e5', bgClass: 'bg-indigo-600' },
  { name: 'Cian / Seguros', value: '#0891b2', bgClass: 'bg-cyan-600' },
  { name: 'Naranja / Hogar', value: '#ea580c', bgClass: 'bg-orange-600' },
  { name: 'Pizarra / Laboral', value: '#475569', bgClass: 'bg-slate-600' },
  { name: 'Púrpura / Legal', value: '#9333ea', bgClass: 'bg-purple-600' },
  { name: 'Teal / Bienestar', value: '#0d9488', bgClass: 'bg-teal-600' },
];

export const ManageDataCategoriesModal: React.FC<ManageDataCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  records,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubcategory,
  onRenameSubcategory,
  onDeleteSubcategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // New Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#dc2626');
  const [newCatSubcategories, setNewCatSubcategories] = useState<string[]>([]);
  const [tempSubInput, setTempSubInput] = useState('');

  // Per-category new subcategory input state
  const [newSubInputs, setNewSubInputs] = useState<Record<string, string>>({});

  // Editing category title / details
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('');

  // Editing subcategory title inline
  const [editingSubcategory, setEditingSubcategory] = useState<{
    categoryId: string;
    oldName: string;
    currentName: string;
  } | null>(null);

  // Deletion confirmation modal/state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'category' | 'subcategory';
    categoryId: string;
    categoryName: string;
    subcategoryName?: string;
    affectedCount: number;
  } | null>(null);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddTempSubcategory = () => {
    const trimmed = tempSubInput.trim();
    if (!trimmed) return;
    if (newCatSubcategories.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showFeedback('error', 'Esta subcategoría ya está en la lista inicial');
      return;
    }
    setNewCatSubcategories([...newCatSubcategories, trimmed]);
    setTempSubInput('');
  };

  const handleRemoveTempSubcategory = (index: number) => {
    setNewCatSubcategories(newCatSubcategories.filter((_, i) => i !== index));
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showFeedback('error', 'El nombre o título de la categoría es obligatorio');
      return;
    }

    try {
      await onAddCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        color: newCatColor,
        subcategories: newCatSubcategories,
      });

      showFeedback('success', `Categoría "${newCatName.trim()}" creada con éxito`);
      setNewCatName('');
      setNewCatDesc('');
      setNewCatColor('#dc2626');
      setNewCatSubcategories([]);
      setTempSubInput('');
      setIsCreatingCategory(false);
    } catch {
      showFeedback('error', 'Error al crear la categoría');
    }
  };

  // Start editing category title/color/description
  const handleStartEditCategory = (cat: DataCategory) => {
    setEditingCategoryId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setEditColor(cat.color || '#dc2626');
  };

  const handleSaveEditCategory = async (categoryId: string) => {
    if (!editName.trim()) {
      showFeedback('error', 'El título de la categoría no puede estar vacío');
      return;
    }
    try {
      await onUpdateCategory(categoryId, {
        name: editName.trim(),
        description: editDesc.trim(),
        color: editColor,
      });
      setEditingCategoryId(null);
      showFeedback('success', 'Título e información de la categoría actualizados');
    } catch {
      showFeedback('error', 'Error al actualizar la categoría');
    }
  };

  // Inline subcategory rename
  const handleStartRenameSubcategory = (categoryId: string, subcategoryName: string) => {
    setEditingSubcategory({
      categoryId,
      oldName: subcategoryName,
      currentName: subcategoryName,
    });
  };

  const handleSaveRenameSubcategory = async () => {
    if (!editingSubcategory) return;
    const { categoryId, oldName, currentName } = editingSubcategory;
    const trimmedNew = currentName.trim();

    if (!trimmedNew) {
      showFeedback('error', 'El título de la subcategoría no puede estar vacío');
      return;
    }

    if (trimmedNew.toLowerCase() === oldName.toLowerCase()) {
      setEditingSubcategory(null);
      return;
    }

    try {
      if (onRenameSubcategory) {
        await onRenameSubcategory(categoryId, oldName, trimmedNew, true);
      } else {
        // Fallback: delete old and add new
        await onDeleteSubcategory(categoryId, oldName);
        await onAddSubcategory(categoryId, trimmedNew);
      }
      setEditingSubcategory(null);
      showFeedback('success', `Subcategoría renombrada a "${trimmedNew}"`);
    } catch {
      showFeedback('error', 'Error al renombrar la subcategoría');
    }
  };

  // Add new subcategory to existing category
  const handleAddSubcategoryToCategory = async (categoryId: string) => {
    const text = (newSubInputs[categoryId] || '').trim();
    if (!text) return;

    const cat = categories.find((c) => c.id === categoryId);
    if (cat && cat.subcategories?.some((s) => s.toLowerCase() === text.toLowerCase())) {
      showFeedback('error', `La subcategoría "${text}" ya existe en esta categoría`);
      return;
    }

    try {
      await onAddSubcategory(categoryId, text);
      setNewSubInputs({ ...newSubInputs, [categoryId]: '' });
      showFeedback('success', `Subcategoría "${text}" agregada`);
    } catch {
      showFeedback('error', 'Error al agregar la subcategoría');
    }
  };

  // Trigger Delete Confirmation for Subcategory
  const requestDeleteSubcategory = (categoryId: string, categoryName: string, subcategoryName: string) => {
    const affectedCount = records.filter(
      (r) =>
        r.category?.toLowerCase() === categoryName.toLowerCase() &&
        r.subcategory?.toLowerCase() === subcategoryName.toLowerCase()
    ).length;

    setDeleteConfirmTarget({
      type: 'subcategory',
      categoryId,
      categoryName,
      subcategoryName,
      affectedCount,
    });
  };

  // Trigger Delete Confirmation for Category
  const requestDeleteCategory = (cat: DataCategory) => {
    const affectedCount = records.filter(
      (r) => r.category?.toLowerCase() === cat.name.toLowerCase()
    ).length;

    setDeleteConfirmTarget({
      type: 'category',
      categoryId: cat.id,
      categoryName: cat.name,
      affectedCount,
    });
  };

  // Perform confirmed deletion
  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;

    try {
      if (deleteConfirmTarget.type === 'category') {
        await onDeleteCategory(deleteConfirmTarget.categoryId);
        showFeedback('success', `Categoría "${deleteConfirmTarget.categoryName}" eliminada`);
      } else if (deleteConfirmTarget.type === 'subcategory' && deleteConfirmTarget.subcategoryName) {
        await onDeleteSubcategory(
          deleteConfirmTarget.categoryId,
          deleteConfirmTarget.subcategoryName
        );
        showFeedback(
          'success',
          `Subcategoría "${deleteConfirmTarget.subcategoryName}" eliminada de ${deleteConfirmTarget.categoryName}`
        );
      }
    } catch {
      showFeedback('error', 'Error al realizar la eliminación');
    } finally {
      setDeleteConfirmTarget(null);
    }
  };

  // Statistics
  const totalSubcategories = categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0);
  const totalRecordsCategorized = records.filter((r) => r.category).length;

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = cat.name.toLowerCase().includes(q);
    const matchDesc = cat.description?.toLowerCase().includes(q) || false;
    const matchSub = cat.subcategories?.some((s) => s.toLowerCase().includes(q)) || false;
    return matchName || matchDesc || matchSub;
  });

  return (
    <div
      id="modal-manage-data-categories-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-manage-data-categories-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Stats */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center border border-red-200/50 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  Panel de Administración de Categorías y Subcategorías
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Crea, edita títulos, personaliza colores o elimina categorías y subcategorías
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-2 px-5 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {categories.length} Categorías
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {totalSubcategories} Subcategorías
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {totalRecordsCategorized} Archivos Organizados
            </span>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200 border-b border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Action & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-slate-900">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título de categoría o subcategoría..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setIsCreatingCategory(!isCreatingCategory)}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all border shadow-2xs ${
              isCreatingCategory
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                : 'bg-white dark:bg-slate-900 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
            }`}
          >
            {isCreatingCategory ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Cerrar Formulario</span>
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4" />
                <span>+ Crear Nueva Categoría</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/40 dark:bg-slate-950/30">
          {/* Create Category Panel */}
          {isCreatingCategory && (
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 shadow-md space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-red-500" />
                  <span>Nueva Categoría Principal</span>
                </h3>
                <span className="text-[11px] text-slate-400">Paso 1 de 1</span>
              </div>

              <form onSubmit={handleCreateCategorySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Título / Nombre de la Categoría: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ej: Pasaportes y Viajes, Mascotas, Legal..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Descripción breve (opcional):
                    </label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Ej: Visas, pasaportes vigentes y sellos..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Color Palette Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-400" />
                    <span>Color identificador:</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewCatColor(c.value)}
                        className={`w-7 h-7 rounded-full cursor-pointer transition-transform flex items-center justify-center ${c.bgClass} ${
                          newCatColor === c.value
                            ? 'ring-3 ring-offset-2 ring-red-500 scale-110 shadow-sm'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        title={c.name}
                      >
                        {newCatColor === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategories initial list */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Subcategorías Iniciales:</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      Presiona Enter para agregar varias
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempSubInput}
                      onChange={(e) => setTempSubInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTempSubcategory();
                        }
                      }}
                      placeholder="Escribe el nombre de la subcategoría (ej: Vacunas, Pasaporte Europeo)..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddTempSubcategory}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 text-red-600 border border-red-600 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>

                  {newCatSubcategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {newCatSubcategories.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs"
                        >
                          <Tag className="w-3 h-3 text-red-500" />
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTempSubcategory(idx)}
                            className="text-slate-400 hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Nueva Categoría</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Categories & Subcategories */}
          <div className="space-y-4">
            {filteredCategories.map((cat) => {
              const isEditingCat = editingCategoryId === cat.id;
              const catRecords = records.filter(
                (r) => r.category?.toLowerCase() === cat.name.toLowerCase()
              );
              const subcategories = cat.subcategories || [];

              return (
                <div
                  key={cat.id}
                  id={`cat-card-${cat.id}`}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3.5"
                >
                  {/* Category Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    {/* Left: Indicator & Title/Edit Mode */}
                    <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 sm:mt-0 shadow-2xs"
                        style={{ backgroundColor: cat.color || '#dc2626' }}
                      />

                      {isEditingCat ? (
                        /* Edit Category Title & Info Mode */
                        <div className="w-full space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-red-200 dark:border-red-900/50">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-600 uppercase">
                              Editando Categoría:
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-0.5">
                                Título / Nombre:
                              </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-0.5">
                                Descripción:
                              </label>
                              <input
                                type="text"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>

                          {/* Color Options */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[11px] font-bold text-slate-500 mr-1">Color:</span>
                            {COLOR_OPTIONS.map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setEditColor(c.value)}
                                className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${c.bgClass} ${
                                  editColor === c.value
                                    ? 'ring-2 ring-offset-1 ring-red-500 scale-110'
                                    : 'hover:scale-105 opacity-80'
                                }`}
                                title={c.name}
                              />
                            ))}
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditingCategoryId(null)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleSaveEditCategory(cat.id)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar Título</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal Category Display */
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
                              {cat.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {subcategories.length} subcategoría{subcategories.length !== 1 ? 's' : ''}
                            </span>
                            {catRecords.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 dark:border-red-900">
                                {catRecords.length} archivo{catRecords.length !== 1 ? 's' : ''} vinculados
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions (Edit Category & Delete Category) */}
                    {!isEditingCat && (
                      <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleStartEditCategory(cat)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-400 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="Editar título, descripción y color de esta categoría"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Editar Título</span>
                        </button>

                        <button
                          onClick={() => requestDeleteCategory(cat)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="Eliminar esta categoría completa"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subcategories Management Section */}
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-red-500" />
                        <span>Subcategorías configuradas ({subcategories.length}):</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Haz clic en el lápiz para renombrar o en ✕ para eliminar
                      </span>
                    </div>

                    {/* Subcategories Chips */}
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map((sub) => {
                        const isEditingThisSub =
                          editingSubcategory?.categoryId === cat.id &&
                          editingSubcategory.oldName === sub;

                        const count = catRecords.filter(
                          (r) => r.subcategory?.toLowerCase() === sub.toLowerCase()
                        ).length;

                        if (isEditingThisSub) {
                          return (
                            <div
                              key={sub}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/60 border-2 border-red-500 shadow-xs"
                            >
                              <Tag className="w-3 h-3 text-red-600 shrink-0" />
                              <input
                                type="text"
                                autoFocus
                                value={editingSubcategory.currentName}
                                onChange={(e) =>
                                  setEditingSubcategory({
                                    ...editingSubcategory,
                                    currentName: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveRenameSubcategory();
                                  } else if (e.key === 'Escape') {
                                    setEditingSubcategory(null);
                                  }
                                }}
                                className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white border border-red-300 w-36 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleSaveRenameSubcategory}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                title="Guardar nuevo título"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubcategory(null)}
                                className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 hover:text-slate-900 cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={sub}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-red-300 transition-all shadow-2xs group/chip"
                          >
                            <Tag className="w-3 h-3 text-red-500 shrink-0" />
                            <span className="font-bold">{sub}</span>

                            {count > 0 && (
                              <span
                                className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-extrabold"
                                title={`${count} documento(s) con esta subcategoría`}
                              >
                                {count}
                              </span>
                            )}

                            {/* Rename Subcategory button */}
                            <button
                              type="button"
                              onClick={() => handleStartRenameSubcategory(cat.id, sub)}
                              className="text-slate-400 hover:text-red-600 p-0.5 rounded opacity-50 group-hover/chip:opacity-100 cursor-pointer transition-opacity"
                              title="Renombrar título de esta subcategoría"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>

                            {/* Delete Subcategory button */}
                            <button
                              type="button"
                              onClick={() => requestDeleteSubcategory(cat.id, cat.name, sub)}
                              className="text-slate-400 hover:text-red-600 p-0.5 rounded opacity-50 group-hover/chip:opacity-100 cursor-pointer transition-opacity"
                              title="Eliminar esta subcategoría"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}

                      {subcategories.length === 0 && (
                        <p className="text-xs text-slate-400 italic">
                          Esta categoría no tiene subcategorías aún. Añade una abajo.
                        </p>
                      )}
                    </div>

                    {/* Quick Inline Add Subcategory */}
                    <div className="pt-1.5 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={newSubInputs[cat.id] || ''}
                          onChange={(e) =>
                            setNewSubInputs({ ...newSubInputs, [cat.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubcategoryToCategory(cat.id);
                            }
                          }}
                          placeholder={`+ Agregar nueva subcategoría a "${cat.name}"...`}
                          className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddSubcategoryToCategory(cat.id)}
                        disabled={!(newSubInputs[cat.id] || '').trim()}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Subcategoría</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                <Folder className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No se encontraron categorías o subcategorías
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Intenta con otra palabra clave o crea una nueva categoría arriba.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog Modal Overlay */}
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100">
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-xs text-slate-500">
                    {deleteConfirmTarget.type === 'category'
                      ? 'Eliminar Categoría Principal'
                      : 'Eliminar Subcategoría'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-slate-800 dark:text-slate-200 space-y-2">
                <p>
                  ¿Estás seguro de que deseas eliminar{' '}
                  {deleteConfirmTarget.type === 'category' ? (
                    <strong className="text-red-600">
                      la categoría "{deleteConfirmTarget.categoryName}" y todas sus subcategorías
                    </strong>
                  ) : (
                    <strong className="text-red-600">
                      la subcategoría "{deleteConfirmTarget.subcategoryName}" de la categoría "
                      {deleteConfirmTarget.categoryName}"
                    </strong>
                  )}
                  ?
                </p>

                {deleteConfirmTarget.affectedCount > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Atención: Hay {deleteConfirmTarget.affectedCount} documento(s) o foto(s)
                      asociados actualmente.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sí, Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Todos los cambios y títulos se sincronizan automáticamente</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
