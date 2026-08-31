import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  User,
  Folder,
  Tag,
  Share2,
  Copy,
  Check,
  Download,
  FileText,
  Eye,
  MessageCircle,
  BellRing,
} from 'lucide-react';
import { Member, PersonalRecord } from '../types';

interface SendPersonalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PersonalRecord | null;
  records: PersonalRecord[];
  members: Member[];
  onSendAlert: (recipientId: string, title: string, message: string) => void;
  onViewPhoto?: (record: PersonalRecord) => void;
}

export const SendPersonalRecordModal: React.FC<SendPersonalRecordModalProps> = ({
  isOpen,
  onClose,
  record: initialRecord,
  records,
  members,
  onSendAlert,
  onViewPhoto,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    initialRecord?.id || records[0]?.id || ''
  );
  const [recipientId, setRecipientId] = useState<string>('all');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (initialRecord) {
      setSelectedRecordId(initialRecord.id);
    } else if (records.length > 0 && !selectedRecordId) {
      setSelectedRecordId(records[0].id);
    }
  }, [initialRecord, records]);

  const activeRecord = records.find((r) => r.id === selectedRecordId) || initialRecord || records[0];
  const recordOwner = members.find((m) => m.id === activeRecord?.memberId);

  useEffect(() => {
    if (activeRecord) {
      const ownerName = recordOwner?.name || 'Integrante';
      const cat = activeRecord.category || 'General';
      const subcat = activeRecord.subcategory || 'Dato Personal';

      if (activeRecord.cardNumber) {
        setCustomMessage(
          `💳 Tarjeta: ${activeRecord.cardBank || subcat} (${activeRecord.cardNumber}) | Vence: ${activeRecord.cardExp || 'N/D'} | CVC: ${activeRecord.cardCvc || '•••'} | Titular: ${activeRecord.cardHolder || ownerName}`
        );
      } else {
        setCustomMessage(
          `📁 Dato Personal compartido: ${cat} - ${subcat} de ${ownerName}.${
            activeRecord.fileName ? ` (Archivo adjunto: ${activeRecord.fileName})` : ''
          }`
        );
      }
    }
    setSentSuccess(false);
    setCopied(false);
  }, [selectedRecordId, activeRecord, recordOwner]);

  if (!isOpen || !activeRecord) return null;

  const isImage =
    activeRecord.fileType?.startsWith('image/') ||
    (activeRecord.fileDataUrl && activeRecord.fileDataUrl.startsWith('data:image/'));

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    const title = activeRecord.cardNumber
      ? `💳 Tarjeta: ${activeRecord.cardBank || activeRecord.subcategory}`
      : `📁 Dato Personal: ${activeRecord.category} - ${activeRecord.subcategory}`;
    onSendAlert(recipientId, title, customMessage.trim());
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1500);
  };

  const handleWhatsAppShare = () => {
    const ownerName = recordOwner?.name || 'la familia';
    let text = `*📁 DATOS PERSONALES - ${activeRecord.category.toUpperCase()}*\n` +
      `👤 *Integrante:* ${ownerName}\n` +
      `🏷️ *Subcategoría:* ${activeRecord.subcategory}\n`;

    if (activeRecord.cardNumber) {
      text += `💳 *Nº Tarjeta:* \`${activeRecord.cardNumber}\`\n` +
        `📅 *Vencimiento:* ${activeRecord.cardExp || 'N/D'}\n` +
        `🔒 *CVC / CVV:* ${activeRecord.cardCvc || '•••'}\n` +
        `🏦 *Banco/Emisor:* ${activeRecord.cardBank || ''}\n` +
        `👤 *Titular:* ${activeRecord.cardHolder || ownerName}\n`;
    }

    if (activeRecord.fileName) {
      text += `📎 *Adjunto:* ${activeRecord.fileName}\n`;
    }

    text += `\n💬 ${customMessage}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopySummary = () => {
    const ownerName = recordOwner?.name || 'Integrante';
    let text = `📁 DATO PERSONAL\n` +
      `Integrante: ${ownerName}\n` +
      `Categoría: ${activeRecord.category}\n` +
      `Subcategoría: ${activeRecord.subcategory}\n`;

    if (activeRecord.cardNumber) {
      text += `Tarjeta Nº: ${activeRecord.cardNumber}\n` +
        `Vencimiento: ${activeRecord.cardExp || ''}\n` +
        `CVC: ${activeRecord.cardCvc || ''}\n` +
        `Titular: ${activeRecord.cardHolder || ownerName}\n` +
        `Banco: ${activeRecord.cardBank || ''}\n`;
    }

    if (activeRecord.fileName) {
      text += `Archivo: ${activeRecord.fileName}\n`;
    }

    text += `Mensaje: ${customMessage}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (activeRecord.fileDataUrl) {
      const link = document.createElement('a');
      link.href = activeRecord.fileDataUrl;
      link.download =
        activeRecord.fileName ||
        `${(activeRecord.subcategory || activeRecord.category || 'dato_personal')
          .toLowerCase()
          .replace(/\s+/g, '_')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      id="modal-send-personal-record-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-send-personal-record-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center border border-red-200/50">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Enviar o Compartir Datos Personales
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Envía alertas a los integrantes de la familia o comparte por WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSendNotification} className="p-5 space-y-4">
          {sentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>¡Notificación enviada exitosamente a la familia!</span>
            </div>
          )}

          {/* Select which Record to Send if multiple records exist */}
          {records.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-red-500" />
                <span>Seleccionar Dato Personal a Enviar:</span>
              </label>
              <select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-red-500/30"
              >
                {records.map((r) => {
                  const owner = members.find((m) => m.id === r.memberId);
                  return (
                    <option key={r.id} value={r.id}>
                      {owner ? `${owner.name}: ` : ''}
                      {r.category} → {r.subcategory} {r.fileName ? `📎 (${r.fileName})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Selected Record Summary Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                  <Folder className="w-3 h-3" />
                  {activeRecord.category}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <Tag className="w-3 h-3 text-red-500" />
                  {activeRecord.subcategory}
                </span>
              </div>
              {recordOwner && (
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md">
                  {recordOwner.name}
                </span>
              )}
            </div>

            {/* Attached Photo / Document preview if present */}
            {activeRecord.fileDataUrl && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mt-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isImage ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                      <img
                        src={activeRecord.fileDataUrl}
                        alt="Adjunto"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {activeRecord.fileName || 'Archivo adjunto'}
                    </p>
                    <p className="text-[10px] text-slate-400">Listo para enviar</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isImage && onViewPhoto && (
                    <button
                      type="button"
                      onClick={() => onViewPhoto(activeRecord)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-red-600 cursor-pointer"
                      title="Ver foto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-red-600 border border-red-500 hover:bg-red-50 cursor-pointer shadow-2xs"
                    title="Descargar"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Destinatario Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-red-500" />
              <span>Enviar a Integrante:</span>
            </label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="all">📢 Todos los Integrantes de la Familia</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  👤 {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mensaje a Enviar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-red-500" />
              <span>Mensaje / Detalle del Envío:</span>
            </label>
            <textarea
              rows={2}
              required
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
            />
          </div>

          {/* External Share Actions: WhatsApp & Copy */}
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Copiar datos al portapapeles"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Modal Action Buttons: White background with red border */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Notificación a Integrante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
