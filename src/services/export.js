import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { escriturasAPI } from './api';

/**
 * Exportar para Excel
 */
export async function exportarParaExcel(escrituras = null) {
    try {
        // ... (unchanged)
        const dados = escrituras || await escriturasAPI.getAll();

        // Preparar dados para o Excel
        const dataForExcel = dados.map(e => ({
            'Tipo de Escritura': e.tipo,
            'Data Selagem': e.selagem,
            'Livro': e.livro,
            'Folha': e.folha,
            'Tipo Livro': e.tipoLivro || e.tipo_livro,
            'Outorgante': e.outorgante,
            'Outorgado': e.outorgado,
            'Escrevente': e.escrevente,
            'Mês': e.mes,
            'Ano': e.ano,
            'Observação': e.observacao,
            'Data Cadastro': e.created_at ? new Date(e.created_at).toLocaleDateString() : ''
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
            { wch: 15 }  // Criação
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

/**
 * Exportar para PDF (Versão simplificada sem autoTable)
 */
/**
 * Exportar para PDF (Design Profissional Tabular)
 */
export async function exportarParaPDF(escrituras = null) {
    try {
        const dados = escrituras || await escriturasAPI.getAll();

        if (!dados || dados.length === 0) {
            return { success: false, error: 'Sem dados para exportar' };
        }

        const doc = new jsPDF('l', 'mm', 'a4'); // Paisagem para mais espaço horizontal
        const totalPagesExp = '{total_pages_count_string}';
        let pageCount = 1;

        // Configurações Globais
        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 10;
        const headerHeight = 35;
        const rowHeight = 10; // altura mínima, pode expandir

        // Cores
        const colorPrimary = [0, 51, 102]; // Azul escuro
        const colorHeaderBg = [240, 240, 240]; // Cinza claro
        const colorRowAlt = [249, 250, 251]; // Cinza muito claro para linhas pares

        // Colunas e Larguras
        const cols = [
            { header: 'Data', w: 25, field: 'data' },
            { header: 'Tipo Escritura', w: 45, field: 'tipo' },
            { header: 'Livro/Folha', w: 30, field: 'livro' },
            { header: 'Outorgante', w: 60, field: 'outorgante' },
            { header: 'Outorgado', w: 60, field: 'outorgado' },
            { header: 'Escrevente', w: 25, field: 'escrevente' },
            { header: 'Ano', w: 15, field: 'ano' }
        ];

        // Função de Cabeçalho da Página
        function drawHeader(doc) {
            // Título Principal
            doc.setFillColor(...colorPrimary);
            doc.rect(0, 0, pageWidth, 15, 'F');

            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('Relatório de Escrituras', pageWidth / 2, 10, { align: 'center' });

            // Subtítulo e Metadados
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, 22);
            doc.text(`Total de Registros: ${dados.length}`, pageWidth - margin, 22, { align: 'right' });

            // Cabeçalho da Tabela
            let x = margin;
            const y = 28;

            doc.setFillColor(...colorHeaderBg);
            doc.rect(margin, y - 5, pageWidth - (margin * 2), 8, 'F');

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50, 50, 50);

            cols.forEach(col => {
                doc.text(col.header, x + 2, y);
                x += col.w;
            });

            doc.setDrawColor(200, 200, 200);
            doc.line(margin, y + 3, pageWidth - margin, y + 3);

            return y + 5; // Posição Y para começar os dados
        }

        // Função de Rodapé
        function drawFooter(doc, pageNumber) {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Sistema de Escrituras - Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        // --- Início do Desenho ---
        let y = drawHeader(doc);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);

        dados.forEach((row, index) => {
            // Calcular altura necessária para a linha (wrap text)
            // A coluna mais crítica é Outorgante/Outorgado
            const outorganteLines = doc.splitTextToSize(row.outorgante || '-', cols[3].w - 4);
            const outorgadoLines = doc.splitTextToSize(row.outorgado || '-', cols[4].w - 4);
            const tipoLines = doc.splitTextToSize(row.tipo || '-', cols[1].w - 4);

            const maxLines = Math.max(outorganteLines.length, outorgadoLines.length, tipoLines.length);
            const currentRecHeight = Math.max(rowHeight, maxLines * 4 + 4); // 4mm por linha de texto + padding

            // Nova página se não couber
            if (y + currentRecHeight > pageHeight - 15) {
                drawFooter(doc, pageCount);
                doc.addPage();
                pageCount++;
                y = drawHeader(doc);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0);
            }

            // Zebrado (fundo alternado)
            if (index % 2 !== 0) {
                doc.setFillColor(...colorRowAlt);
                doc.rect(margin, y, pageWidth - (margin * 2), currentRecHeight, 'F');
            }

            // Desenhar Linha de Grade Inferior (opcional, deixa mais limpo sem vertical)
            doc.setDrawColor(230, 230, 230);
            doc.line(margin, y + currentRecHeight, pageWidth - margin, y + currentRecHeight);

            // Conteúdo das Células
            let x = margin;

            // Col 1: Data
            const dataSelagem = row.selagem ? new Date(row.selagem).toLocaleDateString('pt-BR') : '-';
            doc.text(dataSelagem, x + 2, y + 4);
            x += cols[0].w;

            // Col 2: Tipo (Wrap)
            doc.text(tipoLines, x + 2, y + 4);
            x += cols[1].w;

            // Col 3: Livro/Folha
            doc.text(`${row.livro || '-'}/${row.folha || '-'}`, x + 2, y + 4);
            x += cols[2].w;

            // Col 4: Outorgante (Wrap)
            doc.text(outorganteLines, x + 2, y + 4);
            x += cols[3].w;

            // Col 5: Outorgado (Wrap)
            doc.text(outorgadoLines, x + 2, y + 4);
            x += cols[4].w;

            // Col 6: Escrevente
            doc.text(row.escrevente || '-', x + 2, y + 4);
            x += cols[5].w;

            // Col 7: Ano
            doc.text(row.ano || '-', x + 2, y + 4);

            y += currentRecHeight;
        });

        // Rodapé final
        drawFooter(doc, pageCount);

        // Salvar PDF
        const fileName = `relatorio_escrituras_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

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
            data: dados
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
