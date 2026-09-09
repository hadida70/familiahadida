import React, { useState, useMemo } from 'react';
import {
  Key,
  Plus,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Globe,
  ExternalLink,
  ShieldCheck,
  Share2,
  Lock,
} from 'lucide-react';
import { Member, PasswordItem } from '../types';
import { sounds } from '../lib/sound';

interface PasswordsViewProps {
  passwords: PasswordItem[];
  members: Member[];
  activeMember: Member | null;
  isAdmin?: boolean;
  onOpenAddPassword: () => void;
  onEditPassword: (password: PasswordItem) => void;
  onDeletePassword: (id: string) => void;
  onLock?: () => void;
  fontSize?: 'normal' | 'large' | 'xlarge';
}

export const PasswordsView: React.FC<PasswordsViewProps> = ({
  passwords,
  members,
  activeMember,
  isAdmin = false,
  onOpenAddPassword,
  onEditPassword,
  onDeletePassword,
  onLock,
  fontSize = 'normal',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toggle reveal password for a specific item
  const toggleReveal = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Copy text to clipboard with sound and feedback
  const handleCopy = (text: string, identifier: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    sounds.playCheckSound();
    setCopiedId(identifier);
    setTimeout(() => {
      setCopiedId((curr) => (curr === identifier ? null : curr));
    }, 2000);
  };

  // WhatsApp Share helper
  const handleShareWhatsApp = (item: PasswordItem) => {
    let text = `🔐 *ACCESO / CONTRASEÑA*\n` +
      `🌐 *Sitio / Servicio:* ${item.website}\n`;
    if (item.email) {
      text += `👤 *Correo / Usuario:* \`${item.email}\`\n`;
    }
    text += `🔑 *Contraseña:* \`${item.password}\`\n`;
    if (item.notes) {
      text += `📝 *Nota:* ${item.notes}\n`;
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtered passwords based on search term
  const filteredPasswords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return passwords;
    return passwords.filter((p) => {
      const matchWeb = (p.website || '').toLowerCase().includes(term);
      const matchEmail = (p.email || '').toLowerCase().includes(term);
      const matchNotes = (p.notes || '').toLowerCase().includes(term);
      return matchWeb || matchEmail || matchNotes;
    });
  }, [passwords, searchTerm]);

  const formatWebsiteUrl = (web: string) => {
    let clean = web.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('.')) {
        clean = 'https://' + clean;
      } else {
        return null;
      }
    }
    return clean;
  };

  return (
    <div id="passwords-management-section" className="space-y-4 max-w-5xl mx-auto mb-12">
      {/* Header & Control Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center border border-red-200 dark:border-red-900/60 shadow-2xs">
              <Key className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Contraseñas y Accesos
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                  {passwords.length} {passwords.length === 1 ? 'cuenta' : 'cuentas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestor seguro familiar para páginas web, cuentas, correos y claves
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
            {onLock && (
              <button
                type="button"
                onClick={onLock}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Bloquear sección de contraseñas"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Bloquear</span>
              </button>
            )}

            {/* Add Password Button */}
            <button
              onClick={onOpenAddPassword}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Agregar Contraseña</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por página web, usuario, correo, notas..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredPasswords.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center mx-auto border border-red-200 dark:border-red-900/50">
            <ShieldCheck className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchTerm
                ? 'No se encontraron contraseñas'
                : 'Aún no hay contraseñas registradas'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm mx-auto">
              {searchTerm
                ? 'Intenta con otro término de búsqueda.'
                : 'Guarda tus páginas web, correos y contraseñas de forma organizada y segura para toda la familia.'}
            </p>
          </div>
          <button
            onClick={onOpenAddPassword}
            className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 text-red-600 border border-red-600 hover:bg-red-50 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar la primera contraseña</span>
          </button>
        </div>
      )}

      {/* ================= TABLA DE CONTRASEÑAS ================= */}
      {filteredPasswords.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-5">Página Web / Servicio</th>
                  <th className="py-3.5 px-3 sm:px-4">Correo / Usuario</th>
                  <th className="py-3.5 px-3 sm:px-4">Contraseña</th>
                  <th className="py-3.5 px-3 sm:px-4 hidden sm:table-cell">Nota / Detalles</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {filteredPasswords.map((item) => {
                  const isRevealed = !!revealedPasswords[item.id];
                  const isCopiedEmail = copiedId === `email_${item.id}`;
                  const isCopiedPass = copiedId === `pass_${item.id}`;
                  const webUrl = formatWebsiteUrl(item.website);
                  const owner = members.find((m) => m.id === item.memberId);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Página Web / Servicio */}
                      <td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900 dark:text-white align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0 border border-red-200/60 dark:border-red-900/50">
                            <Globe className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                {item.website}
                              </span>
                              {webUrl && (
                                <a
                                  href={webUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-red-600 p-0.5 transition-colors"
                                  title={`Abrir ${item.website}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {/* Mobile only note / owner */}
                            <div className="sm:hidden text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {item.notes && <span>📝 {item.notes}</span>}
                              {owner && <span className="ml-1 text-[10px] font-bold">({owner.name})</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Correo / Usuario */}
                      <td className="py-3.5 px-3 sm:px-4 text-slate-700 dark:text-slate-300 align-middle">
                        {item.email ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="truncate max-w-[140px] sm:max-w-[200px] font-medium text-xs sm:text-sm">
                              {item.email}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.email, `email_${item.id}`)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0 transition-colors"
                              title="Copiar usuario / correo"
                            >
                              {isCopiedEmail ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Sin correo</span>
                        )}
                      </td>

                      {/* 3. Contraseña */}
                      <td className="py-3.5 px-3 sm:px-4 align-middle font-mono">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold tracking-wider select-all ${
                              isRevealed
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-500 tracking-widest'
                            }`}
                          >
                            {isRevealed ? item.password : '••••••••••••'}
                          </span>

                          {/* Reveal eye toggle */}
                          <button
                            type="button"
                            onClick={() => toggleReveal(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                            title={isRevealed ? 'Ocultar contraseña' : 'Ver contraseña'}
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Copy password */}
                          <button
                            type="button"
                            onClick={() => handleCopy(item.password, `pass_${item.id}`)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                            title="Copiar contraseña"
                          >
                            {isCopiedPass ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 4. Nota / Observaciones */}
                      <td className="py-3.5 px-3 sm:px-4 text-xs text-slate-600 dark:text-slate-400 hidden sm:table-cell align-middle max-w-[220px]">
                        {item.notes ? (
                          <div className="flex items-center gap-1">
                            <span className="line-clamp-2" title={item.notes}>
                              {item.notes}
                            </span>
                            {owner && (
                              <span className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                {owner.name}
                              </span>
                            )}
                          </div>
                        ) : owner ? (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            {owner.name}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 italic">-</span>
                        )}
                      </td>

                      {/* 5. Acciones */}
                      <td className="py-3.5 px-4 text-right align-middle shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          {/* Share WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(item)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                            title="Compartir por WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => onEditPassword(item)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar contraseña"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => onDeletePassword(item.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Eliminar contraseña"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
