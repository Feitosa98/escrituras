<?php
declare(strict_types=1);

function tracking_prefix(array $data): string
{
    $explicit = strtoupper(trim((string)($data['tipoAcompanhamento'] ?? $data['tipo_acompanhamento'] ?? '')));
    if (in_array($explicit, ['PP', 'EPTT', 'EPDV'], true)) return $explicit;
    return str_contains(strtolower((string)($data['tipo'] ?? '')), 'procura') ? 'PP' : 'EPTT';
}

function next_tracking_code(PDO $pdo, string $prefix): string
{
    $base = $prefix . date('Ym');
    $pdo->prepare('INSERT IGNORE INTO tracking_sequences (prefix_month,sequence_value) VALUES (?, -1)')->execute([$base]);
    $stmt = $pdo->prepare('SELECT sequence_value FROM tracking_sequences WHERE prefix_month=? FOR UPDATE');
    $stmt->execute([$base]);
    $next = (int)$stmt->fetchColumn() + 1;
    $pdo->prepare('UPDATE tracking_sequences SET sequence_value=? WHERE prefix_month=?')->execute([$next, $base]);
    return $base . str_pad((string)$next, 3, '0', STR_PAD_LEFT);
}

function generate_tracking_password(): string
{
    $letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    $numbers = '23456789';
    $password = '';
    for ($i = 0; $i < 4; $i++) $password .= $letters[random_int(0, strlen($letters) - 1)];
    for ($i = 0; $i < 4; $i++) $password .= $numbers[random_int(0, strlen($numbers) - 1)];
    return $password;
}

function act_integrity_hash(array $data): string
{
    $keys = ['tipo', 'selagem', 'livro', 'folha', 'protocolo', 'outorgante', 'cpfCnpjOutorgante', 'cpf_cnpj_outorgante', 'outorgado', 'cpfCnpjOutorgado', 'cpf_cnpj_outorgado', 'escrevente', 'tipoLivro', 'tipo_livro', 'mes', 'ano'];
    $values = [];
    foreach ($keys as $key) if (array_key_exists($key, $data)) $values[$key] = $data[$key];
    ksort($values);
    return hash('sha256', json_encode($values, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE));
}

function normalize_party_document(mixed $value, string $label): ?string
{
    $digits = preg_replace('/\D+/', '', trim((string)$value));
    if ($digits === '') return null;
    if (!in_array(strlen($digits), [11, 14], true)) fail("$label deve possuir 11 digitos para CPF ou 14 para CNPJ");
    return $digits;
}

function act_filter_query(array $filters, bool $count = false): array
{
    $select = $count ? 'COUNT(*) total' : 'e.*, responsible.nome responsavel_nome';
    $sql = "SELECT $select FROM escrituras e" . ($count ? '' : ' LEFT JOIN users responsible ON responsible.id=e.responsavel_id') . ' WHERE 1=1';
    $params = [];
    if (($filters['arquivadas'] ?? null) === 'somente') $sql .= ' AND e.archived_at IS NOT NULL';
    elseif (($filters['arquivadas'] ?? null) !== 'todas') $sql .= ' AND e.archived_at IS NULL';
    $simple = ['tipo' => 'e.tipo', 'escrevente' => 'e.escrevente', 'ano' => 'e.ano', 'livro' => 'e.livro'];
    foreach ($simple as $key => $column) {
        if (($filters[$key] ?? '') !== '') { $sql .= " AND $column=?"; $params[] = $filters[$key]; }
    }
    if (($filters['dataInicio'] ?? '') !== '') { $sql .= ' AND e.selagem>=?'; $params[] = $filters['dataInicio']; }
    if (($filters['dataFim'] ?? '') !== '') { $sql .= ' AND e.selagem<=?'; $params[] = $filters['dataFim']; }
    if (($filters['busca'] ?? '') !== '') {
        $sql .= ' AND (e.tipo LIKE ? OR e.outorgante LIKE ? OR e.outorgado LIKE ? OR e.livro LIKE ? OR e.folha LIKE ? OR e.protocolo LIKE ?';
        $term = '%' . $filters['busca'] . '%';
        array_push($params, $term, $term, $term, $term, $term, $term);
        $documentDigits = preg_replace('/\D+/', '', $filters['busca']);
        if ($documentDigits !== '') {
            $sql .= ' OR e.cpf_cnpj_outorgante LIKE ? OR e.cpf_cnpj_outorgado LIKE ?';
            $documentTerm = '%' . $documentDigits . '%';
            array_push($params, $documentTerm, $documentTerm);
        }
        $sql .= ')';
    }
    if (!$count) {
        $sql .= ' ORDER BY e.created_at DESC';
        if (isset($filters['limit'])) {
            $sql .= ' LIMIT ' . (int)$filters['limit'] . ' OFFSET ' . (int)($filters['offset'] ?? 0);
        }
    }
    return [$sql, $params];
}

