import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Users, Award, Calendar, ChevronRight, BarChart2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { metasAPI } from '../services/metas';
import { adminAPI } from '../services/admin';
import { getUser, hasPermission } from '../services/api';
import '../styles/index.css';

export function Metas() {
    const toast = useToast();
    const user = getUser();
    const isAdmin = hasPermission('admin');

    // Estado
    const [activeTab, setActiveTab] = useState('individual'); // individual, equipe, config
    const [loading, setLoading] = useState(true);
    const [mes, setMes] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
    const [ano, setAno] = useState(new Date().getFullYear());

    // Dados
    const [relatorioIndividual, setRelatorioIndividual] = useState(null);
    const [relatorioEquipe, setRelatorioEquipe] = useState(null);
    const [ranking, setRanking] = useState([]);
    const [projecao, setProjecao] = useState(null);
    const [metaConfig, setMetaConfig] = useState(null);

    // Configuração (Admin)
    const [novaMetaTotal, setNovaMetaTotal] = useState('');
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        carregarDados();
    }, [mes, ano, activeTab]);

    async function carregarDados() {
        try {
            setLoading(true);

            if (activeTab === 'individual') {
                const dados = await metasAPI.getRelatorioIndividual(user.id, mes, ano);
                setRelatorioIndividual(dados);

                // Carregar projeção também
                const proj = await metasAPI.getProjecao(mes, ano);
                setProjecao(proj);
            }
            else if (activeTab === 'equipe') {
                const dados = await metasAPI.getRelatorioEquipe(mes, ano);
                setRelatorioEquipe(dados);

                const rank = await metasAPI.getRanking(mes, ano);
                setRanking(rank);
            }
            else if (activeTab === 'config' && isAdmin) {
                // Carregar meta atual e usuários para configuração
                try {
                    const meta = await metasAPI.getMeta(mes, ano);
                    setMetaConfig(meta);
                    if (meta) setNovaMetaTotal(meta.meta_total);
                } catch (e) {
                    setMetaConfig(null);
                    setNovaMetaTotal('');
                }

                const users = await adminAPI.getUsers();
                setUsersList(users.filter(u => u.ativo));
            }
        } catch (error) {
            console.error(error);
            // Silenciar erro 404 de meta não encontrada na config, é normal
            if (activeTab !== 'config') {
                toast.error('Erro ao carregar dados de metas');
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSalvarMeta(e) {
        e.preventDefault();
        try {
            if (!novaMetaTotal) return;

            // Distribuir igualmente por padrão
            const metaPorPessoa = Math.floor(parseInt(novaMetaTotal) / usersList.length);
            const metasIndividuais = usersList.map(u => ({
                userId: u.id,
                quantidade: metaPorPessoa
            }));

            await metasAPI.setMeta({
                mes,
                ano,
                metaTotal: parseInt(novaMetaTotal),
                metasIndividuais
            });

            toast.success('Meta definida com sucesso!');
            carregarDados();
        } catch (error) {
            toast.error(error.message);
        }
    }

    const ProgressBar = ({ percentual, color = 'primary' }) => (
        <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: 'var(--border-color)',
            borderRadius: '5px',
            overflow: 'hidden',
            marginTop: '8px'
        }}>
            <div style={{
                width: `${Math.min(percentual, 100)}%`,
                height: '100%',
                backgroundColor: percentual >= 100 ? 'var(--success-500)' : `var(--${color}-500)`,
                borderRadius: '5px',
                transition: 'width 0.5s ease-in-out'
            }} />
        </div>
    );

    const StatCard = ({ title, value, subtext, icon: Icon, color = 'primary' }) => (
        <div className="card" style={{ padding: 'var(--spacing-lg)', borderLeft: `4px solid var(--${color}-500)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <label className="text-secondary text-sm font-medium">{title}</label>
                    <h3 className="text-2xl font-bold mt-1">{value}</h3>
                    {subtext && <p className="text-sm text-secondary mt-1">{subtext}</p>}
                </div>
                <div style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: `var(--${color}-100)`,
                    color: `var(--${color}-600)`
                }}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 className="text-3xl font-bold text-primary">Relatórios de Metas</h2>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)', alignItems: 'center' }}>
                    <Select value={mes} onChange={e => setMes(e.target.value)} style={{ width: '150px' }}>
                        <option value="01">Janeiro</option>
                        <option value="02">Fevereiro</option>
                        <option value="03">Março</option>
                        <option value="04">Abril</option>
                        <option value="05">Maio</option>
                        <option value="06">Junho</option>
                        <option value="07">Julho</option>
                        <option value="08">Agosto</option>
                        <option value="09">Setembro</option>
                        <option value="10">Outubro</option>
                        <option value="11">Novembro</option>
                        <option value="12">Dezembro</option>
                    </Select>
                    <Select value={ano} onChange={e => setAno(e.target.value)} style={{ width: '100px' }}>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </Select>
                </div>
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                <Button
                    variant={activeTab === 'individual' ? 'primary' : 'secondary'}
                    onClick={() => setActiveTab('individual')}
                >
                    <Users size={18} style={{ marginRight: '8px' }} />
                    Minha Produção
                </Button>
                <Button
                    variant={activeTab === 'equipe' ? 'primary' : 'secondary'}
                    onClick={() => setActiveTab('equipe')}
                >
                    <BarChart2 size={18} style={{ marginRight: '8px' }} />
                    Relatório de Equipe
                </Button>
                {isAdmin && (
                    <Button
                        variant={activeTab === 'config' ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab('config')}
                    >
                        <Target size={18} style={{ marginRight: '8px' }} />
                        Configurar Metas
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-xl"><div className="loading" /></div>
            ) : (
                <>
                    {/* VISÃO INDIVIDUAL */}
                    {activeTab === 'individual' && relatorioIndividual && (
                        <div className="grid grid-cols-1 gap-lg">
                            <div className="grid grid-cols-3 gap-md">
                                <StatCard
                                    title="Minha Meta"
                                    value={relatorioIndividual.meta}
                                    icon={Target}
                                    subtext="Escrituras/mês"
                                />
                                <StatCard
                                    title="Realizado"
                                    value={relatorioIndividual.producao}
                                    icon={TrendingUp}
                                    color={relatorioIndividual.status === 'superou' ? 'success' : relatorioIndividual.status === 'atingiu' ? 'primary' : 'warning'}
                                    subtext={`${relatorioIndividual.percentual}% da meta`}
                                />
                                <StatCard
                                    title="Projeção"
                                    value={projecao?.projecaoFimMes || '-'}
                                    icon={Calendar}
                                    color="gray"
                                    subtext="Estimativa final"
                                />
                            </div>

                            <Card title="Progresso Mensal">
                                <div style={{ padding: 'var(--spacing-md) 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span className="font-medium">{relatorioIndividual.producao} / {relatorioIndividual.meta} escrituras</span>
                                        <Badge variant={relatorioIndividual.status === 'superou' ? 'success' : relatorioIndividual.status === 'atingiu' ? 'primary' : 'warning'}>
                                            {relatorioIndividual.status === 'superou' ? 'Superou a Meta!' : relatorioIndividual.status === 'atingiu' ? 'Meta Atingida' : 'Em andamento'}
                                        </Badge>
                                    </div>
                                    <ProgressBar percentual={relatorioIndividual.percentual} />

                                    <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
                                        <h4 className="font-bold mb-2">Comparativo</h4>
                                        <p className="text-secondary">
                                            Vs. Mês Anterior:
                                            <span style={{
                                                color: relatorioIndividual.variacao >= 0 ? 'var(--success-500)' : 'var(--danger-500)',
                                                fontWeight: 'bold',
                                                marginLeft: '8px'
                                            }}>
                                                {relatorioIndividual.variacao > 0 ? '+' : ''}{relatorioIndividual.variacao}%
                                            </span>
                                            <span className="text-secondary text-sm ml-2">({relatorioIndividual.producaoAnterior} escrituras)</span>
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* VISÃO EQUIPE */}
                    {activeTab === 'equipe' && relatorioEquipe && (
                        <div className="grid grid-cols-1 gap-lg">
                            <div className="grid grid-cols-4 gap-md">
                                <StatCard title="Meta do Cartório" value={relatorioEquipe.meta} icon={Target} />
                                <StatCard
                                    title="Total Realizado"
                                    value={relatorioEquipe.producao}
                                    icon={Users}
                                    subtext={`${relatorioEquipe.percentual}% da meta`}
                                    color={relatorioEquipe.status === 'superou' ? 'success' : 'primary'}
                                />
                                <StatCard title="Média/Pessoa" value={relatorioEquipe.mediaPorPessoa} icon={BarChart2} color="gray" />
                                <StatCard
                                    title="Vs. Mês Anterior"
                                    value={`${relatorioEquipe.variacao > 0 ? '+' : ''}${relatorioEquipe.variacao}%`}
                                    icon={TrendingUp}
                                    color={relatorioEquipe.variacao >= 0 ? 'success' : 'danger'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-lg" style={{ alignItems: 'start' }}>
                                <Card title="Ranking de Produtividade">
                                    <div className="table-container">
                                        <table style={{ width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '50px' }}>#</th>
                                                    <th>Escrevente</th>
                                                    <th className="text-right">Produção</th>
                                                    <th className="text-right">% Meta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ranking.map((r, index) => (
                                                    <tr key={r.id}>
                                                        <td>
                                                            {index < 3 ? (
                                                                <span style={{ fontSize: '1.2rem' }}>{['🥇', '🥈', '🥉'][index]}</span>
                                                            ) : (
                                                                <span className="text-secondary font-bold pl-2">{index + 1}</span>
                                                            )}
                                                        </td>
                                                        <td className="font-medium">{r.nome}</td>
                                                        <td className="text-right font-bold">{r.producao}</td>
                                                        <td className="text-right">
                                                            <Badge variant={r.percentual >= 100 ? 'success' : r.percentual >= 80 ? 'primary' : 'neutral'}>
                                                                {r.percentual}%
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                <div className="flex flex-col gap-lg">
                                    <Card title="Top 5 Tipos de Escritura">
                                        {relatorioEquipe.distribuicaoPorTipo.slice(0, 5).map((tipo, idx) => (
                                            <div key={idx} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span className="text-sm">{tipo.tipo}</span>
                                                <span className="font-bold text-sm">{tipo.quantidade}</span>
                                            </div>
                                        ))}
                                    </Card>

                                    <Card title="Progresso da Equipe">
                                        <div className="text-center py-md">
                                            <h3 className="text-4xl font-bold mb-2 text-primary">{relatorioEquipe.percentual}%</h3>
                                            <p className="text-secondary mb-4">da meta mensal atingida</p>
                                            <ProgressBar percentual={relatorioEquipe.percentual} color="success" />
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONFIGURAÇÃO (ADMIN) */}
                    {activeTab === 'config' && isAdmin && (
                        <div className="grid grid-cols-1 gap-lg text-left">
                            <Card title={`Configurar Meta: ${mes}/${ano}`}>
                                <form onSubmit={handleSalvarMeta}>
                                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <Input
                                            label="Meta Total do Cartório"
                                            type="number"
                                            value={novaMetaTotal}
                                            onChange={e => setNovaMetaTotal(e.target.value)}
                                            placeholder="Ex: 200"
                                            required
                                        />
                                        <p className="text-sm text-secondary mt-2">
                                            A meta será distribuída igualmente entre os {usersList.length} usuários ativos
                                            ({usersList.length > 0 ? Math.floor((parseInt(novaMetaTotal) || 0) / usersList.length) : 0} por pessoa).
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
                                        <Button type="submit" variant="primary" icon={Target}>
                                            Salvar Meta
                                        </Button>
                                    </div>
                                </form>
                            </Card>

                            {metaConfig && (
                                <Card title="Metas Individuais Atuais">
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Usuário</th>
                                                    <th>Meta Atual</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {metaConfig.metas_individuais.map(m => (
                                                    <tr key={m.id}>
                                                        <td>{m.user_nome}</td>
                                                        <td>
                                                            <Badge variant="primary">{m.meta_quantidade}</Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Metas;
