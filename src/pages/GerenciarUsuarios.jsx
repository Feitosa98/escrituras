import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Shield } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { usersAPI } from '../services/api';
import '../styles/index.css';

export function GerenciarUsuarios() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    username: '',
    senha: '',
    role: 'visualizador',
    ativo: true,
    access_start: '07:50',
    access_end: '18:30',
  });

  function usernameFromName(nome) {
    const parts = String(nome || '').trim().split(/\s+/).filter(Boolean);
    const clean = (value) => String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!parts.length) return '';
    return `${clean(parts[0])}.${clean(parts.at(-1) || 'usuario')}`;
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    setEditingUser(null);
    setFormData({
      nome: '',
      username: '',
      senha: '',
      role: 'visualizador',
      ativo: true,
      access_start: '07:50',
      access_end: '18:30',
    });
    setModalOpen(true);
  }

  function handleEdit(user) {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      username: user.username || '',
      senha: '',
      role: user.role,
      ativo: user.ativo,
      access_start: user.access_start || '07:50',
      access_end: user.access_end || '18:30',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, formData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await usersAPI.create(formData);
        toast.success('Usuário criado com sucesso!');
      }

      setModalOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar usuário');
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Deseja desativar o acesso de ${user.nome}? O histórico será preservado.`)) {
      return;
    }

    try {
      await usersAPI.delete(user.id);
      toast.success('Usuário desativado com sucesso!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      toast.error(error.response?.data?.error || 'Erro ao desativar usuário');
    }
  }

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'danger',
      editor: 'warning',
      visualizador: 'secondary',
    };
    const labels = { admin: 'ADM', editor: 'Coordenador', visualizador: 'Escrevente' };
    return <Badge variant={variants[role]}>{labels[role] || role}</Badge>;
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', display: 'flex', justifyContent: 'center' }}>
        <div className="loading" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gerenciar Usuários</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            {users.length} {users.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleNew}>
          Novo Usuário
        </Button>
      </div>

      <Card>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário</th>
                <th>Nível</th>
                <th>Horário</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.nome}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{user.username}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{user.access_start} às {user.access_end}</td>
                  <td>
                    <Badge variant={user.ativo ? 'success' : 'secondary'}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => handleEdit(user)}
                        title="Editar"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(user)}
                        title="Desativar acesso"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Input
              label="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({
                ...formData,
                nome: e.target.value,
                username: editingUser ? formData.username : usernameFromName(e.target.value),
              })}
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Input
              label="Usuário (nome.sobrenome)"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              placeholder="iago.feitosa"
              hint="Este é o login de acesso. Não é necessário informar e-mail."
              autoComplete="username"
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Input
              label={editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              required={!editingUser}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Select
              label="Nível de acesso"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="visualizador">Escrevente</option>
              <option value="editor">Coordenador</option>
              <option value="admin">ADM</option>
            </Select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <Input
              label="Acesso a partir de"
              type="time"
              value={formData.access_start}
              onChange={(e) => setFormData({ ...formData, access_start: e.target.value })}
              required
            />
            <Input
              label="Acesso até"
              type="time"
              value={formData.access_end}
              onChange={(e) => setFormData({ ...formData, access_end: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label className="flex items-center gap-sm">
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              />
              <span className="text-sm text-primary">Usuário ativo</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingUser ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default GerenciarUsuarios;