function list_acts(array $filters): array
{
    [$sql, $params] = act_filter_query($filters);
    $stmt = db()->prepare($sql); $stmt->execute($params);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) unset($row['senha_cliente']);
    return $rows;
}

function act_history(int $actId): array
{
    $stmt = db()->prepare('SELECT wh.status_anterior,wh.status_novo,wh.observacao,wh.created_at,u.nome atualizado_por FROM workflow_history wh LEFT JOIN users u ON u.id=wh.created_by WHERE wh.escritura_id=? ORDER BY wh.created_at DESC');
    $stmt->execute([$actId]);
    return $stmt->fetchAll();
}

function act_checklist(int $actId): array
{
    $stmt = db()->prepare('SELECT c.*,u.nome concluido_por FROM checklist_items c LEFT JOIN users u ON u.id=c.concluido_by WHERE c.escritura_id=? ORDER BY c.ordem,c.id');
    $stmt->execute([$actId]);
    return $stmt->fetchAll();
}

function create_act(array $data, array $user): array
{
    foreach (['tipo', 'livro', 'folha', 'outorgante', 'escrevente', 'mes', 'ano'] as $field) {
        if (trim((string)($data[$field] ?? '')) === '') fail("Campo obrigatorio: $field");
    }
    $typeBook = trim((string)($data['tipoLivro'] ?? $data['tipo_livro'] ?? ''));
    if ($typeBook === '') fail('Campo obrigatorio: tipoLivro');
    $email = trim((string)($data['emailCliente'] ?? $data['email_cliente'] ?? ''));
    $grantorDocument = normalize_party_document($data['cpfCnpjOutorgante'] ?? $data['cpf_cnpj_outorgante'] ?? '', 'CPF/CNPJ do outorgante');
    $granteeDocument = normalize_party_document($data['cpfCnpjOutorgado'] ?? $data['cpf_cnpj_outorgado'] ?? '', 'CPF/CNPJ do outorgado');
    $requestedProtocol = trim((string)($data['protocolo'] ?? ''));
    if (strlen($requestedProtocol) > 40) fail('O protocolo deve possuir no maximo 40 caracteres');
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Informe um e-mail valido para o cliente');
    $prefix = tracking_prefix($data);
    $generate = $prefix === 'PP' ? bool_value($data['geraAcompanhamento'] ?? $data['gera_acompanhamento'] ?? false) : true;
    if ($generate && $email === '') fail('Informe o e-mail do requerente para gerar o acompanhamento');
    $duplicate = db()->prepare('SELECT id FROM escrituras WHERE livro=? AND folha=?');
    $duplicate->execute([$data['livro'], $data['folha']]);
    if ($duplicate->fetch()) fail('Ja existe uma escritura com este Livro e Folha');
    if ($requestedProtocol !== '') {
        $protocolDuplicate = db()->prepare('SELECT id FROM escrituras WHERE protocolo=?');
        $protocolDuplicate->execute([$requestedProtocol]);
        if ($protocolDuplicate->fetch()) fail('Ja existe uma escritura com este protocolo');
    }

    return with_transaction(function (PDO $pdo) use ($data, $user, $typeBook, $email, $prefix, $generate, $grantorDocument, $granteeDocument, $requestedProtocol): array {
        $trackingPassword = $generate ? generate_tracking_password() : null;
        $trackingCode = $generate ? next_tracking_code($pdo, $prefix) : null;
        $status = trim((string)($data['status'] ?? 'Abertura de protocolo'));
        $stmt = $pdo->prepare('INSERT INTO escrituras (uuid,tipo,selagem,livro,folha,outorgante,cpf_cnpj_outorgante,outorgado,cpf_cnpj_outorgado,email_cliente,escrevente,tipo_livro,mes,ano,observacao,senha_cliente,acompanhamento_codigo,tipo_acompanhamento,gera_acompanhamento,protocolo_data,status,prazo_dias,valor_receita,integrity_hash,created_by,responsavel_id,prazo_data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE(),?,?,?,?,?,?,?)');
        $stmt->execute([
            uuid_v4(), trim((string)$data['tipo']), $data['selagem'] ?: null, trim((string)$data['livro']), trim((string)$data['folha']),
            trim((string)$data['outorgante']), $grantorDocument, trim((string)($data['outorgado'] ?? '')) ?: null, $granteeDocument, $email ?: null,
            trim((string)$data['escrevente']), $typeBook, str_pad((string)$data['mes'], 2, '0', STR_PAD_LEFT), (string)$data['ano'],
            trim((string)($data['observacao'] ?? '')) ?: null, encrypt_secret($trackingPassword), $trackingCode, $prefix, $generate ? 1 : 0,
            $status, (int)($data['prazo_dias'] ?? 0), (float)($data['valor_receita'] ?? 0), act_integrity_hash($data),
            (int)$user['id'], (int)($data['responsavelId'] ?? $data['responsavel_id'] ?? $user['id']),
            ($data['prazoData'] ?? $data['prazo_data'] ?? null) ?: null,
        ]);
        $id = (int)$pdo->lastInsertId();
        $protocol = $requestedProtocol !== '' ? $requestedProtocol : sprintf('PROT-%s-%05d', $data['ano'], $id);
        $pdo->prepare('UPDATE escrituras SET protocolo=? WHERE id=?')->execute([$protocol, $id]);
        if ($status !== 'Concluido' && $status !== 'Concluído') ensure_default_checklist($id, (int)$user['id']);
        $act = find_act($id, true);
        audit('CREATE', 'escrituras', $id, null, $act, $user);
        return $act;
    });
}

