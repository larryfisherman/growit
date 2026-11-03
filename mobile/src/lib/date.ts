// Calendar dates are local-time. Never use toISOString() for them — it converts to
// UTC, so between midnight and 02:00 in Poland it still reports the previous day.
// sv-SE is the locale that formats as YYYY-MM-DD, which is what the API expects.

export const getToday = () => new Date().toLocaleDateString('sv-SE');

export const formatWeekdayDayMonth = (date: Date = new Date()) =>
  date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/// A date-only string ('YYYY-MM-DD', what the API sends for performedAt) is a calendar
/// date, so it is read in local time. new Date() would read it as UTC midnight, which is
/// still the previous day anywhere west of UTC.
const parseDate = (iso: string) => {
  const dateOnly = DATE_ONLY.exec(iso);
  if (!dateOnly) return new Date(iso);

  const [, year, month, day] = dateOnly;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const formatDayMonth = (iso: string) =>
  parseDate(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });

export const formatShortDate = (date: Date = new Date()) => date.toLocaleDateString('pl-PL');
