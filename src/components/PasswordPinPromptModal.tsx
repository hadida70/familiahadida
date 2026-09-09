import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, AlertCircle, Key } from 'lucide-react';
import { Member } from '../types';

interface PasswordPinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  activeMember?: Member | null;
  onLogin?: (memberIdOrUsername: string, pin: string) => Promise<{ success: boolean; error?: string; user?: Member }>;
}

const CORRECT_PIN = '1474';

export const PasswordPinPromptModal: React.FC<PasswordPinPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Acceso a Contraseñas',
  subtitle = 'Introduce el PIN de seguridad (1474) para ver y gestionar las contraseñas.',
  activeMember,
  onLogin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setErrorMessage('');
    }
  }, [isOpen]);

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

  const verifyPin = async (enteredPin: string) => {
    if (onLogin && activeMember) {
      try {
        const res = await onLogin(activeMember.id, enteredPin);
        if (res.success) {
          onSuccess();
          onClose();
          return;
        }
      } catch (e) {
        console.error('Login verify error:', e);
      }
    }

    if (enteredPin === CORRECT_PIN) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setErrorMessage('PIN incorrecto. Intenta con 1474.');
      setTimeout(() => {
        setPin('');
      }, 500);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  if (!isOpen) return null;

  return (
    <div
      id="password-pin-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="password-pin-modal-card"
        className="bg-slate-900 text-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-800 flex flex-col items-center text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Key & Security Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-600/15 border border-red-500/30 text-red-500 flex items-center justify-center mb-3 shadow-inner">
          <Key className="w-7 h-7 stroke-[2.5]" />
        </div>

        <h2 className="text-lg font-black tracking-tight text-white mb-1">
          {title}
        </h2>
        <p className="text-xs text-slate-400 mb-4 max-w-xs">
          {subtitle}
        </p>

        {/* PIN Indicator Dots */}
        <div className="flex items-center justify-center gap-3.5 mb-3">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 ring-4 ring-rose-500/30 scale-110'
                    : isFilled
                    ? 'bg-red-500 ring-4 ring-red-500/30 scale-110'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        <div className="h-5 mb-2">
          {error && (
            <p className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMessage}
            </p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-red-600 active:text-white border border-slate-700/80 text-lg font-bold text-white transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center select-none"
            >
              {num}
            </button>
          ))}

          <button
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 active:bg-slate-700 border border-slate-700/50 text-[11px] font-bold text-slate-400 transition-all cursor-pointer flex items-center justify-center select-none"
          >
            Limpiar
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-red-600 active:text-white border border-slate-700/80 text-lg font-bold text-white transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center select-none"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 active:bg-slate-700 border border-slate-700/50 text-[11px] font-bold text-slate-400 transition-all cursor-pointer flex items-center justify-center select-none"
          >
            Borrar
          </button>
        </div>

        <div className="mt-4 text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
          <span>PIN: 1474</span>
        </div>
      </div>
    </div>
  );
};