function update_act(int $id, array $data, array $user): array
{
    $before = find_act($id);
    if (!$before) fail('Escritura nao encontrada', 404);
    $email = trim((string)($data['emailCliente'] ?? $data['email_cliente'] ?? $before['email_cliente'] ?? ''));
    $grantorDocument = normalize_party_document($data['cpfCnpjOutorgante'] ?? $data['cpf_cnpj_outorgante'] ?? $before['cpf_cnpj_outorgante'] ?? '', 'CPF/CNPJ do outorgante');
    $granteeDocument = normalize_party_document($data['cpfCnpjOutorgado'] ?? $data['cpf_cnpj_outorgado'] ?? $before['cpf_cnpj_outorgado'] ?? '', 'CPF/CNPJ do outorgado');
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Informe um e-mail valido para o cliente');
    $book = (string)($data['livro'] ?? $before['livro']);
    $sheet = (string)($data['folha'] ?? $before['folha']);
    $dup = db()->prepare('SELECT id FROM escrituras WHERE livro=? AND folha=? AND id<>?');
    $dup->execute([$book, $sheet, $id]);
    if ($dup->fetch()) fail('Ja existe uma escritura com este Livro e Folha');
    $protocol = trim((string)($data['protocolo'] ?? $before['protocolo'] ?? ''));
    if ($protocol === '') $protocol = (string)($before['protocolo'] ?? '');
    if (strlen($protocol) > 40) fail('O protocolo deve possuir no maximo 40 caracteres');
    if ($protocol !== '') {
        $protocolDuplicate = db()->prepare('SELECT id FROM escrituras WHERE protocolo=? AND id<>?');
        $protocolDuplicate->execute([$protocol, $id]);
        if ($protocolDuplicate->fetch()) fail('Ja existe uma escritura com este protocolo');
    }
    if (array_key_exists('protocolo', $data)) $data['protocolo'] = $protocol;
    $map = [
        'tipo' => 'tipo', 'selagem' => 'selagem', 'livro' => 'livro', 'folha' => 'folha', 'outorgante' => 'outorgante',
        'outorgado' => 'outorgado', 'protocolo' => 'protocolo', 'escrevente' => 'escrevente', 'mes' => 'mes', 'ano' => 'ano', 'observacao' => 'observacao',
        'status' => 'status', 'prazo_dias' => 'prazo_dias', 'valor_receita' => 'valor_receita',
    ];
    $sets = ['email_cliente=?', 'cpf_cnpj_outorgante=?', 'cpf_cnpj_outorgado=?', 'updated_by=?', 'integrity_hash=?'];
    $values = [$email ?: null, $grantorDocument, $granteeDocument, $user['id'], act_integrity_hash(array_merge($before, $data))];
    if (array_key_exists('tipoLivro', $data) || array_key_exists('tipo_livro', $data)) {
        $sets[] = 'tipo_livro=?'; $values[] = $data['tipoLivro'] ?? $data['tipo_livro'];
    }
    foreach ($map as $input => $column) {
        if (!array_key_exists($input, $data)) continue;
        $sets[] = "$column=?"; $values[] = $data[$input] === '' ? null : $data[$input];
    }
    $values[] = $id;
    db()->prepare('UPDATE escrituras SET ' . implode(',', $sets) . ' WHERE id=?')->execute($values);
    $updated = find_act($id);
    audit('UPDATE', 'escrituras', $id, $before, $updated, $user);
    return $updated;
}

