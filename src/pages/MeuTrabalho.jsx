import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckSquare, Clock3, RefreshCw, UserRoundCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { useToast } from '../components/ui/Toast';
import { escriturasAPI } from '../services/api';

function localDate(value) {
  if (!value) return 'Sem prazo';
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-');
  return year && month && day ? `${day}/${month}/${year}` : raw;
}

export default function MeuTrabalho({ onView }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await escriturasAPI.getMeuTrabalho());
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível carregar seu trabalho');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <Loading size="lg" message="Organizando seu trabalho..." />;

  const resumo = data?.resumo || {};
  const cards = [
    { label: 'Atos comigo', value: resumo.atos || 0, icon: UserRoundCheck, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Atrasados', value: resumo.atrasados || 0, icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Vencem hoje', value: resumo.vencemHoje || 0, icon: Clock3, color: '#d97706', bg: '#fffbeb' },
    { label: 'Tarefas de hoje', value: resumo.tarefasHoje || 0, icon: CheckSquare, color: '#059669', bg: '#ecfdf5' },
  ];

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: '#b5882f', textTransform: 'uppercase', letterSpacing: '.1em', fontSize: '.7rem', fontWeight: 800 }}>Operação diária</p>
          <h2 style={{ fontSize: '1.65rem', color: 'var(--text-primary)', marginTop: '.2rem' }}>Meu trabalho</h2>
          <p style={{ color: 'var(--text-tertiary)', marginTop: '.3rem' }}>Atos, prazos e tarefas que precisam da sua atenção.</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={load} disabled={loading}>Atualizar</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '.85rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.8rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 42, height: 42, borderRadius: '.7rem', display: 'grid', placeItems: 'center', color, background: bg }}><Icon size={20} /></div>
            <div><p style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</p><p style={{ fontSize: '.78rem', color: 'var(--text-tertiary)' }}>{label}</p></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.65fr) minmax(300px, .85fr)', gap: '1rem', alignItems: 'start' }}>
        <Card title="Atos sob minha responsabilidade">
          {(data?.atos || []).length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Nenhum ato pendente atribuído a você.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {data.atos.map((ato) => {
                const prazo = String(ato.prazo_data || '').slice(0, 10);
                const atrasado = prazo && prazo < data.hoje;
                const total = Number(ato.checklist_total || 0);
                const done = Number(ato.checklist_concluido || 0);
                const progress = total ? Math.round((done / total) * 100) : 0;
                return (
                  <button key={ato.id} onClick={() => onView?.(ato)} style={{ width: '100%', textAlign: 'left', border: `1px solid ${atrasado ? '#fecaca' : 'var(--border-color)'}`, borderLeft: `4px solid ${atrasado ? '#dc2626' : '#1d4f7a'}`, borderRadius: '.7rem', background: 'var(--bg-primary)', padding: '.85rem 1rem', cursor: 'pointer', color: 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.75rem', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 750, color: 'var(--text-primary)' }}>{ato.protocolo || `${ato.livro}/${ato.folha}`} · {ato.tipo}</p>
                        <p style={{ fontSize: '.8rem', color: 'var(--text-tertiary)', marginTop: '.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ato.outorgante}</p>
                      </div>
                      <Badge variant={ato.status === 'Aguardando cliente' ? 'warning' : 'primary'}>{ato.status}</Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '.7rem', fontSize: '.74rem', color: atrasado ? '#dc2626' : 'var(--text-tertiary)' }}>
                      <span>{atrasado ? 'Prazo vencido: ' : 'Prazo: '}{localDate(ato.prazo_data)}</span>
                      <span>Checklist {done}/{total} ({progress}%)</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Próximas tarefas">
          {(data?.tarefas || []).length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Nenhuma tarefa pendente.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {data.tarefas.slice(0, 10).map((task) => (
                <div key={task.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '.7rem' }}>
                  <p style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '.86rem' }}>{task.titulo}</p>
                  <p style={{ fontSize: '.74rem', color: 'var(--text-tertiary)', marginTop: '.2rem' }}><CalendarDays size={12} style={{ display: 'inline', marginRight: 4 }} />{localDate(task.data_agendada)} {task.protocolo ? `· ${task.protocolo}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
