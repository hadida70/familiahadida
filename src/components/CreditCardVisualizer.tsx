import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  CreditCard as CreditCardIcon,
} from 'lucide-react';

export interface CreditCardData {
  cardNumber?: string;
  cardHolder?: string;
  cardExp?: string;
  cardCvc?: string;
  cardBank?: string;
  cardBrand?: string;
  cardTheme?: string;
  cardAccountNo?: string;
}

interface CreditCardVisualizerProps {
  card: CreditCardData;
  interactive?: boolean;
  showSensitiveDefault?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CreditCardVisualizer: React.FC<CreditCardVisualizerProps> = ({
  card,
  interactive = true,
  showSensitiveDefault = true,
  size = 'md',
}) => {
  const [showNumbers, setShowNumbers] = useState(showSensitiveDefault);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const cardNumber = card.cardNumber || '';
  const cardHolder = (card.cardHolder || 'JAIME HADIDA').toUpperCase();
  const cardExp = card.cardExp || 'MM/AA';
  const cardCvc = card.cardCvc || '•••';
  const cardBank = (card.cardBank || 'ISRACARD').toUpperCase();

  // Format card number with spaces every 4 digits on a single line
  const formatCardNumber = (num: string, reveal: boolean) => {
    const raw = num.replace(/\D/g, '');
    if (!raw) return '••••  ••••  ••••  ••••';
    if (reveal) {
      return raw.match(/.{1,4}/g)?.join('  ') || raw;
    }
    // Masked: show first 4 and last 4
    if (raw.length <= 4) return '••••  ••••  ••••  ' + raw;
    const last4 = raw.slice(-4);
    const first4 = raw.slice(0, 4);
    return `${first4}  ••••  ••••  ${last4}`;
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Card Dimensions based on size
  const sizeClasses = {
    sm: 'w-full max-w-[320px] min-h-[160px] p-4',
    md: 'w-full max-w-[390px] min-h-[190px] p-5 sm:p-6',
    lg: 'w-full max-w-[440px] min-h-[210px] p-6',
  }[size];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Minimalist White Card Container */}
      <div
        className={`relative ${sizeClasses} select-none transition-all duration-300 rounded-2xl flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-black/40`}
      >
        {/* Subtle minimalist top border accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 dark:bg-slate-100" />

        {/* Top Header: Bank / Card Name only, zero logos */}
        <div className="flex items-center justify-between z-10">
          <span className="text-xs sm:text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase truncate">
            {cardBank}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            TARJETA
          </span>
        </div>

        {/* Center: Card Number on a Single Line */}
        <div className="my-auto py-2 z-10">
          <p className="font-mono text-sm sm:text-base md:text-lg font-black tracking-[0.16em] sm:tracking-[0.2em] text-slate-900 dark:text-slate-100 whitespace-nowrap overflow-x-auto text-center sm:text-left">
            {formatCardNumber(cardNumber, showNumbers)}
          </p>
        </div>

        {/* Bottom Line: Cardholder, Expiry, and CVC in one aligned line */}
        <div className="flex items-end justify-between gap-2 z-10 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Cardholder Name */}
          <div className="min-w-0 flex-1">
            <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              TITULAR
            </span>
            <p className="font-mono text-[11px] sm:text-xs font-bold tracking-wider text-slate-800 dark:text-slate-200 truncate uppercase">
              {cardHolder}
            </p>
          </div>

          {/* Expiration & CVC together in the same line */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                VENCE
              </span>
              <p className="font-mono text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                {cardExp}
              </p>
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="text-right">
              <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                CVC
              </span>
              <p className="font-mono text-[11px] sm:text-xs font-black text-red-600 dark:text-red-400 tracking-widest">
                {showNumbers ? cardCvc : '•••'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      {interactive && (
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          {/* Reveal / Mask Numbers */}
          <button
            type="button"
            onClick={() => setShowNumbers(!showNumbers)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Mostrar u ocultar números y CVC"
          >
            {showNumbers ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                <span>Ocultar Números</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Ver Números</span>
              </>
            )}
          </button>

          {/* Copy Card Number */}
          {cardNumber && (
            <button
              type="button"
              onClick={() => handleCopy(cardNumber.replace(/\s+/g, ''), 'number')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Copiar número de tarjeta al portapapeles"
            >
              {copiedField === 'number' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-red-500" />
                  <span>Copiar Nº</span>
                </>
              )}
            </button>
          )}

          {/* Copy CVC */}
          {cardCvc && (
            <button
              type="button"
              onClick={() => handleCopy(cardCvc, 'cvc')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Copiar CVC"
            >
              {copiedField === 'cvc' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">¡CVC Copiado!</span>
                </>
              ) : (
                <>
                  <CreditCardIcon className="w-3.5 h-3.5 text-red-500" />
                  <span>Copiar CVC</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

