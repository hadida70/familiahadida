import React from 'react';
import {
  Trash2,
  Edit2,
  Download,
  Eye,
  FileText,
  Folder,
  Tag,
  Send,
  Paperclip,
  CreditCard as CreditCardIcon,
  Image as ImageIcon,
  CheckCircle2,
  Square,
  ListTodo,
} from 'lucide-react';
import { Member, PersonalRecord, RecordAttachment, RecordTodo } from '../types';
import { CreditCardVisualizer } from './CreditCardVisualizer';
import { sounds } from '../lib/sound';

interface PersonalRecordCardProps {
  record: PersonalRecord;
  member?: Member;
  isAdmin?: boolean;
  onEdit: (record: PersonalRecord) => void;
  onDelete: (id: string) => void;
  onViewPhoto: (record: PersonalRecord, attachmentIndex?: number) => void;
  onSendRecord?: (record: PersonalRecord) => void;
  onUpdateRecordTodos?: (recordId: string, todos: RecordTodo[]) => void;
}

export const isCreditCardRecord = (record: PersonalRecord) => {
  const cat = (record.category || '').toLowerCase();
  const isBank =
    cat.includes('banco') ||
    cat.includes('bancos') ||
    cat.includes('finanza') ||
    cat.includes('finanzas') ||
    cat.includes('tarjeta') ||
    cat.includes('bank');

  // La visualización de la tarjeta de crédito SOLO está disponible en la categoría Banco / Finanzas
  if (!isBank) return false;

  if (record.cardNumber || record.cardCvc || record.cardExp || record.cardHolder || record.cardAtmPin) return true;
  const str = `${record.category || ''} ${record.subcategory || ''}`.toLowerCase();
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

export const PersonalRecordCard: React.FC<PersonalRecordCardProps> = ({
  record,
  member,
  isAdmin = false,
  onEdit,
  onDelete,
  onViewPhoto,
  onSendRecord,
  onUpdateRecordTodos,
}) => {
  // Normalize attachments array
  const attachments: RecordAttachment[] =
    record.attachments && record.attachments.length > 0
      ? record.attachments
      : record.fileDataUrl || record.fileUrl
      ? [
          {
            id: 'att_' + record.id,
            fileName: record.fileName || 'Documento adjunto',
            fileType: record.fileType || '',
            fileSize: record.fileSize || 0,
            fileUrl: record.fileUrl || '',
            fileDataUrl: record.fileDataUrl || '',
            label: 'Principal',
          },
        ]
      : [];

  const imageAttachments = attachments.filter(
    (a) => a.fileType?.startsWith('image/') || (a.fileDataUrl && a.fileDataUrl.startsWith('data:image/'))
  );

  const isCard = isCreditCardRecord(record);
  const todos: RecordTodo[] = record.todos || [];
  const isListRecord = record.recordType === 'list' || (record.recordType !== 'document' && todos.length > 0 && attachments.length === 0);
  const completedTodosCount = todos.filter((t) => t.completed).length;

  const handleDownloadAttachment = (att: RecordAttachment) => {
    const targetUrl = att.fileUrl || att.fileDataUrl;
    if (targetUrl) {
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = att.fileName || `${(record.subcategory || 'documento').toLowerCase().replace(/\s+/g, '_')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleToggleTodo = (todoId: string) => {
    if (!onUpdateRecordTodos) return;
    const nextTodos = todos.map((t) => {
      if (t.id === todoId) {
        const nextCompleted = !t.completed;
        if (nextCompleted) sounds.playCheckSound();
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    onUpdateRecordTodos(record.id, nextTodos);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      id={`personal-record-${record.id}`}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
    >
      <div>
        {/* Header: Categoría + Member Badge + Actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {/* Categoría Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60">
              {isCard ? <CreditCardIcon className="w-3 h-3 text-red-500" /> : isListRecord ? <ListTodo className="w-3 h-3 text-red-500" /> : <Folder className="w-3 h-3" />}
              <span>{record.category || 'General'}</span>
            </span>

            {/* Mode Badge if list */}
            {isListRecord && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                <ListTodo className="w-3 h-3 text-amber-500" />
                <span>Listado</span>
              </span>
            )}

            {/* Member Owner Badge */}
            {member && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {member.name}
              </span>
            )}
          </div>

          {/* Card Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Send / Share button */}
            {onSendRecord && (
              <button
                onClick={() => onSendRecord(record)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Enviar o compartir dato"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Admin-only Edit & Delete */}
            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(record)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Editar o modificar dato"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(record.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Subcategoría as Main Title */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-1 text-xs text-slate-400 dark:text-slate-500 mb-0.5">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-red-500" />
              <span>Subcategoría:</span>
            </div>
            {attachments.length > 0 && (
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/60">
                📎 {attachments.length} {attachments.length === 1 ? 'archivo' : 'archivos'}
              </span>
            )}
          </div>
          <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
            {record.subcategory || record.title || 'Dato Personal'}
          </h4>
        </div>

        {/* ================= CREDIT CARD VISUALIZER (ONLY FOR BANK CATEGORY) ================= */}
        {isCard && (
          <div className="mb-4">
            <CreditCardVisualizer
              card={{
                cardNumber: record.cardNumber,
                cardHolder: record.cardHolder || member?.name || 'JAIME HADIDA',
                cardExp: record.cardExp,
                cardCvc: record.cardCvc,
                cardAtmPin: record.cardAtmPin,
                cardBank: record.cardBank || record.title || record.subcategory || 'ISRACARD',
                cardBrand: record.cardBrand,
                cardTheme: 'isracard_white',
              }}
              size="sm"
            />
          </div>
        )}

        {/* ================= MULTI-DOCUMENT & PHOTO ATTACHMENTS AREA ================= */}
        {attachments.length > 0 && (
          <div className="mb-3.5 space-y-2">
            {/* Multi-Photo Gallery Preview for 1, 2, or 3+ images */}
            {imageAttachments.length === 1 && (
              <div
                onClick={() => onViewPhoto(record, attachments.indexOf(imageAttachments[0]))}
                className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer group/img aspect-video sm:aspect-4/3 max-h-48 flex items-center justify-center shadow-xs"
              >
                <img
                  src={imageAttachments[0].fileDataUrl || imageAttachments[0].fileUrl}
                  alt={imageAttachments[0].fileName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-white text-red-600 border border-red-600 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Imagen</span>
                  </span>
                </div>
                {imageAttachments[0].label && (
                  <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-black shadow-md">
                    {imageAttachments[0].label}
                  </div>
                )}
              </div>
            )}

            {imageAttachments.length === 2 && (
              <div className="grid grid-cols-2 gap-2">
                {imageAttachments.map((imgAtt, i) => (
                  <div
                    key={imgAtt.id || i}
                    onClick={() => onViewPhoto(record, attachments.indexOf(imgAtt))}
                    className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer group/img aspect-4/3 max-h-36 flex items-center justify-center shadow-xs"
                  >
                    <img
                      src={imgAtt.fileDataUrl || imgAtt.fileUrl}
                      alt={imgAtt.fileName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-red-600 text-white text-[9px] font-black shadow-md">
                      {imgAtt.label || (i === 0 ? 'Frente' : 'Dorso')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {imageAttachments.length >= 3 && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5">
                  {imageAttachments.slice(0, 3).map((imgAtt, i) => (
                    <div
                      key={imgAtt.id || i}
                      onClick={() => onViewPhoto(record, attachments.indexOf(imgAtt))}
                      className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer group/img aspect-square max-h-28 flex items-center justify-center shadow-xs"
                    >
                      <img
                        src={imgAtt.fileDataUrl || imgAtt.fileUrl}
                        alt={imgAtt.fileName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                      {imgAtt.label && (
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded-md bg-red-600 text-white text-[8px] font-black">
                          {imgAtt.label}
                        </div>
                      )}
                      {i === 2 && imageAttachments.length > 3 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs font-black">
                          +{imageAttachments.length - 2} más
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List of Attached Documents / Files */}
            <div className="space-y-1.5">
              {attachments.map((att, attIdx) => {
                const isAttImage =
                  att.fileType?.startsWith('image/') ||
                  (att.fileDataUrl && att.fileDataUrl.startsWith('data:image/'));

                return (
                  <div
                    key={att.id || attIdx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900">
                        {isAttImage ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {att.label && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-red-600 text-white shrink-0">
                              {att.label}
                            </span>
                          )}
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {att.fileName || `Documento ${attIdx + 1}`}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatFileSize(att.fileSize)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isAttImage && (
                        <button
                          type="button"
                          onClick={() => onViewPhoto(record, attIdx)}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-red-600 transition-colors cursor-pointer"
                          title="Ver documento"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(att)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-red-600 border border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shadow-2xs"
                        title="Descargar archivo"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= LISTADO DE ÍTEMS / TO-DO CHECKLIST (SOLO SI TIENE ÍTEMS) ================= */}
        {todos.length > 0 && (
          <div className={`mb-3 p-3.5 rounded-2xl ${
            isListRecord
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60'
              : 'bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70'
          } space-y-2.5`}>
            {/* Checklist Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ListTodo className={`w-4 h-4 ${isListRecord ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}`} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isListRecord ? 'Listado de Ítems:' : 'Tareas To-Do:'}
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {completedTodosCount}/{todos.length} {completedTodosCount === 1 ? 'completado' : 'completados'}
              </span>
            </div>

            {/* Progress Bar if todos exist */}
            <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${(completedTodosCount / todos.length) * 100}%` }}
              />
            </div>

            {/* Checklist items */}
            <div className="space-y-1 pt-0.5">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => handleToggleTodo(todo.id)}
                  className={`flex items-start gap-2 p-1.5 rounded-xl transition-all cursor-pointer select-none text-xs ${
                    todo.completed
                      ? 'text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-900/30'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTodo(todo.id);
                    }}
                    className={`p-0.5 mt-0.5 rounded-md transition-transform active:scale-90 shrink-0 ${
                      todo.completed ? 'text-emerald-600' : 'text-slate-400 hover:text-red-600'
                    }`}
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/10 stroke-[2.5]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 stroke-[2]" />
                    )}
                  </button>
                  <span className={`flex-1 break-words font-medium ${todo.completed ? 'line-through' : ''}`}>
                    {todo.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer info: Date & Attachment Action & Send shortcut */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          {new Date(record.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>

        <div className="flex items-center gap-2">
          {onSendRecord && (
            <button
              onClick={() => onSendRecord(record)}
              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-red-600 flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3 text-red-500" />
              <span>Enviar</span>
            </button>
          )}

          {attachments.length > 0 && (
            <button
              onClick={() => onViewPhoto(record, 0)}
              className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Paperclip className="w-3 h-3" />
              <span>{attachments.length} {attachments.length === 1 ? 'doc' : 'docs'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
