import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { CustomList, GroceryItem, Member } from '../types';

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GroceryItem[];
  members: Member[];
  activeMember: Member | null;
  activeList?: CustomList;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  isOpen,
  onClose,
  items,
  members,
  activeMember,
  activeList,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const listItems = activeList ? items.filter((i) => i.listId === activeList.id) : items;
  const listTitle = activeList ? `${activeList.icon} ${activeList.name.toUpperCase()}` : 'SUPERMERCADO';

  // Generate clean text representation
  const generateFormattedText = () => {
    let text = `📋 *LISTA: ${listTitle}*\n`;
    text += `📅 ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

    const pendingItems = listItems.filter((i) => !i.completed);
    const completedItems = listItems.filter((i) => i.completed);

    if (activeMember && activeMember.role !== 'admin') {
      text += `👤 *Asignado a: ${activeMember.name}*\n\n`;
    }

    if (pendingItems.length === 0) {
      text += `¡Todos los productos han sido completados! 🎉\n`;
    } else {
      text += `🛒 *PENDIENTES (${pendingItems.length}):*\n`;
      pendingItems.forEach((item, index) => {
        const assignee = members.find((m) => m.id === item.assignedToId);
        const assigneeText = assignee ? ` [Asignado a: ${assignee.name}]` : '';
        const qtyText = item.quantity ? ` (${item.quantity})` : '';
        const urgentText = item.urgent ? ' ⚡[URGENTE]' : '';
        text += `${index + 1}. ${item.title}${qtyText}${urgentText}${assigneeText}\n`;
      });
    }

    if (completedItems.length > 0) {
      text += `\n✅ *LISTOS / COMPRADOS (${completedItems.length}):*\n`;
      completedItems.forEach((item) => {
        text += `• ~${item.title}~\n`;
      });
    }

    return text;
  };

  const textToShare = generateFormattedText();

  const handleCopy = () => {
    navigator.clipboard.writeText(textToShare);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(textToShare);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

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
          <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              <h2 className="font-extrabold text-lg">Compartir {activeList ? activeList.name : 'Lista'}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-emerald-800 text-emerald-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Copia la lista o envíala directamente por WhatsApp a los integrantes de tu familia:
            </p>

            <pre className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {textToShare}
            </pre>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleWhatsApp}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-transform active:scale-95 cursor-pointer"
              >
                <span>💬 WhatsApp</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-transform active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
