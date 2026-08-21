<?php
declare(strict_types=1);

function handle_auth(string $method, array $parts): never
{
    if ($method === 'POST' && ($parts[1] ?? '') === 'login') {
        enforce_rate_limit('auth-login', 8, 900);
        $data = body();
        $login = strtolower(trim((string)($data['usuario'] ?? '')));
        $password = $data['senha'] ?? null;
        if ($login === '' || !is_string($password)) fail('Usuario e senha sao obrigatorios');
        if (!preg_match('/^[a-z0-9]+\.[a-z0-9]+$/', $login) || strlen($login) > 100 || strlen($password) > 256) {
            fail('Use o usuario no formato nome.sobrenome');
        }
        $stmt = db()->prepare('SELECT * FROM users WHERE username=? LIMIT 1');
        $stmt->execute([$login]);
        $user = $stmt->fetch();
        if (!$user || !(int)$user['ativo'] || !password_verify($password, $user['senha_hash'])) {
            fail('Credenciais invalidas', 401);
        }
        $current = (int)date('H') * 60 + (int)date('i');
        $toMinutes = static function (string $time): int {
            [$hour, $minute] = array_map('intval', explode(':', substr($time, 0, 5)));
            return $hour * 60 + $minute;
        };
        $start = $toMinutes($user['access_start'] ?: '07:50');
        $end = $toMinutes($user['access_end'] ?: '18:30');
        $allowed = $start <= $end ? ($current >= $start && $current <= $end) : ($current >= $start || $current <= $end);
        if (!$allowed) fail(sprintf('Acesso permitido somente das %s as %s', substr($user['access_start'], 0, 5), substr($user['access_end'], 0, 5)), 403);
        audit('LOGIN', 'users', $user['id'], null, ['username' => $user['username']], $user);
        $safe = [
            'id' => (int)$user['id'], 'nome' => $user['nome'], 'username' => $user['username'],
            'email' => $user['email'], 'role' => $user['role'],
            'access_start' => substr($user['access_start'], 0, 5), 'access_end' => substr($user['access_end'], 0, 5),
        ];
        json_response(['token' => jwt_create($user), 'user' => $safe]);
    }

    if ($method === 'GET' && ($parts[1] ?? '') === 'me') {
        json_response(current_user());
    }
    fail('Rota nao encontrada', 404);
}

