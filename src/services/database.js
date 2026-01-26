import Dexie from 'dexie';

// Criar banco de dados
export const db = new Dexie('EscriturasDB');

// Definir schema
db.version(1).stores({
  escrituras: '++id, tipo, selagem, livro, folha, outorgante, outorgado, escrevente, tipoLivro, mes, ano, observacao, createdAt, updatedAt'
});

// Classe para Escritura
export class Escritura {
  constructor(data) {
    this.tipo = data.tipo || '';
    this.selagem = data.selagem || null;
    this.livro = data.livro || '';
    this.folha = data.folha || '';
    this.outorgante = data.outorgante || '';
    this.outorgado = data.outorgado || '';
    this.escrevente = data.escrevente || '';
    this.tipoLivro = data.tipoLivro || '';
    this.mes = data.mes || '';
    this.ano = data.ano || '';
    this.observacao = data.observacao || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}

// Funções CRUD

/**
 * Adicionar nova escritura
 */
export async function adicionarEscritura(data) {
  try {
    const escritura = new Escritura(data);
    const id = await db.escrituras.add(escritura);
    return { success: true, id };
  } catch (error) {
    console.error('Erro ao adicionar escritura:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obter todas as escrituras
 */
export async function obterTodasEscrituras() {
  try {
    const escrituras = await db.escrituras.toArray();
    return escrituras;
  } catch (error) {
    console.error('Erro ao obter escrituras:', error);
    return [];
  }
}

/**
 * Obter escritura por ID
 */
export async function obterEscrituraPorId(id) {
  try {
    const escritura = await db.escrituras.get(id);
    return escritura;
  } catch (error) {
    console.error('Erro ao obter escritura:', error);
    return null;
  }
}

/**
 * Atualizar escritura
 */
export async function atualizarEscritura(id, data) {
  try {
    const updates = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await db.escrituras.update(id, updates);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar escritura:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletar escritura
 */
export async function deletarEscritura(id) {
  try {
    await db.escrituras.delete(id);
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar escritura:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Buscar escrituras com filtros
 */
export async function buscarEscrituras(filtros = {}) {
  try {
    let query = db.escrituras;

    // Aplicar filtros
    if (filtros.tipo) {
      query = query.where('tipo').equals(filtros.tipo);
    }

    if (filtros.escrevente) {
      query = query.where('escrevente').equals(filtros.escrevente);
    }

    if (filtros.ano) {
      query = query.where('ano').equals(filtros.ano);
    }

    if (filtros.mes) {
      query = query.where('mes').equals(filtros.mes);
    }

    if (filtros.tipoLivro) {
      query = query.where('tipoLivro').equals(filtros.tipoLivro);
    }

    const resultados = await query.toArray();

    let filtrados = resultados;

    // Filtro de data (período)
    if (filtros.dataInicio || filtros.dataFim) {
      filtrados = filtrados.filter(e => {
        if (!e.selagem) return false;
        const dataSelagem = new Date(e.selagem);
        let valido = true;

        if (filtros.dataInicio) {
          valido = valido && dataSelagem >= new Date(filtros.dataInicio);
        }

        if (filtros.dataFim) {
          valido = valido && dataSelagem <= new Date(filtros.dataFim);
        }

        return valido;
      });
    }

    // Filtro de texto (busca em múltiplos campos)
    if (filtros.texto) {
      const textoLower = filtros.texto.toLowerCase();
      filtrados = filtrados.filter(e =>
        e.tipo?.toLowerCase().includes(textoLower) ||
        e.outorgante?.toLowerCase().includes(textoLower) ||
        e.outorgado?.toLowerCase().includes(textoLower) ||
        e.livro?.toString().includes(textoLower) ||
        e.folha?.toLowerCase().includes(textoLower) ||
        e.observacao?.toLowerCase().includes(textoLower)
      );
    }

    return filtrados;
  } catch (error) {
    console.error('Erro ao buscar escrituras:', error);
    return [];
  }
}

/**
 * Verificar se já existe escritura com mesmo livro e folha
 */
export async function verificarDuplicidade(livro, folha, idIgnorar = null) {
  try {
    const existentes = await db.escrituras
      .where('livro').equals(livro)
      .and(e => e.folha === folha)
      .toArray();

    if (idIgnorar) {
      return existentes.filter(e => e.id !== idIgnorar);
    }

    return existentes;
  } catch (error) {
    console.error('Erro ao verificar duplicidade:', error);
    return [];
  }
}

/**
 * Obter estatísticas
 */
export async function obterEstatisticas() {
  try {
    const todas = await db.escrituras.toArray();

    // Total
    const total = todas.length;

    // Por tipo
    const porTipo = todas.reduce((acc, e) => {
      acc[e.tipo] = (acc[e.tipo] || 0) + 1;
      return acc;
    }, {});

    // Por escrevente
    const porEscrevente = todas.reduce((acc, e) => {
      acc[e.escrevente] = (acc[e.escrevente] || 0) + 1;
      return acc;
    }, {});

    // Por mês/ano
    const porMes = todas.reduce((acc, e) => {
      const chave = `${e.mes}/${e.ano}`;
      acc[chave] = (acc[chave] || 0) + 1;
      return acc;
    }, {});

    // Por tipo de livro
    const porTipoLivro = todas.reduce((acc, e) => {
      acc[e.tipoLivro] = (acc[e.tipoLivro] || 0) + 1;
      return acc;
    }, {});

    // Escrituras recentes (últimas 10)
    const recentes = todas
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return {
      total,
      porTipo,
      porEscrevente,
      porMes,
      porTipoLivro,
      recentes
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      total: 0,
      porTipo: {},
      porEscrevente: {},
      porMes: {},
      porTipoLivro: {},
      recentes: []
    };
  }
}

/**
 * Limpar todos os dados
 */
export async function limparDados() {
  try {
    await db.escrituras.clear();
    return { success: true };
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Importar dados em massa
 */
export async function importarDados(escrituras) {
  try {
    const escriturasFormatadas = escrituras.map(e => new Escritura(e));
    await db.escrituras.bulkAdd(escriturasFormatadas);
    return { success: true, count: escriturasFormatadas.length };
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    return { success: false, error: error.message };
  }
}

export default db;
