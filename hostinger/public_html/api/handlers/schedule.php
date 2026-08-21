<?php
declare(strict_types=1);

function find_schedule(int $id): ?array
{
    $stmt=db()->prepare('SELECT a.*,u.nome responsavel_nome,u.email responsavel_email,e.protocolo escritura_protocolo,e.tipo escritura_tipo,e.outorgante escritura_outorgante FROM agendamentos a LEFT JOIN users u ON u.id=a.user_id LEFT JOIN escrituras e ON e.id=a.escritura_id WHERE a.id=?');$stmt->execute([$id]);return $stmt->fetch()?:null;
}

function handle_schedule(string $method,array $parts): never
{
    $user=require_role('visualizador');$id=$parts[1]??null;
    if($method==='GET'&&$id===null){$sql='SELECT a.*,u.nome responsavel_nome,u.email responsavel_email,e.protocolo escritura_protocolo,e.tipo escritura_tipo,e.outorgante escritura_outorgante FROM agendamentos a LEFT JOIN users u ON u.id=a.user_id LEFT JOIN escrituras e ON e.id=a.escritura_id WHERE 1=1';$params=[];
        foreach(['escritura_id'=>'a.escritura_id','user_id'=>'a.user_id','concluido'=>'a.concluido']as$key=>$column){if(query($key)!==null&&query($key)!==''){$sql.=" AND $column=?";$params[]=query($key);}}
        if(query('data_agendada')){$sql.=' AND a.data_agendada LIKE ?';$params[]=query('data_agendada').'%';}if(query('mes')&&query('ano')){$sql.=' AND DATE_FORMAT(a.data_agendada,"%Y-%m")=?';$params[]=query('ano').'-'.str_pad((string)query('mes'),2,'0',STR_PAD_LEFT);}elseif(query('ano')){$sql.=' AND YEAR(a.data_agendada)=?';$params[]=query('ano');}$sql.=' ORDER BY a.data_agendada,a.concluido,a.id DESC';$stmt=db()->prepare($sql);$stmt->execute($params);json_response($stmt->fetchAll());}
    if($method==='GET'&&ctype_digit((string)$id)){$item=find_schedule((int)$id);if(!$item)fail('Agendamento nao encontrado',404);json_response($item);}
    require_role('editor');
    if($method==='POST'&&$id===null){$data=body();if(empty($data['titulo'])||empty($data['data_agendada']))fail('Titulo e data do agendamento sao obrigatorios');db()->prepare('INSERT INTO agendamentos(escritura_id,user_id,titulo,descricao,data_agendada,created_by)VALUES(?,?,?,?,?,?)')->execute([$data['escritura_id']??null,$data['user_id']??$user['id'],trim($data['titulo']),$data['descricao']??null,$data['data_agendada'],$user['id']]);$newId=(int)db()->lastInsertId();$item=find_schedule($newId);audit('CREATE','agendamentos',$newId,null,$item,$user);json_response($item,201);}
    if($method==='PATCH'&&ctype_digit((string)$id)){$before=find_schedule((int)$id);if(!$before)fail('Agendamento nao encontrado',404);$data=body();db()->prepare('UPDATE agendamentos SET titulo=?,descricao=?,data_agendada=?,concluido=?,user_id=? WHERE id=?')->execute([$data['titulo']??$before['titulo'],$data['descricao']??$before['descricao'],$data['data_agendada']??$before['data_agendada'],array_key_exists('concluido',$data)?(bool_value($data['concluido'])?1:0):$before['concluido'],$data['user_id']??$before['user_id'],$id]);$after=find_schedule((int)$id);audit('UPDATE','agendamentos',$id,$before,$after,$user);json_response($after);}
    if($method==='DELETE'&&ctype_digit((string)$id)){$before=find_schedule((int)$id);if(!$before)fail('Agendamento nao encontrado',404);db()->prepare('DELETE FROM agendamentos WHERE id=?')->execute([$id]);audit('DELETE','agendamentos',$id,$before,null,$user);json_response(null,204);}fail('Rota nao encontrada',404);
}

