import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import TermosDeUso from '../legal/TermosDeUso';
import PoliticaPrivacidade from '../legal/PoliticaPrivacidade';
import '../../styles/index.css';

export function Footer() {
    const [showTermos, setShowTermos] = useState(false);
    const [showPrivacidade, setShowPrivacidade] = useState(false);

    return (
        <>
            <footer style={{
                backgroundColor: 'var(--bg-primary)',
                borderTop: '1px solid var(--border-color)',
                padding: 'var(--spacing-lg) var(--spacing-xl)',
                marginTop: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-md)'
                }}>
                    <div>
                        <p className="text-sm text-secondary">
                            © 2026 Sistema de Controle de Escrituras
                        </p>
                        <p className="text-xs text-secondary" style={{ marginTop: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                            Desenvolvido com <Heart size={12} color="var(--danger-500)" fill="var(--danger-500)" /> por
                            <strong style={{ marginLeft: '4px' }}>Iago Feitosa</strong>
                        </p>
                        <p className="text-xs text-secondary">
                            Feitosa Soluções em Informática
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <button
                            onClick={() => setShowTermos(true)}
                            className="text-sm text-secondary"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Termos de Uso
                        </button>
                        <button
                            onClick={() => setShowPrivacidade(true)}
                            className="text-sm text-secondary"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Política de Privacidade
                        </button>
                    </div>
                </div>
            </footer>

            <TermosDeUso isOpen={showTermos} onClose={() => setShowTermos(false)} />
            <PoliticaPrivacidade isOpen={showPrivacidade} onClose={() => setShowPrivacidade(false)} />
        </>
    );
}

export default Footer;
