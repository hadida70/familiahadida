import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Globe,
  Mail,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  Key,
  User,
  Check,
} from 'lucide-react';
import { Member, PasswordItem } from '../types';
import { sounds } from '../lib/sound';

interface AddPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: Partial<PasswordItem>) => void;
  editingPassword?: PasswordItem | null;
  members: Member[];
  activeMember: Member | null;
}

export const AddPasswordModal: React.FC<AddPasswordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPassword,
  members,
  activeMember,
}) => {
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [memberId, setMemberId] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedFlash, setGeneratedFlash] = useState(false);

  useEffect(() => {
    if (editingPassword) {
      setWebsite(editingPassword.website || '');
      setEmail(editingPassword.email || '');
      setPassword(editingPassword.password || '');
      setNotes(editingPassword.notes || '');
      setMemberId(editingPassword.memberId || 'all');
      setShowPassword(false);
    } else {
      setWebsite('');
      setEmail(activeMember?.name ? `${activeMember.name.toLowerCase().replace(/\s+/g, '')}@gmail.com` : '');
      setPassword('');
      setNotes('');
      setMemberId(activeMember?.id || 'all');
      setShowPassword(true);
    }
  }, [editingPassword, isOpen, activeMember]);

  if (!isOpen) return null;

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let result = '';
    const length = 16;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setShowPassword(true);
    setGeneratedFlash(true);
    sounds.playAddSound();
    setTimeout(() => setGeneratedFlash(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!website.trim() || !password.trim()) return;

    onSave({
      website: website.trim(),
      email: email.trim(),
      password: password.trim(),
      notes: notes.trim(),
      memberId: memberId || 'all',
    });

    sounds.playCheckSound();
    onClose();
  };

  return (
    <div
      id="modal-add-password-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-add-password-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center border border-red-200/50">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {editingPassword ? 'Editar Contraseña' : 'Nueva Contraseña'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guarda accesos web, cuentas, correos y notas seguras
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Página Web / Servicio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-red-500" />
              <span>Página Web / App / Servicio <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Ej: netflix.com, Banco Santander, Gmail, Amazon..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none transition-all placeholder-slate-400"
            />
          </div>

          {/* Correo / Usuario */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-red-500" />
              <span>Correo Electrónico / Nombre de Usuario</span>
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: jaime@gmail.com o usuario_admin"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none transition-all placeholder-slate-400"
            />
          </div>

          {/* Contraseña con Generador y Ojo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-red-500" />
                <span>Contraseña <span className="text-red-500">*</span></span>
              </label>

              {/* Botón de Generar Contraseña */}
              <button
                type="button"
                onClick={generateSecurePassword}
                className="text-[11px] font-extrabold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-100 transition-colors"
                title="Crear una contraseña aleatoria de alta seguridad"
              >
                <Sparkles className="w-3 h-3 text-red-500" />
                <span>Generar Segura</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña..."
                className="w-full px-3.5 py-2.5 pr-11 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono tracking-wider focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none transition-all placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {generatedFlash && (
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>¡Contraseña segura de 16 caracteres generada!</span>
              </p>
            )}
          </div>

          {/* Integrante Dueño / Asignado */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-red-500" />
              <span>Perteneciente a Integrante:</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="all">👥 Toda la Familia (Compartida)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  👤 {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nota / Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>Notas / PIN de Recuperación / Preguntas de Seguridad (Opcional):</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: PIN numérico de acceso 1474, preguntas secretas, correo de recuperación..."
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!website.trim() || !password.trim()}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40"
            >
              <Lock className="w-4 h-4 text-red-500" />
              <span>{editingPassword ? 'Guardar Cambios' : 'Registrar Contraseña'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
