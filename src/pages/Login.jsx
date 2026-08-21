import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, FileSearch, Landmark, LockKeyhole, UserRound } from 'lucide-react';
import { authAPI } from '../services/api';
import '../styles/auth-public.css';

export function Login({ onLoginSuccess }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login(usuario, senha);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onLoginSuccess?.(response.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível entrar. Confira seus dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="access-shell">
      <div className="access-shell__orb access-shell__orb--one" />
      <div className="access-shell__orb access-shell__orb--two" />
      <div className="access-panel">
      <section className="access-brand" aria-label="Cartório Santiago">
        <div className="access-brand__glow access-brand__glow--one" />
        <div className="access-brand__glow access-brand__glow--two" />
        <div className="access-brand__top">
          <img className="access-brand__mark" src="/logo-mark.jpg" alt="Cartório Santiago" />
          <div><p className="access-brand__name">Cartório Santiago</p><p className="access-brand__eyebrow">Gestão Notarial</p></div>
        </div>
        <div className="access-brand__content">
          <span className="access-pill"><Landmark size={15} /> Excelência notarial</span>
          <h1>Gestão segura.<br /><em>Atendimento eficiente.</em></h1>
          <p>Um ambiente centralizado para organizar atos, acompanhar processos e manter a rotina do cartório sempre sob controle.</p>
        </div>
        <p className="access-brand__footer">1º Tabelionato de Notas · Manacapuru, Princesinha do Solimões</p>
      </section>

      <section className="access-form-side">
        <div className="access-mobile-brand">
          <img src="/logo-mark.jpg" alt="" />
          <div><strong>Cartório Santiago</strong><span>Gestão Notarial</span></div>
        </div>
        <div className="access-form-wrap">
          <header className="access-form-header">
            <span className="access-form-kicker">Área interna</span>
            <h2>Bem-vindo de volta</h2>
            <p>Informe suas credenciais para acessar o sistema.</p>
          </header>
          <form className="access-form" onSubmit={handleSubmit} autoComplete="off">
            <label className="access-field">
              <span>Usuário</span>
              <div className="access-input-wrap">
                <UserRound size={19} />
                <input
                  type="text"
                  name="cartorio-usuario"
                  value={usuario}
                  onChange={(event) => setUsuario(event.target.value.toLowerCase())}
                  placeholder="nome.sobrenome"
                  pattern="[a-z0-9]+\.[a-z0-9]+"
                  title="Use o primeiro e o último nome separados por ponto. Exemplo: iago.feitosa"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  autoFocus
                  required
                />
              </div>
            </label>
            <label className="access-field">
              <span>Senha</span>
              <div className="access-input-wrap">
                <LockKeyhole size={19} />
                <input name="cartorio-senha" type={showPassword ? 'text' : 'password'} value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Digite sua senha" autoComplete="current-password" required />
                <button className="access-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && <div className="access-error" role="alert">{error}</div>}
            <button className="access-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Validando acesso...' : 'Entrar no sistema'}</span>{!loading && <ArrowRight size={19} />}
            </button>
          </form>
          <div className="access-divider"><span>ou</span></div>
          <Link className="access-public-link" to="/consulta">
            <span className="access-public-link__icon"><FileSearch size={20} /></span>
            <span><strong>Acompanhar ato notarial</strong><small>Acesso público para requerentes</small></span>
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="access-form-footer">
          <span>© 2026 Cartório Santiago</span>
          <span className="access-legal-links"><Link to="/termos">Termos</Link><Link to="/privacidade">Privacidade</Link><Link to="/lgpd">LGPD</Link></span>
        </div>
      </section>
      </div>
    </main>
  );
}

export default Login;
