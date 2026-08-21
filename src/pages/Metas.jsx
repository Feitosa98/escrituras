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
  const [activeTab, setActiveTab] = useState(isAdmin ? 'equipe' : 'individual'); // individual, equipe, config
  const [loading, setLoading] = useState(true);
  const [trimestre, setTrimestre] = useState(`T${Math.ceil((new Date().getMonth() + 1) / 3)}`);
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
  }, [trimestre, ano, activeTab]);

  async function carregarDados() {
    try {
      setLoading(true);

      if (activeTab === 'individual') {
        const dados = await metasAPI.getRelatorioIndividual(user.id, trimestre, ano);
        setRelatorioIndividual(dados);

        // Carregar projeção também
        const proj = await metasAPI.getProjecao(trimestre, ano);
        setProjecao(proj);
      } else if (activeTab === 'equipe') {
        const dados = await metasAPI.getRelatorioEquipe(trimestre, ano);
        setRelatorioEquipe(dados);

        const rank = await metasAPI.getRanking(trimestre, ano);
        setRanking(rank);
      } else if (activeTab === 'config' && isAdmin) {
        // Carregar meta atual e usuários para configuração
        try {
          const meta = await metasAPI.getMeta(trimestre, ano);
          setMetaConfig(meta);
          if (meta) setNovaMetaTotal(meta.meta_total);
        } catch (e) {
          setMetaConfig(null);
          setNovaMetaTotal('');
        }

        const users = await adminAPI.getUsers();
        setUsersList(users.filter((u) => u.ativo && u.role !== 'admin'));
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

      if (usersList.length === 0) {
        toast.error('Cadastre ao menos um escrevente ou coordenador ativo.');
        return;
      }
      const total = parseInt(novaMetaTotal);
      const metaPorPessoa = Math.floor(total / usersList.length);
      const resto = total % usersList.length;
      const metasIndividuais = usersList.map((u, index) => ({
        userId: u.id,
        quantidade: metaPorPessoa + (index < resto ? 1 : 0),
      }));

      await metasAPI.setMeta({
        trimestre,
        ano,
        metaTotal: total,
        metasIndividuais,
      });

      toast.success('Meta trimestral definida com sucesso!');
      carregarDados();
    } catch (error) {
      toast.error(error.message);
    }
  }

  const ProgressBar = ({ percentual, color = 'primary' }) => (
    <div
      style={{
        width: '100%',
        height: '10px',
        backgroundColor: 'var(--border-color)',
        borderRadius: '5px',
        overflow: 'hidden',
        marginTop: '8px',
      }}
    >
      <div
        style={{
          width: `${Math.min(percentual, 100)}%`,
          height: '100%',
          backgroundColor: percentual >= 100 ? 'var(--success-500)' : `var(--${color}-500)`,
          borderRadius: '5px',
          transition: 'width 0.5s ease-in-out',
        }}
      />
    </div>
  );

  const StatCard = ({ title, value, subtext, icon: Icon, color = 'primary' }) => (
    <div
      className="card"
      style={{ padding: 'var(--spacing-lg)', borderLeft: `4px solid var(--${color}-500)` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <label className="text-secondary text-sm font-medium">{title}</label>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {subtext && <p className="text-sm text-secondary mt-1">{subtext}</p>}
        </div>
        <div
          style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: `var(--${color}-100)`,
            color: `var(--${color}-600)`,
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Relatórios de Metas</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            Acompanhe a produção individual e da equipe a cada três meses
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <Select value={trimestre} onChange={(e) => setTrimestre(e.target.value)} style={{ width: '190px' }}>
            <option value="T1">1º trimestre · Jan–Mar</option>
            <option value="T2">2º trimestre · Abr–Jun</option>
            <option value="T3">3º trimestre · Jul–Set</option>
            <option value="T4">4º trimestre · Out–Dez</option>
          </Select>
          <Select value={ano} onChange={(e) => setAno(e.target.value)} style={{ width: '100px' }}>
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
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
        <div className="text-center py-xl">
          <div className="loading" />
        </div>
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
                  subtext="Escrituras/trimestre"
                />
                <StatCard
                  title="Realizado"
                  value={relatorioIndividual.producao}
                  icon={TrendingUp}
                  color={
                    relatorioIndividual.status === 'superou'
                      ? 'success'
                      : relatorioIndividual.status === 'atingiu'
                        ? 'primary'
                        : 'warning'
                  }
                  subtext={`${relatorioIndividual.percentual}% da meta`}
                />
                <StatCard
                  title="Projeção"
                  value={projecao?.projecaoFimTrimestre ?? '-'}
                  icon={Calendar}
                  color="gray"
                  subtext="Estimativa final"
                />
              </div>

              <Card title="Progresso Trimestral">
                <div style={{ padding: 'var(--spacing-md) 0' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span className="font-medium">
                      {relatorioIndividual.producao} / {relatorioIndividual.meta} escrituras
                    </span>
                    <Badge
                      variant={
                        relatorioIndividual.status === 'superou'
                          ? 'success'
                          : relatorioIndividual.status === 'atingiu'
                            ? 'primary'
                            : 'warning'
                      }
                    >
                      {relatorioIndividual.status === 'superou'
                        ? 'Superou a Meta!'
                        : relatorioIndividual.status === 'atingiu'
                          ? 'Meta Atingida'
                          : 'Em andamento'}
                    </Badge>
                  </div>
                  <ProgressBar percentual={relatorioIndividual.percentual} />

                  <div
                    style={{
                      marginTop: 'var(--spacing-lg)',
                      padding: 'var(--spacing-md)',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: '8px',
                    }}
                  >
                    <h4 className="font-bold mb-2">Comparativo</h4>
                    <p className="text-secondary">
                      Vs. Trimestre Anterior:
                      <span
                        style={{
                          color:
                            relatorioIndividual.variacao >= 0
                              ? 'var(--success-500)'
                              : 'var(--danger-500)',
                          fontWeight: 'bold',
                          marginLeft: '8px',
                        }}
                      >
                        {relatorioIndividual.variacao > 0 ? '+' : ''}
                        {relatorioIndividual.variacao}%
                      </span>
                      <span className="text-secondary text-sm ml-2">
                        ({relatorioIndividual.producaoAnterior} escrituras)
                      </span>
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
                <StatCard
                  title="Média/Pessoa"
                  value={relatorioEquipe.mediaPorPessoa}
                  icon={BarChart2}
                  color="gray"
                />
                <StatCard
                  title="Vs. Trimestre Anterior"
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
                                <span style={{ fontSize: '1.2rem' }}>
                                  {['🥇', '🥈', '🥉'][index]}
                                </span>
                              ) : (
                                <span className="text-secondary font-bold pl-2">{index + 1}</span>
                              )}
                            </td>
                            <td className="font-medium">{r.nome}</td>
                            <td className="text-right font-bold">{r.producao}</td>
                            <td className="text-right">
                              <Badge
                                variant={
                                  r.percentual >= 100
                                    ? 'success'
                                    : r.percentual >= 80
                                      ? 'primary'
                                      : 'neutral'
                                }
                              >
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
                      <div
                        key={idx}
                        style={{
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span className="text-sm">{tipo.tipo}</span>
                        <span className="font-bold text-sm">{tipo.quantidade}</span>
                      </div>
                    ))}
                  </Card>

                  <Card title="Progresso da Equipe">
                    <div className="text-center py-md">
                      <h3 className="text-4xl font-bold mb-2 text-primary">
                        {relatorioEquipe.percentual}%
                      </h3>
                      <p className="text-secondary mb-4">da meta trimestral atingida</p>
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
              <Card title={`Configurar Meta: ${trimestre}/${ano}`}>
                <form onSubmit={handleSalvarMeta}>
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <Input
                      label="Meta Trimestral do Cartório"
                      type="number"
                      value={novaMetaTotal}
                      onChange={(e) => setNovaMetaTotal(e.target.value)}
                      placeholder="Ex: 200"
                      required
                    />
                    <p className="text-sm text-secondary mt-2">
                      A meta será distribuída de forma equilibrada entre {usersList.length} escreventes e coordenadores ativos.
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 'var(--spacing-md)',
                    }}
                  >
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
                        {metaConfig.metas_individuais.map((m) => (
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
