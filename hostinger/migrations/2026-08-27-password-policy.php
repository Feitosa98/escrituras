<?php
declare(strict_types=1);

require dirname(__DIR__) . '/public_html/api/bootstrap.php';

$pdo = db();
$database = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();

function security_column_exists(PDO $pdo, string $database, string $column): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME="users" AND COLUMN_NAME=?');
    $stmt->execute([$database, $column]);
    return (int)$stmt->fetchColumn() > 0;
}

$columns = [
    'password_changed_at' => 'ALTER TABLE users ADD COLUMN password_changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER access_end',
    'password_version' => 'ALTER TABLE users ADD COLUMN password_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER password_changed_at',
    'must_change_password' => 'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER password_version',
    'failed_login_attempts' => 'ALTER TABLE users ADD COLUMN failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER must_change_password',
    'failed_login_window_started_at' => 'ALTER TABLE users ADD COLUMN failed_login_window_started_at DATETIME NULL AFTER failed_login_attempts',
    'locked_until' => 'ALTER TABLE users ADD COLUMN locked_until DATETIME NULL AFTER failed_login_window_started_at',
];

foreach ($columns as $column => $sql) {
    if (!security_column_exists($pdo, $database, $column)) $pdo->exec($sql);
}

$pdo->exec('CREATE TABLE IF NOT EXISTS password_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_password_history_user_created (user_id, created_at),
    CONSTRAINT fk_password_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

$pdo->exec('INSERT INTO password_history (user_id, senha_hash)
    SELECT u.id, u.senha_hash FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM password_history h WHERE h.user_id=u.id)');

echo json_encode([
    'ok' => true,
    'migration' => '2026-08-27-password-policy',
    'users' => (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
