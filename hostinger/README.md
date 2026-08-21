# Implantacao na Hostinger Cloud

Esta pasta contem a camada de servidor compativel com a Hospedagem Cloud da
Hostinger. O frontend React continua sendo compilado pelo Vite e a API passa a
ser executada em PHP 8.2+ com MySQL 8/MariaDB.

## Estrutura no servidor

- `public_html/`: arquivos compilados do frontend, `.htaccess` e pasta `api/`.
- `config.php`: arquivo privado, criado na pasta acima de `public_html`.
- MySQL: banco criado pelo hPanel e inicializado com `schema.mysql.sql`.

O arquivo `config.example.php` deve ser copiado para `config.php` fora da pasta
publica. Nunca envie o arquivo real de configuracao ao Git.

## Publicacao segura

1. Crie um site vazio usando um dominio temporario no hPanel.
2. Crie um banco MySQL e um usuario exclusivo para o sistema.
3. Importe `schema.mysql.sql` pelo phpMyAdmin.
4. Gere o frontend com `npm run build:hostinger`.
5. Envie o conteudo de `hostinger/release/public_html` para `public_html`.
6. Envie o `config.php` preenchido para a pasta acima de `public_html`.
7. Valide `/api/health`, login, permissoes, cadastros e consulta publica.
8. Aponte o dominio somente depois da conferencia dos dados.

## Transferencia dos dados

O script `scripts/export-hostinger-snapshot.mjs` cria um arquivo cifrado a
partir do PostgreSQL. O arquivo so pode ser aberto com a chave informada em
`MIGRATION_ARCHIVE_KEY`. No servidor Cloud, `import-snapshot.php` importa os
registros somente se o banco MySQL estiver vazio e cifra novamente as senhas de
acompanhamento com a chave definitiva do sistema.
