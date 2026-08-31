import React, { useState, useEffect } from 'react';
import { Lock, Crown, User, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { FamiliaHadidaLogo } from './FamiliaHadidaLogo';
import { Member } from '../types';
import { getMemberColorTheme } from '../lib/memberColors';

interface PinLockScreenProps {
  members: Member[];
  onUnlock: (member: Member, isAdmin: boolean) => void;
  initialMember?: Member | null;
}

const CORRECT_PIN = '1474';

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  members,
  onUnlock,
  initialMember,
}) => {
  // Find Jaime or member with admin role
  const jaimeAdminMember =
    members.find((m) => m.name.toUpperCase() === 'JAIME' || m.role === 'admin') ||
    members[0] || {
      id: 'member_jaime',
      name: 'JAIME',
      role: 'admin' as const,
      avatarColor: 'bg-orange-500',
      avatarInitial: 'J',
    };

  // State: Currently selected user ID
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    if (initialMember) return initialMember.id;
    return jaimeAdminMember.id;
  });

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected member object
  const selectedMember =
    members.find((m) => m.id === selectedMemberId) || jaimeAdminMember;
  const isSelectedAdmin =
    selectedMember.name.toUpperCase() === 'JAIME' || selectedMember.role === 'admin';

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);
      setErrorMessage('');

      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setError(false);
    setErrorMessage('');
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === CORRECT_PIN) {
      const isAdmin = isSelectedAdmin;
      const authenticatedMember: Member = {
        ...selectedMember,
        role: isAdmin ? 'admin' : 'member',
      };

      localStorage.setItem('hadida_family_auth', 'authenticated');
      localStorage.setItem('hadida_family_auth_role', isAdmin ? 'admin' : 'member');
      localStorage.setItem('hadida_family_auth_member_id', authenticatedMember.id);

      onUnlock(authenticatedMember, isAdmin);
    } else {
      setError(true);
      setErrorMessage('PIN incorrecto. Ingresa 1474.');
      setTimeout(() => {
        setPin('');
      }, 500);
    }
  };

  // Keyboard typing support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter' && pin.length === 4) {
        verifyPin(pin);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, selectedMemberId]);

  return (
    <div
      id="pin-lock-screen"
      className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-3 sm:p-6 selection:bg-red-500 py-8"
    >
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* Familia Hadida Logo Card */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl shadow-2xl mb-4 border border-slate-200">
          <FamiliaHadidaLogo className="h-13 sm:h-16 w-auto" />
        </div>

        {/* Security Prompt */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-bold mb-3 shadow-inner">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Acceso Privado Familiar • PIN 1474</span>
        </div>

        {/* Step 1: User Profile Selection */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-3.5 sm:p-4 mb-4 shadow-xl text-left">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              1. Selecciona tu Usuario
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Jaime es Administrador
            </span>
          </div>

          {/* Members Grid / Pills */}
          <div className="grid grid-cols-2 gap-2">
            {members.map((member) => {
              const isAdmin =
                member.name.toUpperCase() === 'JAIME' || member.role === 'admin';
              const isSelected = selectedMemberId === member.id;
              const theme = getMemberColorTheme(member, member.id);

              return (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedMemberId(member.id);
                    setPin('');
                    setError(false);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 relative ${
                    isSelected
                      ? isAdmin
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-2 ring-amber-500/40 shadow-md'
                        : 'bg-blue-600/20 border-blue-500 text-blue-200 ring-2 ring-blue-500/40 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isAdmin ? (
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <span className={`w-2.5 h-2.5 rounded-full ${theme.dot} shrink-0`} />
                      )}
                      <span className="text-xs font-black text-white truncate">
                        {member.name}
                      </span>
                    </div>

                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          isAdmin ? 'text-amber-400' : 'text-blue-400'
                        } stroke-[3] shrink-0`}
                      />
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-semibold ${
                      isAdmin ? 'text-amber-300/80' : 'text-slate-400'
                    }`}
                  >
                    {isAdmin ? '👑 Administrador (Total)' : '👤 Familiar (Personal)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Keypad with PIN */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col items-center">
          <div className="mb-2 text-center">
            <span className="text-xs font-bold text-slate-400">
              Ingresando como:{' '}
              <strong className="text-white">
                {isSelectedAdmin
                  ? `👑 ${selectedMember.name} (Administrador)`
                  : `👤 ${selectedMember.name} (Familiar)`}
              </strong>
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3 text-center">
            {isSelectedAdmin
              ? 'Introduce el PIN 1474 para acceso con permisos completos.'
              : 'Introduce el PIN 1474 para acceder a tu perfil familiar.'}
          </p>

          {/* PIN Dots Indicator */}
          <div className="flex items-center justify-center gap-3.5 mb-3">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-200 ${
                    error
                      ? 'bg-rose-500 ring-4 ring-rose-500/30 scale-110'
                      : isFilled
                      ? isSelectedAdmin
                        ? 'bg-amber-400 ring-4 ring-amber-400/30 scale-110'
                        : 'bg-blue-400 ring-4 ring-blue-400/30 scale-110'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Error message */}
          <div className="h-5 mb-2">
            {error && (
              <p className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1 animate-shake">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMessage}
              </p>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full max-w-[260px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="h-12 sm:h-14 rounded-2xl bg-slate-950/80 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-xl font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center select-none"
              >
                {num}
              </button>
            ))}

            <button
              onClick={handleClear}
              className="h-12 sm:h-14 rounded-2xl bg-slate-950/40 hover:bg-slate-800/60 active:bg-slate-800 border border-slate-800/60 text-xs font-bold text-slate-400 transition-all cursor-pointer flex items-center justify-center select-none"
            >
              Limpiar
            </button>

            <button
              onClick={() => handleKeyPress('0')}
              className="h-12 sm:h-14 rounded-2xl bg-slate-950/80 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-xl font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center select-none"
            >
              0
            </button>

            <button
              onClick={handleDelete}
              className="h-12 sm:h-14 rounded-2xl bg-slate-950/40 hover:bg-slate-800/60 active:bg-slate-800 border border-slate-800/60 text-xs font-bold text-slate-400 transition-all cursor-pointer flex items-center justify-center select-none"
            >
              Borrar
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-slate-500 text-xs flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>PIN Único Familiar: <strong>1474</strong></span>
        </div>
      </div>
    </div>
  );
};
