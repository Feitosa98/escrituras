SET NAMES utf8mb4;
SET time_zone = '-04:00';

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NULL,
  nome VARCHAR(180) NOT NULL,
  username VARCHAR(100) NULL,
  email VARCHAR(190) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor','visualizador') NOT NULL DEFAULT 'visualizador',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  access_start TIME NOT NULL DEFAULT '07:50:00',
  access_end TIME NOT NULL DEFAULT '18:30:00',
  public_key MEDIUMTEXT NULL,
  private_key_encrypted MEDIUMTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_uuid (uuid),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS escrituras (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NULL,
  tipo VARCHAR(180) NOT NULL,
  selagem DATE NULL,
  livro VARCHAR(80) NOT NULL,
  folha VARCHAR(80) NOT NULL,
  outorgante TEXT NOT NULL,
  cpf_cnpj_outorgante VARCHAR(14) NULL,
  outorgado TEXT NULL,
  cpf_cnpj_outorgado VARCHAR(14) NULL,
  email_cliente VARCHAR(190) NULL,
  escrevente VARCHAR(180) NOT NULL,
  tipo_livro VARCHAR(100) NOT NULL,
  mes CHAR(2) NOT NULL,
  ano CHAR(4) NOT NULL,
  observacao TEXT NULL,
  protocolo VARCHAR(40) NULL,
  senha_cliente TEXT NULL COMMENT 'Valor cifrado AES-256-GCM com prefixo enc:',
  acompanhamento_codigo VARCHAR(40) NULL,
  tipo_acompanhamento ENUM('PP','EPTT','EPDV') NULL,
  gera_acompanhamento TINYINT(1) NOT NULL DEFAULT 1,
  protocolo_data DATE NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Abertura de protocolo',
  prazo_dias INT NOT NULL DEFAULT 0,
  valor_receita DECIMAL(14,2) NOT NULL DEFAULT 0,
  integrity_hash CHAR(64) NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  responsavel_id BIGINT UNSIGNED NULL,
  prazo_data DATE NULL,
  archived_at TIMESTAMP NULL,
  archived_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_escrituras_uuid (uuid),
  UNIQUE KEY uq_escrituras_livro_folha (livro, folha),
  UNIQUE KEY uq_escrituras_protocolo (protocolo),
  UNIQUE KEY uq_escrituras_acompanhamento (acompanhamento_codigo),
  KEY idx_escrituras_tipo (tipo),
  KEY idx_escrituras_ano (ano),
  KEY idx_escrituras_cpf_outorgante (cpf_cnpj_outorgante),
  KEY idx_escrituras_cpf_outorgado (cpf_cnpj_outorgado),
  KEY idx_escrituras_responsavel (responsavel_id),
  KEY idx_escrituras_prazo (prazo_data),
  KEY idx_escrituras_archived (archived_at),
  CONSTRAINT fk_escrituras_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_escrituras_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_escrituras_responsavel FOREIGN KEY (responsavel_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_escrituras_archived_by FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  acao VARCHAR(80) NOT NULL,
  tabela VARCHAR(80) NULL,
  registro_id BIGINT UNSIGNED NULL,
  dados_anteriores JSON NULL,
  dados_novos JSON NULL,
  ip_address VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created (created_at),
  KEY idx_audit_user (user_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tipos_escritura (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(180) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tipos_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS escreventes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(180) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_escreventes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workflow_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  escritura_id BIGINT UNSIGNED NOT NULL,
  status_anterior VARCHAR(100) NULL,
  status_novo VARCHAR(100) NOT NULL,
  observacao VARCHAR(500) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_workflow_escritura (escritura_id),
  CONSTRAINT fk_workflow_escritura FOREIGN KEY (escritura_id) REFERENCES escrituras(id) ON DELETE CASCADE,
  CONSTRAINT fk_workflow_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agendamentos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  escritura_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  titulo VARCHAR(180) NOT NULL,
  descricao TEXT NULL,
  data_agendada DATETIME NOT NULL,
  concluido TINYINT(1) NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_agenda_data (data_agendada),
  CONSTRAINT fk_agenda_escritura FOREIGN KEY (escritura_id) REFERENCES escrituras(id) ON DELETE CASCADE,
  CONSTRAINT fk_agenda_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_agenda_created FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checklist_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  escritura_id BIGINT UNSIGNED NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  concluido TINYINT(1) NOT NULL DEFAULT 0,
  ordem INT NOT NULL DEFAULT 0,
  concluido_by BIGINT UNSIGNED NULL,
  concluido_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_checklist_escritura (escritura_id, ordem),
  CONSTRAINT fk_checklist_escritura FOREIGN KEY (escritura_id) REFERENCES escrituras(id) ON DELETE CASCADE,
  CONSTRAINT fk_checklist_concluido FOREIGN KEY (concluido_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_checklist_created FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metas_mensais (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  mes CHAR(2) NOT NULL,
  ano SMALLINT UNSIGNED NOT NULL,
  meta_total INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_meta_mes_ano (mes, ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metas_individuais (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  meta_mensal_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  meta_quantidade INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_meta_individual (meta_mensal_id, user_id),
  CONSTRAINT fk_meta_ind_mensal FOREIGN KEY (meta_mensal_id) REFERENCES metas_mensais(id) ON DELETE CASCADE,
  CONSTRAINT fk_meta_ind_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assinaturas_digitais (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  escritura_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  hash_documento CHAR(64) NOT NULL,
  assinatura MEDIUMTEXT NOT NULL,
  algoritmo VARCHAR(40) NOT NULL DEFAULT 'RSA-SHA256',
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assinatura_escritura_user (escritura_id, user_id),
  CONSTRAINT fk_assinatura_escritura FOREIGN KEY (escritura_id) REFERENCES escrituras(id) ON DELETE CASCADE,
  CONSTRAINT fk_assinatura_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key CHAR(64) NOT NULL,
  hits INT UNSIGNED NOT NULL DEFAULT 1,
  window_started_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (bucket_key),
  KEY idx_rate_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tracking_sequences (
  prefix_month VARCHAR(20) NOT NULL,
  sequence_value INT NOT NULL DEFAULT -1,
  PRIMARY KEY (prefix_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
