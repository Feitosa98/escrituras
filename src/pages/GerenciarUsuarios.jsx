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
        email: '',
        senha: '',
        role: 'visualizador',
        ativo: true
    });

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
            email: '',
            senha: '',
            role: 'visualizador',
            ativo: true
        });
        setModalOpen(true);
    }

    function handleEdit(user) {
        setEditingUser(user);
        setFormData({
            nome: user.nome,
            email: user.email,
            senha: '',
            role: user.role,
            ativo: user.ativo
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
        if (!window.confirm(`Tem certeza que deseja excluir o usuário ${user.nome}?`)) {
            return;
        }

        try {
            await usersAPI.delete(user.id);
            toast.success('Usuário excluído com sucesso!');
            loadUsers();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            toast.error(error.response?.data?.error || 'Erro ao excluir usuário');
        }
    }

    const getRoleBadge = (role) => {
        const variants = {
            'admin': 'danger',
            'editor': 'warning',
            'visualizador': 'secondary'
        };
        return <Badge variant={variants[role]}>{role}</Badge>;
    };

    if (loading) {
        return (
            <div style={{ padding: 'var(--spacing-xl)', display: 'flex', justifyContent: 'center' }}>
                <div className="loading" style={{ width: '40px', height: '40px' }} />
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="text-3xl font-bold text-primary">Gerenciar Usuários</h2>
                    <p className="text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
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
                                <th>Email</th>
                                <th>Permissão</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.nome}</td>
                                    <td>{user.email}</td>
                                    <td>{getRoleBadge(user.role)}</td>
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
                                                title="Excluir"
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
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                            label="Permissão"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            required
                        >
                            <option value="visualizador">Visualizador</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Administrador</option>
                        </Select>
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
