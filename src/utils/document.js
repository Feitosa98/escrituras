export function normalizeCpfCnpj(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 14);
}

export function formatCpfCnpj(value) {
  const digits = normalizeCpfCnpj(value);
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function isValidCpfCnpjLength(value) {
  const digits = normalizeCpfCnpj(value);
  return digits.length === 0 || digits.length === 11 || digits.length === 14;
}
