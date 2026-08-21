<?php
declare(strict_types=1);

function normalize_quarter(string $value): string
{
    $value = strtoupper(trim($value));
    if (preg_match('/^T[1-4]$/', $value)) return $value;
    if (ctype_digit($value) && (int)$value >= 1 && (int)$value <= 12) return 'T' . (int)ceil((int)$value / 3);
    fail('Trimestre invalido');
}

function quarter_months(string $quarter): array
{
    $number = (int)substr(normalize_quarter($quarter), 1);
    $start = ($number - 1) * 3 + 1;
    return array_map(static fn(int $month): string => str_pad((string)$month, 2, '0', STR_PAD_LEFT), range($start, $start + 2));
}

function previous_quarter(string $quarter, int $year): array
{
    $number = (int)substr(normalize_quarter($quarter), 1);
    return $number === 1 ? ['T4', $year - 1] : ['T' . ($number - 1), $year];
}

function quarterly_goal(string $quarter, int $year): ?array
{
    $quarter = normalize_quarter($quarter);
    $stmt = db()->prepare('SELECT * FROM metas_mensais WHERE mes=? AND ano=?');
    $stmt->execute([$quarter, $year]);
    $goal = $stmt->fetch();
    if (!$goal) return null;
    $individual = db()->prepare('SELECT mi.*,u.nome user_nome,u.username user_username FROM metas_individuais mi JOIN users u ON u.id=mi.user_id WHERE mi.meta_mensal_id=? ORDER BY u.nome');
    $individual->execute([$goal['id']]);
    $goal['trimestre'] = $quarter;
    $goal['meses'] = quarter_months($quarter);
    $goal['metas_individuais'] = $individual->fetchAll();
    return $goal;
}

function quarter_count_statement(bool $individual = false): PDOStatement
{
    if ($individual) return db()->prepare('SELECT COUNT(*) FROM escrituras e JOIN users u ON u.id=? WHERE (e.created_by=u.id OR (e.created_by IS NULL AND LOWER(TRIM(e.escrevente))=LOWER(TRIM(u.nome)))) AND e.mes IN (?,?,?) AND e.ano=? AND e.archived_at IS NULL');
    return db()->prepare('SELECT COUNT(*) FROM escrituras WHERE mes IN (?,?,?) AND ano=? AND archived_at IS NULL');
}

function individual_quarter_report(int $userId, string $quarter, int $year): array
{
    $quarter = normalize_quarter($quarter);
    $months = quarter_months($quarter);
    $meta = db()->prepare('SELECT mi.meta_quantidade FROM metas_individuais mi JOIN metas_mensais mm ON mm.id=mi.meta_mensal_id WHERE mi.user_id=? AND mm.mes=? AND mm.ano=?');
    $meta->execute([$userId, $quarter, $year]);
    $target = (int)($meta->fetchColumn() ?: 0);
    $count = quarter_count_statement(true);
    $count->execute([$userId, ...$months, $year]);
    $production = (int)$count->fetchColumn();
    [$previousQuarter, $previousYear] = previous_quarter($quarter, $year);
    $count->execute([$userId, ...quarter_months($previousQuarter), $previousYear]);
    $previous = (int)$count->fetchColumn();
    $percentage = $target > 0 ? $production / $target * 100 : 0;
    $variation = $previous > 0 ? ($production - $previous) / $previous * 100 : 0;
    return ['userId' => $userId, 'trimestre' => $quarter, 'meses' => $months, 'ano' => $year, 'meta' => $target, 'producao' => $production, 'percentual' => round($percentage, 1), 'status' => $percentage >= 100 ? 'superou' : ($percentage >= 80 ? 'atingiu' : 'abaixo'), 'producaoAnterior' => $previous, 'variacao' => round($variation, 1)];
}

function team_quarter_report(string $quarter, int $year): array
{
    $quarter = normalize_quarter($quarter);
    $months = quarter_months($quarter);
    $goal = quarterly_goal($quarter, $year);
    $count = quarter_count_statement();
    $count->execute([...$months, $year]);
    $production = (int)$count->fetchColumn();
    $target = (int)($goal['meta_total'] ?? 0);
    $users = (int)db()->query("SELECT COUNT(*) FROM users WHERE ativo=1 AND role<>'admin'")->fetchColumn();
    $group = static function (string $column, string $label) use ($months, $year): array {
        $stmt = db()->prepare("SELECT $column $label,COUNT(*) quantidade FROM escrituras WHERE mes IN (?,?,?) AND ano=? AND archived_at IS NULL GROUP BY $column ORDER BY quantidade DESC");
        $stmt->execute([...$months, $year]);
        return $stmt->fetchAll();
    };
    [$previousQuarter, $previousYear] = previous_quarter($quarter, $year);
    $count->execute([...quarter_months($previousQuarter), $previousYear]);
    $previous = (int)$count->fetchColumn();
    $percentage = $target > 0 ? $production / $target * 100 : 0;
    return ['trimestre' => $quarter, 'meses' => $months, 'ano' => $year, 'meta' => $target, 'producao' => $production, 'percentual' => round($percentage, 1), 'status' => $percentage >= 100 ? 'superou' : ($percentage >= 80 ? 'atingiu' : 'abaixo'), 'mediaPorPessoa' => round($users > 0 ? $production / $users : 0, 1), 'distribuicaoPorTipo' => $group('tipo', 'tipo'), 'distribuicaoPorEscrevente' => $group('escrevente', 'escrevente'), 'producaoAnterior' => $previous, 'variacao' => round($previous > 0 ? ($production - $previous) / $previous * 100 : 0, 1)];
}

