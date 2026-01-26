import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, Users, Calendar } from 'lucide-react';
// import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Loading from '../components/ui/Loading';
import { escriturasAPI } from '../services/api';
import '../styles/index.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);
            const data = await escriturasAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div style={{ padding: 'var(--spacing-xl)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Loading size="lg" message="Carregando estatísticas..." />
            </div>
        );
    }

    // Preparar dados para gráficos
    const dadosPorTipo = Object.entries(stats.porTipo).map(([nome, valor]) => ({
        nome,
        valor
    }));

    const dadosPorEscrevente = Object.entries(stats.porEscrevente).map(([nome, valor]) => ({
        nome,
        valor
    }));

    const dadosPorMes = Object.entries(stats.porMes)
        .sort((a, b) => {
            const [mesA, anoA] = a[0].split('/');
            const [mesB, anoB] = b[0].split('/');
            return new Date(anoA, mesA) - new Date(anoB, mesB);
        })
        .slice(-12) // Últimos 12 meses
        .map(([periodo, valor]) => ({
            periodo,
            valor
        }));

    // Estatísticas comparativas (mês atual vs anterior)
    const mesAtual = dadosPorMes[dadosPorMes.length - 1]?.valor || 0;
    const mesAnterior = dadosPorMes[dadosPorMes.length - 2]?.valor || 0;
    const variacao = mesAnterior > 0 ? ((mesAtual - mesAnterior) / mesAnterior) * 100 : 0;
    const tendencia = variacao > 0 ? 'alta' : variacao < 0 ? 'baixa' : 'estavel';

    // Média mensal
    const mediaMensal = dadosPorMes.length > 0
        ? Math.round(dadosPorMes.reduce((acc, item) => acc + item.valor, 0) / dadosPorMes.length)
        : 0;

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 className="text-3xl font-bold text-primary">Dashboard</h2>
                <p className="text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                    Visão geral do controle de escrituras
                </p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-4 gap-lg" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <Card>
                    <div className="flex items-center gap-md">
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--primary-100)',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            <FileText size={24} color="var(--primary-600)" />
                        </div>
                        <div>
                            <p className="text-sm text-secondary">Total de Escrituras</p>
                            <p className="text-2xl font-bold text-primary">{stats.total}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-md">
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--success-100)',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            <Users size={24} color="var(--success-600)" />
                        </div>
                        <div>
                            <p className="text-sm text-secondary">Escreventes</p>
                            <p className="text-2xl font-bold text-primary">{Object.keys(stats.porEscrevente).length}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-md">
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--warning-100)',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            <Calendar size={24} color="var(--warning-600)" />
                        </div>
                        <div>
                            <p className="text-sm text-secondary">Tipos de Escritura</p>
                            <p className="text-2xl font-bold text-primary">{Object.keys(stats.porTipo).length}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-md">
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--danger-100)',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            <TrendingUp size={24} color="var(--danger-600)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p className="text-sm text-secondary">Este Mês</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <p className="text-2xl font-bold text-primary">{mesAtual}</p>
                                {mesAnterior > 0 && (
                                    <Badge
                                        variant={tendencia === 'alta' ? 'success' : tendencia === 'baixa' ? 'danger' : 'secondary'}
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                                    </Badge>
                                )}
                            </div>
                            {mesAnterior > 0 && (
                                <p className="text-xs text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                                    vs. mês anterior ({mesAnterior})
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* ÁREA DE GRÁFICOS SUBSTITUÍDA POR LISTAS SIMPLES PARA ESTABILIDADE */}
            <div className="grid grid-cols-2 gap-lg" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                {/* Lista por Tipo */}
                <Card title="Resumo por Tipo">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th style={{ textAlign: 'right' }}>Qtd.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dadosPorTipo.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.nome}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Badge variant="primary">{item.valor}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Lista por Escrevente */}
                <Card title="Resumo por Escrevente">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Escrevente</th>
                                    <th style={{ textAlign: 'right' }}>Qtd.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dadosPorEscrevente.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.nome}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Badge variant="success">{item.valor}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Escrituras Recentes */}
            <Card title="Escrituras Recentes">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Outorgante</th>
                                <th>Outorgado</th>
                                <th>Escrevente</th>
                                <th>Período</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!stats.recentes || stats.recentes.length === 0) ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                                        Nenhuma escritura cadastrada
                                    </td>
                                </tr>
                            ) : (
                                stats.recentes.map((escritura) => (
                                    <tr key={escritura.uuid || escritura.id}>
                                        <td>
                                            <Badge variant="primary">{escritura.tipo}</Badge>
                                        </td>
                                        <td>{escritura.outorgante}</td>
                                        <td>{escritura.outorgado}</td>
                                        <td>{escritura.escrevente}</td>
                                        <td>{escritura.mes}/{escritura.ano}</td>
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

export default Dashboard;
