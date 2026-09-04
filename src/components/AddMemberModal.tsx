import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, User, Shield, KeyRound } from 'lucide-react';
import { Member } from '../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: Partial<Member> & { pin?: string }) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
}) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('1474');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [color, setColor] = useState('bg-blue-600');

  if (!isOpen) return null;

  const COLORS = [
    { name: 'Rojo', bg: 'bg-red-600' },
    { name: 'Azul', bg: 'bg-blue-600' },
    { name: 'Púrpura', bg: 'bg-purple-600' },
    { name: 'Ámbar', bg: 'bg-amber-600' },
    { name: 'Rosa', bg: 'bg-rose-600' },
    { name: 'Índigo', bg: 'bg-indigo-600' },
    { name: 'Cian', bg: 'bg-cyan-600' },
    { name: 'Esmeralda', bg: 'bg-emerald-600' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddMember({
      name: name.trim().toUpperCase(),
      pin: pin.trim() || '1474',
      role,
      avatarColor: color,
      avatarInitial: name.trim()[0]?.toUpperCase() || '👤',
    });

    setName('');
    setPin('1474');
    onClose();
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
          <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              <h2 className="font-extrabold text-lg">
                Agregar Nuevo Integrante
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-red-700 text-red-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre del integrante *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. SOFI, STEPHANIE, MOISES..."
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-red-500 text-slate-900 dark:text-white font-medium text-base outline-none"
              />
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                PIN de acceso (mínimo 4 dígitos)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1474"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-red-500 text-slate-900 dark:text-white font-mono font-bold text-base outline-none tracking-widest text-center"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Predeterminado: <strong>1474</strong>. El usuario usará este PIN para iniciar sesión.
              </p>
            </div>

            {/* Role Radio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Rol en la aplicación
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    role === 'member'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 border-blue-600 font-bold shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-xs">Integrante</span>
                    <span className="text-[10px] opacity-80">Listas y consulta de docs</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 border-amber-600 font-bold shadow-xs ring-1 ring-amber-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-xs">Administrador</span>
                    <span className="text-[10px] opacity-80">Gestión total y subida de docs</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Avatar Color */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Color de perfil
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c.bg}
                    type="button"
                    onClick={() => setColor(c.bg)}
                    className={`w-8 h-8 rounded-full ${c.bg} transition-transform cursor-pointer ${
                      color === c.bg
                        ? 'ring-4 ring-red-400 ring-offset-2 scale-110'
                        : 'hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-red-600 border-2 border-red-600 font-bold text-sm shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                Guardar Integrante
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
