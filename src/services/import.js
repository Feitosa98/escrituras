import ExcelJS from 'exceljs';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const MAX_IMPORT_ROWS = 5000;

function cellValue(value) {
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  if (value.formula) return `=${value.formula}`;
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || '').join('');
  if (value.text !== undefined) return value.text;
  return value.result ?? '';
}

/**
 * Importar dados do arquivo Excel
 */
export async function importarExcel(file) {
  if (!file || file.size > MAX_IMPORT_BYTES) {
    throw new Error('A planilha deve possuir no máximo 10 MB');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(e.target.result);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error('A planilha não possui uma aba de dados');
        if (worksheet.rowCount > MAX_IMPORT_ROWS) {
          throw new Error(`A planilha deve possuir no máximo ${MAX_IMPORT_ROWS} linhas`);
        }

        const jsonData = [];
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          const values = [];
          for (let column = 1; column <= worksheet.columnCount; column += 1) {
            values.push(cellValue(row.getCell(column).value));
          }
          jsonData[rowNumber - 1] = values;
        });

        // Encontrar a linha do cabeçalho
        // Procurar por palavras-chave que indicam cabeçalho
        let headerRowIndex = -1;
        const keywords = ['ESCRITURA', 'TIPO', 'LIVRO', 'FOLHA', 'OUTORGANTE'];

        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i];
          if (Array.isArray(row)) {
            // Verificar se a linha contém pelo menos 2 das palavras-chave
            const matches = keywords.filter((keyword) =>
              row.some((cell) => cell && cell.toString().toUpperCase().includes(keyword))
            );

            if (matches.length >= 2) {
              headerRowIndex = i;
              break;
            }
          }
        }

        if (headerRowIndex === -1) {
          throw new Error(
            'Cabeçalho não encontrado. Verifique se o arquivo contém as colunas: ESCRITURA, LIVRO, FOLHA, OUTORGANTE'
          );
        }

        const headers = jsonData[headerRowIndex].map((h) => (h ? h.toString().trim() : ''));
        const rows = jsonData.slice(headerRowIndex + 1);

        // Mapear colunas (buscar por palavras-chave parciais)
        const findColumn = (keywords) => {
          for (const keyword of keywords) {
            const index = headers.findIndex(
              (h) => h && h.toString().toUpperCase().includes(keyword.toUpperCase())
            );
            if (index >= 0) return index;
          }
          return -1;
        };

        const colunas = {
          escritura: findColumn(['ESCRITURA', 'TIPO']),
          selagem: findColumn(['SELAGEM', 'DATA']),
          livro: findColumn(['LIVRO']),
          folha: findColumn(['FOLHA']),
          outorgante: findColumn(['OUTORGANTE']),
          outorgado: findColumn(['OUTORGADO']),
          escrevente: findColumn(['ESCREVENTE']),
          tipoLivro: findColumn(['TIPO DE LIVRO', 'TIPO LIVRO']),
          mes: findColumn(['MÊS', 'MES']),
          ano: findColumn(['ANO']),
          observacao: findColumn(['OBSERVAÇÃO', 'OBSERVACAO', 'OBS']),
        };

        // Processar linhas
        const escrituras = rows
          .filter((row) => {
            // Filtrar linhas vazias ou com fórmulas
            if (!row || !row[colunas.escritura]) return false;

            // Ignorar linhas onde o tipo é uma fórmula (começa com =)
            const tipo = row[colunas.escritura];
            if (tipo && tipo.toString().startsWith('=')) return false;

            // Ignorar linhas onde livro não é número ou texto válido
            const livro = row[colunas.livro];
            if (!livro || livro.toString().startsWith('=')) return false;

            return true;
          })
          .map((row) => {
            // Processar data de selagem
            let selagem = null;
            if (row[colunas.selagem]) {
              if (typeof row[colunas.selagem] === 'number') {
                // Excel armazena datas como números (dias desde 1900-01-01)
                const excelDate = row[colunas.selagem];
                const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                selagem = jsDate.toISOString().split('T')[0];
              } else if (row[colunas.selagem] instanceof Date) {
                selagem = row[colunas.selagem].toISOString().split('T')[0];
              } else if (!row[colunas.selagem].toString().startsWith('=')) {
                selagem = row[colunas.selagem];
              }
            }

            // Processar mês e ano (podem ser fórmulas ou valores)
            let mes = '';
            let ano = '';

            if (selagem) {
              // Se temos data de selagem, extrair mês e ano dela
              const data = new Date(selagem);
              const meses = [
                'JANEIRO',
                'FEVEREIRO',
                'MARÇO',
                'ABRIL',
                'MAIO',
                'JUNHO',
                'JULHO',
                'AGOSTO',
                'SETEMBRO',
                'OUTUBRO',
                'NOVEMBRO',
                'DEZEMBRO',
              ];
              mes = meses[data.getMonth()];
              ano = data.getFullYear().toString();
            } else {
              // Tentar pegar dos campos se não forem fórmulas
              if (row[colunas.mes] && !row[colunas.mes].toString().startsWith('=')) {
                mes = row[colunas.mes].toString().trim();
              }
              if (row[colunas.ano] && !row[colunas.ano].toString().startsWith('=')) {
                ano = row[colunas.ano].toString().trim();
              }
            }

            return {
              tipo: row[colunas.escritura]?.toString().trim() || '',
              selagem: selagem,
              livro: row[colunas.livro]?.toString().trim() || '',
              folha: row[colunas.folha]?.toString().trim() || '',
              outorgante: row[colunas.outorgante]?.toString().trim() || '',
              outorgado: row[colunas.outorgado]?.toString().trim() || '',
              escrevente: row[colunas.escrevente]?.toString().trim() || '',
              tipoLivro: row[colunas.tipoLivro]?.toString().trim() || '', // Corrigido para camelCase
              mes: mes,
              ano: ano,
              observacao: row[colunas.observacao]?.toString().trim() || '',
            };
          });

        // Importar para o backend via API (Em lote)
        try {
          console.log(`Enviando ${escrituras.length} escrituras para importação...`);

          // Se a API suportar endpoint de batch/import, usar:
          // const resultado = await escriturasAPI.importBulk(escrituras);

          // Como acabamos de criar a rota /import, vamos usá-la:
          const response = await fetch('/api/escrituras/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ escrituras }),
          });

          const resultado = await response.json();

          if (response.ok) {
            resolve({
              success: true,
              count: resultado.details.success,
              message: resultado.message,
            });
          } else {
            reject(new Error(resultado.error || 'Erro na importação'));
          }
        } catch (error) {
          console.error('Erro na requisição de importação:', error);
          reject(error);
        }
      } catch (error) {
        console.error('Erro ao processar Excel:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error('Erro ao ler arquivo:', error);
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}

