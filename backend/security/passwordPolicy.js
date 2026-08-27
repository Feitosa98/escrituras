const blockedPasswords = new Set([
  'admin123',
  'administrador',
  'password',
  'password123',
  'senha123',
  '123456789012345',
  'qwertyuiop',
]);

function validatePassword(password, context = {}) {
  if (typeof password !== 'string') return 'A senha deve ser informada';
  if (password.length < 8) return 'A senha deve possuir pelo menos 8 caracteres';
  if (password.length > 128) return 'A senha deve possuir no máximo 128 caracteres';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return 'Use letra maiúscula, minúscula, número e caractere especial';
  }

  const normalized = password.trim().toLowerCase();
  if (blockedPasswords.has(normalized)) return 'Escolha uma senha menos previsível';

  const personalValues = [context.username, context.email]
    .filter(Boolean)
    .flatMap((value) => String(value).toLowerCase().split(/[^a-z0-9]+/))
    .filter((value) => value.length >= 4);
  if (personalValues.some((value) => normalized.includes(value))) {
    return 'A senha não deve conter o usuário ou o e-mail';
  }

  return null;
}

module.exports = { validatePassword };
