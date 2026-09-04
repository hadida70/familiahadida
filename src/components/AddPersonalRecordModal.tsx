import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  User,
  Paperclip,
  CheckCircle2,
  Folder,
  Tag,
  Plus,
  Settings,
  ChevronDown,
  CreditCard as CreditCardIcon,
  Sparkles,
} from 'lucide-react';
import { Member, PersonalRecord, DataCategory } from '../types';
import { CreditCardVisualizer } from './CreditCardVisualizer';

interface AddPersonalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<PersonalRecord>) => void;
  onUploadFile?: (file: File) => Promise<{ fileName: string; fileUrl: string; fileType: string; fileSize: number } | null>;
  members: Member[];
  activeMember: Member | null;
  editingRecord?: PersonalRecord | null;
  categories?: DataCategory[];
  initialCategory?: string;
  initialSubcategory?: string;
  onOpenManageCategories?: () => void;
  onAddSubcategory?: (categoryId: string, subcategoryName: string) => Promise<void>;
}

export const isCardSubcategory = (cat: string, sub: string, rec?: PersonalRecord | null) => {
  if (rec && (rec.cardNumber || rec.cardCvc || rec.cardExp || rec.cardHolder)) return true;
  const str = `${cat} ${sub}`.toLowerCase();
  return (
    str.includes('tarjeta') ||
    str.includes('credito') ||
    str.includes('crédito') ||
    str.includes('debito') ||
    str.includes('débito') ||
    str.includes('dreamcard') ||
    str.includes('isracard') ||
    str.includes('visa') ||
    str.includes('mastercard')
  );
};

