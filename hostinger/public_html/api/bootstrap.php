<?php
declare(strict_types=1);

const DEFAULT_CHECKLIST = [
    'Conferir dados do requerente e das partes',
    'Conferir documentos obrigatorios',
    'Analisar certidoes e impedimentos',
    'Preparar minuta do ato',
    'Revisar minuta e valores',
    'Coletar assinaturas',
    'Concluir selagem e arquivamento',
];

function load_config(): array
{
    $explicit = getenv('APP_CONFIG_PATH') ?: null;
    $candidates = array_filter([
        $explicit,
        dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'config.php',
        dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config.php',
    ]);
    foreach ($candidates as $candidate) {
        if (is_file($candidate)) {
            $config = require $candidate;
            if (is_array($config)) return $config;
        }
    }
    throw new RuntimeException('Configuracao privada nao encontrada');
}

$GLOBALS['app_config'] = load_config();
date_default_timezone_set($GLOBALS['app_config']['timezone'] ?? 'America/Manaus');

function config(?string $key = null, mixed $default = null): mixed
{
    $value = $GLOBALS['app_config'];
    if ($key === null) return $value;
    foreach (explode('.', $key) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) return $default;
        $value = $value[$part];
    }
    return $value;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $db = config('db');
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'], $db['port'] ?? 3306, $db['name'], $db['charset'] ?? 'utf8mb4'
    );
    $pdo = new PDO($dsn, $db['user'], $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '-04:00'",
    ]);
    return $pdo;
}

function json_response(mixed $data = null, int $status = 200, array $headers = []): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    foreach ($headers as $name => $value) header($name . ': ' . $value);
    if ($status !== 204) {
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    }
    exit;
}

function fail(string $message, int $status = 400, array $extra = []): never
{
    json_response(array_merge(['error' => $message], $extra), $status);
}

function body(): array
{
    static $parsed = null;
    if (is_array($parsed)) return $parsed;
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > 5 * 1024 * 1024) fail('Requisicao muito grande', 413);
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return $parsed = [];
    $data = json_decode($raw, true);
    if (!is_array($data)) fail('JSON invalido', 400);
    return $parsed = $data;
}

function route_path(): string
{
    $path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/api', PHP_URL_PATH) ?: '/api');
    $position = strpos($path, '/api');
    if ($position !== false) $path = substr($path, $position + 4);
    return '/' . trim($path, '/');
}

function request_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function query(string $key, mixed $default = null): mixed
{
    return $_GET[$key] ?? $default;
}

function request_ip(): string
{
    if (config('trusted_proxy', false)) {
        $forwarded = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')[0]);
        if (filter_var($forwarded, FILTER_VALIDATE_IP)) return $forwarded;
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64url_decode(string $value): string|false
{
    $padded = $value . str_repeat('=', (4 - strlen($value) % 4) % 4);
    return base64_decode(strtr($padded, '-_', '+/'), true);
}

function jwt_create(array $user): string
{
    $now = time();
    $payload = [
        'sub' => (int)$user['id'],
        'role' => $user['role'],
        'iat' => $now,
        'exp' => $now + (int)config('token_ttl_seconds', 28800),
    ];
    $head = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body = base64url_encode(json_encode($payload));
    $signature = base64url_encode(hash_hmac('sha256', "$head.$body", (string)config('jwt_secret'), true));
    return "$head.$body.$signature";
}

function jwt_decode(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$head, $body, $signature] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$head.$body", (string)config('jwt_secret'), true));
    if (!hash_equals($expected, $signature)) return null;
    $payloadRaw = base64url_decode($body);
    $payload = $payloadRaw ? json_decode($payloadRaw, true) : null;
    if (!is_array($payload) || (int)($payload['exp'] ?? 0) < time()) return null;
    return $payload;
}

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/^Bearer\s+(.+)$/i', $header, $matches) ? trim($matches[1]) : null;
}

function current_user(bool $required = true): ?array
{
    static $loaded = false;
    static $user = null;
    if ($loaded) {
        if ($required && !$user) fail('Token de acesso invalido ou expirado', 401);
        return $user;
    }
    $loaded = true;
    $token = bearer_token();
    $payload = $token ? jwt_decode($token) : null;
    if ($payload) {
        $stmt = db()->prepare('SELECT id, uuid, nome, username, email, role, ativo, TIME_FORMAT(access_start, "%H:%i") access_start, TIME_FORMAT(access_end, "%H:%i") access_end, created_at, updated_at FROM users WHERE id = ? AND ativo = 1');
        $stmt->execute([(int)$payload['sub']]);
        $user = $stmt->fetch() ?: null;
    }
    if ($required && !$user) fail('Token de acesso invalido ou expirado', 401);
    return $user;
}

function require_role(string $required): array
{
    $levels = ['visualizador' => 1, 'editor' => 2, 'admin' => 3];
    $user = current_user();
    if (($levels[$user['role']] ?? 0) < ($levels[$required] ?? 99)) {
        fail('Permissao negada', 403, ['message' => "Esta acao requer permissao de $required ou superior"]);
    }
    return $user;
}

