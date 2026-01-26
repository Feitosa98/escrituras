import React, { useState } from 'react';
import { Moon, Sun, FileText, Shield, LogOut, User } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import TermosDeUso from '../legal/TermosDeUso';
import PoliticaPrivacidade from '../legal/PoliticaPrivacidade';
import logoFeitosa from '../../assets/logo-feitosa.png';
import '../../styles/index.css';

export function Header({ toggleTheme, isDark, user, onLogout }) {
    const [showTermos, setShowTermos] = useState(false);
    const [showPrivacidade, setShowPrivacidade] = useState(false);

    const getRoleBadge = (role) => {
        const variants = {
            'admin': 'danger',
            'editor': 'warning',
            'visualizador': 'secondary'
        };
        const labels = {
            'admin': 'Admin',
            'editor': 'Editor',
            'visualizador': 'Visualizador'
        };
        return <Badge variant={variants[role]}>{labels[role]}</Badge>;
    };

    return (
        <>
            <header style={{
                backgroundColor: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
                padding: 'var(--spacing-md) var(--spacing-xl)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <img
                        src={logoFeitosa}
                        alt="Feitosa Soluções em Informática"
                        style={{ height: '40px', width: 'auto' }}
                    />
                    <div>
                        <h1 className="text-xl font-bold text-primary">Controle de Escrituras</h1>
                        <p className="text-xs text-secondary">Sistema de Gerenciamento</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    {/* Informações do usuário */}
                    {user && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <User size={16} color="var(--text-secondary)" />
                            <div>
                                <p className="text-sm font-bold text-primary">{user.nome}</p>
                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
                                    {getRoleBadge(user.role)}
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTermos(true)}
                            icon={FileText}
                            title="Termos de Uso"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPrivacidade(true)}
                            icon={Shield}
                            title="Política de Privacidade"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleTheme}
                            icon={isDark ? Sun : Moon}
                            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
                        />
                        {user && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onLogout}
                                icon={LogOut}
                                title="Sair"
                            />
                        )}
                    </div>
                </div>
            </header>

            <TermosDeUso isOpen={showTermos} onClose={() => setShowTermos(false)} />
            <PoliticaPrivacidade isOpen={showPrivacidade} onClose={() => setShowPrivacidade(false)} />
        </>
    );
}

export default Header;
