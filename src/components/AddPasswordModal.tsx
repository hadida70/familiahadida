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
  StickyNote,
  Palette,
  Tag,
  FileSpreadsheet,
} from 'lucide-react';
import { Member, PasswordItem } from '../types';
import { sounds } from '../lib/sound';
import { ExcelTableEditor } from './ExcelTableEditor';
import {
  ExcelTableData,
  TABLE_TEMPLATES,
  isTableContent,
  parseTableContent,
  serializeTableContent,
} from '../lib/tableUtils';

interface AddPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: Partial<PasswordItem>) => void;
  editingPassword?: PasswordItem | null;
  members: Member[];
  activeMember: Member | null;
}

const POSTIT_COLORS = [
  {
    id: 'yellow',
    name: 'Amarillo Clásico',
    bgClass: 'bg-amber-100 border-amber-300 text-amber-900',
    swatchClass: 'bg-amber-300 border-amber-400',
    ringClass: 'ring-amber-400',
  },
  {
    id: 'pink',
    name: 'Rosa Pastel',
    bgClass: 'bg-pink-100 border-pink-300 text-pink-900',
    swatchClass: 'bg-pink-300 border-pink-400',
    ringClass: 'ring-pink-400',
  },
  {
    id: 'green',
    name: 'Verde Menta',
    bgClass: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    swatchClass: 'bg-emerald-300 border-emerald-400',
    ringClass: 'ring-emerald-400',
  },
  {
    id: 'blue',
    name: 'Azul Cielo',
    bgClass: 'bg-sky-100 border-sky-300 text-sky-900',
    swatchClass: 'bg-sky-300 border-sky-400',
    ringClass: 'ring-sky-400',
  },
  {
    id: 'purple',
    name: 'Lavanda',
    bgClass: 'bg-purple-100 border-purple-300 text-purple-900',
    swatchClass: 'bg-purple-300 border-purple-400',
    ringClass: 'ring-purple-400',
  },
  {
    id: 'orange',
    name: 'Naranja Cálido',
    bgClass: 'bg-orange-100 border-orange-300 text-orange-900',
    swatchClass: 'bg-orange-300 border-orange-400',
    ringClass: 'ring-orange-400',
  },
];

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
  const [mode, setMode] = useState<'text' | 'excel'>('text');
  const [tableData, setTableData] = useState<ExcelTableData>(TABLE_TEMPLATES[0].table);
  const [memberId, setMemberId] = useState('all');
  const [category, setCategory] = useState('General');
  const [color, setColor] = useState<string>('yellow');
  const [showPassword, setShowPassword] = useState(false);
  const [showExtraCredentials, setShowExtraCredentials] = useState(false);
  const [generatedFlash, setGeneratedFlash] = useState(false);

  useEffect(() => {
    if (editingPassword) {
      setWebsite(editingPassword.website || '');
      setEmail(editingPassword.email || '');
      setPassword(editingPassword.password || '');
      setMemberId(editingPassword.memberId || 'all');
      setCategory(editingPassword.category || 'General');
      setColor(editingPassword.color || 'yellow');
      setShowPassword(false);
      setShowExtraCredentials(!!(editingPassword.email || editingPassword.password));

      if (isTableContent(editingPassword.notes)) {
        const parsed = parseTableContent(editingPassword.notes);
        setMode('excel');
        setTableData(parsed || TABLE_TEMPLATES[0].table);
        setNotes('');
      } else {
        setMode('text');
        setNotes(editingPassword.notes || '');
        setTableData(TABLE_TEMPLATES[0].table);
      }
    } else {
      setWebsite('');
      setEmail('');
      setPassword('');
      setNotes('');
      setMode('text');
      setTableData(TABLE_TEMPLATES[0].table);
      setMemberId(activeMember?.id || 'all');
      setCategory('General');
      setColor('yellow');
      setShowPassword(true);
      setShowExtraCredentials(true);
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
    setTimeout(() => setGeneratedFlash(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = website.trim() || (mode === 'excel' ? 'Tabla Excel' : (notes.trim() ? notes.trim().slice(0, 30) : 'Clave'));
    let finalNotes = '';

    if (mode === 'excel') {
      finalNotes = serializeTableContent(tableData);
    } else {
      finalNotes = notes.trim();
    }

    if (!finalTitle && !finalNotes) return;

    onSave({
      website: finalTitle,
      email: email.trim(),
      password: password.trim(),
      notes: finalNotes,
      category: category || 'General',
      memberId: memberId || 'all',
      color: color || 'yellow',
    });

    sounds.playCheckSound();
    onClose();
  };

  const activeColorObj = POSTIT_COLORS.find((c) => c.id === color) || POSTIT_COLORS[0];

  return (
    <div
      id="modal-add-password-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-add-password-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-4 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Post-it Header with Live Color Bar */}
        <div className={`px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${activeColorObj.bgClass} bg-opacity-20`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-slate-700 shadow-2xs">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {editingPassword ? 'Editar Clave o Tabla' : 'Nueva Clave o Tabla'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escribe libremente accesos o ingresa datos en tablas tipo Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. Selector de Color del Post-It */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Color de la Clave:</span>
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {POSTIT_COLORS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setColor(c.id);
                      sounds.playAddSound();
                    }}
                    className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? `${c.swatchClass} text-slate-900 ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-105`
                        : `${c.bgClass} opacity-80 hover:opacity-100`
                    }`}
                    title={c.name}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: isSelected ? '#ffffff' : undefined }} />
                    <span>{c.name.split(' ')[0]}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Asignar Propietario */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-red-500" />
              <span>Asignar a Propietario (Familiar):</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="all">👥 Toda la Familia (Clave Compartida)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  👤 {m.name} {m.role === 'admin' ? '(Admin)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              * El familiar seleccionado solo podrá ver esta clave en modo lectura.
            </p>
          </div>

          {/* 3. Título / Asunto de la Nota */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>Título / Asunto / Servicio <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Ej: Clave WiFi Casa, Netflix TV Sala, Cuentas Bancarias..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all placeholder-slate-400"
            />
          </div>

          {/* 4. Selector de Modo: Texto Libre vs Excel / Tabla */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Tipo de Contenido:</span>
            </label>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'text'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Texto Libre</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('excel')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'excel'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Modo Excel / Tabla</span>
              </button>
            </div>
          </div>

          {/* 5. Contenido Dinámico: Área de Texto o Editor de Tabla Excel */}
          {mode === 'excel' ? (
            <div>
              <ExcelTableEditor
                tableData={tableData}
                onChange={setTableData}
              />
            </div>
          ) : (
            <div>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe libremente aquí tu clave, instrucciones, códigos de acceso, preguntas secretas o detalles de la cuenta..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none font-sans leading-relaxed"
              />
            </div>
          )}

          {/* 6. Campos Rápidos de Usuario y Contraseña (Colapsables/Opcionales) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Datos de Acceso Rápidos (Opcional)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowExtraCredentials(!showExtraCredentials)}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {showExtraCredentials ? 'Ocultar campos' : '+ Agregar usuario / clave'}
              </button>
            </div>

            {showExtraCredentials && (
              <div className="space-y-3 pt-1">
                {/* Usuario / Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>Correo / Usuario:</span>
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: jaime@gmail.com o usuario123"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500/30 outline-none"
                  />
                </div>

                {/* Contraseña con Generador y Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Contraseña / PIN:</span>
                    </label>

                    <button
                      type="button"
                      onClick={generateSecurePassword}
                      className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1 cursor-pointer bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 hover:bg-amber-200 transition-colors"
                      title="Generar contraseña de 16 caracteres aleatoria"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                      <span>Generar Segura</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa la clave..."
                      className="w-full px-3 py-2 pr-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono tracking-wider focus:ring-2 focus:ring-amber-500/30 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={showPassword ? 'Ocultar' : 'Ver'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {generatedFlash && (
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>¡Contraseña segura de 16 caracteres generada!</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Categoría Opcional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Categoría (Opcional):</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="General">📌 General</option>
              <option value="Hogar">🏠 Hogar y Servicios</option>
              <option value="Bancos">💳 Bancos y Finanzas</option>
              <option value="Streaming">🎬 Streaming y Entretenimiento</option>
              <option value="Trabajo">💼 Trabajo y Trámites</option>
              <option value="Personal">👤 Personal</option>
            </select>
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
              disabled={!website.trim() && (mode === 'text' ? !notes.trim() : false)}
              className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-40"
            >
              <StickyNote className="w-4 h-4 text-slate-950" />
              <span>{editingPassword ? 'Guardar Clave' : 'Fijar Clave'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
