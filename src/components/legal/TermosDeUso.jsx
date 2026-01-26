import React from 'react';
import { X, FileText } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import '../../styles/index.css';

export function TermosDeUso({ isOpen, onClose }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Termos de Uso"
            size="lg"
            footer={
                <Button variant="primary" onClick={onClose}>
                    Entendi
                </Button>
            }
        >
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: 'var(--spacing-md)' }}>
                <h3 className="text-lg font-bold text-primary" style={{ marginBottom: 'var(--spacing-md)' }}>
                    Sistema de Controle de Escrituras
                </h3>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        1. Aceitação dos Termos
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        Ao utilizar o Sistema de Controle de Escrituras, você concorda com estes termos de uso.
                        Se você não concordar com qualquer parte destes termos, não utilize o sistema.
                    </p>
                </section>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        2. Uso do Sistema
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6', marginBottom: 'var(--spacing-sm)' }}>
                        Este sistema foi desenvolvido para gerenciamento de escrituras cartorárias e deve ser utilizado
                        exclusivamente para fins profissionais e legais.
                    </p>
                    <ul className="text-sm text-secondary" style={{ paddingLeft: 'var(--spacing-lg)', lineHeight: '1.6' }}>
                        <li>Você é responsável pela veracidade dos dados inseridos</li>
                        <li>O sistema não deve ser usado para atividades ilegais</li>
                        <li>Mantenha suas credenciais de acesso seguras</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        3. Armazenamento de Dados
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        Todos os dados são armazenados localmente no navegador do usuário (IndexedDB).
                        Não há sincronização com servidores externos. É responsabilidade do usuário fazer
                        backups regulares dos dados através da funcionalidade de exportação.
                    </p>
                </section>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        4. Limitação de Responsabilidade
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        O sistema é fornecido "como está". O desenvolvedor não se responsabiliza por perda de dados,
                        erros ou problemas decorrentes do uso do sistema. Recomenda-se sempre manter backups atualizados.
                    </p>
                </section>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        5. Propriedade Intelectual
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        Este sistema foi desenvolvido por <strong>Iago Feitosa</strong> - Feitosa Soluções em Informática.
                        Todos os direitos reservados. É proibida a reprodução, distribuição ou modificação sem autorização.
                    </p>
                </section>

                <section>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        6. Atualizações
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        Estes termos podem ser atualizados periodicamente. Recomendamos revisar regularmente.
                    </p>
                </section>

                <div style={{
                    marginTop: 'var(--spacing-xl)',
                    paddingTop: 'var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <p className="text-xs text-secondary">
                        Última atualização: Janeiro de 2026
                    </p>
                </div>
            </div>
        </Modal>
    );
}

export default TermosDeUso;
