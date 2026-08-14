import React, { useState, useEffect, useCallback } from 'react';
import { Printer, Shield, Copy, CheckCircle2, Clock, AlertCircle, Calendar as CalendarIcon, Plus, User, Circle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { AgendamentoModal } from '../components/agendamentos/AgendamentoModal';

const STATUS_CONFIG = {
  'Aguardando cliente': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: AlertCircle },
  'Em andamento':       { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: Clock },
  'Concluído':          { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2 },
};

export function Detalhes({ escritura, onClose, onEdit }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false);
  const [agendamentoEdit, setAgendamentoEdit] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const escrituraId = escritura?.id;

  const fetchAgendamentosEscritura = useCallback(async () => {
    if (!escrituraId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agendamentos?escritura_id=${escrituraId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgendamentos(data);
      }
    } catch (e) {
      console.error('Erro ao buscar agendamentos da escritura:', e);
    }
  }, [escrituraId]);

  useEffect(() => {
    if (escrituraId) {
      // A função atualiza o estado apenas após a resposta assíncrona da API.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAgendamentosEscritura();
    }
  }, [escrituraId, fetchAgendamentosEscritura]);

  if (!escritura) return null;

  async function toggleConcluido(item) {
    try {
      const token = localStorage.getItem('token');
      const novoEstado = !item.concluido;
      const res = await fetch(`/api/agendamentos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ concluido: novoEstado ? 1 : 0 })
      });
      if (res.ok) {
        const atualizado = await res.json();
        setAgendamentos(prev => prev.map(a => a.id === item.id ? atualizado : a));
      }
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err);
    }
  }

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const statusCfg = STATUS_CONFIG[escritura.status] || STATUS_CONFIG['Em andamento'];
  const StatusIcon = statusCfg.icon;
  const temAcompanhamento = Boolean(escritura.acompanhamento_codigo && escritura.senha_cliente);

  function handleImprimir() {
    const w = window.open('', '_blank', 'width=800,height=900');
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprovante Notarial — ${escritura.protocolo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            margin: 0; padding: 2rem;
            color: #0f172a; background: #fff;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .border-page {
            border: 3px double #0f172a;
            padding: 2.5rem;
            border-radius: 12px;
            position: relative;
            background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #d4a843;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
          }
          .title {
            font-family: 'Cinzel', serif;
            font-size: 1.75rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 0.25rem 0;
            letter-spacing: 0.08em;
          }
          .subtitle {
            font-size: 0.85rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin: 0;
          }
          .doc-badge {
            display: inline-block;
            background: #0f172a;
            color: #d4a843;
            font-family: 'Cinzel', serif;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.35rem 1rem;
            border-radius: 9999px;
            margin-top: 1rem;
            letter-spacing: 0.12em;
          }
          .cred-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin: 2rem 0;
          }
          .cred-item {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.25rem;
            text-align: center;
          }
          .cred-item.highlight {
            background: #eff6ff;
            border-color: #3b82f6;
          }
          .cred-label {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748b;
            margin-bottom: 0.5rem;
          }
          .cred-val {
            font-family: monospace;
            font-size: 1.5rem;
            font-weight: 800;
            color: #0f172a;
          }
          .cred-val.prot { color: #1e40af; }
          .cred-val.senha { letter-spacing: 0.3em; }
          .table-info {
            width: 100%;
            border-collapse: collapse;
            margin: 2rem 0;
          }
          .table-info th, .table-info td {
            padding: 0.875rem 1rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          .table-info th {
            width: 35%;
            font-size: 0.8rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            background: #f8fafc;
          }
          .table-info td {
            font-size: 0.95rem;
            font-weight: 600;
            color: #0f172a;
          }
          .instructions {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 10px;
            padding: 1.25rem;
            margin: 2rem 0;
            font-size: 0.85rem;
            color: #92400e;
          }
          .instructions strong { color: #78350f; }
          .footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 0.75rem;
            color: #64748b;
          }
          .sign-box {
            text-align: center;
            width: 240px;
          }
          .sign-line {
            border-bottom: 1px solid #0f172a;
            margin-bottom: 0.5rem;
            height: 40px;
          }
        </style>
      </head>
      <body>
        <div class="border-page">
          <div class="header">
            <h1 class="title">🏛️ CARTÓRIO SANTIAGO</h1>
            <p class="subtitle">1º Tabelionato de Notas — Manacapuru / AM</p>
            <div class="doc-badge">${temAcompanhamento ? 'COMPROVANTE DE ACOMPANHAMENTO' : 'REGISTRO DO ATO NOTARIAL'}</div>
          </div>

          <div class="cred-box">
            <div class="cred-item highlight">
              <div class="cred-label">${temAcompanhamento ? 'Código de Acompanhamento' : 'Número de Protocolo'}</div>
              <div class="cred-val prot">${temAcompanhamento ? escritura.acompanhamento_codigo : escritura.protocolo || 'N/A'}</div>
            </div>
            <div class="cred-item">
              <div class="cred-label">${temAcompanhamento ? 'Senha de Acesso' : 'Data do Protocolo'}</div>
              <div class="cred-val ${temAcompanhamento ? 'senha' : ''}">${temAcompanhamento ? escritura.senha_cliente : formatarData(escritura.protocolo_data || escritura.created_at)}</div>
            </div>
          </div>

          <table class="table-info">
            <tr>
              <th>Ato Notarial</th>
              <td>${escritura.tipo || '—'}</td>
            </tr>
            <tr>
              <th>Outorgante / Parte</th>
              <td>${escritura.outorgante || '—'}</td>
            </tr>
            <tr>
              <th>Outorgado</th>
              <td>${escritura.outorgado || '—'}</td>
            </tr>
            <tr>
              <th>Livro & Folha</th>
              <td>Livro ${escritura.livro || '—'} &nbsp;|&nbsp; Folha ${escritura.folha || '—'} (${escritura.tipoLivro || escritura.tipo_livro || 'Notas'})</td>
            </tr>
            <tr>
              <th>Escrevente Responsável</th>
              <td>${escritura.escrevente || '—'}</td>
            </tr>
            <tr>
              <th>Status Atual</th>
              <td>${escritura.status || 'Em andamento'}</td>
            </tr>
            <tr>
              <th>Registro feito por</th>
              <td>${escritura.usuario_fez || '—'}</td>
            </tr>
            <tr>
              <th>Assinado por</th>
              <td>${escritura.usuario_assinou || 'Ainda não assinado'}</td>
            </tr>
          </table>

          ${temAcompanhamento ? `<div class="instructions">
            <strong>Como acompanhar o ato:</strong><br>
            Acesse o portal e informe o <strong>Código de Acompanhamento</strong> e a <strong>Senha de Acesso</strong>.
            Guarde este documento com segurança.
          </div>` : ''}

          <div class="footer">
            <div>
              <strong>Cartório Santiago — 1º Tabelionato de Notas</strong><br>
              Manacapuru / AM • Atendimento de Seg. a Sex.<br>
              Emitido em: ${new Date().toLocaleString('pt-BR')}
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <span>Rubrica do Escrevente</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 250);
  }

  function copiarProtocolo() {
    if (escritura.acompanhamento_codigo) {
      navigator.clipboard.writeText(escritura.acompanhamento_codigo).catch(() => {});
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Detalhes da Escritura
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            Visualização completa do ato notarial
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          {escritura.protocolo && (
            <button
              onClick={handleImprimir}
              title="Imprimir comprovante para o cliente"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                border: '1.5px solid #3b82f6',
                background: 'rgba(59,130,246,0.08)', color: '#2563eb',
                fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
            >
              <Printer size={15} />
              Imprimir Comprovante
            </button>
          )}
          <Button variant="primary" onClick={() => { setAgendamentoEdit(null); setModalAgendamentoOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'linear-gradient(135deg, #d4a843, #b8860b)', border: 'none', color: 'white' }}>
            <Plus size={16} />
            Agendar Ação
          </Button>
          <Button variant="primary" onClick={() => onEdit && onEdit(escritura)}>
            Editar
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Voltar
          </Button>
        </div>
      </div>

      {/* Protocolo — destaque para o escrevente */}
      {temAcompanhamento && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '2px solid #bfdbfe',
            borderRadius: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '2.75rem', height: '2.75rem', borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', flexShrink: 0,
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                Código de Acompanhamento
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 800, color: '#1e40af', letterSpacing: '0.05em' }}>
                  {escritura.acompanhamento_codigo}
                </span>
                <button
                  onClick={copiarProtocolo}
                  title="Copiar código de acompanhamento"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', padding: '0.2rem',
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
              Senha de Acesso
            </p>
            <span
              style={{
                display: 'inline-block',
                fontFamily: 'monospace', fontSize: '1.125rem', fontWeight: 800,
                letterSpacing: '0.25em', color: '#0f172a',
                background: 'white', border: '1.5px dashed #cbd5e1',
                padding: '0.25rem 0.875rem', borderRadius: '0.5rem',
              }}
            >
              {escritura.senha_cliente}
            </span>
            <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Entregar ao cliente com o comprovante
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.75rem', marginBottom: '1.25rem',
        }}
      >
        {[
          ['Protocolo', escritura.protocolo || '—'],
          ['Data', formatarData(escritura.protocolo_data || escritura.created_at)],
          ['Registro feito por', escritura.usuario_fez || '—'],
          ['Assinado por', escritura.usuario_assinou || 'Ainda não assinado'],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.625rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ marginTop: '0.2rem', fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
          borderRadius: '0.75rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}
      >
        <StatusIcon size={20} style={{ color: statusCfg.color, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status Atual
          </p>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: statusCfg.color, marginTop: '0.1rem' }}>
            {escritura.status || 'Em andamento'}
          </p>
        </div>
      </div>

      {/* Data grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card title="Informações Principais">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label className="label">Tipo de Escritura</label>
              <Badge variant="primary" style={{ marginTop: '0.25rem' }}>{escritura.tipo}</Badge>
            </div>
            <div>
              <label className="label">Data de Selagem</label>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatarData(escritura.selagem)}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Livro</label>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem' }}>{escritura.livro}</p>
              </div>
              <div>
                <label className="label">Folha</label>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem' }}>{escritura.folha}</p>
              </div>
            </div>
            <div>
              <label className="label">Tipo de Livro</label>
              <Badge variant="success" style={{ marginTop: '0.25rem' }}>
                {escritura.tipoLivro || escritura.tipo_livro}
              </Badge>
            </div>
          </div>
        </Card>

        <Card title="Partes Envolvidas">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label className="label">Outorgante</label>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>{escritura.outorgante}</p>
            </div>
            <div>
              <label className="label">Outorgado</label>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{escritura.outorgado || '—'}</p>
            </div>
            <div>
              <label className="label">Escrevente Responsável</label>
              <Badge variant="warning" style={{ marginTop: '0.25rem' }}>{escritura.escrevente}</Badge>
            </div>
          </div>
        </Card>

        <Card title="Período">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Mês</label>
              <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.5rem' }}>{escritura.mes}</p>
            </div>
            <div>
              <label className="label">Ano</label>
              <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.5rem' }}>{escritura.ano}</p>
            </div>
          </div>
        </Card>

        <Card title="Observações">
          {escritura.observacao ? (
            <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {escritura.observacao}
            </p>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Nenhuma observação registrada
            </p>
          )}
        </Card>

        {/* Seção de Ações e Tarefas Agendadas desta Escritura */}
        <Card style={{ gridColumn: '1 / -1', padding: '1.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <CalendarIcon size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Ações & Tarefas Agendadas
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
                  Acompanhe pendências e retornos programados para esta escritura
                </p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => { setAgendamentoEdit(null); setModalAgendamentoOpen(true); }}>
              + Nova Tarefa
            </Button>
          </div>

          {agendamentos.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              Nenhuma ação agendada para esta escritura no momento.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {agendamentos.map(a => (
                <div
                  key={a.id}
                  onClick={() => { setAgendamentoEdit(a); setModalAgendamentoOpen(true); }}
                  style={{
                    padding: '0.875rem',
                    background: a.concluido ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    border: a.concluido ? '1px solid var(--border-color)' : '1px solid #fde68a',
                    borderLeft: a.concluido ? '4px solid #10b981' : '4px solid #d97706',
                    borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.15s',
                    opacity: a.concluido ? 0.75 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleConcluido(a); }}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: a.concluido ? '#10b981' : '#94a3b8', marginTop: '2px' }}
                    >
                      {a.concluido ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: a.concluido ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: a.concluido ? 'line-through' : 'none' }}>
                        {a.titulo}
                      </div>
                      {a.descricao && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                          {a.descricao}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        <span>📅 {formatarData(a.data_agendada)}</span>
                        <span>👤 {a.responsavel_nome || 'Geral'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <AgendamentoModal
        isOpen={modalAgendamentoOpen}
        onClose={() => setModalAgendamentoOpen(false)}
        onSave={() => fetchAgendamentosEscritura()}
        escritura={escritura}
        agendamento={agendamentoEdit}
        currentUser={currentUser}
      />
    </div>
  );
}

export default Detalhes;
