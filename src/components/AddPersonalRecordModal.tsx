import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  Paperclip,
  CheckCircle2,
  Folder,
  Tag,
  Plus,
  CreditCard as CreditCardIcon,
  Sparkles,
  Square,
  ListTodo,
  File,
  Image as ImageIcon,
  Eye,
  Camera,
  ArrowUp,
  ArrowDown,
  Layers,
  Check,
  Info,
} from 'lucide-react';
import { Member, PersonalRecord, DataCategory, RecordAttachment, RecordTodo } from '../types';
import { CreditCardVisualizer } from './CreditCardVisualizer';

interface AddPersonalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<PersonalRecord>) => void;
  onUploadFile?: (file: File) => Promise<{ fileName: string; fileUrl: string; fileType: string; fileSize: number } | null>;
  onUploadFiles?: (files: File[]) => Promise<RecordAttachment[]>;
  members: Member[];
  activeMember: Member | null;
  editingRecord?: PersonalRecord | null;
  records?: PersonalRecord[];
  categories?: DataCategory[];
  initialCategory?: string;
  initialSubcategory?: string;
  onOpenManageCategories?: () => void;
  onAddSubcategory?: (categoryId: string, subcategoryName: string) => Promise<void>;
  onPreviewAttachment?: (attachment: RecordAttachment) => void;
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

// Preset labels for common document sides / types
const QUICK_LABEL_PRESETS = [
  'Frente',
  'Dorso',
  'Sefaj / Anexo',
  'Página 1',
  'Página 2',
  'Comprobante',
  'Contrato',
  'Pasaporte',
];

// Quick To-Do task suggestions
const QUICK_TODO_PRESETS = [
  'Pedir turno',
  'Renovar documento',
  'Pagar resumen',
  'Apostillar / Legalizar',
  'Presentar en oficina',
  'Consultar vencimiento',
];