function my_work(array $user): array
{
    $today = date('Y-m-d');
    $stmt = db()->prepare("SELECT e.*,responsible.nome responsavel_nome,(SELECT COUNT(*) FROM checklist_items c WHERE c.escritura_id=e.id) checklist_total,(SELECT COUNT(*) FROM checklist_items c WHERE c.escritura_id=e.id AND c.concluido=1) checklist_concluido FROM escrituras e LEFT JOIN users responsible ON responsible.id=e.responsavel_id WHERE e.archived_at IS NULL AND e.status<>'Concluido' AND e.status<>'Concluído' AND (e.responsavel_id=? OR (e.responsavel_id IS NULL AND e.escrevente=?)) ORDER BY e.prazo_data IS NULL,e.prazo_data,e.updated_at DESC");
    $stmt->execute([$user['id'], $user['nome']]);
    $acts = $stmt->fetchAll();
    foreach ($acts as &$act) unset($act['senha_cliente']);
    $tasks = db()->prepare('SELECT a.*,e.protocolo,e.tipo,e.outorgante FROM agendamentos a LEFT JOIN escrituras e ON e.id=a.escritura_id WHERE a.user_id=? AND a.concluido=0 AND (e.archived_at IS NULL OR e.id IS NULL) ORDER BY a.data_agendada');
    $tasks->execute([$user['id']]);
    $taskRows = $tasks->fetchAll();
    return [
        'hoje' => $today, 'atos' => $acts, 'tarefas' => $taskRows,
        'resumo' => [
            'atos' => count($acts),
            'atrasados' => count(array_filter($acts, fn($a) => ($a['prazo_data'] ?? '') !== '' && substr($a['prazo_data'], 0, 10) < $today)),
            'vencemHoje' => count(array_filter($acts, fn($a) => substr((string)($a['prazo_data'] ?? ''), 0, 10) === $today)),
            'aguardandoCliente' => count(array_filter($acts, fn($a) => $a['status'] === 'Aguardando cliente')),
            'tarefasHoje' => count(array_filter($taskRows, fn($a) => substr((string)$a['data_agendada'], 0, 10) === $today)),
        ],
    ];
}

function acts_stats(): array
{
    $total = (int)db()->query('SELECT COUNT(*) FROM escrituras WHERE archived_at IS NULL')->fetchColumn();
    $recent = db()->query('SELECT * FROM escrituras WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 10')->fetchAll();
    foreach ($recent as &$item) unset($item['senha_cliente']);
    $group = static function (string $column, string $label): array {
        $rows = db()->query("SELECT $column label,COUNT(*) count FROM escrituras WHERE archived_at IS NULL GROUP BY $column ORDER BY count DESC")->fetchAll();
        return array_column($rows, 'count', 'label');
    };
    $periodRows = db()->query("SELECT CONCAT(mes,'/',ano) label,COUNT(*) count FROM escrituras WHERE archived_at IS NULL GROUP BY ano,mes ORDER BY ano,mes")->fetchAll();
    return ['total' => $total, 'recentes' => $recent, 'porTipo' => $group('tipo', 'tipo'), 'porEscrevente' => $group('escrevente', 'escrevente'), 'porMes' => array_column($periodRows, 'count', 'label')];
}

