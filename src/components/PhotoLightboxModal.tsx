import React from 'react';
import { X, Download, FileText, Folder, Tag, Send } from 'lucide-react';
import { PersonalRecord } from '../types';

interface PhotoLightboxModalProps {
  record: PersonalRecord | null;
  onClose: () => void;
  onSendRecord?: (record: PersonalRecord) => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  record,
  onClose,
  onSendRecord,
}) => {
  if (!record || !record.fileDataUrl) return null;

  const isImage =
    record.fileType?.startsWith('image/') || record.fileDataUrl.startsWith('data:image/');
  const titleText = record.subcategory || record.category || 'Documento';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = record.fileDataUrl || '';
    link.download =
      record.fileName || `${titleText.toLowerCase().replace(/\s+/g, '_')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="modal-lightbox-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between text-white pb-3 px-2">
          <div className="min-w-0 pr-4 flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600/80 text-white border border-red-500 flex items-center gap-1">
              <Folder className="w-3 h-3" />
              <span>{record.category}</span>
            </span>
            <span className="text-sm sm:text-base font-bold text-white flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-red-400" />
              <span>{record.subcategory}</span>
            </span>
            {record.fileName && (
              <span className="text-xs text-slate-300 truncate">({record.fileName})</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
                <span>Enviar</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-white text-red-600 border border-red-600 text-xs font-bold flex items-center gap-1.5 hover:bg-red-50 transition-colors cursor-pointer shadow-xs"
              title="Descargar archivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content View */}
        <div className="w-full flex items-center justify-center max-h-[75vh] overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-700 p-2">
          {isImage ? (
            <img
              src={record.fileDataUrl}
              alt={titleText}
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="py-16 px-8 flex flex-col items-center gap-4 text-center text-slate-200">
              <FileText className="w-16 h-16 text-red-400" />
              <div>
                <p className="text-base font-bold">{record.fileName || titleText}</p>
                <p className="text-xs text-slate-400 mt-1">{record.fileType}</p>
              </div>
              <button
                onClick={handleDownload}
                className="mt-2 px-4 py-2 rounded-xl bg-white text-red-600 border border-red-600 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                Descargar Documento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
