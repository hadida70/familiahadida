import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, CheckCheck, Trash2, Calendar } from 'lucide-react';
import { PushNotification, Member } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotification[];
  activeMember: Member | null;
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  activeMember,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  // Filter notifications for active member
  const memberNotifications = notifications.filter(
    (n) =>
      activeMember &&
      (n.recipientId === activeMember.id ||
        n.recipientId === 'all' ||
        activeMember.role === 'admin')
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                🔔
              </div>
              <div>
                <h2 className="font-extrabold text-lg">Historial de Notificaciones</h2>
                <p className="text-xs text-slate-400">
                  Para: {activeMember ? activeMember.name : 'Integrante'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {memberNotifications.length > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Leídas</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {memberNotifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Bell className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-bold text-sm">No tienes notificaciones por el momento</p>
                <p className="text-xs mt-1 text-slate-500">
                  Las alertas de compras asignadas aparecerán aquí.
                </p>
              </div>
            ) : (
              memberNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    n.read
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {new Date(n.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                    {n.message}
                  </p>

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span className="capitalize">{n.type.replace('_', ' ')}</span>
                    <span>
                      {new Date(n.timestamp).toLocaleDateString([], {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
