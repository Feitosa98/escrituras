import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { logoBase64 } from '../assets/logoData';
import { formatDateBR } from '../utils/date';

const navy = rgb(6 / 255, 26 / 255, 42 / 255);
const gold = rgb(185 / 255, 160 / 255, 100 / 255);
const ink = rgb(30 / 255, 48 / 255, 60 / 255);
const muted = rgb(113 / 255, 128 / 255, 138 / 255);
const line = rgb(228 / 255, 228 / 255, 221 / 255);
const paper = rgb(250 / 255, 248 / 255, 242 / 255);

function fitText(text, font, size, maxWidth) {
  if (!text) return '-';
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && font.widthOfTextAtSize(`${value}...`, size) > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}...`;
}

function drawText(page, text, x, y, font, size, color = ink, maxWidth = null) {
  const t = text || '-';
  page.drawText(maxWidth ? fitText(t, font, size, maxWidth) : t, {
    x,
    y,
    font,
    size,
    color,
  });
}

function drawHeader(page, regular, bold, logo) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 92, width, height: 92, color: navy });
  page.drawRectangle({ x: 0, y: height - 96, width, height: 4, color: gold });

  if (logo) {
    page.drawImage(logo, { x: 38, y: height - 79, width: 45, height: 52 });
  }

  const textX = logo ? 102 : 36;
  drawText(page, 'CARTÓRIO SANTIAGO', textX, height - 48, bold, 19, gold);
  drawText(
    page,
    '1º TABELIONATO DE NOTAS, PROTESTO E CONTRATOS MARÍTIMOS DE MANACAPURU - AMAZONAS',
    textX,
    height - 65,
    regular,
    7,
    rgb(0.91, 0.92, 0.91)
  );
  drawText(page, 'RELATÓRIO GERENCIAL', width - 151, height - 48, bold, 8, gold);
}

function drawFooter(page, regular, pageNumber, pageCount) {
  const { width } = page.getSize();
  const pageLabel = `Página ${pageNumber} de ${pageCount}`;
  page.drawLine({ start: { x: 34, y: 38 }, end: { x: width - 34, y: 38 }, thickness: 0.6, color: line });
  drawText(page, 'Cartório Santiago - Manacapuru/AM', 34, 23, regular, 7, muted);
  drawText(page, pageLabel, width - 34 - regular.widthOfTextAtSize(pageLabel, 7), 23, regular, 7, muted);
}

export async function createReportPdf(records) {
  const document = await PDFDocument.create();
  document.setTitle('Relatório de Escrituras');
  document.setAuthor('Sistema de Escrituras');
  document.setSubject('Listagem de Escrituras Cadastradas');
  document.setCreationDate(new Date());

  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  
  let embeddedLogo;
  if (logoBase64 && logoBase64.startsWith('data:image/png;base64,')) {
    const base64Data = logoBase64.replace('data:image/png;base64,', '');
    const imgBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    embeddedLogo = await document.embedPng(imgBytes);
  }

  const firstPageRows = 12;
  const nextPageRows = 20;
  const chunks = [];
  chunks.push(records.slice(0, firstPageRows));
  for (let index = firstPageRows; index < records.length; index += nextPageRows) {
    chunks.push(records.slice(index, index + nextPageRows));
  }
  if (chunks.length === 0) chunks.push([]);

  chunks.forEach((pageRecords, pageIndex) => {
    const page = document.addPage([841.89, 595.28]); // A4 Paisagem para caber colunas
    const { width, height } = page.getSize();
    drawHeader(page, regular, bold, embeddedLogo);

    let cursor = height - 128;
    if (pageIndex === 0) {
      drawText(page, 'Listagem de Escrituras', 34, cursor, bold, 20, navy);
      cursor -= 20;
      drawText(
        page,
        `Total de registros exportados: ${records.length}`,
        34,
        cursor,
        regular,
        9,
        muted
      );
      cursor -= 35;
    } else {
      drawText(page, 'Detalhamento dos registros (Cont.)', 34, cursor, bold, 16, navy);
      cursor -= 25;
    }

    // Colunas ajustadas para Escrituras (Paisagem: largura ~841, incluindo Protocolo e Senha)
    const columns = [
      { label: 'Protocolo', x: 34, width: 85 },
      { label: 'Senha', x: 125, width: 65 },
      { label: 'Data', x: 195, width: 55 },
      { label: 'Tipo do Ato', x: 255, width: 140 },
      { label: 'L. / Fl.', x: 400, width: 55 },
      { label: 'Outorgante / Partes', x: 460, width: 220 },
      { label: 'Escrevente', x: 685, width: 120 },
    ];

    page.drawRectangle({ x: 32, y: cursor - 5, width: width - 64, height: 24, color: navy });
    columns.forEach((column) => drawText(page, column.label, column.x, cursor + 3, bold, 7, gold));
    cursor -= 25;

    if (pageRecords.length === 0) {
      drawText(page, 'Nenhum registro encontrado.', 34, cursor - 12, regular, 9, muted);
    }

    pageRecords.forEach((record, index) => {
      if (index % 2 === 1) {
        page.drawRectangle({ x: 32, y: cursor - 8, width: width - 64, height: 28, color: paper });
      }
      
      const dataStr = formatDateBR(record.selagem, '-');
      const livroFl = `${record.livro || '-'}/${record.folha || '-'}`;
      const outorgantesStr = record.outorgado ? `${record.outorgante} / ${record.outorgado}` : record.outorgante;

      drawText(page, record.protocolo || '-', columns[0].x, cursor, bold, 7, navy, columns[0].width);
      drawText(page, record.senha_cliente || '-', columns[1].x, cursor, bold, 7, ink, columns[1].width);
      drawText(page, dataStr, columns[2].x, cursor, regular, 7, ink, columns[2].width);
      drawText(page, record.tipo || '-', columns[3].x, cursor, bold, 7, ink, columns[3].width);
      drawText(page, livroFl, columns[4].x, cursor, regular, 7, ink, columns[4].width);
      drawText(page, outorgantesStr || '-', columns[5].x, cursor, regular, 7, ink, columns[5].width);
      drawText(page, record.escrevente || '-', columns[6].x, cursor, regular, 7, ink, columns[6].width);
      
      // Linha divisória suave
      page.drawLine({ start: { x: 32, y: cursor - 8 }, end: { x: width - 32, y: cursor - 8 }, thickness: 0.5, color: paper });
      cursor -= 28;
    });

    drawFooter(page, regular, pageIndex + 1, chunks.length);
  });

  const pdfBytes = await document.save();
  return pdfBytes;
}