export const AddPersonalRecordModal: React.FC<AddPersonalRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUploadFile,
  members,
  activeMember,
  editingRecord,
  categories = [],
  initialCategory,
  initialSubcategory,
  onOpenManageCategories,
  onAddSubcategory,
}) => {
  const [memberId, setMemberId] = useState<string>(activeMember?.id || members[0]?.id || 'member_jaime');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newSubInline, setNewSubInline] = useState('');
  const [showNewSubInput, setShowNewSubInput] = useState(false);

  // Credit Card fields
  const [isCardMode, setIsCardMode] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [cardTheme, setCardTheme] = useState<'black_vip' | 'isracard_white' | 'blue_metal' | 'gold_luxury' | 'titanium'>('black_vip');
  const [cardAccountNo, setCardAccountNo] = useState('');

  // File Attachment fields
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected member object
  const selectedMember = members.find((m) => m.id === memberId) || activeMember || members[0];

  // Determine current category object if selected from list
  const selectedCategoryObj = categories.find(
    (c) => c.name.toLowerCase() === category.toLowerCase()
  );

  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  useEffect(() => {
    if (editingRecord) {
      setMemberId(editingRecord.memberId);
      setCategory(editingRecord.category || '');
      setSubcategory(editingRecord.subcategory || '');
      setFileName(editingRecord.fileName || '');
      setFileType(editingRecord.fileType || '');
      setFileSize(editingRecord.fileSize || 0);
      setFileUrl(editingRecord.fileUrl || '');
      setFileDataUrl(editingRecord.fileDataUrl || '');

      setCardNumber(editingRecord.cardNumber || '');
      setCardHolder(editingRecord.cardHolder || '');
      setCardExp(editingRecord.cardExp || '');
      setCardCvc(editingRecord.cardCvc || '');
      setCardBank(editingRecord.cardBank || 'ISRACARD');
      setCardTheme('isracard_white');
      setCardAccountNo('');

      const isKnown = categories.some(
        (c) => c.name.toLowerCase() === (editingRecord.category || '').toLowerCase()
      );
      setIsCustomCategory(!isKnown && !!editingRecord.category);
      setIsCardMode(isCardSubcategory(editingRecord.category || '', editingRecord.subcategory || '', editingRecord));
    } else {
      const activeId = activeMember?.id || members[0]?.id || 'member_jaime';
      setMemberId(activeId);
      
      // Determine initial category and subcategory
      let targetCat = initialCategory;
      let targetSub = initialSubcategory;

      if (!targetCat && targetSub) {
        // Find matching category that has this subcategory
        const matchingCat = categories.find((c) =>
          c.subcategories.some((s) => s.toLowerCase() === targetSub?.toLowerCase())
        );
        if (matchingCat) {
          targetCat = matchingCat.name;
        }
      }

      if (!targetCat) {
        targetCat = categories[0]?.name || 'Finanzas y Bancos';
      }

      if (!targetSub) {
        const catObj = categories.find((c) => c.name.toLowerCase() === targetCat?.toLowerCase());
        targetSub = catObj?.subcategories?.[0] || 'Tarjeta de Crédito';
      }

      setCategory(targetCat);
      setSubcategory(targetSub);
      setIsCustomCategory(false);
      setFileName('');
      setFileType('');
      setFileSize(0);
      setFileDataUrl('');

      setCardNumber('');
      const defaultMemberObj = members.find((m) => m.id === activeId);
      setCardHolder(defaultMemberObj?.name || 'JAIME HADIDA');
      setCardExp('');
      setCardCvc('');
      setCardBank('ISRACARD');
      setCardTheme('isracard_white');
      setCardAccountNo('');

      setIsCardMode(isCardSubcategory(targetCat, targetSub));
    }
    setError('');
    setShowNewSubInput(false);
    setNewSubInline('');
  }, [editingRecord, isOpen, activeMember, members, categories, initialCategory, initialSubcategory]);

  if (!isOpen) return null;

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomCategory(true);
      setCategory('');
      setSubcategory('');
      setIsCardMode(false);
    } else {
      setIsCustomCategory(false);
      setCategory(val);
      const catObj = categories.find((c) => c.name === val);
      const firstSub = catObj?.subcategories?.[0] || '';
      setSubcategory(firstSub);
      setIsCardMode(isCardSubcategory(val, firstSub));
    }
  };

  const handleSubcategorySelect = (subName: string) => {
    setSubcategory(subName);
    const isCard = isCardSubcategory(category, subName);
    setIsCardMode(isCard);
    if (isCard && !cardHolder) {
      setCardHolder(selectedMember?.name || 'JAIME HADIDA');
    }
  };

  const handleQuickAddSubcategory = async () => {
    const trimmed = newSubInline.trim();
    if (!trimmed) return;

    if (selectedCategoryObj && onAddSubcategory) {
      await onAddSubcategory(selectedCategoryObj.id, trimmed);
    }
    handleSubcategorySelect(trimmed);
    setNewSubInline('');
    setShowNewSubInput(false);
  };

  // Card Number Formatter (groups of 4, max 19 chars)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Expiration Formatter (MM/AA)
  const handleExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExp(raw);
  };

  // CVC Formatter (3 or 4 digits)
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(raw);
  };

  const handleFileProcess = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setError('El archivo no debe superar los 50 MB');
      return;
    }

    setError('');
    setFileName(file.name);
    setFileType(file.type || 'application/octet-stream');
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFileDataUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Try server disk upload if onUploadFile is provided
    if (onUploadFile) {
      try {
        setIsUploading(true);
        const uploadRes = await onUploadFile(file);
        if (uploadRes && uploadRes.fileUrl) {
          setFileUrl(uploadRes.fileUrl);
        }
      } catch (err) {
        console.error('Upload failed, falling back to data URL:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileType('');
    setFileSize(0);
    setFileUrl('');
    setFileDataUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category.trim();
    const finalSubcategory = subcategory.trim();

    if (!finalCategory) {
      setError('Por favor selecciona o escribe la categoría');
      return;
    }

    if (!finalSubcategory) {
      setError('Por favor selecciona o escribe la subcategoría');
      return;
    }

    onSave({
      memberId,
      category: finalCategory,
      subcategory: finalSubcategory,
      fileName: isCardMode ? '' : fileName,
      fileType: isCardMode ? '' : fileType,
      fileSize: isCardMode ? 0 : fileSize,
      fileUrl: isCardMode ? '' : fileUrl,
      fileDataUrl: isCardMode ? '' : fileDataUrl,
      // Card fields
      cardNumber: isCardMode ? cardNumber.trim() : undefined,
      cardHolder: isCardMode ? cardHolder.trim().toUpperCase() : undefined,
      cardExp: isCardMode ? cardExp.trim() : undefined,
      cardCvc: isCardMode ? cardCvc.trim() : undefined,
      cardBank: isCardMode ? cardBank.trim() : undefined,
      cardTheme: isCardMode ? 'isracard_white' : undefined,
    });

    onClose();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = fileType.startsWith('image/') || fileDataUrl.startsWith('data:image/');

  return (
    <div
      id="modal-add-personal-record-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-add-personal-record-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center border border-red-200/50">
              {isCardMode ? <CreditCardIcon className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                {editingRecord
                  ? isCardMode
                    ? 'Editar Tarjeta / Dato'
                    : 'Editar Dato Personal'
                  : isCardMode
                  ? 'Registrar Tarjeta de Crédito / Débito'
                  : 'Nuevo Dato Personal'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCardMode
                  ? 'Ingresa los números, vencimiento, CVC y titular de la tarjeta'
                  : 'Selecciona la categoría y subcategoría para clasificar el documento'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-semibold">
              {error}
            </div>
          )}

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-red-500" />
              <span>Titular / Integrante de la Familia:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {members.map((m) => {
                const isSelected = memberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMemberId(m.id);
                      if (isCardMode && (!cardHolder || cardHolder === selectedMember.name)) {
                        setCardHolder(m.name);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categoría & Subcategoría row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Categoría Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-red-500" />
                  <span>Categoría: <span className="text-red-500">*</span></span>
                </label>
                {onOpenManageCategories && (
                  <button
                    type="button"
                    onClick={onOpenManageCategories}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    Gestionar
                  </button>
                )}
              </div>

              <div className="relative">
                <select
                  value={isCustomCategory ? '__custom__' : category}
                  onChange={handleCategorySelectChange}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all appearance-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      📁 {c.name}
                    </option>
                  ))}
                  <option value="__custom__">➕ Otra categoría...</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {isCustomCategory && (
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Nombre de la categoría..."
                  className="w-full mt-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500/30"
                />
              )}
            </div>

            {/* Subcategoría Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-red-500" />
                  <span>Subcategoría: <span className="text-red-500">*</span></span>
                </label>
                {!showNewSubInput && selectedCategoryObj && (
                  <button
                    type="button"
                    onClick={() => setShowNewSubInput(true)}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Nueva</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                required
                value={subcategory}
                onChange={(e) => handleSubcategorySelect(e.target.value)}
                placeholder="Ej: Tarjeta de Crédito, Cédula..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
              />
            </div>
          </div>

          {/* Quick Subcategory Chips */}
          {availableSubcategories.length > 0 && !isCustomCategory && (
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 max-h-24 overflow-y-auto">
              {availableSubcategories.map((sub) => {
                const isSelected = subcategory.toLowerCase() === sub.toLowerCase();
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleSubcategorySelect(sub)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-400'
                    }`}
                  >
                    <Tag className={`w-2.5 h-2.5 ${isSelected ? 'text-white' : 'text-red-500'}`} />
                    <span>{sub}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Inline Add New Subcategory input */}
          {showNewSubInput && (
            <div className="p-2 rounded-xl bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center gap-2">
              <input
                type="text"
                value={newSubInline}
                onChange={(e) => setNewSubInline(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddSubcategory();
                  }
                }}
                placeholder={`Nueva subcategoría para ${category}...`}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/30"
              />
              <button
                type="button"
                onClick={handleQuickAddSubcategory}
                disabled={!newSubInline.trim()}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNewSubInput(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Toggle for Card Mode */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/60">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="w-4 h-4 text-red-600" />
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Formato de Tarjeta de Crédito / Débito
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Habilita los campos de número, CVC, fecha de vencimiento y diseño visual
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !isCardMode;
                setIsCardMode(next);
                if (next && !cardHolder) {
                  setCardHolder(selectedMember?.name || 'JAIME HADIDA');
                }
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                isCardMode ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isCardMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ================= CREDIT CARD STUDIO & PREVIEW ================= */}
          {isCardMode && (
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Diseño Minimalista</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  (Números en línea y CVC visible)
                </span>
              </div>

              {/* Real-time Card Visualizer */}
              <div className="py-2 flex justify-center">
                <CreditCardVisualizer
                  card={{
                    cardNumber,
                    cardHolder: cardHolder || selectedMember?.name || 'JAIME HADIDA',
                    cardExp,
                    cardCvc,
                    cardBank: cardBank || 'ISRACARD',
                    cardTheme: 'isracard_white',
                  }}
                  interactive={true}
                  showSensitiveDefault={true}
                  size="md"
                />
              </div>

              {/* Card Inputs Grid */}
              <div className="space-y-3 pt-2">
                {/* Nombre de la Tarjeta & Titular */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Nombre de la Tarjeta: <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required={isCardMode}
                      value={cardBank}
                      onChange={(e) => setCardBank(e.target.value)}
                      placeholder="Ej: ISRACARD, MAX, Visa Platinum..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Titular en la Tarjeta:
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="JAIME HADIDA"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Número de Tarjeta */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Número de Tarjeta: <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      16 dígitos (Ej: 4580 9811 3659 9900)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required={isCardMode}
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4580 9811 3659 9900"
                      maxLength={19}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white tracking-widest focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    />
                    <CreditCardIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Fecha de Vencimiento & CVC */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha de Vencimiento: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={isCardMode}
                      value={cardExp}
                      onChange={handleExpChange}
                      placeholder="MM/AA (05/30)"
                      maxLength={5}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white text-center focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CVC / CVV: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={isCardMode}
                      value={cardCvc}
                      onChange={handleCvcChange}
                      placeholder="261"
                      maxLength={4}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white text-center focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File & Photo Attachment Area (Only for standard non-card records) */}
          {!isCardMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-red-500" />
                  <span>Adjuntar Foto o Archivo:</span>
                </span>
                {fileName && (
                  <span className="text-[11px] font-normal text-slate-500">
                    {formatFileSize(fileSize)}
                  </span>
                )}
              </label>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />

              {!fileDataUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-red-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                      <Upload className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Haz clic para seleccionar foto o archivo
                    </p>
                    <p className="text-[11px] text-slate-400">
                      O arrastra y suelta aquí (Imágenes JPG, PNG, PDFs)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
                  {isImage ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700">
                      <img
                        src={fileDataUrl}
                        alt={fileName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {fileName || 'Archivo adjunto'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatFileSize(fileSize)} {fileType ? `• ${fileType.split('/')[1] || fileType}` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-semibold text-red-600 hover:underline mt-0.5 cursor-pointer"
                    >
                      Cambiar archivo
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Quitar archivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {editingRecord
                  ? 'Guardar Cambios'
                  : isCardMode
                  ? 'Guardar Tarjeta de Crédito'
                  : 'Guardar Dato Personal'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
