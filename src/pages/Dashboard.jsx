import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, TrendingUp, Users, Calendar,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Clock, CheckCircle2, Plus, ArrowRight,
  Activity,
} from 'lucide-react';
import Loading from '../components/ui/Loading';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { escriturasAPI } from '../services/api';
import api from '../services/api';
import { CalendarioAgendamentos } from '../components/agendamentos/CalendarioAgendamentos';

// Etapas — espelha o que está no Kanban.jsx
const ETAPAS_CFG = {
  'Abertura de protocolo':    { cor: '#6366f1', icon: '📋' },
  'Orçamento / Documentação': { cor: '#f59e0b', icon: '💰' },
  'Minuta / Solicitações':    { cor: '#8b5cf6', icon: '📝' },
  'Assinatura':               { cor: '#0ea5e9', icon: '✍️' },
  'Prenotação':               { cor: '#ec4899', icon: '📌' },
  'Concluído':                { cor: '#10b981', icon: '✅' },
  'Em andamento':             { cor: '#3b82f6', icon: '🔵' },
  'Aguardando cliente':       { cor: '#f59e0b', icon: '⏳' },
};

function getCfg(status) {
  return ETAPAS_CFG[status] || { cor: '#94a3b8', icon: '⬜' };
}

function formatHora(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ── Timeline do dia ───────────────────────────────────────────────────────────
function TimelineHoje({ atividade, loadingAtiv, error, onRefresh }) {
  const total = (atividade?.totais?.movimentos || 0) + (atividade?.totais?.criadas || 0);

  // Mescla movimentos e criadas em ordem cronológica reversa
  const eventos = [
    ...(atividade?.movimentos || []).map(m => ({ ...m, _tipo: 'movimento' })),
    ...(atividade?.criadas || []).map(c => ({ ...c, _tipo: 'criada', created_at: c.created_at })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={17} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Atividade de Hoje
          </h3>
          <span
            style={{
              fontSize: '0.6875rem', fontWeight: 700,
              background: total > 0 ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
              color: total > 0 ? '#3b82f6' : 'var(--text-tertiary)',
              border: `1px solid ${total > 0 ? 'rgba(59,130,246,0.2)' : 'var(--border-color)'}`,
              padding: '0.15rem 0.5rem', borderRadius: '9999px',
            }}
          >
            {total} evento{total !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loadingAtiv}
          aria-label="Atualizar atividades do dia"
          title="Atualizar atividades"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
        >
          <RefreshCw size={13} style={{ animation: loadingAtiv ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Contadores por status */}
      {atividade?.porStatus && atividade.porStatus.length > 0 && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
          }}
        >
          {atividade.porStatus.map(s => {
            const cfg = getCfg(s.status);
            return (
              <div
                key={s.status}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  background: `${cfg.cor}14`,
                  border: `1px solid ${cfg.cor}33`,
                  fontSize: '0.6875rem', fontWeight: 600,
                  color: cfg.cor,
                }}
              >
                <span>{cfg.icon}</span>
                <span>{s.status}</span>
                <span
                  style={{
                    background: cfg.cor, color: 'white',
                    borderRadius: '9999px', minWidth: '1.25rem', height: '1.25rem',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6875rem', fontWeight: 700, padding: '0 0.25rem',
                  }}
                >
                  {s.total}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de eventos */}
      <div style={{ maxHeight: '440px', overflowY: 'auto' }}>
        {loadingAtiv ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loading size="sm" message="Carregando atividades..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Não foi possível carregar as atividades.
            </p>
            <button onClick={onRefresh} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: '#2563eb', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
              Tentar novamente
            </button>
          </div>
        ) : eventos.length === 0 ? (
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '3rem 1.5rem', gap: '0.5rem',
              color: 'var(--text-tertiary)',
            }}
          >
            <Clock size={32} style={{ opacity: 0.25 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nenhuma atividade registrada hoje</p>
            <p style={{ fontSize: '0.75rem', textAlign: 'center' }}>
              As atualizações de etapa e novos cadastros aparecem aqui em tempo real.
            </p>
            <Link
              to="/cadastro"
              style={{
                marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.875rem', borderRadius: '0.5rem', background: '#2563eb',
                color: 'white', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700,
              }}
            >
              <Plus size={14} /> Nova escritura
            </Link>
          </div>
        ) : (
          <div style={{ position: 'relative', padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Linha vertical da timeline */}
            <div
              style={{
                position: 'absolute', left: '2.125rem', top: '0.75rem', bottom: '0.75rem',
                width: '2px', background: 'var(--border-color)',
              }}
            />

            {eventos.map((ev, i) => {
              if (ev._tipo === 'movimento') {
                const cfgNovo = getCfg(ev.status_novo);
                return (
                  <div key={`m-${ev.id || i}`} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', paddingBottom: '1rem', position: 'relative' }}>
                    {/* Dot */}
                    <div
                      style={{
                        flexShrink: 0, width: '1.75rem', height: '1.75rem',
                        borderRadius: '50%',
                        background: cfgNovo.cor,
                        border: '3px solid var(--bg-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.625rem',
                        zIndex: 1,
                        boxShadow: `0 0 0 2px ${cfgNovo.cor}33`,
                      }}
                    >
                      <span style={{ fontSize: '0.7rem' }}>{cfgNovo.icon}</span>
                    </div>

                    {/* Conteúdo */}
                    <div style={{ flex: 1, paddingTop: '0.1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.125rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ev.tipo}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                          Livro {ev.livro} / Fl. {ev.folha}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{ev.status_anterior}</span>
                        <ArrowRight size={11} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cfgNovo.cor }}>{ev.status_novo}</span>
                      </div>
                      {ev.observacao && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '0.375rem', borderLeft: `2px solid ${cfgNovo.cor}` }}>
                          {ev.observacao}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {ev.atualizado_por && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                            {ev.atualizado_por}
                          </span>
                        )}
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>·</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                          {formatHora(ev.created_at)}
                        </span>
                        {ev.protocolo && (
                          <>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>·</span>
                            <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                              {ev.protocolo}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Escritura criada
              return (
                <div key={`c-${ev.id}`} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', paddingBottom: '1rem', position: 'relative' }}>
                  <div
                    style={{
                      flexShrink: 0, width: '1.75rem', height: '1.75rem',
                      borderRadius: '50%',
                      background: 'rgba(16,185,129,0.15)',
                      border: '3px solid var(--bg-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 1,
                      boxShadow: '0 0 0 2px rgba(16,185,129,0.2)',
                    }}
                  >
                    <Plus size={11} style={{ color: '#10b981' }} />
                  </div>
                  <div style={{ flex: 1, paddingTop: '0.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.125rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ev.tipo}
                      </span>
                      <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700 }}>
                        Novo cadastro
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ev.outorgante}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {ev.criado_por && <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{ev.criado_por}</span>}
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>·</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{formatHora(ev.created_at)}</span>
                      {ev.protocolo && (
                        <>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>·</span>
                          <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{ev.protocolo}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [loadingAtiv, setLoadingAtiv] = useState(true);
  const [atividadeError, setAtividadeError] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setStatsError(false);
      const data = await escriturasAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStatsError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAtividade = useCallback(async () => {
    try {
      setLoadingAtiv(true);
      setAtividadeError(false);
      const res = await api.get('/escrituras/stats/atividade-hoje');
      setAtividade(res.data);
    } catch (error) {
      console.error('Erro ao carregar atividade:', error);
      setAtividadeError(true);
    } finally {
      setLoadingAtiv(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadAtividade();
  }, [loadStats, loadAtividade]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loading size="lg" message="Carregando estatísticas..." />
      </div>
    );
  }

  if (!stats || statsError) {
    return (
      <Card>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Não foi possível calcular as métricas.</p>
          <Button onClick={loadStats}>Tentar novamente</Button>
        </div>
      </Card>
    );
  }

  const dadosPorTipo       = Object.entries(stats.porTipo).map(([nome, valor]) => ({ nome, valor }));
  const dadosPorEscrevente = Object.entries(stats.porEscrevente).map(([nome, valor]) => ({ nome, valor }));
  const now = new Date();
  const currentKey = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = `${String(previousDate.getMonth() + 1).padStart(2, '0')}/${previousDate.getFullYear()}`;
  const mesAtual = Number(stats.porMes[currentKey] || 0);
  const mesAnterior = Number(stats.porMes[previousKey] || 0);
  const variacao    = mesAnterior > 0 ? ((mesAtual - mesAnterior) / mesAnterior) * 100 : 0;
  const variacaoPositiva = variacao >= 0;

  const statCards = [
    {
      label: 'Total de Escrituras', value: stats.total,
      icon: FileText, color: '#3b82f6',
      bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    },
    {
      label: 'Escreventes', value: Object.keys(stats.porEscrevente).length,
      icon: Users, color: '#10b981',
      bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
    },
    {
      label: 'Tipos de Escritura', value: Object.keys(stats.porTipo).length,
      icon: Calendar, color: '#f59e0b',
      bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    },
    {
      label: 'Este Mês', value: mesAtual,
      icon: TrendingUp, color: '#8b5cf6',
      bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
      extra: mesAnterior > 0 ? {
        text: `${variacaoPositiva ? '+' : ''}${variacao.toFixed(1)}%`,
        positive: variacaoPositiva,
        sub: `vs. ${mesAnterior} no mês anterior`,
      } : null,
    },
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Visão geral
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            Acompanhamento e produtividade do cartório
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/workflow" style={{ padding: '0.55rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, background: 'var(--bg-primary)' }}>
            Ver processos
          </Link>
          <Link to="/cadastro" style={{ padding: '0.55rem 0.8rem', borderRadius: '0.5rem', color: 'white', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, background: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Plus size={14} /> Nova escritura
          </Link>
        </div>
      </div>

      {/* Prioridade operacional: o que aconteceu hoje aparece primeiro */}
      <div style={{ marginBottom: '1.5rem' }}>
        <TimelineHoje atividade={atividade} loadingAtiv={loadingAtiv} error={atividadeError} onRefresh={loadAtividade} />
      </div>

      {/* Cards de stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem', padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                position: 'relative', overflow: 'hidden',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: card.color, opacity: 0.08, filter: 'blur(20px)', pointerEvents: 'none' }} />
              <div style={{ flexShrink: 0, width: '2.75rem', height: '2.75rem', borderRadius: '0.625rem', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                <Icon size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{card.label}</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{card.value}</p>
                {card.extra && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.125rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: card.extra.positive ? '#dcfce7' : '#fee2e2', color: card.extra.positive ? '#15803d' : '#b91c1c' }}>
                      {card.extra.positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {card.extra.text}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{card.extra.sub}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendário de Agendamentos e Ações das Escrituras */}
      <CalendarioAgendamentos currentUser={JSON.parse(localStorage.getItem('user') || '{}')} />

      {/* Resumos e escrituras recentes */}
      <div>

        {/* Coluna esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Tabelas por tipo e escrevente */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {/* Por Tipo */}
            <TabelaResumo
              titulo="Resumo por Tipo"
              badge={`${dadosPorTipo.length} tipos`}
              badgeCor="#3b82f6"
              dados={dadosPorTipo}
              colEsq="Tipo"
              colDir="Qtd."
              corQtd="rgba(59,130,246,0.1)"
              corQtdTexto="#3b82f6"
            />
            {/* Por Escrevente */}
            <TabelaResumo
              titulo="Resumo por Escrevente"
              badge={`${dadosPorEscrevente.length} pessoas`}
              badgeCor="#10b981"
              dados={dadosPorEscrevente}
              colEsq="Escrevente"
              colDir="Qtd."
              corQtd="rgba(16,185,129,0.1)"
              corQtdTexto="#10b981"
            />
          </div>

          {/* Escrituras Recentes */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>Escrituras Recentes</h3>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>Últimas 10</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr>
                    {['Tipo', 'Outorgante', 'Escrevente', 'Período'].map(h => (
                      <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(!stats.recentes || stats.recentes.length === 0) ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        <FileText size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                        <p>Nenhuma escritura cadastrada</p>
                      </td>
                    </tr>
                  ) : (
                    stats.recentes.map(e => (
                      <tr key={e.uuid || e.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }} onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#6366f1', whiteSpace: 'nowrap' }}>{e.tipo}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>{e.outorgante}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{e.escrevente}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{e.mes}/{e.ano}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Componente de tabela reutilizável ─────────────────────────────────────────
function TabelaResumo({ titulo, badge, badgeCor, dados, colEsq, colDir, corQtd, corQtdTexto }) {
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{titulo}</h3>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: `${badgeCor}18`, color: badgeCor, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>{badge}</span>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.625rem 1.25rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>{colEsq}</th>
              <th style={{ padding: '0.625rem 1.25rem', textAlign: 'right', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>{colDir}</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.nome}</td>
                <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '2rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: corQtd, color: corQtdTexto }}>
                    {item.valor}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
