CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY, uuid TEXT UNIQUE, nome TEXT NOT NULL, username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL, senha_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'escrevente',
  ativo INTEGER NOT NULL DEFAULT 1, access_start TEXT NOT NULL DEFAULT '07:50', access_end TEXT NOT NULL DEFAULT '18:30',
  public_key TEXT, private_key_encrypted TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS escrituras (
  id BIGSERIAL PRIMARY KEY, uuid TEXT UNIQUE, tipo TEXT NOT NULL, selagem DATE, livro TEXT NOT NULL, folha TEXT NOT NULL,
  outorgante TEXT NOT NULL, outorgado TEXT, email_cliente TEXT, escrevente TEXT NOT NULL, tipo_livro TEXT NOT NULL,
  mes TEXT NOT NULL, ano TEXT NOT NULL, observacao TEXT, protocolo TEXT UNIQUE, senha_cliente TEXT,
  acompanhamento_codigo TEXT UNIQUE, tipo_acompanhamento TEXT, gera_acompanhamento INTEGER NOT NULL DEFAULT 1,
  protocolo_data DATE, status TEXT DEFAULT 'Abertura de protocolo', prazo_dias INTEGER DEFAULT 0,
  valor_receita NUMERIC(14,2) DEFAULT 0, integrity_hash TEXT, created_by BIGINT REFERENCES users(id),
  updated_by BIGINT REFERENCES users(id), responsavel_id BIGINT REFERENCES users(id), prazo_data DATE,
  archived_at TIMESTAMPTZ, archived_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(livro, folha)
);
CREATE TABLE IF NOT EXISTS audit_logs (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id), acao TEXT NOT NULL, tabela TEXT, registro_id BIGINT, dados_anteriores TEXT, dados_novos TEXT, ip_address TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tipos_escritura (id BIGSERIAL PRIMARY KEY, nome TEXT UNIQUE NOT NULL, ativo INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS escreventes (id BIGSERIAL PRIMARY KEY, nome TEXT NOT NULL, user_id BIGINT REFERENCES users(id), ativo INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS workflow_history (id BIGSERIAL PRIMARY KEY, escritura_id BIGINT REFERENCES escrituras(id) ON DELETE CASCADE, status_anterior TEXT, status_novo TEXT NOT NULL, observacao TEXT, created_by BIGINT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS agendamentos (id BIGSERIAL PRIMARY KEY, escritura_id BIGINT REFERENCES escrituras(id) ON DELETE CASCADE, user_id BIGINT REFERENCES users(id), titulo TEXT NOT NULL, descricao TEXT, data_agendada TIMESTAMPTZ NOT NULL, concluido INTEGER DEFAULT 0, created_by BIGINT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS checklist_items (id BIGSERIAL PRIMARY KEY, escritura_id BIGINT NOT NULL REFERENCES escrituras(id) ON DELETE CASCADE, titulo TEXT NOT NULL, concluido INTEGER NOT NULL DEFAULT 0, ordem INTEGER NOT NULL DEFAULT 0, concluido_by BIGINT REFERENCES users(id), concluido_at TIMESTAMPTZ, created_by BIGINT REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS metas_mensais (id BIGSERIAL PRIMARY KEY, mes TEXT NOT NULL, ano INTEGER NOT NULL, meta_total INTEGER NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE(mes, ano));
CREATE TABLE IF NOT EXISTS metas_individuais (id BIGSERIAL PRIMARY KEY, meta_mensal_id BIGINT NOT NULL REFERENCES metas_mensais(id) ON DELETE CASCADE, user_id BIGINT NOT NULL REFERENCES users(id), meta_quantidade INTEGER NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE(meta_mensal_id,user_id));
CREATE TABLE IF NOT EXISTS assinaturas_digitais (id BIGSERIAL PRIMARY KEY, escritura_id BIGINT NOT NULL REFERENCES escrituras(id), user_id BIGINT NOT NULL REFERENCES users(id), hash_documento TEXT NOT NULL, assinatura TEXT NOT NULL, algoritmo TEXT DEFAULT 'RSA-SHA256', timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE(escritura_id,user_id));
CREATE INDEX IF NOT EXISTS idx_escrituras_tipo ON escrituras(tipo);
CREATE INDEX IF NOT EXISTS idx_escrituras_ano ON escrituras(ano);
CREATE INDEX IF NOT EXISTS idx_escrituras_acompanhamento ON escrituras(acompanhamento_codigo);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_history_escritura ON workflow_history(escritura_id);
CREATE INDEX IF NOT EXISTS idx_escrituras_responsavel ON escrituras(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_escrituras_prazo ON escrituras(prazo_data);
CREATE INDEX IF NOT EXISTS idx_escrituras_arquivada ON escrituras(archived_at);
CREATE INDEX IF NOT EXISTS idx_checklist_escritura ON checklist_items(escritura_id, ordem);