export const AddPersonalRecordModal: React.FC<AddPersonalRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUploadFile,
  onUploadFiles,
  members,
  activeMember,
  editingRecord,
  records = [],
  categories = [],
  initialCategory,
  initialSubcategory,
  onOpenManageCategories,
  onAddSubcategory,
  onPreviewAttachment,
}) => {
  const [memberId, setMemberId] = useState<string>(activeMember?.id || members[0]?.id || 'member_jaime');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);
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

  // Multi-Document Attachments state
  const [attachments, setAttachments] = useState<RecordAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  // Checklist / To-Do Items state (Available in ALL subcategories)
  const [todos, setTodos] = useState<RecordTodo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');

  // Existing record detection in this subcategory
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const todoInputRef = useRef<HTMLInputElement>(null);

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
      setExistingRecordId(editingRecord.id);

      // Load existing attachments
      if (editingRecord.attachments && editingRecord.attachments.length > 0) {
        setAttachments(editingRecord.attachments);
      } else if (editingRecord.fileDataUrl || editingRecord.fileUrl) {
        setAttachments([
          {
            id: 'att_' + (editingRecord.id || Date.now()),
            fileName: editingRecord.fileName || 'Documento adjunto',
            fileType: editingRecord.fileType || '',
            fileSize: editingRecord.fileSize || 0,
            fileUrl: editingRecord.fileUrl || '',
            fileDataUrl: editingRecord.fileDataUrl || '',
            label: 'Principal',
          },
        ]);
      } else {
        setAttachments([]);
      }

      // Load existing todos
      setTodos(editingRecord.todos || []);

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

      const catObj = categories.find((c) => c.name.toLowerCase() === (editingRecord.category || '').toLowerCase());
      const isKnownSub = catObj?.subcategories?.some((s) => s.toLowerCase() === (editingRecord.subcategory || '').toLowerCase());
      setIsCustomSubcategory(!isKnownSub && !!editingRecord.subcategory);

      setIsCardMode(isCardSubcategory(editingRecord.category || '', editingRecord.subcategory || '', editingRecord));
    } else {
      const activeId = activeMember?.id || members[0]?.id || 'member_jaime';
      setMemberId(activeId);

      // Determine initial category and subcategory
      let targetCat = initialCategory;
      let targetSub = initialSubcategory;

      if (!targetCat && targetSub) {
        const matchingCat = categories.find((c) =>
          c.subcategories.some((s) => s.toLowerCase() === targetSub?.toLowerCase())
        );
        if (matchingCat) {
          targetCat = matchingCat.name;
        }
      }

      if (!targetCat) {
        targetCat = categories[0]?.name || 'Documentos de Identidad';
      }

      if (!targetSub) {
        const catObj = categories.find((c) => c.name.toLowerCase() === targetCat?.toLowerCase());
        targetSub = catObj?.subcategories?.[0] || 'TEUDAT ZEUT';
      }

      setCategory(targetCat);
      setSubcategory(targetSub);
      setIsCustomCategory(false);
      setIsCustomSubcategory(false);

      // Check if there is already a record for this member + category + subcategory
      const match = records.find(
        (r) =>
          r.memberId === activeId &&
          r.category?.toLowerCase() === targetCat?.toLowerCase() &&
          r.subcategory?.toLowerCase() === targetSub?.toLowerCase()
      );

      if (match) {
        setExistingRecordId(match.id);
        if (match.attachments && match.attachments.length > 0) {
          setAttachments(match.attachments);
        } else if (match.fileDataUrl || match.fileUrl) {
          setAttachments([
            {
              id: 'att_' + match.id,
              fileName: match.fileName || 'Documento adjunto',
              fileType: match.fileType || '',
              fileSize: match.fileSize || 0,
              fileUrl: match.fileUrl || '',
              fileDataUrl: match.fileDataUrl || '',
              label: 'Principal',
            },
          ]);
        } else {
          setAttachments([]);
        }
        setTodos(match.todos || []);
      } else {
        setExistingRecordId(null);
        setAttachments([]);
        setTodos([]);
      }

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
    setNewTodoText('');
  }, [editingRecord, isOpen, activeMember, members, categories, initialCategory, initialSubcategory]);

  // When member, category or subcategory changes (and not explicitly editing an existing record), auto-sync with matching record
  const checkAndSyncExisting = (targetMemberId: string, targetCat: string, targetSub: string) => {
    if (editingRecord) return;
    const match = records.find(
      (r) =>
        r.memberId === targetMemberId &&
        r.category?.toLowerCase() === targetCat?.toLowerCase() &&
        r.subcategory?.toLowerCase() === targetSub?.toLowerCase()
    );

    if (match) {
      setExistingRecordId(match.id);
      if (match.attachments && match.attachments.length > 0) {
        setAttachments(match.attachments);
      } else if (match.fileDataUrl || match.fileUrl) {
        setAttachments([
          {
            id: 'att_' + match.id,
            fileName: match.fileName || 'Documento adjunto',
            fileType: match.fileType || '',
            fileSize: match.fileSize || 0,
            fileUrl: match.fileUrl || '',
            fileDataUrl: match.fileDataUrl || '',
            label: 'Principal',
          },
        ]);
      }
      if (match.todos && match.todos.length > 0) {
        setTodos(match.todos);
      }
    } else {
      setExistingRecordId(null);
    }
  };

  if (!isOpen) return null;

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomCategory(true);
      setIsCustomSubcategory(true);
      setCategory('');
      setSubcategory('');
      setIsCardMode(false);
      setExistingRecordId(null);
    } else {
      setIsCustomCategory(false);
      setIsCustomSubcategory(false);
      setCategory(val);
      const catObj = categories.find((c) => c.name === val);
      const firstSub = catObj?.subcategories?.[0] || '';
      setSubcategory(firstSub);
      setIsCardMode(isCardSubcategory(val, firstSub));
      checkAndSyncExisting(memberId, val, firstSub);
    }
  };

  const handleSubcategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomSubcategory(true);
      handleSubcategorySelect('');
    } else {
      setIsCustomSubcategory(false);
      handleSubcategorySelect(val);
    }
  };

  const handleSubcategorySelect = (subName: string) => {
    setSubcategory(subName);
    const isCard = isCardSubcategory(category, subName);
    setIsCardMode(isCard);
    if (isCard && !cardHolder) {
      setCardHolder(selectedMember?.name || 'JAIME HADIDA');
    }
    checkAndSyncExisting(memberId, category, subName);
  };

  const handleQuickAddSubcategory = async () => {
    const trimmed = newSubInline.trim();
    if (!trimmed) return;

    if (selectedCategoryObj && onAddSubcategory) {
      await onAddSubcategory(selectedCategoryObj.id, trimmed);
    }
    setIsCustomSubcategory(false);
    handleSubcategorySelect(trimmed);
    setNewSubInline('');
    setShowNewSubInput(false);
  };

  // Card Number Formatter
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

  // CVC Formatter
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(raw);
  };

  // Process and upload multiple files (supports batch and incremental addition)
  const handleFilesProcess = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Validate size
    for (const file of fileArray) {
      if (file.size > 50 * 1024 * 1024) {
        setError(`El archivo "${file.name}" supera los 50 MB`);
        return;
      }
    }

    setError('');
    setIsUploading(true);

    try {
      // 1. Read preview base64 data URLs for all files immediately
      const readPromises = fileArray.map((file, i) => {
        return new Promise<RecordAttachment>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = (e.target?.result as string) || '';
            // Auto-assign logical default label if multiple are added
            let defaultLabel = '';
            if (attachments.length === 0 && fileArray.length === 2) {
              defaultLabel = i === 0 ? 'Frente' : 'Dorso';
            } else if (attachments.length === 0 && fileArray.length === 1) {
              defaultLabel = 'Frente';
            } else if (attachments.length === 1 && fileArray.length === 1) {
              defaultLabel = 'Dorso';
            } else if (attachments.length >= 2) {
              defaultLabel = `Anexo ${attachments.length + i + 1}`;
            }

            resolve({
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size,
              fileDataUrl: dataUrl,
              label: defaultLabel,
              createdAt: new Date().toISOString(),
            });
          };
          reader.readAsDataURL(file);
        });
      });

      const localAttachments = await Promise.all(readPromises);

      // Append new attachments incrementally to current UI state
      setAttachments((prev) => [...prev, ...localAttachments]);

      // 2. Upload to server in background
      if (onUploadFiles) {
        const uploaded = await onUploadFiles(fileArray);
        if (uploaded && uploaded.length > 0) {
          setAttachments((prev) => {
            return prev.map((item) => {
              const matched = uploaded.find((u) => u.fileName === item.fileName);
              return matched && matched.fileUrl ? { ...item, fileUrl: matched.fileUrl } : item;
            });
          });
        }
      } else if (onUploadFile) {
        for (let i = 0; i < fileArray.length; i++) {
          const f = fileArray[i];
          try {
            const res = await onUploadFile(f);
            if (res && res.fileUrl) {
              setAttachments((prev) => {
                return prev.map((item) => {
                  return item.fileName === f.name ? { ...item, fileUrl: res.fileUrl } : item;
                });
              });
            }
          } catch (e) {
            console.error('Upload failed for file:', f.name, e);
          }
        }
      }
    } catch (err: any) {
      console.error('Error processing files:', err);
      setError('Ocurrió un error al procesar los archivos.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesProcess(e.target.files);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesProcess(e.dataTransfer.files);
    }
  };

  const handleRemoveAttachment = (idToRemove: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== idToRemove));
  };

  const handleUpdateAttachmentLabel = (id: string, newLabel: string) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, label: newLabel } : a))
    );
  };

  const handleMoveAttachment = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= attachments.length) return;

    const next = [...attachments];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setAttachments(next);
  };

  // Checklist / To-Do Handlers (Available across all subcategories)
  const handleAddTodo = (textToAdd?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = (textToAdd || newTodoText).trim();
    if (!text) return;

    const newTodo: RecordTodo = {
      id: 'rtodo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTodos((prev) => [...prev, newTodo]);
    setNewTodoText('');
    setTimeout(() => todoInputRef.current?.focus(), 50);
  };

  const handleToggleTodo = (todoId: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
  };

  const handleDeleteTodo = (todoId: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
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

    const firstAtt = attachments[0];

    onSave({
      id: editingRecord?.id || existingRecordId || undefined,
      memberId,
      category: finalCategory,
      subcategory: finalSubcategory,
      attachments: attachments,
      todos: todos,
      // Backward-compatible single file fields
      fileName: firstAtt?.fileName || '',
      fileType: firstAtt?.fileType || '',
      fileSize: firstAtt?.fileSize || 0,
      fileUrl: firstAtt?.fileUrl || '',
      fileDataUrl: firstAtt?.fileDataUrl || '',
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

  return (
    <div
      id="modal-add-personal-record-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-add-personal-record-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-6 transition-all max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
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
                  ? 'Ingresa los números, fotos adjuntas y lista To-Do de la tarjeta'
                  : 'Adjunta múltiples fotos/archivos y organiza tareas To-Do en la subcategoría'}
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

        {/* Form Container with Scroll */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Member Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>👤 Integrante Titular:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {members.map((m) => {
                const isSelected = memberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMemberId(m.id);
                      if (isCardMode && (!cardHolder || cardHolder === selectedMember?.name)) {
                        setCardHolder(m.name);
                      }
                      checkAndSyncExisting(m.id, category, subcategory);
                    }}
                    className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500 shadow-xs ring-1 ring-red-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-red-500" />
                <span>Categoría Principal: <span className="text-red-500">*</span></span>
              </label>
              {onOpenManageCategories && (
                <button
                  type="button"
                  onClick={onOpenManageCategories}
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Gestionar Categorías
                </button>
              )}
            </div>

            {!isCustomCategory ? (
              <select
                value={category}
                onChange={handleCategorySelectChange}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    📁 {c.name}
                  </option>
                ))}
                <option value="__custom__">➕ Escribir otra categoría personalizada...</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej: Trámites Consulares, Vehículos..."
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setCategory(categories[0]?.name || 'Documentos de Identidad');
                  }}
                  className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Lista
                </button>
              </div>
            )}
          </div>

          {/* Subcategory Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-red-500" />
                <span>Subcategoría / Tipo de Documento: <span className="text-red-500">*</span></span>
              </label>

              {selectedCategoryObj && !isCustomSubcategory && (
                <button
                  type="button"
                  onClick={() => setShowNewSubInput(!showNewSubInput)}
                  className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Crear subcategoría</span>
                </button>
              )}
            </div>

            {!isCustomSubcategory ? (
              <select
                value={subcategory}
                onChange={handleSubcategorySelectChange}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              >
                {availableSubcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    🏷️ {sub}
                  </option>
                ))}
                <option value="__custom__">➕ Escribir subcategoría personalizada...</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={subcategory}
                  onChange={(e) => handleSubcategorySelect(e.target.value)}
                  placeholder="Ej: TEUDAT ZEUT, Pasaporte, Licencia..."
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSubcategory(false);
                    const defaultSub = availableSubcategories[0] || 'TEUDAT ZEUT';
                    handleSubcategorySelect(defaultSub);
                  }}
                  className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Lista
                </button>
              </div>
            )}
          </div>

          {/* Quick inline subcategory creator */}
          {showNewSubInput && selectedCategoryObj && (
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <input
                type="text"
                value={newSubInline}
                onChange={(e) => setNewSubInline(e.target.value)}
                placeholder={`Nueva subcategoría para ${selectedCategoryObj.name}...`}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-900 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={handleQuickAddSubcategory}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer"
              >
                Guardar
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

          {/* Existing record banner */}
          {existingRecordId && !editingRecord && (
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                Esta subcategoría ya tiene <strong>{attachments.length} archivo(s)</strong> para {selectedMember?.name}. Los nuevos archivos que agregues se sumarán al mismo registro.
              </span>
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
                  Habilita campos de número, CVC, fecha de vencimiento y diseño visual
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

          {/* ================= CREDIT CARD VISUALIZER & INPUTS ================= */}
          {isCardMode && (
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Diseño de Tarjeta</span>
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

          {/* ================= MULTIPLE DOCUMENTS & PHOTOS ATTACHMENT SECTION ================= */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-red-500" />
                <span>Adjuntar Fotos o Archivos a esta Subcategoría:</span>
              </label>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                {attachments.length === 0
                  ? '0 archivos'
                  : attachments.length === 1
                  ? '1 archivo adjunto'
                  : `${attachments.length} archivos adjuntos`}
              </span>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
            />
            <input
              type="file"
              capture="environment"
              accept="image/*"
              ref={cameraInputRef}
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Drag & Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/20 scale-[0.99]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-red-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isUploading ? 'Subiendo archivos...' : 'Haz clic para seleccionar uno o varios archivos'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    O arrastra y suelta aquí (Frente, Dorso, PDFs, JPG, PNG, etc.)
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-red-500 stroke-[2.5]" />
                <span>Seleccionar varios archivos</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                title="Tomar foto con la cámara"
              >
                <Camera className="w-3.5 h-3.5 text-red-500" />
                <span>Tomar foto</span>
              </button>
            </div>

            {/* List of Attached Documents with Labels and Controls */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
                  <span>Archivos en esta subcategoría ({attachments.length}):</span>
                  <span className="text-[10px] text-slate-400">Asigna etiquetas (Frente/Dorso) a cada archivo</span>
                </div>

                {attachments.map((att, idx) => {
                  const isImg =
                    att.fileType?.startsWith('image/') ||
                    (att.fileDataUrl && att.fileDataUrl.startsWith('data:image/'));

                  return (
                    <div
                      key={att.id || idx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/80 dark:bg-slate-800/60 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                    >
                      {/* Top row: Thumbnail/Icon + Name + Actions */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Thumbnail / Icon */}
                          {isImg && att.fileDataUrl ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onPreviewAttachment) onPreviewAttachment(att);
                              }}
                              className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer relative group/preview"
                              title="Clic para ampliar vista previa"
                            >
                              <img
                                src={att.fileDataUrl}
                                alt={att.fileName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}

                          {/* File metadata */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                                #{idx + 1}
                              </span>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {att.fileName || `Archivo ${idx + 1}`}
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {formatFileSize(att.fileSize)} {att.fileType ? `• ${att.fileType.split('/')[1] || att.fileType}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Top Actions: Move Up / Down / View / Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          {attachments.length > 1 && (
                            <>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveAttachment(idx, 'up')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                                title="Mover arriba"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === attachments.length - 1}
                                onClick={() => handleMoveAttachment(idx, 'down')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                                title="Mover abajo"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isImg && onPreviewAttachment && (
                            <button
                              type="button"
                              onClick={() => onPreviewAttachment(att)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Previsualizar"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Quitar este archivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom row: Quick label tags selector */}
                      <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">Etiqueta:</span>
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
                          {QUICK_LABEL_PRESETS.map((preset) => {
                            const isSelected = att.label === preset;
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleUpdateAttachmentLabel(att.id, isSelected ? '' : preset)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border shrink-0 ${
                                  isSelected
                                    ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Incremental Add More Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar otro archivo a esta subcategoría</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= LISTADO TO-DO / CHECKLIST EN TODAS LAS SUBCATEGORÍAS ================= */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-red-500" />
                <span>Lista To-Do / Tareas Pendientes de esta Subcategoría:</span>
              </label>
              {todos.length > 0 && (
                <span className="text-[11px] font-bold text-slate-500">
                  {todos.filter((t) => t.completed).length} / {todos.length} listas
                </span>
              )}
            </div>

            {/* Progress bar in modal if todos exist */}
            {todos.length > 0 && (
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${(todos.filter((t) => t.completed).length / todos.length) * 100}%` }}
                />
              </div>
            )}

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
              <span className="text-[10px] font-bold text-slate-400 shrink-0">Sugerencias:</span>
              {QUICK_TODO_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddTodo(preset)}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {/* Inline input to add a To-Do task */}
            <div className="flex items-center gap-2">
              <input
                ref={todoInputRef}
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTodo();
                  }
                }}
                placeholder="Ej: Renovar antes del 15, Pedir turno médico, Pagar resumen..."
                className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => handleAddTodo()}
                disabled={!newTodoText.trim()}
                className="px-3.5 py-2 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Checklist items list */}
            {todos.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {todos.map((t) => (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      t.completed
                        ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(t.id)}
                      className={`p-0.5 rounded-md cursor-pointer transition-transform active:scale-90 shrink-0 ${
                        t.completed ? 'text-emerald-600' : 'text-slate-400 hover:text-red-600'
                      }`}
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500/10 stroke-[2.5]" />
                      ) : (
                        <Square className="w-4 h-4 stroke-[2]" />
                      )}
                    </button>

                    <span
                      onClick={() => handleToggleTodo(t.id)}
                      className={`text-xs font-medium flex-1 break-words cursor-pointer select-none ${
                        t.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {t.text}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(t.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {editingRecord
                  ? 'Guardar Cambios'
                  : existingRecordId
                  ? 'Actualizar Subcategoría'
                  : isCardMode
                  ? 'Guardar Tarjeta'
                  : 'Guardar Dato Personal'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
