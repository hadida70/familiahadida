import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, X, AlertCircle, KeyRound, Crown } from 'lucide-react';
import { FamiliaHadidaLogo } from './FamiliaHadidaLogo';

interface AdminPinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
}

const CORRECT_PIN = '1474';

export const AdminPinPromptModal: React.FC<AdminPinPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Acceso al Administrador',
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

  const verifyPin = (enteredPin: string) => {
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
      id="admin-pin-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="admin-pin-modal-card"
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

        {/* Crown & Security Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3 shadow-inner">
          <Crown className="w-7 h-7" />
        </div>

        <h2 className="text-lg font-black tracking-tight text-white mb-1">
          {actionTitle}
        </h2>
        <p className="text-xs text-slate-400 mb-4 max-w-xs">
          Ingresa el PIN de Administrador (<strong>1474</strong>) para desbloquear todas las facultades de la aplicación.
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
                    ? 'bg-amber-400 ring-4 ring-amber-400/30 scale-110'
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
              className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 border border-slate-700/80 text-lg font-bold text-white transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center select-none"
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
            className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 border border-slate-700/80 text-lg font-bold text-white transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center select-none"
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
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>PIN Maestro: 1474</span>
        </div>
      </div>
    </div>
  );
};
