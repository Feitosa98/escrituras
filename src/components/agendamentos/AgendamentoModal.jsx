import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Calendar, Clock, User, FileText, CheckCircle2 } from 'lucide-react';

const API_URL = '/api';

export function AgendamentoModal({ isOpen, onClose, onSave, escritura = null, agendamento = null, currentUser = null }) {
  const [titulo, setTitulo] = useState('');
  const [dataAgendada, setDataAgendada] = useState('');
  const [userId, setUserId] = useState('');
  const [escrituraId, setEscrituraId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [concluido, setConcluido] = useState(false);
  const [users, setUsers] = useState([]);
  const [escrituras, setEscrituras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const hoje = new Date().toISOString().split('T')[0];
      if (agendamento) {
        setTitulo(agendamento.titulo || '');
        setDataAgendada(agendamento.data_agendada ? agendamento.data_agendada.split('T')[0] : hoje);
        setUserId(agendamento.user_id ? String(agendamento.user_id) : (currentUser ? String(currentUser.id) : ''));
        setEscrituraId(agendamento.escritura_id ? String(agendamento.escritura_id) : (escritura ? String(escritura.id) : ''));
        setDescricao(agendamento.descricao || '');
        setConcluido(!!agendamento.concluido);
      } else {
        setTitulo('');
        setDataAgendada(hoje);
        setUserId(currentUser ? String(currentUser.id) : '');
        setEscrituraId(escritura ? String(escritura.id) : '');
        setDescricao('');
        setConcluido(false);
      }
      setError('');
      fetchUsers();
      if (!escritura && !agendamento?.escritura_id) {
        fetchEscrituras();
      }
    }
  }, [isOpen, agendamento, escritura, currentUser]);

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Erro ao buscar usuários:', e);
    }
  }

  async function fetchEscrituras() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/escrituras`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEscrituras(data);
      }
    } catch (e) {
      console.error('Erro ao buscar escrituras:', e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!titulo.trim() || !dataAgendada) {
      setError('Por favor, informe o título e a data da tarefa.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        titulo: titulo.trim(),
        data_agendada: dataAgendada,
        user_id: userId ? Number(userId) : null,
        escritura_id: escrituraId ? Number(escrituraId) : (escritura ? Number(escritura.id) : null),
        descricao: descricao.trim() || null,
        concluido: concluido ? 1 : 0
      };

      const url = agendamento ? `${API_URL}/agendamentos/${agendamento.id}` : `${API_URL}/agendamentos`;
      const method = agendamento ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const salvo = await res.json();
        onSave && onSave(salvo);
        onClose();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao salvar agendamento.');
      }
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      setError('Erro de conexão ao salvar agendamento.');
    } finally {
      setLoading(false);
    }
  }

  const usersOptions = [
    { value: '', label: 'Sem responsável / Geral' },
    ...users.map(u => ({ value: String(u.id), label: `${u.nome} (${u.role || 'colaborador'})` }))
  ];

  const escriturasOptions = [
    { value: '', label: 'Tarefa avulsa (sem escritura vinculada)' },
    ...escrituras.map(esc => ({
      value: String(esc.id),
      label: `${esc.protocolo || `ID ${esc.id}`} - ${esc.outorgante} (${esc.tipo})`
    }))
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agendamento ? 'Editar Tarefa Agendada' : 'Agendar Nova Ação / Tarefa'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #f87171',
            borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.875rem', marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Escritura em destaque (se já estiver fixada) */}
        {escritura ? (
          <div style={{
            padding: '0.75rem 1rem', background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <FileText size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Vinculado à Escritura
              </div>
              <div style={{ fontSize: '0.9375rem', color: '#1e40af', fontWeight: 700 }}>
                {escritura.protocolo} — {escritura.outorgante}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <Select
              label="Vincular a uma Escritura (Opcional)"
              value={escrituraId}
              onChange={e => setEscrituraId(e.target.value)}
              options={escriturasOptions}
            />
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <Input
            label="O que deve ser feito? (Título da Tarefa) *"
            placeholder="Ex.: Solicitar certidão de ônus reajustada, Enviar minuta..."
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <Input
              type="date"
              label="Data do Agendamento *"
              value={dataAgendada}
              onChange={e => setDataAgendada(e.target.value)}
              required
            />
          </div>
          <div>
            <Select
              label="Colaborador Responsável"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              options={usersOptions}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block', fontSize: '0.875rem', fontWeight: 500,
            color: 'var(--text-secondary)', marginBottom: '0.375rem'
          }}>
            Observações / Detalhes (Opcional)
          </label>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Detalhes adicionais, telefones, links ou orientações para a tarefa..."
            rows={3}
            style={{
              width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.375rem',
              border: '1px solid var(--border-color)', background: 'var(--bg-primary)',
              color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
              resize: 'vertical', outline: 'none', transition: 'border-color 0.15s'
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        {agendamento && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="concluido_chk"
              checked={concluido}
              onChange={e => setConcluido(e.target.checked)}
              style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer', accentColor: '#10b981' }}
            />
            <label htmlFor="concluido_chk" style={{ fontSize: '0.9375rem', fontWeight: 600, color: concluido ? '#059669' : 'var(--text-primary)', cursor: 'pointer' }}>
              Tarefa já foi concluída
            </label>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Salvando...' : (agendamento ? 'Salvar Alterações' : 'Agendar Tarefa')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
