import ExcelJS from 'exceljs';
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
      Protocolo: e.protocolo,
      'Tipo Livro': e.tipoLivro || e.tipo_livro,
      Outorgante: e.outorgante,
      'CPF/CNPJ Outorgante': e.cpf_cnpj_outorgante,
      Outorgado: e.outorgado,
      'CPF/CNPJ Outorgado': e.cpf_cnpj_outorgado,
      Escrevente: e.escrevente,
      Mês: e.mes,
      Ano: e.ano,
      Observação: e.observacao,
      'Data Cadastro': e.created_at ? new Date(e.created_at).toLocaleDateString() : '',
    }));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Cartório Santiago';
    const worksheet = workbook.addWorksheet('Escrituras');
    const headers = Object.keys(dataForExcel[0] || {
      'Tipo de Escritura': '', 'Data Selagem': '', Livro: '', Folha: '', Protocolo: '',
      'Tipo Livro': '', Outorgante: '', 'CPF/CNPJ Outorgante': '', Outorgado: '', 'CPF/CNPJ Outorgado': '', Escrevente: '',
      Mês: '', Ano: '', Observação: '', 'Data Cadastro': ''
    });
    const widths = [20, 15, 10, 15, 20, 15, 30, 20, 30, 20, 15, 10, 10, 40, 15];
    worksheet.columns = headers.map((header, index) => ({
      header,
      key: header,
      width: widths[index]
    }));
    worksheet.addRows(dataForExcel);
    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const bytes = await workbook.xlsx.writeBuffer();
    const fileName = `escrituras_${new Date().toISOString().split('T')[0]}.xlsx`;
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

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
