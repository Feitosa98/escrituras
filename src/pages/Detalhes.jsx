import React from 'react';
import { Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import '../styles/index.css';

export function Detalhes({ escritura, onClose, onEdit }) {
    if (!escritura) return null;

    const formatarData = (data) => {
        if (!data) return '-';
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{
                marginBottom: 'var(--spacing-xl)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 className="text-3xl font-bold text-primary">Detalhes da Escritura</h2>
                    <p className="text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                        Visualização completa dos dados
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <Button variant="primary" onClick={() => onEdit && onEdit(escritura)}>
                        Editar
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Voltar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-lg">
                {/* Informações Principais */}
                <Card title="Informações Principais">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        <div>
                            <label className="label">Tipo de Escritura</label>
                            <Badge variant="primary" style={{ marginTop: 'var(--spacing-xs)' }}>
                                {escritura.tipo}
                            </Badge>
                        </div>

                        <div>
                            <label className="label">Data de Selagem</label>
                            <p className="text-base text-primary">{formatarData(escritura.selagem)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-md">
                            <div>
                                <label className="label">Livro</label>
                                <p className="text-base text-primary">{escritura.livro}</p>
                            </div>
                            <div>
                                <label className="label">Folha</label>
                                <p className="text-base text-primary">{escritura.folha}</p>
                            </div>
                        </div>

                        <div>
                            <label className="label">Tipo de Livro</label>
                            <Badge variant="success" style={{ marginTop: 'var(--spacing-xs)' }}>
                                {escritura.tipoLivro}
                            </Badge>
                        </div>
                    </div>
                </Card>

                {/* Partes Envolvidas */}
                <Card title="Partes Envolvidas">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        <div>
                            <label className="label">Outorgante</label>
                            <p className="text-base text-primary">{escritura.outorgante}</p>
                        </div>

                        <div>
                            <label className="label">Outorgado</label>
                            <p className="text-base text-primary">{escritura.outorgado || '-'}</p>
                        </div>

                        <div>
                            <label className="label">Escrevente Responsável</label>
                            <Badge variant="warning" style={{ marginTop: 'var(--spacing-xs)' }}>
                                {escritura.escrevente}
                            </Badge>
                        </div>
                    </div>
                </Card>

                {/* Período */}
                <Card title="Período">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        <div className="grid grid-cols-2 gap-md">
                            <div>
                                <label className="label">Mês</label>
                                <p className="text-base text-primary">{escritura.mes}</p>
                            </div>
                            <div>
                                <label className="label">Ano</label>
                                <p className="text-base text-primary">{escritura.ano}</p>
                            </div>
                        </div>

                        <div>
                            <label className="label">Período Completo</label>
                            <p className="text-lg font-semibold text-primary">
                                {escritura.mes}/{escritura.ano}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Observações */}
                <Card title="Observações">
                    <div>
                        {escritura.observacao ? (
                            <p className="text-base text-primary" style={{ whiteSpace: 'pre-wrap' }}>
                                {escritura.observacao}
                            </p>
                        ) : (
                            <p className="text-sm text-secondary" style={{ fontStyle: 'italic' }}>
                                Nenhuma observação registrada
                            </p>
                        )}
                    </div>
                </Card>

                {/* Metadados */}
                <Card title="Informações do Sistema" style={{ gridColumn: 'span 2' }}>
                    <div className="grid grid-cols-3 gap-md">
                        <div>
                            <label className="label">ID do Registro</label>
                            <p className="text-sm text-secondary">#{escritura.uuid ? escritura.uuid.substring(0, 8) : escritura.id}</p>
                        </div>
                        <div>
                            <label className="label">Data de Criação</label>
                            <p className="text-sm text-secondary">
                                {escritura.createdAt ? formatarData(escritura.createdAt) : '-'}
                            </p>
                        </div>
                        <div>
                            <label className="label">Última Atualização</label>
                            <p className="text-sm text-secondary">
                                {escritura.updatedAt ? formatarData(escritura.updatedAt) : '-'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Detalhes;
