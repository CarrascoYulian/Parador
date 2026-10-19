import type { DayHours } from './types';

export const DAY_LABELS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const TZ = 'America/Santo_Domingo';

/** Día (1–7, lunes = 1) y minutos desde medianoche en hora de República Dominicana. */
export function nowInDR(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')) + 1;
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** "08:00" → "8:00 a. m." */
export function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'a. m.' : 'p. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatRange(d: DayHours) {
  return d.closed ? 'Cerrado' : `${formatTime(d.open)} – ${formatTime(d.close)}`;
}

export interface OpenStatus {
  open: boolean;
  label: string;
  today: number;
}

export function openStatus(hours: DayHours[], date = new Date()): OpenStatus {
  const { day, minutes } = nowInDR(date);
  const today = hours.find((h) => h.day === day);
  if (today && !today.closed) {
    const o = toMinutes(today.open);
    const c = toMinutes(today.close);
    if (minutes >= o && minutes < c) return { open: true, label: `Abierto · cierra a las ${formatTime(today.close)}`, today: day };
    if (minutes < o) return { open: false, label: `Cerrado · abre hoy a las ${formatTime(today.open)}`, today: day };
  }
  // Buscar el próximo día abierto.
  for (let i = 1; i <= 7; i++) {
    const d = ((day - 1 + i) % 7) + 1;
    const next = hours.find((h) => h.day === d);
    if (next && !next.closed) {
      const when = i === 1 ? 'mañana' : `el ${DAY_LABELS[d].toLowerCase()}`;
      return { open: false, label: `Cerrado · abre ${when} a las ${formatTime(next.open)}`, today: day };
    }
  }
  return { open: false, label: 'Cerrado', today: day };
}

/** Agrupa días consecutivos con el mismo horario: "Lunes a sábado". */
export function groupedHours(hours: DayHours[]) {
  const sorted = [...hours].sort((a, b) => a.day - b.day);
  const groups: { from: number; to: number; range: string }[] = [];
  for (const d of sorted) {
    const range = formatRange(d);
    const last = groups[groups.length - 1];
    if (last && last.range === range && last.to === d.day - 1) last.to = d.day;
    else groups.push({ from: d.day, to: d.day, range });
  }
  return groups.map((g) => ({
    label: g.from === g.to ? DAY_LABELS[g.from] : `${DAY_LABELS[g.from]} a ${DAY_LABELS[g.to].toLowerCase()}`,
    range: g.range,
  }));
}
