import { Member } from '../types';

export interface MemberColorTheme {
  name: string;
  bgLight: string;
  text: string;
  border: string;
  dot: string;
  badge: string;
  cellBadge: string;
  pillBg: string;
  pillText: string;
}

const PALETTE: MemberColorTheme[] = [
  {
    name: 'Rojo',
    bgLight: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-red-400 dark:border-red-700',
    dot: 'bg-red-600',
    badge: 'bg-red-50 dark:bg-red-950/50 text-slate-900 dark:text-white border-red-300 dark:border-red-800',
    cellBadge: 'bg-red-50 dark:bg-red-950/70 text-slate-900 dark:text-white border-red-300 dark:border-red-800',
    pillBg: 'bg-red-600',
    pillText: 'text-white',
  },
  {
    name: 'Morado',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-purple-400 dark:border-purple-700',
    dot: 'bg-purple-600',
    badge: 'bg-purple-50 dark:bg-purple-950/50 text-slate-900 dark:text-white border-purple-300 dark:border-purple-800',
    cellBadge: 'bg-purple-50 dark:bg-purple-950/70 text-slate-900 dark:text-white border-purple-300 dark:border-purple-800',
    pillBg: 'bg-purple-600',
    pillText: 'text-white',
  },
  {
    name: 'Rosa',
    bgLight: 'bg-pink-50 dark:bg-pink-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-pink-400 dark:border-pink-700',
    dot: 'bg-pink-600',
    badge: 'bg-pink-50 dark:bg-pink-950/50 text-slate-900 dark:text-white border-pink-300 dark:border-pink-800',
    cellBadge: 'bg-pink-50 dark:bg-pink-950/70 text-slate-900 dark:text-white border-pink-300 dark:border-pink-800',
    pillBg: 'bg-pink-600',
    pillText: 'text-white',
  },
  {
    name: 'Fucsia / Rosa Intenso',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-rose-400 dark:border-rose-700',
    dot: 'bg-rose-600',
    badge: 'bg-rose-50 dark:bg-rose-950/50 text-slate-900 dark:text-white border-rose-300 dark:border-rose-800',
    cellBadge: 'bg-rose-50 dark:bg-rose-950/70 text-slate-900 dark:text-white border-rose-300 dark:border-rose-800',
    pillBg: 'bg-rose-600',
    pillText: 'text-white',
  },
  {
    name: 'Ámbar / Amarillo',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-amber-400 dark:border-amber-700',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 dark:bg-amber-950/50 text-slate-900 dark:text-white border-amber-300 dark:border-amber-800',
    cellBadge: 'bg-amber-50 dark:bg-amber-950/70 text-slate-900 dark:text-white border-amber-300 dark:border-amber-800',
    pillBg: 'bg-amber-500',
    pillText: 'text-white',
  },
  {
    name: 'Azul',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-blue-400 dark:border-blue-700',
    dot: 'bg-blue-600',
    badge: 'bg-blue-50 dark:bg-blue-950/50 text-slate-900 dark:text-white border-blue-300 dark:border-blue-800',
    cellBadge: 'bg-blue-50 dark:bg-blue-950/70 text-slate-900 dark:text-white border-blue-300 dark:border-blue-800',
    pillBg: 'bg-blue-600',
    pillText: 'text-white',
  },
  {
    name: 'Esmeralda / Verde',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-emerald-400 dark:border-emerald-700',
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-50 dark:bg-emerald-950/50 text-slate-900 dark:text-white border-emerald-300 dark:border-emerald-800',
    cellBadge: 'bg-emerald-50 dark:bg-emerald-950/70 text-slate-900 dark:text-white border-emerald-300 dark:border-emerald-800',
    pillBg: 'bg-emerald-600',
    pillText: 'text-white',
  },
  {
    name: 'Índigo / Celeste',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-indigo-400 dark:border-indigo-700',
    dot: 'bg-indigo-600',
    badge: 'bg-indigo-50 dark:bg-indigo-950/50 text-slate-900 dark:text-white border-indigo-300 dark:border-indigo-800',
    cellBadge: 'bg-indigo-50 dark:bg-indigo-950/70 text-slate-900 dark:text-white border-indigo-300 dark:border-indigo-800',
    pillBg: 'bg-indigo-600',
    pillText: 'text-white',
  },
  {
    name: 'Teal / Turquesa',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-teal-400 dark:border-teal-700',
    dot: 'bg-teal-600',
    badge: 'bg-teal-50 dark:bg-teal-950/50 text-slate-900 dark:text-white border-teal-300 dark:border-teal-800',
    cellBadge: 'bg-teal-50 dark:bg-teal-950/70 text-slate-900 dark:text-white border-teal-300 dark:border-teal-800',
    pillBg: 'bg-teal-600',
    pillText: 'text-white',
  },
  {
    name: 'Naranja',
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-slate-900 dark:text-white',
    border: 'border-orange-400 dark:border-orange-700',
    dot: 'bg-orange-500',
    badge: 'bg-orange-50 dark:bg-orange-950/50 text-slate-900 dark:text-white border-orange-300 dark:border-orange-800',
    cellBadge: 'bg-orange-50 dark:bg-orange-950/70 text-slate-900 dark:text-white border-orange-300 dark:border-orange-800',
    pillBg: 'bg-orange-500',
    pillText: 'text-white',
  },
];

