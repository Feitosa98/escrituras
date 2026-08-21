<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/handlers/auth.php';
require __DIR__ . '/handlers/users.php';
require __DIR__ . '/handlers/acts.php';
require __DIR__ . '/handlers/admin.php';
require __DIR__ . '/handlers/audit.php';
require __DIR__ . '/handlers/schedule.php';
require __DIR__ . '/handlers/public_consultation.php';
require __DIR__ . '/handlers/goals.php';

try {
    $method = request_method();
    $path = route_path();
    $parts = $path === '/' ? [] : explode('/', trim($path, '/'));
    if ($method === 'OPTIONS') json_response(null, 204, ['Allow' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS']);
    if ($method === 'GET' && ($parts[0] ?? '') === 'health') {
        db()->query('SELECT 1');
        json_response(['ok' => true, 'database' => 'mysql', 'runtime' => 'php', 'timestamp' => gmdate('c')], 200, ['Cache-Control' => 'no-store']);
    }
    match ($parts[0] ?? '') {
        'auth' => handle_auth($method, $parts),
        'users' => handle_users($method, $parts),
        'escrituras' => handle_acts($method, $parts),
        'admin' => handle_admin($method, $parts),
        'audit' => handle_audit($method, $parts),
        'agendamentos' => handle_schedule($method, $parts),
        'consulta' => handle_public_consultation($method),
        'metas' => handle_goals($method, $parts),
        default => fail('Rota nao encontrada', 404),
    };
} catch (PDOException $error) {
    error_log('Database error: ' . $error->getMessage());
    if ($error->getCode() === '23000') fail('Registro duplicado ou vinculo invalido', 409);
    fail('Erro interno de banco de dados', 500);
} catch (Throwable $error) {
    error_log('Application error: ' . $error->getMessage());
    fail('Erro interno do sistema', 500);
}

