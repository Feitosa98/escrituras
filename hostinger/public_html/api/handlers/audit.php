<?php
declare(strict_types=1);

function parse_audit(array $row): array
{
    foreach (['dados_anteriores','dados_novos'] as $field) if (isset($row[$field]) && is_string($row[$field])) $row[$field]=json_decode($row[$field],true);
    return $row;
}

function handle_audit(string $method,array $parts): never
{
    require_role('admin');if($method!=='GET')fail('Rota nao encontrada',404);$id=$parts[1]??null;
    if($id!==null){$stmt=db()->prepare('SELECT * FROM audit_logs WHERE id=?');$stmt->execute([$id]);$row=$stmt->fetch();if(!$row)fail('Log nao encontrado',404);json_response(parse_audit($row));}
    $sql='SELECT al.*,u.nome usuario_nome,u.email usuario_email FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id WHERE 1=1';$params=[];
    foreach(['user_id'=>'al.user_id','acao'=>'al.acao','tabela'=>'al.tabela']as$key=>$column){if(query($key)!==null&&query($key)!==''){$sql.=" AND $column=?";$params[]=query($key);}}
    if(query('dataInicio')){$sql.=' AND al.created_at>=?';$params[]=query('dataInicio');}if(query('dataFim')){$sql.=' AND al.created_at<=?';$params[]=query('dataFim');}$sql.=' ORDER BY al.created_at DESC LIMIT 1000';$stmt=db()->prepare($sql);$stmt->execute($params);json_response(array_map('parse_audit',$stmt->fetchAll()));
}

