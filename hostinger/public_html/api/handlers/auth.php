<?php
declare(strict_types=1);

function auth_safe_user(array $user): array
{
    $changed = strtotime((string)($user['password_changed_at'] ?? '')) ?: time();
    return [
        'id' => (int)$user['id'],
        'nome' => $user['nome'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'access_start' => substr((string)$user['access_start'], 0, 5),
        'access_end' => substr((string)$user['access_end'], 0, 5),
        'must_change_password' => password_is_expired($user),
        'password_expires_at' => date('c', strtotime('+30 days', $changed)),
    ];
}

function register_login_failure(array $user): void
{
    $windowStarted = strtotime((string)($user['failed_login_window_started_at'] ?? '')) ?: 0;
    $insideWindow = $windowStarted >= strtotime('-15 minutes');
    $attempts = $insideWindow ? (int)$user['failed_login_attempts'] + 1 : 1;
    $startSql = $insideWindow ? 'failed_login_window_started_at' : 'NOW()';
    $lockedSql = $attempts >= 5 ? 'DATE_ADD(NOW(), INTERVAL 15 MINUTE)' : 'NULL';
    $stmt = db()->prepare("UPDATE users SET failed_login_attempts=?,failed_login_window_started_at=$startSql,locked_until=$lockedSql WHERE id=?");
    $stmt->execute([$attempts, (int)$user['id']]);
    audit('LOGIN_FAILED', 'users', $user['id'], null, ['attempts_in_window' => $attempts], $user);
}

function handle_auth(string $method, array $parts): never
{
    $action = $parts[1] ?? '';

    if ($method === 'POST' && $action === 'login') {
        enforce_rate_limit('auth-login', 25, 900);
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
        if (!$user || !(int)$user['ativo']) {
            password_verify($password, '$2y$12$6bT73Njh4VhD7L1vt1ycUO4DhYwH0E0/xfYTYuYHAYl6N9/L5zDgK');
            fail('Credenciais invalidas', 401);
        }
        if (!empty($user['locked_until']) && strtotime((string)$user['locked_until']) > time()) {
            fail('Usuario temporariamente bloqueado. Tente novamente em 15 minutos', 429, ['code' => 'ACCOUNT_LOCKED']);
        }
        if (!password_verify($password, $user['senha_hash'])) {
            register_login_failure($user);
            fail('Credenciais invalidas', 401);
        }
        if (!access_time_allowed($user)) {
            fail(sprintf('Acesso permitido somente das %s as %s', substr($user['access_start'], 0, 5), substr($user['access_end'], 0, 5)), 403, ['code' => 'OUTSIDE_ACCESS_HOURS']);
        }

        db()->prepare('UPDATE users SET failed_login_attempts=0,failed_login_window_started_at=NULL,locked_until=NULL WHERE id=?')->execute([(int)$user['id']]);
        audit('LOGIN', 'users', $user['id'], null, ['username' => $user['username']], $user);
        $safe = auth_safe_user($user);
        json_response(['token' => jwt_create($user), 'user' => $safe, 'must_change_password' => $safe['must_change_password']]);
    }

    if ($method === 'POST' && $action === 'change-password') {
        $user = current_user(true, true);
        $data = body();
        $currentPassword = $data['senha_atual'] ?? null;
        $newPassword = $data['nova_senha'] ?? null;
        if (!is_string($currentPassword) || !is_string($newPassword)) fail('Informe a senha atual e a nova senha');

        $stmt = db()->prepare('SELECT * FROM users WHERE id=? AND ativo=1');
        $stmt->execute([(int)$user['id']]);
        $full = $stmt->fetch();
        if (!$full || !password_verify($currentPassword, $full['senha_hash'])) fail('Senha atual incorreta', 401);
        if (!password_is_expired($full) && strtotime((string)$full['password_changed_at']) > strtotime('-1 day')) {
            fail('A senha somente pode ser alterada novamente apos 1 dia', 409, ['code' => 'PASSWORD_MINIMUM_AGE']);
        }
        if ($error = password_error($newPassword, ['username' => $full['username'], 'email' => $full['email']])) fail($error);
        if (password_was_used((int)$full['id'], $newPassword)) fail('A nova senha nao pode repetir nenhuma das ultimas 5 senhas');

        $hash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo = db();
        $pdo->beginTransaction();
        try {
            save_password_history((int)$full['id'], $hash);
            $pdo->prepare('UPDATE users SET senha_hash=?,password_changed_at=NOW(),password_version=password_version+1,must_change_password=0,failed_login_attempts=0,failed_login_window_started_at=NULL,locked_until=NULL WHERE id=?')->execute([$hash, (int)$full['id']]);
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $error;
        }
        audit('PASSWORD_CHANGE', 'users', $full['id'], null, ['self_service' => true], $full);
        $stmt->execute([(int)$full['id']]);
        $updated = $stmt->fetch();
        $safe = auth_safe_user($updated);
        json_response(['token' => jwt_create($updated), 'user' => $safe]);
    }

    if ($method === 'GET' && $action === 'me') {
        json_response(auth_safe_user(current_user()));
    }
    fail('Rota nao encontrada', 404);
}
