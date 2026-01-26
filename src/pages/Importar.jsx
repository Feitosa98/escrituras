import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { importarExcel } from '../services/import';
import '../styles/index.css';

export function Importar({ onImportSuccess }) {
    const toast = useToast();
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [resultado, setResultado] = useState(null);

    function handleFileChange(e) {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResultado(null);
        }
    }

    async function handleImport() {
        if (!file) {
            toast.warning('Selecione um arquivo para importar');
            return;
        }

        setImporting(true);
        setResultado(null);

        try {
            const result = await importarExcel(file);
            setResultado({
                success: true,
                message: result.message,
                count: result.count
            });
            toast.success(`${result.count} escrituras importadas com sucesso!`);
            setFile(null);

            // Limpar input de arquivo
            const fileInput = document.getElementById('file-upload');
            if (fileInput) fileInput.value = '';

            if (onImportSuccess) {
                setTimeout(() => onImportSuccess(), 1500);
            }
        } catch (error) {
            const errorMsg = error.message || 'Erro ao importar arquivo';
            setResultado({
                success: false,
                message: errorMsg
            });
            toast.error(errorMsg);
        } finally {
            setImporting(false);
        }
    }

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 className="text-3xl font-bold text-primary">Importar Dados</h2>
                <p className="text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                    Importe escrituras de um arquivo Excel
                </p>
            </div>

            <div className="grid grid-cols-2 gap-lg">
                <Card title="Upload de Arquivo">
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label
                            htmlFor="file-upload"
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--spacing-sm)'
                            }}
                        >
                            <Upload size={20} />
                            Selecionar Arquivo Excel
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {file && (
                        <div
                            style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)'
                            }}
                        >
                            <FileSpreadsheet size={24} color="var(--success-600)" />
                            <div style={{ flex: 1 }}>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-secondary">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        </div>
                    )}

                    <Button
                        variant="success"
                        onClick={handleImport}
                        disabled={!file || importing}
                        style={{ width: '100%' }}
                    >
                        {importing ? 'Importando...' : 'Importar Dados'}
                    </Button>

                    {resultado && (
                        <div
                            style={{
                                marginTop: 'var(--spacing-lg)',
                                padding: 'var(--spacing-md)',
                                backgroundColor: resultado.success ? 'var(--success-50)' : 'var(--danger-50)',
                                borderLeft: `4px solid ${resultado.success ? 'var(--success-500)' : 'var(--danger-500)'}`,
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                gap: 'var(--spacing-md)',
                                alignItems: 'flex-start'
                            }}
                        >
                            {resultado.success ? (
                                <CheckCircle size={20} color="var(--success-600)" />
                            ) : (
                                <AlertCircle size={20} color="var(--danger-600)" />
                            )}
                            <div>
                                <p className="font-medium" style={{ color: resultado.success ? 'var(--success-700)' : 'var(--danger-700)' }}>
                                    {resultado.success ? 'Importação concluída!' : 'Erro na importação'}
                                </p>
                                <p className="text-sm" style={{ marginTop: 'var(--spacing-xs)', color: resultado.success ? 'var(--success-600)' : 'var(--danger-600)' }}>
                                    {resultado.message}
                                </p>
                            </div>
                        </div>
                    )}
                </Card>

                <Card title="Instruções">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        <div>
                            <h4 className="font-semibold text-primary" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                Formato do Arquivo
                            </h4>
                            <p className="text-sm text-secondary">
                                O arquivo Excel deve conter as seguintes colunas:
                            </p>
                            <ul style={{
                                marginTop: 'var(--spacing-sm)',
                                marginLeft: 'var(--spacing-lg)',
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--text-secondary)'
                            }}>
                                <li>ESCRITURA</li>
                                <li>SELAGEM</li>
                                <li>LIVRO</li>
                                <li>FOLHA</li>
                                <li>OUTORGANTE</li>
                                <li>OUTORGADO</li>
                                <li>ESCREVENTE</li>
                                <li>TIPO DE LIVRO</li>
                                <li>MÊS</li>
                                <li>ANO</li>
                                <li>OBSERVAÇÃO</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-primary" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                Observações
                            </h4>
                            <ul style={{
                                marginLeft: 'var(--spacing-lg)',
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--spacing-xs)'
                            }}>
                                <li>O arquivo deve estar no formato .xlsx ou .xls</li>
                                <li>A primeira linha deve conter os cabeçalhos</li>
                                <li>Linhas vazias serão ignoradas</li>
                                <li>Os dados serão adicionados ao banco existente</li>
                            </ul>
                        </div>

                        <div
                            style={{
                                marginTop: 'var(--spacing-md)',
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--warning-50)',
                                borderLeft: '4px solid var(--warning-500)',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <p className="text-sm font-medium" style={{ color: 'var(--warning-700)' }}>
                                ⚠️ Atenção
                            </p>
                            <p className="text-sm" style={{ marginTop: 'var(--spacing-xs)', color: 'var(--warning-600)' }}>
                                A importação irá adicionar novos registros. Certifique-se de que não há duplicatas no arquivo.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Importar;
