import React from 'react';
import Modal from '../components/ui/Modal';

export default function TermosDeUso({ isOpen, onClose }) {
    return (
        <Modal title="Termos de Uso do Sistema" isOpen={isOpen} onClose={onClose}>
            <div className="prose" style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>1. Aceitação dos Termos</h4>
                <p>
                    Ao acessar e utilizar o Sistema de Controle de Escrituras ("Sistema"), você concorda em cumprir estes Termos de Uso e todas as leis aplicáveis.
                    O uso do Sistema é estritamente restrito aos funcionários e colaboradores autorizados do Cartório.
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>2. Responsabilidades do Usuário</h4>
                <p>
                    Você é responsável por manter a confidencialidade de suas credenciais de acesso (login e senha).
                    Qualquer ação realizada através de sua conta será de sua inteira responsabilidade.
                    É proibido compartilhar suas credenciais com terceiros.
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>3. Uso Adequado dos Dados</h4>
                <p>
                    O Sistema contém informações sensíveis e confidenciais sobre escrituras e atos notariais.
                    Você concorda em utilizar esses dados exclusivamente para fins profissionais e no exercício de suas funções.
                    A cópia, extração ou divulgação não autorizada de dados é estritamente proibida e passível de sanções administrativas e legais.
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>4. Auditoria e Monitoramento</h4>
                <p>
                    Para garantir a segurança e integridade dos registros, todas as ações realizadas no Sistema são monitoradas e registradas (logs de auditoria),
                    incluindo visualização, criação, edição e exclusão de registros.
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>5. Disponibilidade</h4>
                <p>
                    O Sistema é fornecido "como está". Embora nos esforcemos para garantir alta disponibilidade e integridade dos dados através de backups regulares,
                    não nos responsabilizamos por falhas técnicas imprevistas.
                </p>

                <p style={{ marginTop: '24px', fontSize: '0.875rem', fontStyle: 'italic' }}>
                    Última atualização: Janeiro de 2026.
                </p>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    className="btn btn-primary"
                >
                    Li e Concordo
                </button>
            </div>
        </Modal>
    );
}
