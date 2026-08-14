import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AgendamentoModal } from './AgendamentoModal';
import { Calendar as CalendarIcon, CheckCircle2, Circle, Clock, Plus, User, FileText, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const API_URL = '/api';

export function CalendarioAgendamentos({ currentUser, onSelectEscritura }) {
  const hojeObj = new Date();
  const hojeStr = hojeObj.toISOString().split('T')[0];

  const [mesAtual, setMesAtual] = useState(hojeObj.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(hojeObj.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(hojeStr);
  
  // Filtro de aba: 'meus' (minhas tarefas) ou 'todos' (cartório inteiro)
  const [filtroAba, setFiltroAba] = useState('meus');
  
  const [agendamentosMes, setAgendamentosMes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [agendamentoEdit, setAgendamentoEdit] = useState(null);

  useEffect(() => {
    fetchAgendamentosMes();
  }, [mesAtual, anoAtual]);

  async function fetchAgendamentosMes() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/agendamentos?mes=${mesAtual}&ano=${anoAtual}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgendamentosMes(data);
      }
    } catch (e) {
      console.error('Erro ao buscar agendamentos do mês:', e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleConcluido(item, e) {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const novoEstado = !item.concluido;
      const res = await fetch(`${API_URL}/agendamentos/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ concluido: novoEstado ? 1 : 0 })
      });

      if (res.ok) {
        const atualizado = await res.json();
        setAgendamentosMes(prev => prev.map(a => a.id === item.id ? atualizado : a));
      }
    } catch (err) {
      console.error('Erro ao atualizar conclusão da tarefa:', err);
    }
  }

  function handleMesAnterior() {
    if (mesAtual === 1) {
      setMesAtual(12);
      setAnoAtual(prev => prev - 1);
    } else {
      setMesAtual(prev => prev - 1);
    }
  }

  function handleProximoMes() {
    if (mesAtual === 12) {
      setMesAtual(1);
      setAnoAtual(prev => prev + 1);
    } else {
      setMesAtual(prev => prev + 1);
    }
  }

  function formatarNomeMes(m, a) {
    const data = new Date(a, m - 1, 1);
    return data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  }

  // Gerar dias do calendário grelha
  function gerarDiasCalendario() {
    const primeiroDiaMes = new Date(anoAtual, mesAtual - 1, 1).getDay(); // 0 (Dom) a 6 (Sáb)
    const totalDiasMes = new Date(anoAtual, mesAtual, 0).getDate();
    const dias = [];

    // Células vazias iniciais
    for (let i = 0; i < primeiroDiaMes; i++) {
      dias.push(null);
    }

    // Dias reais
    for (let d = 1; d <= totalDiasMes; d++) {
      const diaStr = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const agendamentosNesteDia = agendamentosMes.filter(a => a.data_agendada && a.data_agendada.startsWith(diaStr));
      dias.push({
        numero: d,
        diaStr,
        tarefas: agendamentosNesteDia
      });
    }

    return dias;
  }

  // Filtrar tarefas do dia selecionado
  const tarefasDoDia = agendamentosMes.filter(a => {
    if (!a.data_agendada || !a.data_agendada.startsWith(diaSelecionado)) return false;
    if (filtroAba === 'meus') {
      return currentUser && a.user_id === currentUser.id;
    }
    return true;
  });

  // Contagem de tarefas para o botão/aba
  const todasNoDia = agendamentosMes.filter(a => a.data_agendada && a.data_agendada.startsWith(diaSelecionado));
  const minhasNoDia = todasNoDia.filter(a => currentUser && a.user_id === currentUser.id);

  const formatarDataDia = (str) => {
    if (!str) return '';
    const [ano, mes, dia] = str.split('-');
    const dt = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const isHoje = str === hojeStr;
    const descDia = dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
    return isHoje ? `Hoje (${descDia})` : descDia;
  };

  const diasGrelha = gerarDiasCalendario();

  return (
    <Card style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
      {/* Header com título e botão de nova tarefa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Calendário de Agendamentos & Tarefas
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', margin: '0.2rem 0 0' }}>
              Programe prazos, retornos e ações nas escrituras para a equipe
            </p>
          </div>
        </div>

        <Button variant="primary" onClick={() => { setAgendamentoEdit(null); setModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'linear-gradient(135deg, #d4a843, #b8860b)', border: 'none', color: 'white' }}>
          <Plus size={16} />
          Agendar Ação
        </Button>
      </div>

      {/* Grid dividido: Calendário Esquerda (55%), Lista de Tarefas Direita (45%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.2fr) minmax(280px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LADO ESQUERDO: Grelha do Mês */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.125rem', borderRadius: '0.875rem', border: '1px solid var(--border-color)' }}>
          {/* Navegação do mês */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {formatarNomeMes(mesAtual, anoAtual)}
            </span>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button onClick={() => { setMesAtual(hojeObj.getMonth() + 1); setAnoAtual(hojeObj.getFullYear()); setDiaSelecionado(hojeStr); }} title="Ir para Hoje" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Hoje
              </button>
              <button onClick={handleMesAnterior} style={{ padding: '0.25rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleProximoMes} style={{ padding: '0.25rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Dias da semana cabeçalho */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <span key={d} style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{d}</span>
            ))}
          </div>

          {/* Células de dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.375rem' }}>
            {diasGrelha.map((celula, idx) => {
              if (!celula) {
                return <div key={`vazio-${idx}`} style={{ height: '2.5rem', background: 'transparent' }} />;
              }
              const isSelected = celula.diaStr === diaSelecionado;
              const isHoje = celula.diaStr === hojeStr;
              const hasTarefas = celula.tarefas.length > 0;
              const pendentesNoDia = celula.tarefas.filter(t => !t.concluido).length;

              return (
                <button
                  key={celula.diaStr}
                  onClick={() => setDiaSelecionado(celula.diaStr)}
                  style={{
                    height: '2.75rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: isSelected ? '2px solid #d4a843' : (isHoje ? '1.5px dashed #3b82f6' : '1px solid transparent'),
                    background: isSelected ? 'rgba(212, 168, 67, 0.15)' : (hasTarefas ? 'var(--bg-primary)' : 'transparent'),
                    color: isSelected ? '#b8860b' : (isHoje ? '#2563eb' : 'var(--text-primary)'),
                    fontWeight: (isSelected || isHoje) ? 700 : 500,
                    fontSize: '0.875rem',
                    padding: '0.25rem'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-primary)'; }}
                  onMouseLeave={e => { if (!isSelected && !hasTarefas) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{celula.numero}</span>
                  {/* Pontinhos indicadores de tarefas */}
                  {hasTarefas && (
                    <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '4px' }}>
                      {pendentesNoDia > 0 ? (
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#d97706' }} />
                      ) : (
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                      )}
                      {celula.tarefas.length > 1 && (
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8' }} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} /> Pendente
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Concluído
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', border: '1.5px dashed #3b82f6', display: 'inline-block' }} /> Hoje
            </span>
          </div>
        </div>

        {/* LADO DIREITO: Painel de Tarefas do Dia */}
        <div>
          {/* Header do Painel com data selecionada */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d4a843', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Agenda do Dia
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.1rem 0 0.75rem', textTransform: 'capitalize' }}>
              {formatarDataDia(diaSelecionado)}
            </h4>

            {/* Abas de filtro: Minhas vs Todas */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '0.5rem', gap: '0.25rem', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setFiltroAba('meus')}
                style={{
                  flex: 1, padding: '0.375rem', fontSize: '0.8125rem', fontWeight: 600,
                  borderRadius: '0.375rem', cursor: 'pointer', border: 'none',
                  background: filtroAba === 'meus' ? 'var(--bg-primary)' : 'transparent',
                  color: filtroAba === 'meus' ? '#d4a843' : 'var(--text-secondary)',
                  boxShadow: filtroAba === 'meus' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                Minhas Tarefas ({minhasNoDia.length})
              </button>
              <button
                onClick={() => setFiltroAba('todos')}
                style={{
                  flex: 1, padding: '0.375rem', fontSize: '0.8125rem', fontWeight: 600,
                  borderRadius: '0.375rem', cursor: 'pointer', border: 'none',
                  background: filtroAba === 'todos' ? 'var(--bg-primary)' : 'transparent',
                  color: filtroAba === 'todos' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: filtroAba === 'todos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                Todo o Cartório ({todasNoDia.length})
              </button>
            </div>
          </div>

          {/* Lista das tarefas */}
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              Carregando agendamentos...
            </div>
          ) : tarefasDoDia.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px dashed var(--border-color)' }}>
              <Clock size={32} style={{ color: '#94a3b8', margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                Nenhuma tarefa agendada para {filtroAba === 'meus' ? 'você' : 'o cartório'} neste dia.
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                Clique no botão abaixo para programar uma ação.
              </p>
              <Button variant="secondary" size="sm" onClick={() => { setAgendamentoEdit(null); setModalOpen(true); }}>
                + Agendar Tarefa para {diaSelecionado.split('-').reverse().slice(0,2).join('/')}
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {tarefasDoDia.map(t => (
                <div
                  key={t.id}
                  onClick={() => { setAgendamentoEdit(t); setModalOpen(true); }}
                  style={{
                    padding: '0.875rem 1rem',
                    background: t.concluido ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    border: t.concluido ? '1px solid var(--border-color)' : '1px solid #fde68a',
                    borderLeft: t.concluido ? '4px solid #10b981' : '4px solid #d97706',
                    borderRadius: '0.625rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: t.concluido ? 'none' : '0 2px 8px rgba(217,119,6,0.06)',
                    opacity: t.concluido ? 0.75 : 1
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', flex: 1 }}>
                      {/* Checkbox interativo */}
                      <button
                        onClick={(e) => toggleConcluido(t, e)}
                        title={t.concluido ? 'Desmarcar' : 'Marcar como concluído'}
                        style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                          color: t.concluido ? '#10b981' : '#94a3b8', marginTop: '2px',
                          display: 'flex', alignItems: 'center'
                        }}
                      >
                        {t.concluido ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>

                      <div>
                        <div style={{
                          fontSize: '0.9375rem', fontWeight: 600,
                          color: t.concluido ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          textDecoration: t.concluido ? 'line-through' : 'none',
                          lineHeight: 1.3
                        }}>
                          {t.titulo}
                        </div>

                        {t.descricao && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                            {t.descricao}
                          </div>
                        )}

                        {/* Badges de responsável e escritura */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          {t.escritura_protocolo && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectEscritura && t.escritura_id) {
                                  onSelectEscritura({ id: t.escritura_id, protocolo: t.escritura_protocolo });
                                }
                              }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #bfdbfe' }}
                            >
                              <FileText size={12} />
                              {t.escritura_protocolo} ({t.escritura_outorgante})
                            </span>
                          )}

                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                            <User size={12} />
                            {t.responsavel_nome ? t.responsavel_nome : 'Geral'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AgendamentoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => {
          fetchAgendamentosMes();
        }}
        agendamento={agendamentoEdit}
        currentUser={currentUser}
      />
    </Card>
  );
}
