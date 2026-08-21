<?php
declare(strict_types=1);

function handle_company(string $method, array $parts): never
{
    $user = require_role('visualizador');
    if ($method !== 'GET') fail('Metodo nao permitido', 405);

    $cnpj = preg_replace('/\D+/', '', (string)($parts[1] ?? '')) ?? '';
    if (strlen($cnpj) !== 14) fail('Informe um CNPJ com 14 digitos');
    enforce_rate_limit('cnpj-lookup-' . (int)$user['id'], 30, 900);

    if (!function_exists('curl_init')) fail('Consulta de CNPJ temporariamente indisponivel', 503);
    $curl = curl_init('https://brasilapi.com.br/api/cnpj/v1/' . rawurlencode($cnpj));
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'User-Agent: Cartorio-Santiago/1.0'],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $payload = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($status === 404) fail('CNPJ nao encontrado', 404);
    if ($payload === false || $curlError !== '' || $status < 200 || $status >= 300) {
        error_log('CNPJ lookup failed: HTTP ' . $status . ' ' . $curlError);
        fail('Nao foi possivel consultar o CNPJ. Preencha os dados manualmente.', 502);
    }

    $data = json_decode((string)$payload, true);
    if (!is_array($data) || empty($data['razao_social'])) fail('Resposta invalida na consulta de CNPJ', 502);

    json_response([
        'cnpj' => preg_replace('/\D+/', '', (string)($data['cnpj'] ?? $cnpj)),
        'razaoSocial' => trim((string)$data['razao_social']),
        'nomeFantasia' => trim((string)($data['nome_fantasia'] ?? '')),
        'situacaoCadastral' => trim((string)($data['descricao_situacao_cadastral'] ?? '')),
        'municipio' => trim((string)($data['municipio'] ?? '')),
        'uf' => trim((string)($data['uf'] ?? '')),
    ], 200, ['Cache-Control' => 'private, max-age=3600']);
}
