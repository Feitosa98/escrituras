<?php
declare(strict_types=1);

require dirname(__DIR__) . '/public_html/api/bootstrap.php';

$pdo = db();
$database = (string)config('db.name');

function column_exists(PDO $pdo, string $database, string $column): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?');
    $stmt->execute([$database, 'escrituras', $column]);
    return (int)$stmt->fetchColumn() > 0;
}

function index_exists(PDO $pdo, string $database, string $index): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?');
    $stmt->execute([$database, 'escrituras', $index]);
    return (int)$stmt->fetchColumn() > 0;
}

if (!column_exists($pdo, $database, 'cpf_cnpj_outorgante')) {
    $pdo->exec('ALTER TABLE escrituras ADD COLUMN cpf_cnpj_outorgante VARCHAR(14) NULL AFTER outorgante');
}
if (!column_exists($pdo, $database, 'cpf_cnpj_outorgado')) {
    $pdo->exec('ALTER TABLE escrituras ADD COLUMN cpf_cnpj_outorgado VARCHAR(14) NULL AFTER outorgado');
}
if (!index_exists($pdo, $database, 'idx_escrituras_cpf_outorgante')) {
    $pdo->exec('CREATE INDEX idx_escrituras_cpf_outorgante ON escrituras (cpf_cnpj_outorgante)');
}
if (!index_exists($pdo, $database, 'idx_escrituras_cpf_outorgado')) {
    $pdo->exec('CREATE INDEX idx_escrituras_cpf_outorgado ON escrituras (cpf_cnpj_outorgado)');
}

$total = (int)$pdo->query('SELECT COUNT(*) FROM escrituras')->fetchColumn();
echo json_encode([
    'success' => true,
    'migration' => '2026-08-21-party-documents',
    'records_preserved' => $total,
    'columns' => ['cpf_cnpj_outorgante', 'cpf_cnpj_outorgado'],
], JSON_UNESCAPED_SLASHES) . PHP_EOL;
