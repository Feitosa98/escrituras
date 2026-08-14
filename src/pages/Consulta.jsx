import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CalendarDays,
  CheckCircle2, ChevronDown, ChevronUp, Clock3, FileSearch, FileText,
  LockKeyhole, RefreshCw, Search, ShieldCheck, UserRound,
} from 'lucide-react';
import '../styles/auth-public.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const STATUS_CONFIG = {
  'Aguardando cliente': { color: '#b7791f', bg: '#fff8e8', border: '#efd59a', icon: AlertCircle, label: 'Aguardando o cliente', desc: 'O cartório aguarda documentos ou informações para continuar.' },
  'Em andamento': { color: '#1d5f91', bg: '#eef7fd', border: '#b9daef', icon: Clock3, label: 'Em andamento', desc: 'O ato está sendo preparado pela equipe do cartório.' },
  'Concluído': { color: '#13715a', bg: '#ecf9f4', border: '#a9ddcc', icon: CheckCircle2, label: 'Concluído', desc: 'O ato notarial foi concluído.' },
};

function formatDate(value, withTime = true) {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return date.toLocaleDateString('pt-BR', withTime ? { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' } : undefined);
}

function InfoCard({ icon: Icon, label, value, wide = false }) {
  return (
    <div className={`track-info ${wide ? 'track-info--wide' : ''}`}>
      <span className="track-info__icon"><Icon size={17} /></span>
      <div><small>{label}</small><strong>{value || '—'}</strong></div>
    </div>
  );
}

function History({ items }) {
  const [expanded, setExpanded] = useState(false);
  if (!items?.length) return null;
  const visible = expanded ? items : items.slice(0, 3);
  return (
    <section className="track-history">
      <button type="button" className="track-section-title" onClick={() => setExpanded((value) => !value)}>
        <span>Histórico do atendimento</span><small>{items.length} movimentações</small>{expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>
      <div className="track-timeline">
        {visible.map((item, index) => (
          <div className="track-timeline__item" key={`${item.created_at}-${index}`}>
            <span className="track-timeline__dot" />
            <div>
              <strong>{item.status_novo}</strong>
              {item.observacao && <p>{item.observacao}</p>}
              <small>{item.atualizado_por ? `${item.atualizado_por} · ` : ''}{formatDate(item.created_at)}</small>
            </div>
          </div>
        ))}
      </div>
      {items.length > 3 && <button className="track-more" type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Mostrar menos' : `Ver mais ${items.length - 3} movimentações`}</button>}
    </section>
  );
}

export function Consulta() {
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConsultar(event) {
    event.preventDefault();
    const code = codigo.trim().toUpperCase();
    const password = senha.trim().toUpperCase();
    if (!code || !password) { setError('Informe o código de acompanhamento e a senha.'); return; }
    setLoading(true); setError(''); setResultado(null);
    try {
      const response = await fetch(`${API_URL}/consulta`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ codigo:code, senha:password }) });
      if (response.ok) setResultado(await response.json());
      else if (response.status === 404) setError('Código ou senha não conferem. Verifique o comprovante e tente novamente.');
      else setError('Não foi possível realizar a consulta agora. Tente novamente.');
    } catch { setError('Não foi possível conectar ao cartório. Tente novamente em instantes.'); }
    finally { setLoading(false); }
  }

  function resetSearch() { setResultado(null); setError(''); setCodigo(''); setSenha(''); }
  const status = resultado ? (STATUS_CONFIG[resultado.status] || STATUS_CONFIG['Em andamento']) : null;
  const StatusIcon = status?.icon;

  return (
    <main className="track-page">
      <header className="track-header">
        <Link className="track-logo" to="/">
          <img src="/logo-mark.jpg" alt="Cartório Santiago" />
          <span><strong>Cartório Santiago</strong><small>1º Tabelionato de Notas</small></span>
        </Link>
        <div className="track-header__actions">
          <span className="track-secure"><ShieldCheck size={15} /> Consulta segura</span>
          <Link to="/"><ArrowLeft size={15} /> Área interna</Link>
        </div>
      </header>

      <div className="track-decoration track-decoration--left" />
      <div className="track-decoration track-decoration--right" />

      <section className={`track-content ${resultado ? 'track-content--result' : ''}`}>
        {!resultado ? (
          <>
            <header className="track-intro">
              <span className="access-pill"><FileSearch size={15} /> Acompanhamento digital</span>
              <h1>Acompanhe seu ato<br /><em>com tranquilidade.</em></h1>
              <p>Consulte o andamento de forma simples, segura e sem precisar sair de casa.</p>
            </header>

            <div className="track-search-column">
              <div className="track-search-card">
                <div className="track-search-card__title"><span><Search size={21} /></span><div><h2>Consultar andamento</h2><p>Use os dados entregues pelo cartório.</p></div></div>
                <form className="track-form" onSubmit={handleConsultar}>
                  <label className="access-field">
                    <span>Código de acompanhamento</span>
                    <div className="access-input-wrap track-code-input"><FileText size={19} /><input value={codigo} onChange={(event) => setCodigo(event.target.value.toUpperCase())} placeholder="Ex.: PP202508000" maxLength={13} autoFocus required /></div>
                  </label>
                  <label className="access-field">
                    <span>Senha de acesso</span>
                    <div className="access-input-wrap"><LockKeyhole size={19} /><input value={senha} onChange={(event) => setSenha(event.target.value.toUpperCase())} placeholder="Digite a senha do comprovante" maxLength={8} required /></div>
                  </label>
                  {error && <div className="access-error track-error" role="alert"><AlertTriangle size={17} />{error}</div>}
                  <button className="access-submit" type="submit" disabled={loading}><span>{loading ? 'Consultando...' : 'Consultar acompanhamento'}</span>{loading ? <RefreshCw className="spin" size={18} /> : <ArrowRight size={19} />}</button>
                </form>
                <p className="track-privacy"><ShieldCheck size={14} /> Seus dados são usados somente para esta consulta.</p>
              </div>

              <div className="track-help"><span>Não encontrou seu código?</span><p>Consulte o comprovante entregue pelo cartório ou entre em contato com o setor responsável.</p></div>
            </div>
          </>
        ) : (
          <article className="track-result-card">
            <header className="track-result-head">
              <button type="button" onClick={resetSearch}><ArrowLeft size={17} /> Nova consulta</button>
              <span className="track-result-code"><small>Acompanhamento</small><strong>{resultado.acompanhamento_codigo}</strong></span>
            </header>
            <section className="track-status" style={{ '--status-color':status.color, '--status-bg':status.bg, '--status-border':status.border }}>
              <span><StatusIcon size={23} /></span><div><small>Status atual</small><h1>{status.label}</h1><p>{status.desc}</p></div>
            </section>
            <section className="track-details">
              <div className="track-details__title"><div><h2>Dados do ato</h2><p>Informações vinculadas ao acompanhamento.</p></div><span>Atualizado em {formatDate(resultado.updated_at)}</span></div>
              <div className="track-info-grid">
                <InfoCard icon={FileText} label="Tipo do ato" value={resultado.tipo} wide />
                <InfoCard icon={BookOpen} label="Livro" value={resultado.livro} />
                <InfoCard icon={BookOpen} label="Folha" value={resultado.folha} />
                <InfoCard icon={FileSearch} label="Protocolo interno" value={resultado.protocolo} />
                <InfoCard icon={CalendarDays} label="Data do protocolo" value={formatDate(resultado.protocolo_data || resultado.created_at, false)} />
                <InfoCard icon={UserRound} label="Outorgante" value={resultado.outorgante} wide />
                {resultado.outorgado && <InfoCard icon={UserRound} label="Outorgado" value={resultado.outorgado} wide />}
              </div>
              {resultado.observacao && <div className="track-note"><AlertCircle size={18} /><div><strong>Observação do cartório</strong><p>{resultado.observacao}</p></div></div>}
              <History items={resultado.historico} />
            </section>
          </article>
        )}
      </section>

      <footer className="track-footer"><span>© 2026 Cartório Santiago</span><span className="track-footer__legal"><Link to="/termos">Termos</Link><Link to="/privacidade">Privacidade</Link><Link to="/lgpd">LGPD</Link></span><span>Manacapuru · Amazonas</span></footer>
    </main>
  );
}

export default Consulta;
