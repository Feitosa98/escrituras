<?php
declare(strict_types=1);

function user_safe(array $row): array
{
    unset($row['senha_hash'], $row['private_key_encrypted']);
    if (isset($row['ativo'])) $row['ativo'] = (int)$row['ativo'];
    if (isset($row['access_start'])) $row['access_start'] = substr((string)$row['access_start'], 0, 5);
    if (isset($row['access_end'])) $row['access_end'] = substr((string)$row['access_end'], 0, 5);
    return $row;
}

function find_user(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? user_safe($row) : null;
}

function handle_users(string $method, array $parts): never
{
    $target = $parts[1] ?? null;
    if ($method === 'GET' && $target === 'options') {
        require_role('visualizador');
        $rows = db()->query('SELECT id,uuid,nome,username,email,role,ativo,TIME_FORMAT(access_start,"%H:%i") access_start,TIME_FORMAT(access_end,"%H:%i") access_end FROM users WHERE ativo=1 ORDER BY nome')->fetchAll();
        json_response($rows);
    }

    require_role('admin');
    if ($method === 'GET' && $target === null) {
        json_response(array_map('user_safe', db()->query('SELECT * FROM users ORDER BY nome')->fetchAll()));
    }
    if ($method === 'GET' && ctype_digit((string)$target)) {
        $user = find_user((int)$target);
        if (!$user) fail('Usuario nao encontrado', 404);
        json_response($user);
    }
    if ($method === 'POST' && $target === null) {
        $data = body();
        $name = trim((string)($data['nome'] ?? ''));
        $password = $data['senha'] ?? null;
        if ($name === '' || !is_string($password)) fail('Nome e senha sao obrigatorios');
        $partsName = preg_split('/\s+/', $name) ?: [];
        $generated = normalize_username(($partsName[0] ?? '') . '.' . ($partsName[count($partsName) - 1] ?? 'usuario'));
        $username = normalize_username((string)($data['username'] ?? $generated));
        if (!preg_match('/^[a-z0-9]+\.[a-z0-9]+$/', $username)) fail('O usuario deve seguir o formato nome.sobrenome');
        $email = strtolower(trim((string)($data['email'] ?? "$username@sistema.local")));
        $role = (string)($data['role'] ?? 'visualizador');
        if (!in_array($role, ['admin', 'editor', 'visualizador'], true)) fail('Nivel de acesso invalido');
        $start = (string)($data['access_start'] ?? '07:50');
        $end = (string)($data['access_end'] ?? '18:30');
        if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $start) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $end)) fail('Horario de acesso invalido');
        if ($error = password_error($password, ['username' => $username, 'email' => $email])) fail($error);
        $check = db()->prepare('SELECT id FROM users WHERE username=? OR email=?');
        $check->execute([$username, $email]);
        if ($check->fetch()) fail('Nome de usuario ou e-mail ja cadastrado');
        $stmt = db()->prepare('INSERT INTO users (uuid,nome,username,email,senha_hash,role,access_start,access_end) VALUES (?,?,?,?,?,?,?,?)');
        $stmt->execute([uuid_v4(), $name, $username, $email, password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]), $role, $start, $end]);
        $user = find_user((int)db()->lastInsertId());
        audit('CREATE', 'users', $user['id'], null, ['nome' => $name, 'username' => $username, 'role' => $role, 'access_start' => $start, 'access_end' => $end]);
        json_response($user, 201);
    }
    if ($method === 'PUT' && ctype_digit((string)$target)) {
        $id = (int)$target;
        $before = find_user($id);
        if (!$before) fail('Usuario nao encontrado', 404);
        $data = body();
        $allowed = ['nome', 'email', 'role', 'ativo', 'access_start', 'access_end'];
        $fields = [];
        $values = [];
        foreach ($allowed as $field) {
            if (!array_key_exists($field, $data)) continue;
            if ($field === 'role' && !in_array($data[$field], ['admin', 'editor', 'visualizador'], true)) fail('Nivel de acesso invalido');
            if (in_array($field, ['access_start', 'access_end'], true) && !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', (string)$data[$field])) fail('Horario de acesso invalido');
            $fields[] = "$field=?";
            $values[] = $field === 'ativo' ? (bool_value($data[$field]) ? 1 : 0) : $data[$field];
        }
        if (array_key_exists('username', $data)) {
            $username = normalize_username((string)$data['username']);
            if (!preg_match('/^[a-z0-9]+\.[a-z0-9]+$/', $username)) fail('O usuario deve seguir o formato nome.sobrenome');
            $dup = db()->prepare('SELECT id FROM users WHERE username=? AND id<>?');
            $dup->execute([$username, $id]);
            if ($dup->fetch()) fail('Nome de usuario ja cadastrado');
            $fields[] = 'username=?'; $values[] = $username;
        }
        if (!empty($data['senha'])) {
            if ($error = password_error($data['senha'], ['username' => $data['username'] ?? $before['username'], 'email' => $data['email'] ?? $before['email']])) fail($error);
            $fields[] = 'senha_hash=?'; $values[] = password_hash($data['senha'], PASSWORD_BCRYPT, ['cost' => 12]);
        }
        if ($fields) {
            $values[] = $id;
            db()->prepare('UPDATE users SET ' . implode(',', $fields) . ' WHERE id=?')->execute($values);
        }
        $updated = find_user($id);
        audit('UPDATE', 'users', $id, $before, $updated);
        json_response($updated);
    }
    if ($method === 'DELETE' && ctype_digit((string)$target)) {
        $actor = current_user();
        $id = (int)$target;
        if ($id === (int)$actor['id']) fail('Nao e possivel desativar seu proprio usuario');
        $before = find_user($id);
        if (!$before) fail('Usuario nao encontrado', 404);
        db()->prepare('UPDATE users SET ativo=0 WHERE id=?')->execute([$id]);
        audit('DEACTIVATE', 'users', $id, $before, find_user($id));
        json_response(['message' => 'Usuario desativado com sucesso']);
    }
    fail('Rota nao encontrada', 404);
}

