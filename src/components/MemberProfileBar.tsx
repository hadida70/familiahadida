import React from 'react';
import { Plus, Crown, User, Lock, ArrowRightLeft } from 'lucide-react';
import { Member, GroceryItem } from '../types';
import { getMemberColorTheme } from '../lib/memberColors';

interface MemberProfileBarProps {
  members: Member[];
  activeMember: Member | null;
  isAdmin: boolean;
  onSelectMember: (member: Member) => void;
  onOpenAddMember: () => void;
  onRequestAdminUnlock?: () => void;
  onLock?: () => void;
  items: GroceryItem[];
}

export const MemberProfileBar: React.FC<MemberProfileBarProps> = ({
  members,
  activeMember,
  isAdmin,
  onSelectMember,
  onOpenAddMember,
  onRequestAdminUnlock,
  onLock,
}) => {
  // If not admin, do NOT show other members. Show only current member badge.
  if (!isAdmin) {
    const memberTheme = activeMember
      ? getMemberColorTheme(activeMember, activeMember.id)
      : null;

    return (
      <div
        id="member-profile-bar"
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Active single member badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border shadow-2xs ${
                memberTheme
                  ? `${memberTheme.bgLight} ${memberTheme.text} ${memberTheme.border}`
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${memberTheme?.dot || 'bg-blue-500'}`} />
              <span className="text-black dark:text-white font-extrabold uppercase">
                {activeMember?.name || 'Familiar'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/80 dark:bg-slate-900/80 font-bold opacity-90">
                Acceso Personal
              </span>
            </div>
          </div>

          {/* Right: Switch user / Unlock admin button */}
          <div className="flex items-center gap-1.5">
            {onRequestAdminUnlock && (
              <button
                onClick={onRequestAdminUnlock}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all cursor-pointer shadow-2xs"
                title="Desbloquear facultades de Administrador con PIN 1474"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Modo Admin (PIN 1474)</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            {onLock && (
              <button
                onClick={onLock}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                title="Cambiar a otro integrante de la familia"
              >
                <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                <span className="hidden sm:inline">Cambiar Usuario</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin view (Jaime): shows all members for administrative filtering & management
  return (
    <div
      id="member-profile-bar"
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Admin Tag + All Members List Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shrink-0 border bg-amber-500 text-slate-950 border-amber-400 shadow-xs ring-2 ring-amber-500/30 select-none"
            title="Sesión de Administrador (Jaime): facultades y visibilidad total"
          >
            <Crown className="w-3.5 h-3.5 fill-slate-950" />
            <span>JAIME (ADMIN)</span>
          </div>

          {/* Members List Pills */}
          {members.map((member) => {
            const isActive = activeMember?.id === member.id;
            const theme = getMemberColorTheme(member, member.id);
            return (
              <button
                key={member.id}
                onClick={() => onSelectMember(member)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shrink-0 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-blue-600 dark:border-blue-400 shadow-xs ring-2 ring-blue-500/30'
                    : `${theme.bgLight} ${theme.text} ${theme.border} hover:opacity-100 opacity-80`
                }`}
                title={`Ver datos de ${member.name}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                <span className="text-black dark:text-white font-black">{member.name}</span>
                {isActive && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-extrabold">
                    Filtro
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Member button (Admin only) */}
        <button
          onClick={onOpenAddMember}
          className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 cursor-pointer"
          title="Agregar Integrante Familiar"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
