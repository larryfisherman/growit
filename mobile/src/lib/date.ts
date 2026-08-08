// Calendar dates are local-time. Never use toISOString() for them — it converts to
// UTC, so between midnight and 02:00 in Poland it still reports the previous day.
// sv-SE is the locale that formats as YYYY-MM-DD, which is what the API expects.

export const getToday = () => new Date().toLocaleDateString('sv-SE');

export const formatWeekdayDayMonth = (date: Date = new Date()) =>
  date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

export const formatDayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });

export const formatShortDate = (date: Date = new Date()) => date.toLocaleDateString('pl-PL');
