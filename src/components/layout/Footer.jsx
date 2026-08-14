import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import TermosDeUso from '../legal/TermosDeUso';
import PoliticaPrivacidade from '../legal/PoliticaPrivacidade';
import AvisoLGPD from '../legal/AvisoLGPD';

export function Footer() {
  const [showTermos, setShowTermos] = useState(false);
  const [showPrivacidade, setShowPrivacidade] = useState(false);
  const [showLGPD, setShowLGPD] = useState(false);

  return (
    <>
      <footer
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          padding: '1rem 1.5rem',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              © 2026 Sistema de Controle de Escrituras
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                marginTop: '0.125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Desenvolvido com{' '}
              <Heart size={11} color="#ef4444" fill="#ef4444" />
              {' '}por <strong style={{ color: 'var(--text-secondary)' }}>Iago Feitosa</strong>
              {' '}· Feitosa Soluções em Informática
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowTermos(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8125rem', color: 'var(--text-tertiary)',
                textDecoration: 'underline', padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              Termos de Uso
            </button>
            <button
              onClick={() => setShowPrivacidade(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8125rem', color: 'var(--text-tertiary)',
                textDecoration: 'underline', padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              Política de Privacidade
            </button>
            <button
              onClick={() => setShowLGPD(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-tertiary)', textDecoration: 'underline', padding: 0 }}
            >
              LGPD
            </button>
          </div>
        </div>
      </footer>

      <TermosDeUso isOpen={showTermos} onClose={() => setShowTermos(false)} />
      <PoliticaPrivacidade isOpen={showPrivacidade} onClose={() => setShowPrivacidade(false)} />
      <AvisoLGPD isOpen={showLGPD} onClose={() => setShowLGPD(false)} />
    </>
  );
}

export default Footer;