function audit(string $action, ?string $table = null, int|string|null $recordId = null, mixed $before = null, mixed $after = null, ?array $user = null): void
{
    $user ??= current_user(false);
    $stmt = db()->prepare('INSERT INTO audit_logs (user_id, acao, tabela, registro_id, dados_anteriores, dados_novos, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $user['id'] ?? null,
        $action,
        $table,
        $recordId,
        $before === null ? null : json_encode($before, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
        $after === null ? null : json_encode($after, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
        request_ip(),
    ]);
}

function enforce_rate_limit(string $scope, int $maxHits, int $windowSeconds): void
{
    $now = new DateTimeImmutable();
    $bucket = hash('sha256', $scope . '|' . request_ip());
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT hits, expires_at FROM rate_limits WHERE bucket_key = ? FOR UPDATE');
        $stmt->execute([$bucket]);
        $row = $stmt->fetch();
        if (!$row || strtotime($row['expires_at']) <= time()) {
            $expires = $now->modify("+$windowSeconds seconds")->format('Y-m-d H:i:s');
            $save = $pdo->prepare('INSERT INTO rate_limits (bucket_key, hits, window_started_at, expires_at) VALUES (?, 1, NOW(), ?) ON DUPLICATE KEY UPDATE hits = 1, window_started_at = NOW(), expires_at = VALUES(expires_at)');
            $save->execute([$bucket, $expires]);
        } else {
            if ((int)$row['hits'] >= $maxHits) {
                $pdo->rollBack();
                fail('Muitas tentativas. Aguarde alguns minutos.', 429, ['retryAfter' => max(1, strtotime($row['expires_at']) - time())]);
            }
            $pdo->prepare('UPDATE rate_limits SET hits = hits + 1 WHERE bucket_key = ?')->execute([$bucket]);
        }
        if (random_int(1, 100) === 1) $pdo->exec('DELETE FROM rate_limits WHERE expires_at < NOW()');
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}

function crypto_key(): string
{
    return hash('sha256', (string)config('encryption_key'), true);
}

function encrypt_secret(?string $plain): ?string
{
    if ($plain === null || $plain === '') return null;
    if (str_starts_with($plain, 'enc:')) return $plain;
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt($plain, 'aes-256-gcm', crypto_key(), OPENSSL_RAW_DATA, $iv, $tag);
    if ($cipher === false) throw new RuntimeException('Falha ao proteger credencial');
    return 'enc:' . base64url_encode($iv . $tag . $cipher);
}

function decrypt_secret(?string $encrypted): ?string
{
    if ($encrypted === null || $encrypted === '') return null;
    if (!str_starts_with($encrypted, 'enc:')) return $encrypted;
    $raw = base64url_decode(substr($encrypted, 4));
    if ($raw === false || strlen($raw) < 29) return null;
    $iv = substr($raw, 0, 12);
    $tag = substr($raw, 12, 16);
    $cipher = substr($raw, 28);
    $plain = openssl_decrypt($cipher, 'aes-256-gcm', crypto_key(), OPENSSL_RAW_DATA, $iv, $tag);
    return $plain === false ? null : $plain;
}

function uuid_v4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

function bool_value(mixed $value, bool $default = false): bool
{
    if ($value === null) return $default;
    if (is_bool($value)) return $value;
    return in_array(strtolower((string)$value), ['1', 'true', 'yes', 'sim', 'on'], true);
}

function normalize_username(string $value): string
{
    $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
    return strtolower(preg_replace('/[^a-z0-9.]+/', '', trim($value)) ?? '');
}

function password_error(mixed $password, array $context = []): ?string
{
    if (!is_string($password)) return 'A senha deve ser informada';
    if (strlen($password) < 15) return 'A senha deve possuir pelo menos 15 caracteres';
    if (strlen($password) > 128) return 'A senha deve possuir no maximo 128 caracteres';
    $normalized = strtolower(trim($password));
    $blocked = ['admin123', 'administrador', 'password', 'password123', 'senha123', '123456789012345', 'qwertyuiop'];
    if (in_array($normalized, $blocked, true)) return 'Escolha uma senha menos previsivel';
    foreach (['username', 'email'] as $key) {
        foreach (preg_split('/[^a-z0-9]+/', strtolower((string)($context[$key] ?? ''))) as $part) {
            if (strlen($part) >= 4 && str_contains($normalized, $part)) return 'A senha nao deve conter o usuario ou o e-mail';
        }
    }
    return null;
}

function find_act(string|int $identifier, bool $includePassword = false): ?array
{
    $field = str_contains((string)$identifier, '-') ? 'uuid' : 'id';
    $stmt = db()->prepare("SELECT e.*, creator.nome usuario_fez, responsible.nome responsavel_nome FROM escrituras e LEFT JOIN users creator ON creator.id=e.created_by LEFT JOIN users responsible ON responsible.id=e.responsavel_id WHERE e.$field=?");
    $stmt->execute([$identifier]);
    $act = $stmt->fetch() ?: null;
    if (!$act) return null;
    $signers = db()->prepare('SELECT u.nome, a.`timestamp` FROM assinaturas_digitais a JOIN users u ON u.id=a.user_id WHERE a.escritura_id=? ORDER BY a.`timestamp` DESC');
    $signers->execute([$act['id']]);
    $rows = $signers->fetchAll();
    $act['usuarios_assinaram'] = array_column($rows, 'nome');
    $act['usuario_assinou'] = implode(', ', $act['usuarios_assinaram']);
    if ($includePassword) $act['senha_cliente'] = decrypt_secret($act['senha_cliente']);
    else unset($act['senha_cliente']);
    return $act;
}

function ensure_default_checklist(int $actId, int $userId): void
{
    $stmt = db()->prepare('SELECT COUNT(*) FROM checklist_items WHERE escritura_id=?');
    $stmt->execute([$actId]);
    if ((int)$stmt->fetchColumn() > 0) return;
    $insert = db()->prepare('INSERT INTO checklist_items (escritura_id,titulo,ordem,created_by) VALUES (?,?,?,?)');
    foreach (DEFAULT_CHECKLIST as $index => $title) $insert->execute([$actId, $title, $index + 1, $userId]);
}

function with_transaction(callable $callback): mixed
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $value = $callback($pdo);
        $pdo->commit();
        return $value;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}

