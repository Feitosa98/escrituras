<?php
declare(strict_types=1);

function handle_admin(string $method, array $parts): never
{
    require_role('visualizador');
    $resource = $parts[1] ?? null;
    $id = $parts[2] ?? null;
    if ($resource === 'tipos-escritura') {
        if ($method === 'GET' && $id === null) json_response(db()->query('SELECT * FROM tipos_escritura ORDER BY nome')->fetchAll());
        require_role('editor');
        if ($method === 'POST' && $id === null) {
            $name = strtoupper(trim((string)(body()['nome'] ?? ''))); if ($name === '') fail('Nome e obrigatorio');
            try { db()->prepare('INSERT INTO tipos_escritura (nome) VALUES (?)')->execute([$name]); }
            catch (PDOException $error) { if ($error->getCode() === '23000') fail('Tipo ja cadastrado'); throw $error; }
            $newId = (int)db()->lastInsertId(); $stmt = db()->prepare('SELECT * FROM tipos_escritura WHERE id=?'); $stmt->execute([$newId]); $row=$stmt->fetch(); audit('CREATE','tipos_escritura',$newId,null,$row); json_response($row,201);
        }
        if ($method === 'PUT' && ctype_digit((string)$id)) {
            $stmt=db()->prepare('SELECT * FROM tipos_escritura WHERE id=?');$stmt->execute([$id]);$before=$stmt->fetch();if(!$before)fail('Tipo nao encontrado',404);$data=body();
            db()->prepare('UPDATE tipos_escritura SET nome=?,ativo=? WHERE id=?')->execute([strtoupper(trim((string)($data['nome']??$before['nome']))),array_key_exists('ativo',$data)?(bool_value($data['ativo'])?1:0):$before['ativo'],$id]);$stmt->execute([$id]);$after=$stmt->fetch();audit('UPDATE','tipos_escritura',$id,$before,$after);json_response($after);
        }
    }
    if ($resource === 'escreventes') {
        if ($method === 'GET' && $id === null) json_response(db()->query('SELECT e.*,u.nome usuario_vinculado FROM escreventes e LEFT JOIN users u ON u.id=e.user_id ORDER BY e.nome')->fetchAll());
        require_role('admin');
        if ($method === 'POST' && $id === null) {
            $data=body();$name=strtoupper(trim((string)($data['nome']??'')));if($name==='')fail('Nome e obrigatorio');db()->prepare('INSERT INTO escreventes(nome,user_id)VALUES(?,?)')->execute([$name,$data['user_id']??null]);$newId=(int)db()->lastInsertId();$stmt=db()->prepare('SELECT * FROM escreventes WHERE id=?');$stmt->execute([$newId]);$row=$stmt->fetch();audit('CREATE','escreventes',$newId,null,$row);json_response($row,201);
        }
        if ($method === 'PUT' && ctype_digit((string)$id)) {
            $stmt=db()->prepare('SELECT * FROM escreventes WHERE id=?');$stmt->execute([$id]);$before=$stmt->fetch();if(!$before)fail('Escrevente nao encontrado',404);$data=body();db()->prepare('UPDATE escreventes SET nome=?,user_id=?,ativo=? WHERE id=?')->execute([strtoupper(trim((string)($data['nome']??$before['nome']))),array_key_exists('user_id',$data)?($data['user_id']?:null):$before['user_id'],array_key_exists('ativo',$data)?(bool_value($data['ativo'])?1:0):$before['ativo'],$id]);$stmt->execute([$id]);$after=$stmt->fetch();audit('UPDATE','escreventes',$id,$before,$after);json_response($after);
        }
    }
    fail('Rota nao encontrada',404);
}

