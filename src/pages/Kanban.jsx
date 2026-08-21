import React, { useState, useEffect, useCallback } from 'react';
import { escriturasAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import Loading from '../components/ui/Loading';
import { formatDateBR, parseDateValue } from '../utils/date';
import {
  RefreshCw, Search, FileText, User,
  BookOpen, ChevronDown, Clock, X,
  MessageSquare, History, ArrowRight,
  CheckCircle2, Circle, Filter,
} from 'lucide-react';

// ── Etapas do processo ────────────────────────────────────────────────────────
export const ETAPAS = [
  { id: 'Abertura de protocolo',    cor: '#6366f1', bg: 'rgba(99,102,241,0.09)',   borda: 'rgba(99,102,241,0.25)',   icon: '📋' },
  { id: 'Orçamento / Documentação', cor: '#f59e0b', bg: 'rgba(245,158,11,0.09)',   borda: 'rgba(245,158,11,0.25)',   icon: '💰' },
  { id: 'Minuta / Solicitações',    cor: '#8b5cf6', bg: 'rgba(139,92,246,0.09)',   borda: 'rgba(139,92,246,0.25)',   icon: '📝' },
  { id: 'Assinatura',               cor: '#0ea5e9', bg: 'rgba(14,165,233,0.09)',   borda: 'rgba(14,165,233,0.25)',   icon: '✍️' },
  { id: 'Prenotação',               cor: '#ec4899', bg: 'rgba(236,72,153,0.09)',   borda: 'rgba(236,72,153,0.25)',   icon: '📌' },
  { id: 'Concluído',                cor: '#10b981', bg: 'rgba(16,185,129,0.09)',   borda: 'rgba(16,185,129,0.25)',   icon: '✅' },
];

// Status antigos mapeados visualmente
const STATUS_LEGADO = {
  'Em andamento':       { cor: '#3b82f6', bg: 'rgba(59,130,246,0.09)', borda: 'rgba(59,130,246,0.25)', icon: '🔵' },
  'Aguardando cliente': { cor: '#f59e0b', bg: 'rgba(245,158,11,0.09)', borda: 'rgba(245,158,11,0.25)', icon: '⏳' },
};

function getEtapaCfg(status) {
  return ETAPAS.find(e => e.id === status)
    || STATUS_LEGADO[status]
    || { cor: '#94a3b8', bg: 'rgba(148,163,184,0.09)', borda: 'rgba(148,163,184,0.25)', icon: '⬜' };
}

function formatHora(dt) {
  if (!dt) return '';
  const d = parseDateValue(dt);
  if (!d) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatData(dt) {
  return formatDateBR(dt, '', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Modal de atualização de etapa ─────────────────────────────────────────────
function ModalEtapa({ escritura, onConfirm, onCancel }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(escritura?.status || ETAPAS[0].id);
  const [obs, setObs] = useState('');
  const cfgAtual = getEtapaCfg(escritura?.status);
  const cfgNova  = getEtapaCfg(etapaSelecionada);

  if (!escritura) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          padding: '1.5rem',
          width: '100%', maxWidth: '500px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Atualizar Etapa do Processo
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
              {escritura.tipo} · Livro {escritura.livro}, Fl. {escritura.folha}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {escritura.outorgante}
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.25rem', borderRadius: '0.375rem', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Etapa atual */}
        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '1rem' }}>{cfgAtual.icon}</span>
          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Etapa atual</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: cfgAtual.cor }}>{escritura.status || '—'}</p>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--text-tertiary)', marginLeft: 'auto' }} />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Nova etapa</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: cfgNova.cor }}>{etapaSelecionada}</p>
          </div>
        </div>

        {/* Seleção da nova etapa */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Selecionar nova etapa
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {ETAPAS.map(e => {
              const selected = etapaSelecionada === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setEtapaSelecionada(e.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: selected ? `2px solid ${e.cor}` : '1.5px solid var(--border-color)',
                    background: selected ? e.bg : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{e.icon}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: selected ? 700 : 500, color: selected ? e.cor : 'var(--text-primary)', flex: 1 }}>
                    {e.id}
                  </span>
                  {selected && <CheckCircle2 size={16} style={{ color: e.cor, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Observação */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            <MessageSquare size={13} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
            Observação (opcional)
          </label>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Ex: Documentos enviados ao cliente para assinatura..."
            rows={3}
            style={{
              width: '100%', padding: '0.625rem 0.75rem',
              fontSize: '0.875rem', fontFamily: 'inherit',
              border: '1.5px solid var(--border-color)',
              borderRadius: '0.5rem', resize: 'vertical',
              background: 'var(--bg-secondary)', color: 'var(--text-primary)',
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(etapaSelecionada, obs)}
            disabled={etapaSelecionada === escritura.status}
            style={{
              padding: '0.5rem 1.375rem', borderRadius: '0.5rem',
              border: 'none',
              background: etapaSelecionada === escritura.status ? 'var(--bg-secondary)' : cfgNova.cor,
              color: etapaSelecionada === escritura.status ? 'var(--text-tertiary)' : 'white',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: etapaSelecionada === escritura.status ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              opacity: etapaSelecionada === escritura.status ? 0.5 : 1,
            }}
          >
            Confirmar mudança
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de histórico ────────────────────────────────────────────────────────
function ModalHistorico({ escritura, historico, onClose, loadingHist }) {
  if (!escritura) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'slideUp 0.2s ease' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Histórico do Processo</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
              {escritura.tipo} · {escritura.protocolo || `Livro ${escritura.livro}, Fl. ${escritura.folha}`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {loadingHist ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="loading" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : historico.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
            <History size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>Nenhuma movimentação registrada</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Linha vertical */}
            <div style={{ position: 'absolute', left: '0.875rem', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {historico.map((h, i) => {
                const cfgNovo = getEtapaCfg(h.status_novo);
                return (
                  <div key={i} style={{ display: 'flex', gap: '1rem', paddingLeft: '0.25rem' }}>
                    {/* Dot */}
                    <div style={{ flexShrink: 0, width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: cfgNovo.cor, border: `3px solid var(--bg-primary)`, boxShadow: `0 0 0 2px ${cfgNovo.borda}`, marginTop: '0.125rem', zIndex: 1 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{h.status_anterior}</span>
                        <ArrowRight size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: cfgNovo.cor }}>{h.status_novo}</span>
                      </div>
                      {h.observacao && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', padding: '0.375rem 0.625rem', background: 'var(--bg-secondary)', borderRadius: '0.375rem', borderLeft: `3px solid ${cfgNovo.cor}` }}>
                          {h.observacao}
                        </p>
                      )}
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                        {h.atualizado_por && `${h.atualizado_por} · `}
                        {formatData(h.created_at)} às {formatHora(h.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export function Kanban() {
  const [escrituras, setEscrituras] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalEtapa, setModalEtapa] = useState(null);
  const [modalHist, setModalHist]   = useState(null);
  const [historico, setHistorico]   = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [search, setSearch]         = useState('');
  const [filtroStatus, setFiltroStatus] = useState(''); // '' = todos
  const toast = useToast();

  const carregar = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      const dados = await escriturasAPI.getAll();
      setEscrituras(dados);
    } catch {
      toast.error('Erro ao carregar processos');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function carregarHistorico(escritura) {
    setModalHist(escritura);
    setLoadingHist(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/escrituras/${escritura.id}/historico`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) setHistorico(await response.json());
      else setHistorico([]);
    } catch { setHistorico([]); }
    finally { setLoadingHist(false); }
  }

  async function confirmarEtapa(novaEtapa, obs) {
    const escritura = modalEtapa;
    setModalEtapa(null);

    // Optimistic update
    setEscrituras(prev => prev.map(e => e.id === escritura.id ? { ...e, status: novaEtapa } : e));

    try {
      await escriturasAPI.updateStatus(escritura.id, novaEtapa, obs);
      toast.success(`Etapa atualizada para "${novaEtapa}"`);
    } catch {
      toast.error('Erro ao atualizar etapa. Revertendo...');
      carregar(true);
    }
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  const filtradas = escrituras.filter(e => {
    const s = e.status || 'Em andamento';
    const q = search.toLowerCase();
    const matchSearch = !q || [e.tipo, e.outorgante, e.outorgado, e.escrevente, e.livro, e.folha, e.protocolo].some(v => String(v || '').toLowerCase().includes(q));
    const matchStatus = !filtroStatus || s === filtroStatus;
    return matchSearch && matchStatus;
  });

  // Contagem por etapa
  const contagem = {};
  escrituras.forEach(e => {
    const s = e.status || 'Em andamento';
    contagem[s] = (contagem[s] || 0) + 1;
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <Loading size="lg" message="Carregando processos..." />
    </div>
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Acompanhamento de Processos</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            {filtradas.length} {filtradas.length === 1 ? 'processo' : 'processos'} {filtroStatus ? `em "${filtroStatus}"` : 'no total'}
          </p>
        </div>
        <button
          onClick={() => carregar(true)} disabled={refreshing}
          title="Atualizar"
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', border: '1.5px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}
        >
          <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          Atualizar
        </button>
      </div>

      {/* ── Pílulas de contagem por etapa ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          onClick={() => setFiltroStatus('')}
          style={{
            padding: '0.3rem 0.875rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
            border: !filtroStatus ? '2px solid #3b82f6' : '1.5px solid var(--border-color)',
            background: !filtroStatus ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)',
            color: !filtroStatus ? '#3b82f6' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          Todos ({escrituras.length})
        </button>
        {ETAPAS.map(e => {
          const n = contagem[e.id] || 0;
          const active = filtroStatus === e.id;
          return (
            <button
              key={e.id}
              onClick={() => setFiltroStatus(active ? '' : e.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.3rem 0.875rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                border: active ? `2px solid ${e.cor}` : '1.5px solid var(--border-color)',
                background: active ? e.bg : 'var(--bg-secondary)',
                color: active ? e.cor : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span>{e.icon}</span>
              <span>{e.id}</span>
              <span style={{ background: active ? e.cor : 'var(--border-color)', color: active ? 'white' : 'var(--text-tertiary)', borderRadius: '9999px', minWidth: '1.25rem', height: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, padding: '0 0.3rem' }}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Barra de busca ────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: '0.875rem', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar por tipo, outorgante, livro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '0.5rem 0.875rem 0.5rem 2.375rem',
            fontSize: '0.875rem',
            border: '1.5px solid var(--border-color)', borderRadius: '0.5rem',
            background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      {/* ── Tabela de processos ───────────────────────────────────────────── */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Tipo</th>
                <th>Livro / Folha</th>
                <th>Outorgante</th>
                <th>Escrevente</th>
                <th>Período</th>
                <th style={{ textAlign: 'center' }}>Etapa atual</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    <FileText size={32} style={{ opacity: 0.25, display: 'block', margin: '0 auto 0.5rem' }} />
                    {search || filtroStatus ? 'Nenhum processo encontrado com os filtros aplicados.' : 'Nenhum processo cadastrado.'}
                  </td>
                </tr>
              ) : (
                filtradas.map(e => {
                  const cfg = getEtapaCfg(e.status || 'Em andamento');
                  return (
                    <tr key={e.id}>
                      {/* Protocolo */}
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '0.375rem' }}>
                          {e.protocolo || `#${e.id}`}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{e.tipo}</span>
                      </td>

                      {/* Livro/Folha */}
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        <span style={{ fontWeight: 600 }}>{e.livro}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}> / </span>
                        <span style={{ fontWeight: 600 }}>{e.folha}</span>
                      </td>

                      {/* Outorgante */}
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', maxWidth: '180px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.outorgante}</div>
                        {e.outorgado && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.outorgado}</div>
                        )}
                      </td>

                      {/* Escrevente */}
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{e.escrevente}</td>

                      {/* Período */}
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{e.mes}/{e.ano}</td>

                      {/* Etapa — clicável */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => setModalEtapa(e)}
                          title="Clique para mudar a etapa"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '9999px',
                            background: cfg.bg,
                            border: `1.5px solid ${cfg.borda}`,
                            color: cfg.cor,
                            fontSize: '0.75rem', fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={el => { el.currentTarget.style.boxShadow = `0 0 0 3px ${cfg.borda}`; }}
                          onMouseLeave={el => { el.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <span>{cfg.icon}</span>
                          <span>{e.status || 'Em andamento'}</span>
                          <ChevronDown size={12} style={{ opacity: 0.6 }} />
                        </button>
                      </td>

                      {/* Ações */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => carregarHistorico(e)}
                          title="Ver histórico de movimentações"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            padding: '0.3rem 0.625rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.6875rem', fontWeight: 500,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={el => { el.currentTarget.style.borderColor = '#3b82f6'; el.currentTarget.style.color = '#3b82f6'; }}
                          onMouseLeave={el => { el.currentTarget.style.borderColor = 'var(--border-color)'; el.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <History size={13} />
                          Histórico
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modais ────────────────────────────────────────────────────────── */}
      {modalEtapa && (
        <ModalEtapa
          escritura={modalEtapa}
          onConfirm={confirmarEtapa}
          onCancel={() => setModalEtapa(null)}
        />
      )}
      {modalHist && (
        <ModalHistorico
          escritura={modalHist}
          historico={historico}
          loadingHist={loadingHist}
          onClose={() => { setModalHist(null); setHistorico([]); }}
        />
      )}
    </div>
  );
}

export default Kanban;
