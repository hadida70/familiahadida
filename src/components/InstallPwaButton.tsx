import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export const InstallPwaButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  // If already installed/standalone, don't show the button
  if (isStandalone) return null;

  // Show if installable on Android/desktop or if on iOS browser
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
        title="Instalar aplicación en tu dispositivo"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">App</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 bg-white p-1">
              <img src="/logo.png" alt="Familia Hadida" className="w-full h-full object-contain" />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Instalar Familia Hadida en iPhone
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sigue estos 2 sencillos pasos en Safari para agregar la app a tu pantalla de inicio:
              </p>
            </div>

            <div className="space-y-2 text-left bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span>Toca el botón <strong>Compartir</strong> (<span className="text-blue-500 font-bold">⎋</span> abajo en Safari).</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span>Desliza y selecciona <strong>"Agregar a pantalla de inicio"</strong> (➕).</span>
              </p>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
