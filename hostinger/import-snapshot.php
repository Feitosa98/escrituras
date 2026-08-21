<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { fwrite(STDERR, "Este importador so pode ser executado por linha de comando.\n"); exit(2); }
if ($argc < 2) { fwrite(STDERR, "Uso: MIGRATION_ARCHIVE_KEY=... php import-snapshot.php arquivo.hst\n"); exit(2); }
$archiveKey = getenv('MIGRATION_ARCHIVE_KEY') ?: '';
if (strlen($archiveKey) < 24) { fwrite(STDERR, "Defina MIGRATION_ARCHIVE_KEY com pelo menos 24 caracteres.\n"); exit(2); }

require __DIR__ . '/public_html/api/bootstrap.php';
$raw = file_get_contents($argv[1]);
if ($raw === false || strlen($raw) < 49 || substr($raw, 0, 4) !== 'HST1') { fwrite(STDERR, "Arquivo de migracao invalido.\n"); exit(2); }
$salt = substr($raw, 4, 16); $iv = substr($raw, 20, 12); $tag = substr($raw, 32, 16); $cipher = substr($raw, 48);
$key = hash_pbkdf2('sha256', $archiveKey, $salt, 200000, 32, true);
$plain = openssl_decrypt($cipher, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
$snapshot = $plain === false ? null : json_decode($plain, true);
if (!is_array($snapshot) || ($snapshot['format'] ?? null) !== 1 || !is_array($snapshot['tables'] ?? null)) { fwrite(STDERR, "Nao foi possivel decifrar ou validar o arquivo.\n"); exit(2); }

$pdo = db();
$existing = (int)$pdo->query('SELECT (SELECT COUNT(*) FROM users) + (SELECT COUNT(*) FROM escrituras)')->fetchColumn();
if ($existing > 0) { fwrite(STDERR, "Importacao recusada: o banco de destino nao esta vazio.\n"); exit(3); }

$order = ['users','tipos_escritura','escreventes','escrituras','audit_logs','workflow_history','agendamentos','checklist_items','metas_mensais','metas_individuais','assinaturas_digitais'];
$allowedColumns = [];
foreach ($order as $table) {
    $columns = $pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll();
    $allowedColumns[$table] = array_column($columns, 'Field');
}

$pdo->beginTransaction();
try {
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach ($order as $table) {
        foreach (($snapshot['tables'][$table] ?? []) as $row) {
            if ($table === 'escrituras' && !empty($row['senha_cliente'])) $row['senha_cliente'] = encrypt_secret((string)$row['senha_cliente']);
            $row = array_intersect_key($row, array_flip($allowedColumns[$table]));
            if (!$row) continue;
            $columns = array_keys($row);
            $quoted = array_map(static fn(string $column): string => "`$column`", $columns);
            $stmt = $pdo->prepare("INSERT INTO `$table` (" . implode(',', $quoted) . ') VALUES (' . implode(',', array_fill(0, count($columns), '?')) . ')');
            $values = array_map(static function ($value) {
                if (is_bool($value)) return $value ? 1 : 0;
                if (is_array($value)) return json_encode($value, JSON_UNESCAPED_UNICODE);
                return $value;
            }, array_values($row));
            $stmt->execute($values);
        }
    }
    $pdo->exec("INSERT INTO tracking_sequences(prefix_month,sequence_value) SELECT LEFT(acompanhamento_codigo,LENGTH(acompanhamento_codigo)-3),MAX(CAST(RIGHT(acompanhamento_codigo,3) AS UNSIGNED)) FROM escrituras WHERE acompanhamento_codigo IS NOT NULL GROUP BY LEFT(acompanhamento_codigo,LENGTH(acompanhamento_codigo)-3) ON DUPLICATE KEY UPDATE sequence_value=VALUES(sequence_value)");
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
    $pdo->commit();
    $counts = [];
    foreach ($order as $table) $counts[$table] = (int)$pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
    echo json_encode(['success' => true, 'counts' => $counts], JSON_UNESCAPED_UNICODE) . PHP_EOL;
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fwrite(STDERR, "Importacao cancelada: " . $error->getMessage() . PHP_EOL);
    exit(4);
}
