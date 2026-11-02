import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileText,
  Folder,
  Tag,
  Send,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { PersonalRecord, RecordAttachment } from '../types';

interface PhotoLightboxModalProps {
  record: PersonalRecord | null;
  initialIndex?: number;
  onClose: () => void;
  onSendRecord?: (record: PersonalRecord) => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  record,
  initialIndex = 0,
  onClose,
  onSendRecord,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Normalize attachments
  const attachments: RecordAttachment[] =
    record?.attachments && record.attachments.length > 0
      ? record.attachments
      : record?.fileDataUrl || record?.fileUrl
      ? [
          {
            id: 'att_' + record.id,
            fileName: record.fileName || 'Documento',
            fileType: record.fileType || '',
            fileSize: record.fileSize || 0,
            fileUrl: record.fileUrl || '',
            fileDataUrl: record.fileDataUrl || '',
          },
        ]
      : [];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, record]);

  // Keyboard navigation
  useEffect(() => {
    if (!record) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [record, attachments.length, onClose]);

  if (!record || attachments.length === 0) return null;

  const currentAttachment = attachments[currentIndex] || attachments[0];
  const targetUrl = currentAttachment.fileUrl || currentAttachment.fileDataUrl || '';
  const isImage =
    currentAttachment.fileType?.startsWith('image/') ||
    (currentAttachment.fileDataUrl && currentAttachment.fileDataUrl.startsWith('data:image/'));
  const isPdf =
    currentAttachment.fileType === 'application/pdf' ||
    currentAttachment.fileName?.toLowerCase().endsWith('.pdf') ||
    targetUrl.toLowerCase().endsWith('.pdf');

  const titleText = record.title || record.subcategory || record.category || 'Documento';

  const handleDownload = () => {
    if (targetUrl) {
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download =
        currentAttachment.fileName ||
        `${titleText.toLowerCase().replace(/\s+/g, '_')}_${currentIndex + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      id="modal-lightbox-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[94vh] flex flex-col items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between text-white pb-3 px-2 shrink-0 gap-2">
          <div className="min-w-0 pr-2 flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-red-600 text-white border border-red-500 flex items-center gap-1">
              <Folder className="w-3 h-3" />
              <span>{record.category}</span>
            </span>

            <span className="text-sm sm:text-base font-black text-white flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-red-400" />
              <span>{titleText}</span>
            </span>

            {currentAttachment.label && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white shadow-xs">
                {currentAttachment.label}
              </span>
            )}

            {attachments.length > 1 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {currentIndex + 1} de {attachments.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {targetUrl && (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Abrir</span>
              </a>
            )}

            {onSendRecord && (
              <button
                onClick={() => {
                  onClose();
                  onSendRecord(record);
                }}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-900 hover:text-red-600 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Enviar o compartir dato"
              >
                <Send className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-white text-red-600 border border-red-600 text-xs font-bold flex items-center gap-1.5 hover:bg-red-50 transition-colors cursor-pointer shadow-xs"
              title="Descargar archivo activo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content View Area with Navigation Arrows */}
        <div className="relative w-full flex-1 flex items-center justify-center min-h-[55vh] max-h-[75vh] overflow-hidden rounded-3xl bg-slate-950/80 border border-slate-800 p-2 sm:p-4">
          {attachments.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 z-20 p-2.5 rounded-full bg-black/60 hover:bg-red-600 text-white transition-all cursor-pointer shadow-lg backdrop-blur-xs"
              title="Anterior (Flecha izquierda)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {isImage ? (
            <img
              key={currentAttachment.id || currentIndex}
              src={targetUrl}
              alt={currentAttachment.fileName || titleText}
              className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all animate-in fade-in duration-200"
              referrerPolicy="no-referrer"
            />
          ) : isPdf && targetUrl ? (
            <iframe
              key={currentAttachment.id || currentIndex}
              src={targetUrl}
              title={currentAttachment.fileName || titleText}
              className="w-full h-[68vh] rounded-2xl bg-white border border-slate-700 shadow-2xl"
            />
          ) : (
            <div className="py-16 px-8 flex flex-col items-center gap-4 text-center text-slate-200 animate-in fade-in duration-200">
              <div className="w-20 h-20 rounded-3xl bg-red-950/50 text-red-400 border border-red-800/80 flex items-center justify-center shadow-xl">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {currentAttachment.fileName || titleText}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {currentAttachment.fileType || 'Documento adjunto'}
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-white text-red-600 border border-red-600 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg hover:bg-red-50 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Este Documento</span>
              </button>
            </div>
          )}

          {attachments.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 z-20 p-2.5 rounded-full bg-black/60 hover:bg-red-600 text-white transition-all cursor-pointer shadow-lg backdrop-blur-xs"
              title="Siguiente (Flecha derecha)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Strip (if multiple attachments exist) */}
        {attachments.length > 1 && (
          <div className="w-full pt-3 px-2 flex items-center justify-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            {attachments.map((att, idx) => {
              const isThumbImg =
                att.fileType?.startsWith('image/') ||
                (att.fileDataUrl && att.fileDataUrl.startsWith('data:image/'));
              const isSelected = idx === currentIndex;

              return (
                <button
                  key={att.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative rounded-xl overflow-hidden w-12 h-12 sm:w-14 sm:h-14 shrink-0 transition-all cursor-pointer border-2 ${
                    isSelected
                      ? 'border-red-500 scale-105 shadow-md shadow-red-500/30'
                      : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                  }`}
                  title={att.fileName || `Documento ${idx + 1}`}
                >
                  {isThumbImg && (att.fileDataUrl || att.fileUrl) ? (
                    <img
                      src={att.fileDataUrl || att.fileUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 text-red-400 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  {att.label && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-black text-white text-center truncate py-0.5 px-0.5">
                      {att.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