function quarter_ranking(string $quarter, int $year): array
{
    $quarter = normalize_quarter($quarter);
    $months = quarter_months($quarter);
    $stmt = db()->prepare("SELECT u.id,u.nome,u.username,COUNT(e.id) producao,mi.meta_quantidade meta FROM users u LEFT JOIN escrituras e ON (e.created_by=u.id OR (e.created_by IS NULL AND LOWER(TRIM(e.escrevente))=LOWER(TRIM(u.nome)))) AND e.mes IN (?,?,?) AND e.ano=? AND e.archived_at IS NULL LEFT JOIN metas_mensais mm ON mm.mes=? AND mm.ano=? LEFT JOIN metas_individuais mi ON mi.user_id=u.id AND mi.meta_mensal_id=mm.id WHERE u.ativo=1 AND u.role<>'admin' GROUP BY u.id,u.nome,u.username,mi.meta_quantidade ORDER BY producao DESC,u.nome");
    $stmt->execute([...$months, $year, $quarter, $year]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) $row['percentual'] = ($row['meta'] ?? 0) > 0 ? round($row['producao'] / $row['meta'] * 100, 1) : 0;
    return $rows;
}

function quarter_projection(string $quarter, int $year): ?array
{
    $quarter = normalize_quarter($quarter);
    $number = (int)substr($quarter, 1);
    if ($number !== (int)ceil((int)date('n') / 3) || $year !== (int)date('Y')) return null;
    $start = new DateTimeImmutable(sprintf('%04d-%02d-01', $year, ($number - 1) * 3 + 1));
    $end = $start->modify('+3 months -1 day');
    $today = new DateTimeImmutable('today');
    $elapsed = (int)$start->diff($today)->days + 1;
    $totalDays = (int)$start->diff($end)->days + 1;
    $count = quarter_count_statement();
    $count->execute([...quarter_months($quarter), $year]);
    $production = (int)$count->fetchColumn();
    return ['trimestre' => $quarter, 'diasDecorridos' => $elapsed, 'diasNoTrimestre' => $totalDays, 'producaoAtual' => $production, 'projecaoFimTrimestre' => $elapsed > 0 ? (int)round($production / $elapsed * $totalDays) : 0];
}

function handle_goals(string $method, array $parts): never
{
    require_role('visualizador');
    if ($method === 'POST' && count($parts) === 1) {
        require_role('admin');
        $data = body();
        $quarter = normalize_quarter((string)($data['trimestre'] ?? $data['mes'] ?? ''));
        $year = (int)($data['ano'] ?? 0);
        $total = (int)($data['metaTotal'] ?? 0);
        if (!$year || $total <= 0) fail('Trimestre, ano e meta total sao obrigatorios');
        with_transaction(function (PDO $pdo) use ($quarter, $year, $total, $data): void {
            $stmt = $pdo->prepare('SELECT id FROM metas_mensais WHERE mes=? AND ano=? FOR UPDATE');
            $stmt->execute([$quarter, $year]);
            $id = $stmt->fetchColumn();
            if ($id) {
                $pdo->prepare('UPDATE metas_mensais SET meta_total=? WHERE id=?')->execute([$total, $id]);
                $pdo->prepare('DELETE FROM metas_individuais WHERE meta_mensal_id=?')->execute([$id]);
            } else {
                $pdo->prepare('INSERT INTO metas_mensais(mes,ano,meta_total)VALUES(?,?,?)')->execute([$quarter, $year, $total]);
                $id = $pdo->lastInsertId();
            }
            $insert = $pdo->prepare('INSERT INTO metas_individuais(meta_mensal_id,user_id,meta_quantidade)VALUES(?,?,?)');
            foreach (($data['metasIndividuais'] ?? []) as $item) $insert->execute([$id, $item['userId'], $item['quantidade']]);
        });
        audit('SET_QUARTER_GOAL', 'metas_mensais', null, null, ['trimestre' => $quarter, 'ano' => $year, 'metaTotal' => $total]);
        json_response(quarterly_goal($quarter, $year));
    }
    if ($method === 'GET' && ($parts[1] ?? null) === 'relatorio' && ($parts[2] ?? null) === 'individual') json_response(individual_quarter_report((int)$parts[3], (string)$parts[4], (int)$parts[5]));
    if ($method === 'GET' && ($parts[1] ?? null) === 'relatorio' && ($parts[2] ?? null) === 'equipe') json_response(team_quarter_report((string)$parts[3], (int)$parts[4]));
    if ($method === 'GET' && ($parts[1] ?? null) === 'ranking') json_response(quarter_ranking((string)$parts[2], (int)$parts[3]));
    if ($method === 'GET' && ($parts[1] ?? null) === 'projecao') json_response(quarter_projection((string)$parts[2], (int)$parts[3]));
    if ($method === 'GET' && isset($parts[1], $parts[2])) {
        $goal = quarterly_goal((string)$parts[1], (int)$parts[2]);
        if (!$goal) fail('Meta trimestral nao encontrada', 404);
        json_response($goal);
    }
    fail('Rota nao encontrada', 404);
}