function handle_acts(string $method, array $parts): never
{
    $user = require_role('visualizador');
    $second = $parts[1] ?? null;
    $third = $parts[2] ?? null;

    if ($method === 'GET' && $second === 'stats' && $third === null) json_response(acts_stats());
    if ($method === 'GET' && $second === 'stats' && $third === 'atividade-hoje') {
        $today = date('Y-m-d');
        $stmt = db()->prepare('SELECT wh.id,wh.status_anterior,wh.status_novo,wh.observacao,wh.created_at,e.tipo,e.livro,e.folha,e.outorgante,e.protocolo,u.nome atualizado_por FROM workflow_history wh JOIN escrituras e ON e.id=wh.escritura_id LEFT JOIN users u ON u.id=wh.created_by WHERE DATE(wh.created_at)=? ORDER BY wh.created_at DESC LIMIT 50');
        $stmt->execute([$today]); $moves = $stmt->fetchAll();
        $createdStmt = db()->prepare('SELECT e.id,e.tipo,e.livro,e.folha,e.outorgante,e.protocolo,e.status,e.created_at,u.nome criado_por FROM escrituras e LEFT JOIN users u ON u.id=e.created_by WHERE DATE(e.created_at)=? ORDER BY e.created_at DESC LIMIT 20');
        $createdStmt->execute([$today]); $created = $createdStmt->fetchAll();
        $byStatus = db()->query('SELECT status,COUNT(*) total FROM escrituras GROUP BY status ORDER BY total DESC')->fetchAll();
        $byUserStmt = db()->prepare('SELECT u.nome,COUNT(*) total FROM workflow_history wh LEFT JOIN users u ON u.id=wh.created_by WHERE DATE(wh.created_at)=? GROUP BY wh.created_by,u.nome ORDER BY total DESC');
        $byUserStmt->execute([$today]);
        json_response(['hoje' => $today, 'movimentos' => $moves, 'criadas' => $created, 'porStatus' => $byStatus, 'porUsuario' => $byUserStmt->fetchAll(), 'totais' => ['movimentos' => count($moves), 'criadas' => count($created)]]);
    }
    if ($method === 'GET' && $second === 'meu-trabalho') json_response(my_work($user));
    if ($method === 'GET' && $second === 'proximo-protocolo') {
        $year = preg_replace('/\D+/', '', (string)query('ano', date('Y'))) ?? '';
        if (strlen($year) !== 4) fail('Ano invalido');
        $stmt = db()->query("SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='escrituras'");
        $nextId = max(1, (int)$stmt->fetchColumn());
        json_response(['protocolo' => sprintf('PROT-%s-%05d', $year, $nextId)], 200, ['Cache-Control' => 'no-store']);
    }
    if ($method === 'GET' && $second === 'notificacoes') {
        $work = my_work($user); $today = $work['hoje']; $items = [];
        foreach ($work['atos'] as $act) {
            $due = substr((string)($act['prazo_data'] ?? ''), 0, 10);
            $description = ($act['protocolo'] ?: $act['tipo']) . ' · ' . $act['outorgante'];
            if ($due && $due < $today) $items[] = ['id' => 'ato-atrasado-' . $act['id'], 'tipo' => 'atraso', 'prioridade' => 3, 'titulo' => 'Prazo vencido', 'descricao' => $description, 'data' => $due, 'escritura_id' => $act['id']];
            elseif ($due === $today) $items[] = ['id' => 'ato-hoje-' . $act['id'], 'tipo' => 'prazo', 'prioridade' => 2, 'titulo' => 'Prazo vence hoje', 'descricao' => $description, 'data' => $due, 'escritura_id' => $act['id']];
            if ($act['status'] === 'Aguardando cliente') $items[] = ['id' => 'ato-cliente-' . $act['id'], 'tipo' => 'cliente', 'prioridade' => 1, 'titulo' => 'Aguardando o cliente', 'descricao' => $description, 'data' => $act['updated_at'], 'escritura_id' => $act['id']];
        }
        foreach ($work['tarefas'] as $task) {
            $date = substr((string)$task['data_agendada'], 0, 10);
            if ($date <= $today) $items[] = ['id' => 'tarefa-' . $task['id'], 'tipo' => $date < $today ? 'atraso' : 'tarefa', 'prioridade' => $date < $today ? 3 : 2, 'titulo' => $date < $today ? 'Tarefa atrasada' : 'Tarefa para hoje', 'descricao' => $task['titulo'], 'data' => $task['data_agendada'], 'escritura_id' => $task['escritura_id']];
        }
        usort($items, fn($a, $b) => $b['prioridade'] <=> $a['prioridade'] ?: strcmp((string)$a['data'], (string)$b['data']));
        json_response(['total' => count($items), 'items' => array_slice($items, 0, 20)]);
    }
    if ($method === 'POST' && $second === 'import') {
        require_role('editor');
        $rows = body()['escrituras'] ?? null;
        if (!is_array($rows) || !$rows) fail('Lista de escrituras invalida ou vazia');
        if (count($rows) > 1000) fail('Importe no maximo 1000 atos por vez');
        $success = 0; $errors = 0;
        foreach ($rows as $row) { try { create_act((array)$row, $user); $success++; } catch (Throwable) { $errors++; } }
        audit('IMPORT', 'escrituras', null, null, ['count' => $success, 'errors' => $errors], $user);
        json_response(['success' => true, 'message' => "$success escrituras importadas com sucesso.", 'details' => ['success' => $success, 'errors' => $errors]]);
    }
    if ($method === 'GET' && $second === null) {
        $filters = ['tipo' => query('tipo'), 'escrevente' => query('escrevente'), 'ano' => query('ano'), 'livro' => query('livro'), 'dataInicio' => query('dataInicio'), 'dataFim' => query('dataFim'), 'busca' => query('busca'), 'arquivadas' => query('arquivadas')];
        if (query('paginar') === 'true') {
            $page = max(1, (int)query('page', 1)); $limit = min(100, max(10, (int)query('limit', 20)));
            [$countSql, $countParams] = act_filter_query($filters, true); $countStmt = db()->prepare($countSql); $countStmt->execute($countParams); $total = (int)$countStmt->fetchColumn();
            $items = list_acts(array_merge($filters, ['limit' => $limit, 'offset' => ($page - 1) * $limit]));
            json_response(['items' => $items, 'total' => $total, 'page' => $page, 'limit' => $limit, 'pages' => max(1, (int)ceil($total / $limit))]);
        }
        json_response(list_acts($filters));
    }
    if ($method === 'POST' && $second === null) { require_role('editor'); json_response(create_act(body(), $user), 201); }

    if ($second === null) fail('Rota nao encontrada', 404);
    $act = find_act($second);
    if (!$act) fail('Escritura nao encontrada', 404);
    $actId = (int)$act['id'];

    if ($method === 'GET' && $third === null) json_response($act);
    if ($method === 'GET' && $third === 'credenciais') {
        require_role('editor'); $full = find_act($second, true);
        audit('VIEW_TRACKING_CREDENTIALS', 'escrituras', $actId, null, ['acompanhamento_codigo' => $full['acompanhamento_codigo'], 'possui_senha' => (bool)$full['senha_cliente']], $user);
        json_response(['acompanhamento_codigo' => $full['acompanhamento_codigo'], 'senha_cliente' => $full['senha_cliente'], 'gera_acompanhamento' => (int)$full['gera_acompanhamento']], 200, ['Cache-Control' => 'no-store']);
    }
    if ($method === 'GET' && $third === 'historico') json_response(act_history($actId));
    if ($method === 'GET' && $third === 'checklist') {
        if (!in_array($act['status'], ['Concluido', 'Concluído'], true)) ensure_default_checklist($actId, (int)$user['id']);
        json_response(act_checklist($actId));
    }
    if ($method === 'PUT' && $third === null) { require_role('editor'); json_response(update_act($actId, body(), $user)); }
    if ($method === 'DELETE' && $third === null) {
        require_role('editor'); db()->prepare('UPDATE escrituras SET archived_at=NOW(),archived_by=? WHERE id=?')->execute([$user['id'], $actId]);
        audit('ARCHIVE', 'escrituras', $actId, $act, ['archived' => true], $user); json_response(['message' => 'Escritura arquivada com sucesso']);
    }
    if ($method === 'PATCH' && $third === 'restaurar') {
        require_role('editor'); db()->prepare('UPDATE escrituras SET archived_at=NULL,archived_by=NULL,updated_by=? WHERE id=?')->execute([$user['id'], $actId]);
        $updated = find_act($actId); audit('RESTORE', 'escrituras', $actId, $act, $updated, $user); json_response($updated);
    }
    if ($method === 'PATCH' && in_array($third, ['status', 'operacao'], true)) {
        require_role('editor'); $data = body(); $status = trim((string)($data['status'] ?? $act['status']));
        $allowedStatuses = ['Abertura de protocolo','Orçamento / Documentação','Minuta / Solicitações','Aguardando cliente','Assinatura','Prenotação','Concluído'];
        if (!in_array($status, $allowedStatuses, true)) fail('Etapa invalida');
        $responsible = $data['responsavel_id'] ?? $act['responsavel_id']; $due = ($data['prazo_data'] ?? $act['prazo_data']) ?: null;
        if ($due && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$due)) fail('Prazo invalido');
        $note = trim((string)($data['observacao'] ?? '')); if (strlen($note) > 500) fail('A observacao deve ter no maximo 500 caracteres');
        if ($responsible) { $check = db()->prepare('SELECT nome FROM users WHERE id=? AND ativo=1'); $check->execute([$responsible]); $responsibleName = $check->fetchColumn(); if (!$responsibleName) fail('Responsavel invalido ou inativo'); }
        else $responsibleName = $act['escrevente'];
        db()->prepare('UPDATE escrituras SET status=?,responsavel_id=?,prazo_data=?,escrevente=?,updated_by=? WHERE id=?')->execute([$status, $responsible ?: null, $due, $responsibleName, $user['id'], $actId]);
        if ($status !== $act['status']) db()->prepare('INSERT INTO workflow_history (escritura_id,status_anterior,status_novo,observacao,created_by) VALUES (?,?,?,?,?)')->execute([$actId, $act['status'], $status, $note ?: null, $user['id']]);
        $updated = find_act($actId); audit($third === 'status' ? 'UPDATE_STATUS' : 'UPDATE_OPERATION', 'escrituras', $actId, $act, $updated, $user); json_response($updated + ['notificacao_email' => ['sent' => false, 'reason' => 'SMTP_NOT_CONFIGURED']]);
    }
    if ($third === 'checklist') {
        require_role('editor'); $itemId = $parts[3] ?? null;
        if ($method === 'POST' && $itemId === null) {
            $title = trim((string)(body()['titulo'] ?? '')); if ($title === '' || strlen($title) > 180) fail('Informe um item de ate 180 caracteres');
            $orderStmt = db()->prepare('SELECT COALESCE(MAX(ordem),0)+1 FROM checklist_items WHERE escritura_id=?'); $orderStmt->execute([$actId]);
            db()->prepare('INSERT INTO checklist_items (escritura_id,titulo,ordem,created_by) VALUES (?,?,?,?)')->execute([$actId, $title, (int)$orderStmt->fetchColumn(), $user['id']]);
            $id = (int)db()->lastInsertId(); $itemStmt = db()->prepare('SELECT * FROM checklist_items WHERE id=?'); $itemStmt->execute([$id]); $item = $itemStmt->fetch(); audit('CHECKLIST_ADD','escrituras',$actId,null,$item,$user); json_response($item, 201);
        }
        if ($itemId && ctype_digit((string)$itemId) && $method === 'PATCH') {
            $done = bool_value(body()['concluido'] ?? false); db()->prepare('UPDATE checklist_items SET concluido=?,concluido_by=?,concluido_at=? WHERE id=? AND escritura_id=?')->execute([$done ? 1 : 0, $done ? $user['id'] : null, $done ? date('Y-m-d H:i:s') : null, $itemId, $actId]);
            $itemStmt = db()->prepare('SELECT * FROM checklist_items WHERE id=? AND escritura_id=?'); $itemStmt->execute([$itemId, $actId]); $item = $itemStmt->fetch(); if (!$item) fail('Item nao encontrado',404); audit('CHECKLIST_UPDATE','escrituras',$actId,null,$item,$user); json_response($item);
        }
        if ($itemId && ctype_digit((string)$itemId) && $method === 'DELETE') {
            db()->prepare('DELETE FROM checklist_items WHERE id=? AND escritura_id=?')->execute([$itemId,$actId]); audit('CHECKLIST_REMOVE','escrituras',$actId,null,['item_id'=>$itemId],$user); json_response(null,204);
        }
    }
    fail('Rota nao encontrada', 404);
}
