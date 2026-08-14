import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Search, User } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { adminAPI } from '../../services/admin';
import { usersAPI } from '../../services/api';

export function Escreventes() {
  const toast = useToast();
  const [escreventes, setEscreventes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [novoNome, setNovoNome] = useState('');
  const [novoUsuarioId, setNovoUsuarioId] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      const [escreventesData, usuariosData] = await Promise.all([
        adminAPI.getEscreventes(),
        usersAPI.getAll(),
      ]);
      setEscreventes(escreventesData);
      setUsuarios(usuariosData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdicionar(e) {
    e.preventDefault();
    if (!novoNome.trim()) return;

    try {
      await adminAPI.createEscrevente({
        nome: novoNome,
        user_id: novoUsuarioId || null,
      });
      toast.success('Escrevente adicionado!');
      setNovoNome('');
      setNovoUsuarioId('');
      carregarDados();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleVincular(escrevente, userId) {
    try {
      await adminAPI.updateEscrevente(escrevente.id, {
        user_id: userId || null,
      });
      carregarDados();
      toast.success('Vínculo atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar vínculo');
    }
  }

  async function handleToggleStatus(escrevente) {
    try {
      await adminAPI.updateEscrevente(escrevente.id, {
        ativo: escrevente.ativo ? 0 : 1,
      });
      carregarDados();
      toast.success(`Status atualizado`);
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  }

  const userOptions = [
    { value: '', label: 'Sem usuário vinculado' },
    ...usuarios.map((u) => ({ value: u.id, label: u.nome })),
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Escreventes</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
          Gerencie os escreventes e vincule-os aos usuários do sistema
        </p>
      </div>

      <Card title="Novo Escrevente">
        <form
          onSubmit={handleAdicionar}
          className="grid grid-cols-2 gap-md"
          style={{ alignItems: 'end' }}
        >
          <Input
            label="Nome do Escrevente"
            placeholder="Nome completo"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            required
          />
          <Select
            label="Vincular a Usuário (Opcional)"
            value={novoUsuarioId}
            onChange={(e) => setNovoUsuarioId(e.target.value)}
            options={userOptions}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Button type="submit" variant="primary" style={{ width: '100%' }}>
              <Plus size={18} style={{ marginRight: '8px' }} />
              Adicionar Escrevente
            </Button>
          </div>
        </form>
      </Card>

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <Card title={`Lista de Escreventes (${escreventes.length})`}>
          {loading ? (
            <p className="text-center text-secondary py-lg">Carregando...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--spacing-md)' }}>Nome</th>
                    <th style={{ padding: 'var(--spacing-md)' }}>Usuário Vinculado</th>
                    <th style={{ padding: 'var(--spacing-md)' }}>Status</th>
                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {escreventes.map((e) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: 'var(--spacing-md)' }}>{e.nome}</td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <select
                          value={e.user_id || ''}
                          onChange={(evt) => handleVincular(e, evt.target.value)}
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            borderColor: 'var(--border-color)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {userOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <span className={`badge badge-${e.ativo ? 'success' : 'neutral'}`}>
                          {e.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                        <Button
                          variant={e.ativo ? 'danger' : 'success'}
                          size="sm"
                          onClick={() => handleToggleStatus(e)}
                        >
                          {e.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Escreventes;
