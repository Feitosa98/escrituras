<?php
declare(strict_types=1);

return [
    'app_env' => 'production',
    'timezone' => 'America/Manaus',
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'u000000000_escrituras',
        'user' => 'u000000000_app',
        'password' => 'ALTERE_ESTA_SENHA',
        'charset' => 'utf8mb4',
    ],
    // Gere valores diferentes, aleatorios e com pelo menos 32 bytes.
    'jwt_secret' => 'ALTERE_POR_UM_SEGREDO_ALEATORIO_DE_64_CARACTERES',
    'encryption_key' => 'ALTERE_POR_OUTRO_SEGREDO_ALEATORIO_DE_64_CARACTERES',
    'token_ttl_seconds' => 28800,
    'trusted_proxy' => false,
];

