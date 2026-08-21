export function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const text = String(value).trim();
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateBR(value, fallback = '—', options) {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString('pt-BR', options) : fallback;
}
