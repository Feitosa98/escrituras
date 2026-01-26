import React from 'react';
import Modal from '../components/ui/Modal';

export default function PoliticaPrivacidade({ isOpen, onClose }) {
    return (
        <Modal title="Política de Privacidade e Proteção de Dados" isOpen={isOpen} onClose={onClose}>
            <div className="prose" style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <p>
                    Esta Política de Privacidade descreve como o Sistema de Controle de Escrituras coleta, usa e protege suas informações,
                    em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>1. Coleta de Dados</h4>
                <p>
                    O Sistema coleta apenas os dados estritamente necessários para o funcionamento e auditoria dos serviços notariais:
                </p>
                <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Dados de Acesso:</strong> Nome, e-mail e função (cargo) dos usuários do sistema.</li>
                    <li><strong>Dados de Registro:</strong> Informações contidas nas escrituras (Livro, Folha, Outorgante, Outorgado, etc), que são de natureza pública ou restrita conforme a legislação notarial.</li>
                    <li><strong>Logs de Auditoria:</strong> Endereço IP, data/hora e tipo de ação realizada no sistema.</li>
                </ul>

                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>2. Finalidade do Tratamento</h4>
                <p>
                    Os dados são tratados com a finalidade exclusiva de:
                </p>
                <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginTop: '8px' }}>
                    <li>Permitir o controle e consulta de escrituras lavradas pelo Cartório.</li>
                    <li>Garantir a segurança da informação através de controle de acesso e auditoria.</li>
                    <li>Produzir relatórios gerenciais e estatísticos.</li>
                </ul>

                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>3. Armazenamento e Segurança</h4>
                <p>
                    Adotamos medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas
                    de destruição, perda, alteração, comunicação ou difusão. Os dados são armazenados localmente em servidor seguro com rotinas de backup.
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>4. Compartilhamento</h4>
                <p>
                    Os dados armazenados no Sistema não são compartilhados com terceiros externos, exceto quando exigido por lei ou autoridade competente (ex: Corregedoria).
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>5. Seus Direitos</h4>
                <p>
                    Como titular de dados (usuário do sistema), você tem direito a confirmar a existência de tratamento, acessar seus dados de cadastro
                    e solicitar correção de dados incompletos, inexatos ou desatualizados, contatando o administrador do sistema.
                </p>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    className="btn btn-primary"
                >
                    Entendi
                </button>
            </div>
        </Modal>
    );
}
