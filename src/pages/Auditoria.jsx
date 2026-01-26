import React, { useState, useEffect } from 'react';
import { FileText, Filter, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { auditAPI } from '../services/api';
import '../styles/index.css';

export function Auditoria() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        acao: '',
        tabela: '',
        dataInicio: '',
        dataFim: ''
    });

    useEffect(() => {
        loadLogs();
    }, []);

    async function loadLogs() {
        try {
            setLoading(true);
            const data = await auditAPI.getAll(filters);
            setLogs(data);
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleFilter() {
        loadLogs();
    }

    function clearFilters() {
        setFilters({
            acao: '',
            tabela: '',
            dataInicio: '',
            dataFim: ''
        });
    }

    const getAcaoBadge = (acao) => {
        const variants = {
            'CREATE': 'success',
            'UPDATE': 'warning',
            'DELETE': 'danger',
            'LOGIN': 'primary'
        };
        return <Badge variant={variants[acao] || 'secondary'}>{acao}</Badge>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('pt-BR');
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
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 className="text-3xl font-bold text-primary">Auditoria</h2>
                <p className="text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                    Registro de todas as ações do sistema
                </p>
            </div>

            {/* Filtros */}
            <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="grid grid-cols-4 gap-md" style={{ marginBottom: 'var(--spacing-md)' }}>
                    <Select
                        label="Ação"
                        value={filters.acao}
                        onChange={(e) => setFilters({ ...filters, acao: e.target.value })}
                    >
                        <option value="">Todas</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                        <option value="LOGIN">LOGIN</option>
                    </Select>

                    <Select
                        label="Tabela"
                        value={filters.tabela}
                        onChange={(e) => setFilters({ ...filters, tabela: e.target.value })}
                    >
                        <option value="">Todas</option>
                        <option value="users">Usuários</option>
                        <option value="escrituras">Escrituras</option>
                    </Select>

                    <Input
                        label="Data Início"
                        type="date"
                        value={filters.dataInicio}
                        onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                    />

                    <Input
                        label="Data Fim"
                        type="date"
                        value={filters.dataFim}
                        onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                    />
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Button variant="primary" icon={Filter} onClick={handleFilter}>
                        Filtrar
                    </Button>
                    <Button variant="secondary" onClick={clearFilters}>
                        Limpar Filtros
                    </Button>
                </div>
            </Card>

            {/* Tabela de Logs */}
            <Card>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Usuário</th>
                                <th>Ação</th>
                                <th>Tabela</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                                        Nenhum log encontrado
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.created_at)}</td>
                                        <td>{log.usuario_nome || 'Sistema'}</td>
                                        <td>{getAcaoBadge(log.acao)}</td>
                                        <td>{log.tabela || '-'}</td>
                                        <td className="text-sm text-secondary">{log.ip_address || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

export default Auditoria;
