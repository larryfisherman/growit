/// Normalises text for searching: case and Polish diacritics stop mattering, so
/// "wioslowanie" finds "Wiosłowanie". NFD splits most accents off their base letter;
/// ł has no decomposition, so it is mapped by hand.
export const searchable = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .trim();
