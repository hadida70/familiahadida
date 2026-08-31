import React from 'react';
import { LogOut, Crown, User, ShieldAlert, Lock } from 'lucide-react';
import { FamiliaHadidaLogo } from './FamiliaHadidaLogo';
import { Member } from '../types';

interface HeaderProps {
  connected?: boolean;
  isAdmin: boolean;
  activeMember: Member | null;
  onLock?: () => void;
  onRequestAdminUnlock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connected = true,
  isAdmin,
  activeMember,
  onLock,
  onRequestAdminUnlock,
}) => {
  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 shadow-2xs"
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Left Side Logo */}
        <div className="flex items-center">
          <FamiliaHadidaLogo className="h-10 sm:h-12 md:h-13 w-auto max-w-[180px] sm:max-w-[240px]" />
        </div>

        {/* Right side: Role Status Badge & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Role Badge */}
          {isAdmin ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black shadow-2xs select-none"
              title="Sesión de Administrador: Jaime Hadida"
            >
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
              <span>JAIME</span>
              <span className="text-[10px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-sm ml-0.5">
                ADMIN
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-black shadow-2xs select-none"
                title={`Sesión Familiar: ${activeMember?.name || 'Familiar'}`}
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[100px] sm:max-w-none uppercase">
                  {activeMember?.name || 'Familiar'}
                </span>
              </div>

              {/* Quick elevate to admin button */}
              {onRequestAdminUnlock && (
                <button
                  onClick={onRequestAdminUnlock}
                  className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Ingresar como Administrador con PIN 1474"
                >
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="hidden sm:inline">Admin (1474)</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              )}
            </div>
          )}

          {/* Real-time connection dot */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400"
            title={connected ? 'Conectado en tiempo real' : 'Reconectando...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="hidden lg:inline">{connected ? 'En vivo' : 'Sync'}</span>
          </div>

          {/* Lock / Switch Profile button */}
          {onLock && (
            <button
              onClick={onLock}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-2xs text-xs font-semibold"
              title="Bloquear sesión y cambiar perfil (PIN 1474)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bloquear</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
