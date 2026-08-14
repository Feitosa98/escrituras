import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Database } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { exportarParaExcel, exportarParaPDF, exportarBackup } from '../services/export';
import '../styles/index.css';

export function Exportar() {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExportExcel() {
    setExporting(true);
    try {
      await exportarParaExcel();
      toast.success('Planilha Excel exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar para Excel');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPDF() {
    setExporting(true);
    try {
      await exportarParaPDF();
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
      toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportBackup() {
    setExporting(true);
    try {
      await exportarBackup();
      toast.success('Backup criado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      toast.error('Erro ao criar backup');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Exportar Dados</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
          Exporte suas escrituras em diferentes formatos
        </p>
      </div>

      <div className="grid grid-cols-3 gap-lg">
        {/* Exportar Excel */}
        <Card>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                padding: 'var(--spacing-xl)',
                backgroundColor: 'var(--success-100)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <FileSpreadsheet size={48} color="var(--success-600)" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary">Excel</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                Exportar para planilha Excel (.xlsx)
              </p>
            </div>

            <ul
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                textAlign: 'left',
                width: '100%',
                marginLeft: 'var(--spacing-lg)',
              }}
            >
              <li>✓ Formato editável</li>
              <li>✓ Compatível com Excel</li>
              <li>✓ Todas as colunas</li>
            </ul>

            <Button
              variant="success"
              onClick={handleExportExcel}
              disabled={exporting}
              style={{ width: '100%', marginTop: 'auto' }}
              icon={Download}
            >
              Exportar Excel
            </Button>
          </div>
        </Card>

        {/* Exportar PDF */}
        <Card>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                padding: 'var(--spacing-xl)',
                backgroundColor: 'var(--danger-100)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <FileText size={48} color="var(--danger-600)" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary">PDF</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                Exportar relatório em PDF
              </p>
            </div>

            <ul
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                textAlign: 'left',
                width: '100%',
                marginLeft: 'var(--spacing-lg)',
              }}
            >
              <li>✓ Formato profissional</li>
              <li>✓ Pronto para impressão</li>
              <li>✓ Tabela formatada</li>
            </ul>

            <Button
              variant="danger"
              onClick={handleExportPDF}
              disabled={exporting}
              style={{ width: '100%', marginTop: 'auto' }}
              icon={Download}
            >
              Exportar PDF
            </Button>
          </div>
        </Card>

        {/* Backup JSON */}
        <Card>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                padding: 'var(--spacing-xl)',
                backgroundColor: 'var(--primary-100)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <Database size={48} color="var(--primary-600)" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary">Backup</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                Backup completo em JSON
              </p>
            </div>

            <ul
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                textAlign: 'left',
                width: '100%',
                marginLeft: 'var(--spacing-lg)',
              }}
            >
              <li>✓ Backup completo</li>
              <li>✓ Todos os dados</li>
              <li>✓ Formato JSON</li>
            </ul>

            <Button
              variant="primary"
              onClick={handleExportBackup}
              disabled={exporting}
              style={{ width: '100%', marginTop: 'auto' }}
              icon={Download}
            >
              Fazer Backup
            </Button>
          </div>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card style={{ marginTop: 'var(--spacing-xl)' }}>
        <h3
          className="text-lg font-semibold text-primary"
          style={{ marginBottom: 'var(--spacing-md)' }}
        >
          Informações sobre Exportação
        </h3>

        <div className="grid grid-cols-2 gap-lg">
          <div>
            <h4 className="font-medium text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
              Quando usar cada formato?
            </h4>
            <ul
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                marginLeft: 'var(--spacing-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-xs)',
              }}
            >
              <li>
                <strong>Excel:</strong> Para análise de dados, edição ou compartilhamento
              </li>
              <li>
                <strong>PDF:</strong> Para relatórios formais, impressão ou arquivamento
              </li>
              <li>
                <strong>Backup:</strong> Para segurança e restauração de dados
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-primary" style={{ marginBottom: 'var(--spacing-sm)' }}>
              Dicas
            </h4>
            <ul
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                marginLeft: 'var(--spacing-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-xs)',
              }}
            >
              <li>Faça backups regularmente para não perder dados</li>
              <li>Use filtros na listagem antes de exportar para relatórios específicos</li>
              <li>O nome do arquivo inclui a data de exportação</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Exportar;
