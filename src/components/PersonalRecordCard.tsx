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
} from 'lucide-react';
import { Member, PersonalRecord } from '../types';
import { CreditCardVisualizer } from './CreditCardVisualizer';

interface PersonalRecordCardProps {
  record: PersonalRecord;
  member?: Member;
  isAdmin?: boolean;
  onEdit: (record: PersonalRecord) => void;
  onDelete: (id: string) => void;
  onViewPhoto: (record: PersonalRecord) => void;
  onSendRecord?: (record: PersonalRecord) => void;
}

export const isCreditCardRecord = (record: PersonalRecord) => {
  if (record.cardNumber || record.cardCvc || record.cardExp || record.cardHolder) return true;
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
}) => {
  const isImage =
    record.fileType?.startsWith('image/') ||
    (record.fileDataUrl && record.fileDataUrl.startsWith('data:image/'));

  const isCard = isCreditCardRecord(record);

  const handleDownload = () => {
    const targetUrl = record.fileUrl || record.fileDataUrl;
    if (targetUrl) {
      const link = document.createElement('a');
      link.href = targetUrl;
      const downloadName =
        record.fileName ||
        `${(record.subcategory || record.category || 'documento')
          .toLowerCase()
          .replace(/\s+/g, '_')}`;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
              {isCard ? <CreditCardIcon className="w-3 h-3 text-red-500" /> : <Folder className="w-3 h-3" />}
              <span>{record.category || 'General'}</span>
            </span>

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
                  title="Editar"
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
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-0.5">
            <Tag className="w-3 h-3 text-red-500" />
            <span>Subcategoría:</span>
          </div>
          <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
            {record.subcategory || record.title || 'Dato Personal'}
          </h4>
        </div>

        {/* ================= CREDIT CARD VISUALIZER ================= */}
        {isCard && (
          <div className="mb-4">
            <CreditCardVisualizer
              card={{
                cardNumber: record.cardNumber,
                cardHolder: record.cardHolder || member?.name || 'JAIME HADIDA',
                cardExp: record.cardExp,
                cardCvc: record.cardCvc,
                cardBank: record.cardBank || record.title || record.subcategory || 'ISRACARD',
                cardBrand: record.cardBrand,
                cardTheme: 'isracard_white',
              }}
              size="sm"
            />
          </div>
        )}

        {/* File & Photo Attachment Area */}
        {record.fileDataUrl ? (
          <div className="mb-3">
            {isImage ? (
              <div
                onClick={() => onViewPhoto(record)}
                className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer group/img aspect-video sm:aspect-4/3 max-h-48 flex items-center justify-center shadow-xs"
              >
                <img
                  src={record.fileDataUrl}
                  alt={record.subcategory || record.category}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-white text-red-600 border border-red-600 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Foto Completa</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {record.fileName || 'Documento adjunto'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatFileSize(record.fileSize)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-900 text-red-600 border border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 cursor-pointer shadow-2xs"
                  title="Descargar archivo"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          !isCard && isAdmin && (
            <button
              onClick={() => onEdit(record)}
              className="w-full mb-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 hover:border-red-400 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5 text-red-500" />
              <span>Adjuntar foto o archivo</span>
            </button>
          )
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

          {record.fileDataUrl && isImage && (
            <button
              onClick={() => onViewPhoto(record)}
              className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ImageIcon className="w-3 h-3" />
              <span>Foto</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

