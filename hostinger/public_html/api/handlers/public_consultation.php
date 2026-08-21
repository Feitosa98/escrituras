<?php
declare(strict_types=1);

function handle_public_consultation(string $method): never
{
    if($method!=='POST')fail('Rota nao encontrada',404);enforce_rate_limit('public-consultation',20,900);$data=body();$code=strtoupper(trim((string)($data['codigo']??$data['acompanhamento']??$data['protocolo']??'')));$password=strtoupper(trim((string)($data['senha']??'')));
    if(!preg_match('/^(PP|EPTT|EPDV)\d{9}$/',$code)||!preg_match('/^[A-Z2-9]{8,32}$/',$password))fail('Codigo de acompanhamento ou senha invalidos. Verifique os dados e tente novamente.',404);
    $stmt=db()->prepare('SELECT id,protocolo,protocolo_data,acompanhamento_codigo,tipo_acompanhamento,tipo,livro,folha,outorgante,outorgado,escrevente,mes,ano,status,selagem,observacao,created_at,updated_at,senha_cliente FROM escrituras WHERE acompanhamento_codigo=? AND gera_acompanhamento=1');$stmt->execute([$code]);$act=$stmt->fetch();if(!$act||!hash_equals($password,(string)decrypt_secret($act['senha_cliente'])))fail('Codigo de acompanhamento ou senha invalidos. Verifique os dados e tente novamente.',404);unset($act['senha_cliente']);$act['historico']=act_history((int)$act['id']);json_response($act);
}

