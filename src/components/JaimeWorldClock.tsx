import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Clock } from 'lucide-react';

export interface WorldClockZone {
  id: string;
  abbr: string;
  country: string;
  timeZone: string;
}

const AVAILABLE_ZONES: WorldClockZone[] = [
  { id: 'il', abbr: 'IL', country: 'Israel', timeZone: 'Asia/Jerusalem' },
  { id: 'arg', abbr: 'ARG', country: 'Argentina', timeZone: 'America/Argentina/Buenos_Aires' },
  { id: 've', abbr: 'VE', country: 'Venezuela', timeZone: 'America/Caracas' },
  { id: 'es', abbr: 'ES', country: 'España', timeZone: 'Europe/Madrid' },
  { id: 'mia', abbr: 'MIA', country: 'EE. UU. (Miami/NY)', timeZone: 'America/New_York' },
  { id: 'hou', abbr: 'HOU', country: 'EE. UU. (Centro)', timeZone: 'America/Chicago' },
  { id: 'la', abbr: 'LA', country: 'EE. UU. (Pacífico)', timeZone: 'America/Los_Angeles' },
  { id: 'pan', abbr: 'PAN', country: 'Panamá', timeZone: 'America/Panama' },
  { id: 'col', abbr: 'COL', country: 'Colombia', timeZone: 'America/Bogota' },
  { id: 'mex', abbr: 'MEX', country: 'México', timeZone: 'America/Mexico_City' },
  { id: 'chl', abbr: 'CHL', country: 'Chile', timeZone: 'America/Santiago' },
  { id: 'ury', abbr: 'URY', country: 'Uruguay', timeZone: 'America/Montevideo' },
  { id: 'bra', abbr: 'BRA', country: 'Brasil', timeZone: 'America/Sao_Paulo' },
  { id: 'per', abbr: 'PER', country: 'Perú', timeZone: 'America/Lima' },
  { id: 'uk', abbr: 'UK', country: 'Reino Unido', timeZone: 'Europe/London' },
  { id: 'fra', abbr: 'FRA', country: 'Francia', timeZone: 'Europe/Paris' },
  { id: 'ita', abbr: 'ITA', country: 'Italia', timeZone: 'Europe/Rome' },
  { id: 'gre', abbr: 'GRE', country: 'Grecia', timeZone: 'Europe/Athens' },
];

const DEFAULT_ZONE_IDS = ['il', 'arg', 've'];
const STORAGE_KEY = 'hadida_jaime_world_clocks_v2';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isAddingZone) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAddingZone(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddingZone]);

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

  const getZoneTime = (timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('es-ES', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);
    } catch {
      return '--:--';
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-flex items-center shrink-0">
      <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
        <Clock className="w-3.5 h-3.5 text-red-600 shrink-0" />

        <div className="flex items-center gap-1 sm:gap-1.5">
          {activeZones.map((zone, idx) => (
            <React.Fragment key={zone.id}>
              {idx > 0 && <span className="text-slate-300 dark:text-slate-600 font-bold">|</span>}
              <div
                className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                title={zone.country}
              >
                <span className="text-[10px] sm:text-[11px] font-black text-red-600 dark:text-red-400 tracking-tight">
                  {zone.abbr}
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-black text-slate-900 dark:text-white">
                  {getZoneTime(zone.timeZone)}
                </span>
                {activeZones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveZone(zone.id)}
                    className="hidden group-hover:inline-flex items-center justify-center text-slate-400 hover:text-red-600 ml-0.5 cursor-pointer"
                    title={`Quitar ${zone.abbr}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsAddingZone((prev) => !prev)}
          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-600 dark:text-slate-300 hover:text-red-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Añadir otro país / zona horaria"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {isAddingZone && (
        <div className="fixed sm:absolute right-4 sm:right-0 top-28 sm:top-full mt-1.5 w-52 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-1.5 space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1">
            <span>Añadir país / zona</span>
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
                <span className="font-black text-red-600 dark:text-red-400 w-9 shrink-0">
                  {zone.abbr}
                </span>
                <span className="truncate flex-1 text-slate-700 dark:text-slate-300">
                  {zone.country}
                </span>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">
                  {getZoneTime(zone.timeZone)}
                </span>
              </button>
            ))
          ) : (
            <p className="text-[11px] text-slate-400 text-center py-2">
              Todas las zonas añadidas
            </p>
          )}
        </div>
      )}
    </div>
  );
};
