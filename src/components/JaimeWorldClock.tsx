import React, { useState, useEffect } from 'react';
import { Globe, Plus, X, Sun, Moon, Clock } from 'lucide-react';

export interface WorldClockZone {
  id: string;
  country: string;
  city: string;
  timeZone: string;
  flag: string;
}

const AVAILABLE_ZONES: WorldClockZone[] = [
  { id: 'il', country: 'Israel', city: 'Jerusalén / Tel Aviv', timeZone: 'Asia/Jerusalem', flag: '🇮🇱' },
  { id: 've', country: 'Venezuela', city: 'Caracas', timeZone: 'America/Caracas', flag: '🇻🇪' },
  { id: 'ar', country: 'Argentina', city: 'Buenos Aires', timeZone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
  { id: 'es', country: 'España', city: 'Madrid', timeZone: 'Europe/Madrid', flag: '🇪🇸' },
  { id: 'us_ny', country: 'EE. UU. (Este)', city: 'Miami / Nueva York', timeZone: 'America/New_York', flag: '🇺🇸' },
  { id: 'us_tx', country: 'EE. UU. (Centro)', city: 'Houston / Chicago', timeZone: 'America/Chicago', flag: '🇺🇸' },
  { id: 'us_la', country: 'EE. UU. (Pacífico)', city: 'Los Ángeles', timeZone: 'America/Los_Angeles', flag: '🇺🇸' },
  { id: 'pa', country: 'Panamá', city: 'Ciudad de Panamá', timeZone: 'America/Panama', flag: '🇵🇦' },
  { id: 'co', country: 'Colombia', city: 'Bogotá', timeZone: 'America/Bogota', flag: '🇨🇴' },
  { id: 'mx', country: 'México', city: 'Ciudad de México', timeZone: 'America/Mexico_City', flag: '🇲🇽' },
  { id: 'cl', country: 'Chile', city: 'Santiago', timeZone: 'America/Santiago', flag: '🇨🇱' },
  { id: 'uy', country: 'Uruguay', city: 'Montevideo', timeZone: 'America/Montevideo', flag: '🇺🇾' },
  { id: 'br', country: 'Brasil', city: 'São Paulo', timeZone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { id: 'pe', country: 'Perú', city: 'Lima', timeZone: 'America/Lima', flag: '🇵🇪' },
  { id: 'cr', country: 'Costa Rica', city: 'San José', timeZone: 'America/Costa_Rica', flag: '🇨🇷' },
  { id: 'gb', country: 'Reino Unido', city: 'Londres', timeZone: 'Europe/London', flag: '🇬🇧' },
  { id: 'fr', country: 'Francia', city: 'París', timeZone: 'Europe/Paris', flag: '🇫🇷' },
  { id: 'it', country: 'Italia', city: 'Roma', timeZone: 'Europe/Rome', flag: '🇮🇹' },
  { id: 'gr', country: 'Grecia', city: 'Atenas', timeZone: 'Europe/Athens', flag: '🇬🇷' },
  { id: 'ae', country: 'Emiratos Árabes', city: 'Dubái', timeZone: 'Asia/Dubai', flag: '🇦🇪' },
  { id: 'jp', country: 'Japón', city: 'Tokio', timeZone: 'Asia/Tokyo', flag: '🇯🇵' },
  { id: 'au', country: 'Australia', city: 'Sídney', timeZone: 'Australia/Sydney', flag: '🇦🇺' },
];

const DEFAULT_ZONE_IDS = ['il', 've', 'ar'];
const STORAGE_KEY = 'hadida_jaime_world_clocks_v1';

export const JaimeWorldClock: React.FC = () => {
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage error
    }
    return DEFAULT_ZONE_IDS;
  });

  const [now, setNow] = useState<Date>(() => new Date());
  const [isAddingZone, setIsAddingZone] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedZoneIds));
    } catch {
      // ignore storage error
    }
  }, [selectedZoneIds]);

  const activeZones = selectedZoneIds
    .map((id) => AVAILABLE_ZONES.find((z) => z.id === id))
    .filter((z): z is WorldClockZone => !!z);

  const unselectedZones = AVAILABLE_ZONES.filter((z) => !selectedZoneIds.includes(z.id));

  const handleAddZone = (zoneId: string) => {
    if (!selectedZoneIds.includes(zoneId)) {
      setSelectedZoneIds((prev) => [...prev, zoneId]);
    }
    setIsAddingZone(false);
  };

  const handleRemoveZone = (zoneId: string) => {
    if (selectedZoneIds.length <= 1) return;
    setSelectedZoneIds((prev) => prev.filter((id) => id !== zoneId));
  };

  const getZoneTimeInfo = (timeZone: string) => {
    try {
      const timeFormatter = new Intl.DateTimeFormat('es-ES', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        hour12: false,
      });

      const dateFormatter = new Intl.DateTimeFormat('es-ES', {
        timeZone,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

      const timeStr = timeFormatter.format(now);
      const hourNum = parseInt(hourFormatter.format(now), 10);
      const isDaytime = hourNum >= 6 && hourNum < 19;
      const dateStr = dateFormatter.format(now);

      return { timeStr, isDaytime, dateStr };
    } catch {
      return { timeStr: '--:--:--', isDaytime: true, dateStr: '' };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
              Reloj Mundial
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-300/70 dark:border-orange-800/60">
              👤 JAIME
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAddingZone((prev) => !prev)}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-200 hover:text-red-600 border border-slate-200 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-red-600" />
            <span>Agregar País / Zona</span>
          </button>

          {isAddingZone && (
            <div className="absolute right-0 mt-1.5 w-64 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-30 p-1.5 space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-black uppercase text-slate-400 flex items-center justify-between">
                <span>Seleccionar país / zona</span>
                <button
                  type="button"
                  onClick={() => setIsAddingZone(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {unselectedZones.length > 0 ? (
                unselectedZones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handleAddZone(zone.id)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-slate-800 hover:text-red-600 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none">{zone.flag}</span>
                      <span className="truncate">{zone.country}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {zone.city}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-2">
                  Todos los países están agregados
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {activeZones.map((zone) => {
          const { timeStr, isDaytime, dateStr } = getZoneTimeInfo(zone.timeZone);
          return (
            <div
              key={zone.id}
              className="relative group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2.5 flex flex-col justify-between transition-all hover:border-orange-300 dark:hover:border-orange-800/70"
            >
              {activeZones.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveZone(zone.id)}
                  className="opacity-0 group-hover:opacity-100 absolute top-1.5 right-1.5 p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                  title={`Quitar ${zone.country}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              <div className="flex items-center justify-between gap-1.5 pr-4">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base leading-none shrink-0">{zone.flag}</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                    {zone.country}
                  </span>
                </div>
                {isDaytime ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Día" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" title="Noche" />
                )}
              </div>

              <div className="mt-1.5 flex items-baseline justify-between gap-1">
                <span className="text-base sm:text-lg font-mono font-black tracking-tight text-slate-900 dark:text-white">
                  {timeStr}
                </span>
              </div>

              <div className="mt-0.5 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span className="truncate">{zone.city}</span>
                <span className="capitalize shrink-0">{dateStr}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
