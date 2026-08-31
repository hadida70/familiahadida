import React, { useState, useMemo } from 'react';
import {
  Folder,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Search,
  AlertTriangle,
  FileText,
  Palette,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  FolderPlus,
  Crown,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { DataCategory, PersonalRecord } from '../types';

interface CategoriesAdminViewProps {
  categories: DataCategory[];
  records: PersonalRecord[];
  isAdmin?: boolean;
  onRequestAdminUnlock?: () => void;
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
  onNavigateToDataRecords?: () => void;
}

const COLOR_PALETTES = [
  { name: 'Azul Real', value: '#2563eb', bgClass: 'bg-blue-600' },
  { name: 'Rojo Carmesí', value: '#dc2626', bgClass: 'bg-red-600' },
  { name: 'Rosa Salud', value: '#e11d48', bgClass: 'bg-rose-600' },
  { name: 'Verde Esmeralda', value: '#059669', bgClass: 'bg-emerald-600' },
  { name: 'Ámbar Cálido', value: '#d97706', bgClass: 'bg-amber-600' },
  { name: 'Índigo Violeta', value: '#4f46e5', bgClass: 'bg-indigo-600' },
  { name: 'Cian Océano', value: '#0891b2', bgClass: 'bg-cyan-600' },
  { name: 'Naranja Fuego', value: '#ea580c', bgClass: 'bg-orange-600' },
  { name: 'Púrpura Elegante', value: '#9333ea', bgClass: 'bg-purple-600' },
  { name: 'Pizarra Neutro', value: '#475569', bgClass: 'bg-slate-600' },
  { name: 'Verde Menta', value: '#0d9488', bgClass: 'bg-teal-600' },
];

export const CategoriesAdminView: React.FC<CategoriesAdminViewProps> = ({
  categories,
  records,
  isAdmin = false,
  onRequestAdminUnlock,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubcategory,
  onRenameSubcategory,
  onDeleteSubcategory,
  onNavigateToDataRecords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // New Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#2563eb');
  const [newCatSubcategories, setNewCatSubcategories] = useState<string[]>([]);
  const [tempSubInput, setTempSubInput] = useState('');

  // Per-category quick new subcategory input
  const [newSubInputs, setNewSubInputs] = useState<Record<string, string>>({});

  // Editing category details
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('');

  // Editing subcategory inline
  const [editingSubcategory, setEditingSubcategory] = useState<{
    categoryId: string;
    oldName: string;
    currentName: string;
  } | null>(null);

  // Deletion confirmation modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'category' | 'subcategory';
    categoryId: string;
    categoryName: string;
    subcategoryName?: string;
    affectedCount: number;
  } | null>(null);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Subcategory tag builder in Create form
  const handleAddTempSubcategory = () => {
    const trimmed = tempSubInput.trim();
    if (!trimmed) return;
    if (newCatSubcategories.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showFeedback('error', 'Esta subcategoría ya está añadida en la lista');
      return;
    }
    setNewCatSubcategories([...newCatSubcategories, trimmed]);
    setTempSubInput('');
  };

  const handleRemoveTempSubcategory = (index: number) => {
    setNewCatSubcategories(newCatSubcategories.filter((_, i) => i !== index));
  };

  // Submit Create Category
  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showFeedback('error', 'El título o nombre de la categoría es obligatorio');
      return;
    }

    try {
      await onAddCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        color: newCatColor,
        subcategories: newCatSubcategories,
      });

      showFeedback('success', `Categoría "${newCatName.trim()}" creada exitosamente`);
      setNewCatName('');
      setNewCatDesc('');
      setNewCatColor('#2563eb');
      setNewCatSubcategories([]);
      setTempSubInput('');
      setIsCreatingCategory(false);
    } catch {
      showFeedback('error', 'Ocurrió un error al crear la categoría');
    }
  };

  // Start editing category
  const handleStartEditCategory = (cat: DataCategory) => {
    setEditingCategoryId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setEditColor(cat.color || '#2563eb');
  };

  // Save edited category
  const handleSaveEditCategory = async (id: string) => {
    if (!editName.trim()) {
      showFeedback('error', 'El nombre de la categoría no puede quedar vacío');
      return;
    }

    try {
      await onUpdateCategory(id, {
        name: editName.trim(),
        description: editDesc.trim(),
        color: editColor,
      });
      setEditingCategoryId(null);
      showFeedback('success', 'Categoría actualizada correctamente');
    } catch {
      showFeedback('error', 'Error al guardar los cambios de la categoría');
    }
  };

  // Add new subcategory to existing category
  const handleAddSubcategoryToCat = async (catId: string) => {
    const subName = (newSubInputs[catId] || '').trim();
    if (!subName) return;

    try {
      await onAddSubcategory(catId, subName);
      setNewSubInputs({ ...newSubInputs, [catId]: '' });
      showFeedback('success', `Subcategoría "${subName}" agregada`);
    } catch {
      showFeedback('error', 'Error al agregar la subcategoría');
    }
  };

  // Save renamed subcategory
  const handleSaveSubcategoryRename = async () => {
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
        await onAddSubcategory(categoryId, trimmedNew);
        await onDeleteSubcategory(categoryId, oldName);
      }
      setEditingSubcategory(null);
      showFeedback('success', `Subcategoría renombrada a "${trimmedNew}"`);
    } catch {
      showFeedback('error', 'Error al renombrar la subcategoría');
    }
  };

  // Count records for category
  const getRecordsCountForCategory = (catName: string) => {
    return records.filter((r) => r.category?.toLowerCase() === catName.toLowerCase()).length;
  };

  // Count records for subcategory
  const getRecordsCountForSubcategory = (catName: string, subName: string) => {
    return records.filter(
      (r) =>
        r.category?.toLowerCase() === catName.toLowerCase() &&
        r.subcategory?.toLowerCase() === subName.toLowerCase()
    ).length;
  };

  // Trigger Delete confirmation
  const requestDeleteCategory = (cat: DataCategory) => {
    const count = getRecordsCountForCategory(cat.name);
    setDeleteConfirmTarget({
      type: 'category',
      categoryId: cat.id,
      categoryName: cat.name,
      affectedCount: count,
    });
  };

  const requestDeleteSubcategory = (cat: DataCategory, subName: string) => {
    const count = getRecordsCountForSubcategory(cat.name, subName);
    setDeleteConfirmTarget({
      type: 'subcategory',
      categoryId: cat.id,
      categoryName: cat.name,
      subcategoryName: subName,
      affectedCount: count,
    });
  };

  // Confirm and execute delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;

    try {
      if (deleteConfirmTarget.type === 'category') {
        await onDeleteCategory(deleteConfirmTarget.categoryId);
        showFeedback(
          'success',
          `Categoría "${deleteConfirmTarget.categoryName}" eliminada correctamente`
        );
      } else if (
        deleteConfirmTarget.type === 'subcategory' &&
        deleteConfirmTarget.subcategoryName
      ) {
        await onDeleteSubcategory(
          deleteConfirmTarget.categoryId,
          deleteConfirmTarget.subcategoryName
        );
        showFeedback(
          'success',
          `Subcategoría "${deleteConfirmTarget.subcategoryName}" eliminada correctamente`
        );
      }
    } catch {
      showFeedback('error', 'Error al realizar la eliminación');
    } finally {
      setDeleteConfirmTarget(null);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter((cat) => {
      const matchName = cat.name.toLowerCase().includes(q);
      const matchDesc = cat.description?.toLowerCase().includes(q) || false;
      const matchSubs = (cat.subcategories || []).some((s) => s.toLowerCase().includes(q));
      return matchName || matchDesc || matchSubs;
    });
  }, [categories, searchQuery]);

  const totalSubcategories = useMemo(() => {
    return categories.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0);
  }, [categories]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-all shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Panel de Administración de Categorías
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Crea, edita títulos, añade subcategorías y elimina elementos según lo necesites.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreatingCategory(!isCreatingCategory)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isCreatingCategory
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
              }`}
            >
              {isCreatingCategory ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Cerrar Formulario</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>Nueva Categoría</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Categorías
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {categories.length}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Subcategorías
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {totalSubcategories}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Archivos Vinculados
            </span>
            <span className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400">
              {records.length}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de categoría o subcategoría..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Form to Create New Category */}
      {isCreatingCategory && (
        <form
          onSubmit={handleCreateCategorySubmit}
          className="bg-white dark:bg-slate-900 border-2 border-red-500/40 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Crear Nueva Categoría y sus Subcategorías
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingCategory(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title / Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título o Nombre de la Categoría *
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej. Vivienda y Contratos, Automóvil..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descripción / Notas (Opcional)
              </label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Breve detalle sobre los documentos que agrupa"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Color Palette Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span>Color Identificativo</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTES.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setNewCatColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    c.bgClass
                  } ${
                    newCatColor === c.value
                      ? 'ring-3 ring-offset-2 ring-red-500 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                >
                  {newCatColor === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories Builder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subcategorías Iniciales
            </label>
            <div className="flex gap-2 mb-2">
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
                placeholder="Escribe una subcategoría (ej. Contrato de Alquiler) y pulsa Añadir..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={handleAddTempSubcategory}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Añadir
              </button>
            </div>

            {newCatSubcategories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                {newCatSubcategories.map((sub, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <Tag className="w-3 h-3 text-red-500" />
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTempSubcategory(idx)}
                      className="text-slate-400 hover:text-red-600 ml-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                (Puedes guardar la categoría ahora y agregar subcategorías después)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreatingCategory(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Categoría</span>
            </button>
          </div>
        </form>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
            <Folder className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No se encontraron categorías
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No hay coincidencias para "${searchQuery}". Prueba con otro término.`
                : 'Aún no hay categorías registradas. Puedes crear la primera haciendo clic en "Nueva Categoría".'}
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const isEditing = editingCategoryId === cat.id;
            const recordsCount = getRecordsCountForCategory(cat.name);
            const subcategoriesList = cat.subcategories || [];

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Category Header (View vs Edit Mode) */}
                {isEditing ? (
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Editando Título y Atributos de Categoría
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(cat.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryId(null)}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-300 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Título de la Categoría *
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Descripción
                        </label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Color
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {COLOR_PALETTES.map((c) => (
                          <button
                            type="button"
                            key={c.value}
                            onClick={() => setEditColor(c.value)}
                            className={`w-6 h-6 rounded-full ${c.bgClass} ${
                              editColor === c.value ? 'ring-2 ring-offset-1 ring-slate-900' : 'opacity-70'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs font-bold text-sm"
                        style={{ backgroundColor: cat.color || '#2563eb' }}
                      >
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                            {cat.name}
                          </h3>
                          {cat.isDefault && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
                              Sistema
                            </span>
                          )}
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{recordsCount} archivo(s)</span>
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleStartEditCategory(cat)}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                        title="Editar título de la categoría"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Editar Título</span>
                      </button>

                      <button
                        onClick={() => requestDeleteCategory(cat)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer border border-red-200 dark:border-red-900/40"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Subcategories Management Section */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-red-500" />
                      <span>Subcategorías ({subcategoriesList.length})</span>
                    </span>
                  </div>

                  {/* Subcategories Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    {subcategoriesList.map((sub, idx) => {
                      const subRecordsCount = getRecordsCountForSubcategory(cat.name, sub);
                      const isEditingSub =
                        editingSubcategory?.categoryId === cat.id &&
                        editingSubcategory?.oldName === sub;

                      return (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs group"
                        >
                          {isEditingSub ? (
                            <div className="flex items-center gap-1 w-full">
                              <input
                                type="text"
                                value={editingSubcategory.currentName}
                                onChange={(e) =>
                                  setEditingSubcategory({
                                    ...editingSubcategory,
                                    currentName: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSubcategoryRename();
                                  if (e.key === 'Escape') setEditingSubcategory(null);
                                }}
                                autoFocus
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-red-400 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden"
                              />
                              <button
                                onClick={handleSaveSubcategoryRename}
                                className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                title="Guardar título"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingSubcategory(null)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                                  {sub}
                                </span>
                                {subRecordsCount > 0 && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    {subRecordsCount} registro(s)
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                                <button
                                  onClick={() =>
                                    setEditingSubcategory({
                                      categoryId: cat.id,
                                      oldName: sub,
                                      currentName: sub,
                                    })
                                  }
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-white dark:hover:bg-slate-700"
                                  title="Renombrar subcategoría"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => requestDeleteSubcategory(cat, sub)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-white dark:hover:bg-slate-700"
                                  title="Eliminar subcategoría"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Subcategory Inline Input */}
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      value={newSubInputs[cat.id] || ''}
                      onChange={(e) =>
                        setNewSubInputs({ ...newSubInputs, [cat.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubcategoryToCat(cat.id);
                        }
                      }}
                      placeholder={`Añadir subcategoría a "${cat.name}"...`}
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={() => handleAddSubcategoryToCat(cat.id)}
                      disabled={!(newSubInputs[cat.id] || '').trim()}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  ¿Confirmar eliminación?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {deleteConfirmTarget.type === 'category' ? (
                  <>
                    Estás a punto de eliminar la categoría{' '}
                    <strong className="text-red-600 font-bold">
                      "{deleteConfirmTarget.categoryName}"
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Estás a punto de eliminar la subcategoría{' '}
                    <strong className="text-red-600 font-bold">
                      "{deleteConfirmTarget.subcategoryName}"
                    </strong>{' '}
                    dentro de "{deleteConfirmTarget.categoryName}".
                  </>
                )}
              </p>

              {deleteConfirmTarget.affectedCount > 0 ? (
                <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40 text-[11px]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Existen <strong>{deleteConfirmTarget.affectedCount}</strong> documento(s)
                    vinculados a este elemento. Seguirán existiendo pero su categoría/subcategoría
                    se mantendrá como referencia histórica.
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  No hay documentos ni archivos vinculados a este elemento actualmente.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
