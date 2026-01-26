import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Search, Archive } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { adminAPI } from '../../services/admin';

export function TiposEscritura() {
    const toast = useToast();
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [novoTipo, setNovoTipo] = useState('');
    const [filtro, setFiltro] = useState('');

    useEffect(() => {
        carregarTipos();
    }, []);

    async function carregarTipos() {
        try {
            setLoading(true);
            const dados = await adminAPI.getTipos();
            setTipos(dados);
        } catch (error) {
            toast.error('Erro ao carregar tipos');
        } finally {
            setLoading(false);
        }
    }

    async function handleAdicionar(e) {
        e.preventDefault();
        if (!novoTipo.trim()) return;

        try {
            await adminAPI.createTipo(novoTipo);
            toast.success('Tipo criado com sucesso!');
            setNovoTipo('');
            carregarTipos();
        } catch (error) {
            toast.error(error.message);
        }
    }

    async function handleToggleStatus(tipo) {
        try {
            await adminAPI.updateTipo(tipo.id, {
                ativo: tipo.ativo ? 0 : 1
            });
            carregarTipos();
            toast.success(`Tipo ${tipo.ativo ? 'arquivado' : 'reativado'} com sucesso`);
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    }

    const tiposFiltrados = tipos.filter(t =>
        t.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 className="text-3xl font-bold text-primary">Tipos de Escritura</h2>
                <p className="text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                    Gerencie os tipos de escritura disponíveis no sistema
                </p>
            </div>

            <div className="grid grid-cols-2 gap-lg" style={{ alignItems: 'start' }}>
                <Card title="Novo Tipo">
                    <form onSubmit={handleAdicionar} style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Input
                            placeholder="Nome do Tipo (ex: Compra e Venda)"
                            value={novoTipo}
                            onChange={(e) => setNovoTipo(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Button type="submit" variant="primary">
                            <Plus size={18} style={{ marginRight: '8px' }} />
                            Adicionar
                        </Button>
                    </form>
                </Card>

                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Search size={20} className="text-secondary" />
                        <Input
                            placeholder="Buscar tipos..."
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                            style={{ border: 'none', boxShadow: 'none' }}
                        />
                    </div>
                </Card>
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <Card title={`Lista de Tipos (${tiposFiltrados.length})`}>
                    {loading ? (
                        <p className="text-center text-secondary py-lg">Carregando...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                        <th style={{ padding: 'var(--spacing-md)' }}>Nome</th>
                                        <th style={{ padding: 'var(--spacing-md)' }}>Status</th>
                                        <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tiposFiltrados.map((tipo) => (
                                        <tr key={tipo.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: 'var(--spacing-md)' }}>
                                                {tipo.nome}
                                            </td>
                                            <td style={{ padding: 'var(--spacing-md)' }}>
                                                <span className={`badge badge-${tipo.ativo ? 'success' : 'neutral'}`}>
                                                    {tipo.ativo ? 'Ativo' : 'Arquivado'}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                                <Button
                                                    variant={tipo.ativo ? 'danger' : 'success'}
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(tipo)}
                                                    title={tipo.ativo ? 'Arquivar' : 'Reativar'}
                                                >
                                                    {tipo.ativo ? <Archive size={16} /> : <Check size={16} />}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {tiposFiltrados.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center text-secondary" style={{ padding: 'var(--spacing-lg)' }}>
                                                Nenhum tipo encontrado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default TiposEscritura;
