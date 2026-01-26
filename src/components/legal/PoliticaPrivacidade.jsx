import React from 'react';
import { Shield } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import '../../styles/index.css';

export function PoliticaPrivacidade({ isOpen, onClose }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Política de Privacidade"
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
                        1. Coleta de Dados
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        Este sistema <strong>NÃO coleta, transmite ou armazena dados em servidores externos</strong>.
                        Todas as informações inseridas permanecem exclusivamente no navegador do usuário.
                    </p>
                </section>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        2. Armazenamento Local
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6', marginBottom: 'var(--spacing-sm)' }}>
                        Os dados são armazenados localmente utilizando a tecnologia IndexedDB do navegador:
                    </p>
                    <ul className="text-sm text-secondary" style={{ paddingLeft: 'var(--spacing-lg)', lineHeight: '1.6' }}>
                        <li>Dados de escrituras (tipo, livro, folha, outorgantes, etc.)</li>
                        <li>Configurações de preferências do usuário</li>
                        <li>Nenhum dado pessoal identificável é coletado</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        3. Segurança dos Dados
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        Como os dados ficam armazenados localmente no seu navegador:
                    </p>
                    <ul className="text-sm text-secondary" style={{ paddingLeft: 'var(--spacing-lg)', lineHeight: '1.6', marginTop: 'var(--spacing-sm)' }}>
                        <li>Apenas você tem acesso aos dados no seu computador</li>
                        <li>Recomendamos fazer backups regulares (função Exportar)</li>
                        <li>Limpar o cache do navegador pode apagar os dados</li>
                        <li>Use um navegador seguro e atualizado</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        4. Compartilhamento de Dados
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        <strong>Não compartilhamos dados com terceiros</strong> porque não coletamos nem temos acesso
                        aos seus dados. Tudo permanece no seu dispositivo.
                    </p>
                </section>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        5. Cookies e Rastreamento
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        Este sistema não utiliza cookies de rastreamento, analytics ou qualquer ferramenta de
                        monitoramento de usuários.
                    </p>
                </section>

                <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        6. Seus Direitos (LGPD)
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        Como seus dados ficam apenas no seu dispositivo, você tem controle total:
                    </p>
                    <ul className="text-sm text-secondary" style={{ paddingLeft: 'var(--spacing-lg)', lineHeight: '1.6', marginTop: 'var(--spacing-sm)' }}>
                        <li>Exportar todos os dados a qualquer momento</li>
                        <li>Excluir dados individualmente ou em massa</li>
                        <li>Limpar todos os dados do sistema</li>
                    </ul>
                </section>

                <section>
                    <h4 className="font-bold text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        7. Contato
                    </h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                        Para dúvidas sobre privacidade, entre em contato com:<br />
                        <strong>Iago Feitosa</strong> - Feitosa Soluções em Informática
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

export default PoliticaPrivacidade;