// Mapping specific known member ids to their distinctive colors
// JAIME -> Naranja (9), MOISES -> Azul (5), SIMON -> Rojo (0)
const KNOWN_MEMBERS: Record<string, number> = {
  member_jaime: 9, // Naranja (Orange)
  member_moises: 5, // Azul (Blue)
  member_simon: 0, // Rojo (Red)
  member_sofi: 1, // Morado (Purple)
  member_stephanie: 2, // Rosa (Pink)
  member_sharon: 3, // Fucsia (Rose)
  member_shirly: 4, // Ámbar (Amber)
  member_mercedes: 6, // Esmeralda / Verde (Emerald)
};

export function getMemberColorTheme(member?: Member | null, memberId?: string): MemberColorTheme {
  const id = member?.id || memberId || '';
  const name = member?.name?.toLowerCase() || '';

  // Direct name matching for guaranteed consistency
  if (name.includes('jaime') || id === 'member_jaime') {
    return PALETTE[9]; // Naranja
  }
  if (name.includes('moises') || id === 'member_moises') {
    return PALETTE[5]; // Azul
  }
  if (name.includes('simon') || id === 'member_simon') {
    return PALETTE[0]; // Rojo
  }
  if (name.includes('sofi') || id === 'member_sofi') {
    return PALETTE[1]; // Morado
  }
  if (name.includes('stephanie') || id === 'member_stephanie') {
    return PALETTE[2]; // Rosa
  }
  if (name.includes('sharon') || id === 'member_sharon') {
    return PALETTE[3]; // Fucsia
  }
  if (name.includes('shirly') || id === 'member_shirly') {
    return PALETTE[4]; // Ámbar
  }
  if (name.includes('mercedes') || id === 'member_mercedes') {
    return PALETTE[6]; // Verde
  }

  if (KNOWN_MEMBERS[id] !== undefined) {
    return PALETTE[KNOWN_MEMBERS[id]];
  }

  // If member has avatarColor string like "bg-purple-600", match by color keyword
  if (member?.avatarColor) {
    const c = member.avatarColor.toLowerCase();
    if (c.includes('orange')) return PALETTE[9];
    if (c.includes('blue')) return PALETTE[5];
    if (c.includes('red')) return PALETTE[0];
    if (c.includes('purple')) return PALETTE[1];
    if (c.includes('pink')) return PALETTE[2];
    if (c.includes('rose')) return PALETTE[3];
    if (c.includes('amber') || c.includes('yellow')) return PALETTE[4];
    if (c.includes('emerald') || c.includes('green')) return PALETTE[6];
    if (c.includes('indigo') || c.includes('violet')) return PALETTE[7];
    if (c.includes('teal') || c.includes('cyan')) return PALETTE[8];
  }

  // Consistent fallback hashing
  if (id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % PALETTE.length;
    return PALETTE[idx];
  }

  return PALETTE[9];
}
