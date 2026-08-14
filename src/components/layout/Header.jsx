import React, { useState } from 'react';
import { Sun, Moon, LogOut, FileText, Shield, Scale } from 'lucide-react';
import TermosDeUso from '../legal/TermosDeUso';
import PoliticaPrivacidade from '../legal/PoliticaPrivacidade';
import AvisoLGPD from '../legal/AvisoLGPD';

const ROLE_LABEL = {
  admin:        'Administrador',
  editor:       'Coordenador',
  visualizador: 'Escrevente',
};

function initials(nome) {
  if (!nome) return '?';
  return nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function Header({ toggleTheme, isDark, user, onLogout }) {
  const [showTermos, setShowTermos]         = useState(false);
  const [showPrivacidade, setShowPrivacidade] = useState(false);
  const [showLGPD, setShowLGPD] = useState(false);

  // Header usa o mesmo fundo navy do sidebar para continuidade visual
  const headerBg    = '#0f172a';
  const borderColor = 'rgba(255,255,255,0.07)';
  const textMuted   = 'rgba(255,255,255,0.4)';

  const iconStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '2rem', height: '2rem',
    borderRadius: '0.5rem', border: 'none',
    background: 'rgba(255,255,255,0.05)',
    color: textMuted,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: headerBg,
          borderBottom: `1px solid ${borderColor}`,
          boxShadow: '0 1px 12px rgba(0,0,0,0.35)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            height: '3.5rem',
            alignItems: 'center',
            justifyContent: 'flex-end',   /* ← tudo para a direita */
            paddingLeft: '1.25rem',
            paddingRight: '1.25rem',
            gap: '0.375rem',
          }}
        >
          {/* Termos de uso */}
          <button
            onClick={() => setShowTermos(true)}
            title="Termos de Uso"
            style={iconStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = textMuted; }}
          >
            <FileText size={15} />
          </button>

          {/* Política de privacidade */}
          <button
            onClick={() => setShowPrivacidade(true)}
            title="Política de Privacidade"
            style={iconStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = textMuted; }}
          >
            <Shield size={15} />
          </button>

          <button
            onClick={() => setShowLGPD(true)}
            title="Aviso LGPD"
            style={iconStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = textMuted; }}
          >
            <Scale size={15} />
          </button>

          {/* Divisor */}
          <div style={{ width: '1px', height: '1.25rem', background: borderColor, margin: '0 0.375rem' }} />

          {/* Alternador de tema */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Tema claro' : 'Tema escuro'}
            style={{
              ...iconStyle,
              background: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.08)',
              color: isDark ? '#fbbf24' : textMuted,
              borderRadius: '9999px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Divisor */}
          <div style={{ width: '1px', height: '1.25rem', background: borderColor, margin: '0 0.375rem' }} />

          {/* Usuário + logout */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>

              {/* Info texto */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>
                  {user.nome}
                </span>
                <span style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#d4a843' }}>
                  {ROLE_LABEL[user.role] || user.role}
                </span>
              </div>

              {/* Avatar com iniciais */}
              <div
                style={{
                  width: '2rem', height: '2rem',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6875rem', fontWeight: 700, color: 'white',
                  flexShrink: 0,
                  letterSpacing: '0.025em',
                }}
              >
                {initials(user.nome)}
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                title="Sair"
                style={{ ...iconStyle, background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textMuted; }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <TermosDeUso isOpen={showTermos} onClose={() => setShowTermos(false)} />
      <PoliticaPrivacidade isOpen={showPrivacidade} onClose={() => setShowPrivacidade(false)} />
      <AvisoLGPD isOpen={showLGPD} onClose={() => setShowLGPD(false)} />
    </>
  );
}

export default Header;
