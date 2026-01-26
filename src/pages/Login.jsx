import React, { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authAPI } from '../services/api';
import logoFeitosa from '../assets/logo-feitosa.png';
import '../styles/index.css';

export function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, senha);

            // Salvar token e usuário
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Callback de sucesso
            if (onLoginSuccess) {
                onLoginSuccess(response.user);
            }
        } catch (err) {
            console.error('Erro no login:', err);
            setError(err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-secondary)',
            padding: 'var(--spacing-xl)'
        }}>
            <Card style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <img
                        src={logoFeitosa}
                        alt="Feitosa Soluções em Informática"
                        style={{ height: '60px', marginBottom: 'var(--spacing-md)' }}
                    />
                    <h1 className="text-2xl font-bold text-primary">Sistema de Escrituras</h1>
                    <p className="text-sm text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                        Faça login para continuar
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <Input
                            label="Senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--danger-100)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <AlertCircle size={20} color="var(--danger-600)" />
                            <p className="text-sm" style={{ color: 'var(--danger-600)' }}>
                                {error}
                            </p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={loading}
                        icon={LogIn}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                <div style={{
                    marginTop: 'var(--spacing-xl)',
                    paddingTop: 'var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <p className="text-xs text-secondary">
                        Usuário padrão: <strong>admin@sistema.local</strong><br />
                        Senha padrão: <strong>admin123</strong>
                    </p>
                </div>
            </Card>
        </div>
    );
}

export default Login;
