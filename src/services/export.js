import * as XLSX from 'xlsx';
import { escriturasAPI } from './api';

/**
 * Exportar para Excel
 */
export async function exportarParaExcel(escrituras = null) {
  try {
    // ... (unchanged)
    const dados = escrituras || (await escriturasAPI.getAll());

    // Preparar dados para o Excel
    const dataForExcel = dados.map((e) => ({
      'Tipo de Escritura': e.tipo,
      'Data Selagem': e.selagem,
      Livro: e.livro,
      Folha: e.folha,
      'Tipo Livro': e.tipoLivro || e.tipo_livro,
      Outorgante: e.outorgante,
      Outorgado: e.outorgado,
      Escrevente: e.escrevente,
      Mês: e.mes,
      Ano: e.ano,
      Observação: e.observacao,
      'Data Cadastro': e.created_at ? new Date(e.created_at).toLocaleDateString() : '',
    }));

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataForExcel);

    // ... (rest of excel unchanged)
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 20 }, // Tipo
      { wch: 15 }, // Selagem
      { wch: 10 }, // Livro
      { wch: 15 }, // Folha
      { wch: 15 }, // Tipo Livro
      { wch: 30 }, // Outorgante
      { wch: 30 }, // Outorgado
      { wch: 15 }, // Escrevente
      { wch: 10 }, // Mês
      { wch: 10 }, // Ano
      { wch: 40 }, // Observação
      { wch: 15 }, // Criação
    ];
    ws['!cols'] = colWidths;

    // Adicionar sheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Escrituras');

    // Gerar arquivo
    const fileName = `escrituras_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return { success: false, error: error.message };
  }
}

import { createReportPdf } from './pdf-generator';

/**
 * Exportar para PDF (Design Profissional com pdf-lib)
 */
export async function exportarParaPDF(escrituras = null) {
  try {
    const dados = escrituras || (await escriturasAPI.getAll());

    if (!dados || dados.length === 0) {
      return { success: false, error: 'Sem dados para exportar' };
    }

    // Gerar os bytes do PDF
    const pdfBytes = await createReportPdf(dados);

    // Criar o Blob e fazer o download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const fileName = `relatorio_escrituras_${new Date().toISOString().split('T')[0]}.pdf`;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    return { success: false, error: 'Erro ao gerar PDF: ' + error.message };
  }
}

/**
 * Exportar backup completo (JSON)
 */
export async function exportarBackup() {
  try {
    const dados = await escriturasAPI.getAll();

    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      count: dados.length,
      data: dados,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_escrituras_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, count: dados.length };
  } catch (error) {
    console.error('Erro ao exportar backup:', error);
    return { success: false, error: error.message };
  }
}
