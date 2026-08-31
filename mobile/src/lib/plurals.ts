// Polish plurals: 1 takes the singular, 2-4 take the "few" form, everything else
// takes the "many" form — except numbers ending in 12-14, which also take "many".

const pluralPl = (count: number, one: string, few: string, many: string) => {
  if (count === 1) return one;
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  const isFew = lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14);
  return isFew ? few : many;
};

export const exerciseCountLabel = (count: number) =>
  count === 0 ? 'Brak ćwiczeń' : `${count} ${pluralPl(count, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}`;

export const dayCountLabel = (count: number) =>
  count === 0 ? 'Brak dni' : `${count} ${pluralPl(count, 'dzień', 'dni', 'dni')}`;
