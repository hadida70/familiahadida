import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BellRing, Send, User } from 'lucide-react';
import { Member } from '../types';

interface SendAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendAlert: (recipientId: string, title: string, message: string) => void;
  members: Member[];
}

export const SendAlertModal: React.FC<SendAlertModalProps> = ({
  isOpen,
  onClose,
  onSendAlert,
  members,
}) => {
  const [recipientId, setRecipientId] = useState<string>('all');
  const [title, setTitle] = useState('⚡ Recordatorio de Supermercado');
  const [message, setMessage] = useState('¡Hola! Por favor revisa tu lista de compras asignada hoy.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendAlert(recipientId, title.trim(), message.trim());
    onClose();
  };

  const PRESET_MESSAGES = [
    '¡Hola! Recuerda comprar los productos de tu lista hoy 🛒',
    '¡Ya estoy en el supermercado! Confirma si necesitas algo más 🏃‍♂️',
    '⚡ Por favor compra los productos urgentes marcados en tu lista',
    '✅ ¡Gracias por completar las compras!',
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-amber-500 text-slate-950 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-6 h-6 animate-pulse" />
              <h2 className="font-extrabold text-lg">
                Enviar Notificación Push
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-amber-600/30 text-slate-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Recipient Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Enviar Notificación a:
              </label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white outline-none"
              >
                <option value="all">📢 Todos los Integrantes de la Familia</option>
                {members
                  .filter((m) => m.role !== 'admin')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      👤 {m.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Título del Mensaje
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm outline-none"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mensajes rápidos:
              </label>
              <div className="space-y-1">
                {PRESET_MESSAGES.map((msg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMessage(msg)}
                    className="w-full text-left px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors truncate border border-slate-200 dark:border-slate-700"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Mensaje personalizado
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm outline-none resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Alerta Push</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
