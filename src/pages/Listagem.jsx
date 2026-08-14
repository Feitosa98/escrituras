import React, { useState, useEffect } from 'react';
import {
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useDebounce } from '../hooks/useDebounce';
import { escriturasAPI } from '../services/api';
import { exportarParaExcel } from '../services/export';
import '../styles/index.css';

const ITEMS_POR_PAGINA = 20;

export function Listagem({ onEdit, onView }) {
  const toast = useToast();
  const [escrituras, setEscrituras] = useState([]);
  const [escriturasFiltradas, setEscriturasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalDelete, setModalDelete] = useState({ isOpen: false, escritura: null });
  const [exporting, setExporting] = useState(false);

  // Ordenação
  const [ordenacao, setOrdenacao] = useState({ campo: 'createdAt', direcao: 'desc' });

  // Filtros
  const [filtros, setFiltros] = useState({
    texto: '',
    tipo: '',
    escrevente: '',
    ano: '',
    tipoLivro: '',
    dataInicio: '',
    dataFim: '',
  });

  // Debounce na busca de texto para melhor performance
  const textoBuscaDebounced = useDebounce(filtros.texto, 300);

  useEffect(() => {
    carregarEscrituras();
  }, []);

  useEffect(() => {
    aplicarFiltrosEOrdenacao();
  }, [
    textoBuscaDebounced,
    filtros.tipo,
    filtros.escrevente,
    filtros.ano,
    filtros.tipoLivro,
    filtros.dataInicio,
    filtros.dataFim,
    escrituras,
    ordenacao,
  ]);

  async function carregarEscrituras() {
    try {
      setLoading(true);
      const dados = await escriturasAPI.getAll();
      setEscrituras(dados);
      setEscriturasFiltradas(dados);
    } catch (error) {
      console.error('Erro ao carregar escrituras:', error);
      toast.error('Erro ao carregar escrituras');
    } finally {
      setLoading(false);
    }
  }

  function handleOrdenacao(campo) {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc',
    }));
  }

  function aplicarFiltrosEOrdenacao() {
    let resultado = [...escrituras];

    // Filtros
    if (textoBuscaDebounced) {
      const textoLower = textoBuscaDebounced.toLowerCase();
      resultado = resultado.filter(
        (e) =>
          e.tipo?.toLowerCase().includes(textoLower) ||
          e.outorgante?.toLowerCase().includes(textoLower) ||
          e.outorgado?.toLowerCase().includes(textoLower) ||
          e.livro?.toString().includes(textoLower) ||
          e.folha?.toLowerCase().includes(textoLower)
      );
    }

    if (filtros.tipo) resultado = resultado.filter((e) => e.tipo === filtros.tipo);
    if (filtros.escrevente)
      resultado = resultado.filter((e) => e.escrevente === filtros.escrevente);
    if (filtros.ano) resultado = resultado.filter((e) => e.ano === filtros.ano);
    if (filtros.tipoLivro) resultado = resultado.filter((e) => e.tipoLivro === filtros.tipoLivro);

    if (filtros.dataInicio) {
      resultado = resultado.filter((e) => e.selagem && e.selagem >= filtros.dataInicio);
    }
    if (filtros.dataFim) {
      resultado = resultado.filter((e) => e.selagem && e.selagem <= filtros.dataFim);
    }

    // Ordenação
    resultado.sort((a, b) => {
      const valorA = a[ordenacao.campo] || '';
      const valorB = b[ordenacao.campo] || '';

      if (valorA < valorB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });

    setEscriturasFiltradas(resultado);
    setPaginaAtual(1);
  }

  function limparFiltros() {
    setFiltros({
      texto: '',
      tipo: '',
      escrevente: '',
      ano: '',
      tipoLivro: '',
      dataInicio: '',
      dataFim: '',
    });
    toast.info('Filtros limpos');
  }

  async function handleExportarFiltrados() {
    if (escriturasFiltradas.length === 0) {
      toast.warning('Nenhuma escritura para exportar');
      return;
    }

    setExporting(true);
    try {
      await exportarParaExcel(escriturasFiltradas);
      toast.success(`${escriturasFiltradas.length} escrituras exportadas!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await escriturasAPI.delete(id);
      toast.success('Escritura excluída com sucesso!');
      await carregarEscrituras();
      setModalDelete({ isOpen: false, escritura: null });
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error(error.response?.data?.error || 'Erro ao excluir escritura');
    }
  }

  // Paginação
  const totalPaginas = Math.ceil(escriturasFiltradas.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaAtual - 1) * ITEMS_POR_PAGINA;
  const indiceFim = indiceInicio + ITEMS_POR_PAGINA;
  const escriturasPaginadas = escriturasFiltradas.slice(indiceInicio, indiceFim);

  // Opções para filtros
  const tiposUnicos = [...new Set(escrituras.map((e) => e.tipo))].filter(Boolean).sort();
  const escreventesUnicos = [...new Set(escrituras.map((e) => e.escrevente))]
    .filter(Boolean)
    .sort();
  const anosUnicos = [...new Set(escrituras.map((e) => e.ano))].filter(Boolean).sort().reverse();
  const tiposLivroUnicos = [...new Set(escrituras.map((e) => e.tipoLivro))].filter(Boolean).sort();

  const TableHeader = ({ label, campo }) => (
    <th onClick={() => handleOrdenacao(campo)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <div className="flex items-center gap-sm">
        {label}
        {ordenacao.campo === campo &&
          (ordenacao.direcao === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <div className="loading" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Listagem de Escrituras
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            {escriturasFiltradas.length}{' '}
            {escriturasFiltradas.length === 1 ? 'escritura encontrada' : 'escrituras encontradas'}
          </p>
        </div>
        {escriturasFiltradas.length > 0 && (
          <Button
            variant="success"
            icon={Download}
            onClick={handleExportarFiltrados}
            disabled={exporting}
          >
            {exporting ? 'Exportando...' : 'Exportar Resultados'}
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem', marginBottom: '0.875rem' }}>
          <Input
            label="Busca Geral"
            placeholder="Tipo, outorgante, livro..."
            value={filtros.texto}
            onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
          />
          <Select
            label="Tipo de Escritura"
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            options={tiposUnicos}
            placeholder="Todos os tipos"
          />
          <Select
            label="Escrevente"
            value={filtros.escrevente}
            onChange={(e) => setFiltros({ ...filtros, escrevente: e.target.value })}
            options={escreventesUnicos}
            placeholder="Todos"
          />
          <Select
            label="Ano"
            value={filtros.ano}
            onChange={(e) => setFiltros({ ...filtros, ano: e.target.value })}
            options={anosUnicos}
            placeholder="Todos os anos"
          />
          <Select
            label="Tipo de Livro"
            value={filtros.tipoLivro}
            onChange={(e) => setFiltros({ ...filtros, tipoLivro: e.target.value })}
            options={tiposLivroUnicos}
            placeholder="Todos"
          />
          <Input label="Data Início" type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} />
          <Input label="Data Fim" type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <Button variant="secondary" onClick={limparFiltros}>Limpar Filtros</Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <TableHeader label="Tipo" campo="tipo" />
                <TableHeader label="Selagem" campo="selagem" />
                <TableHeader label="Livro" campo="livro" />
                <TableHeader label="Folha" campo="folha" />
                <TableHeader label="Outorgante" campo="outorgante" />
                <TableHeader label="Outorgado" campo="outorgado" />
                <TableHeader label="Escrevente" campo="escrevente" />
                <th>Período</th>
                <TableHeader label="Status" campo="status" />
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {escriturasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                    {escrituras.length === 0 ? 'Nenhuma escritura cadastrada.' : 'Nenhum resultado para os filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                escriturasPaginadas.map((escritura) => (
                  <tr key={escritura.uuid || escritura.id}>
                    <td><Badge variant="primary">{escritura.tipo}</Badge></td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {escritura.selagem ? new Date(escritura.selagem).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{escritura.livro}</td>
                    <td style={{ fontWeight: 600 }}>{escritura.folha}</td>
                    <td>{escritura.outorgante}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{escritura.outorgado || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{escritura.escrevente}</td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{escritura.mes}/{escritura.ano}</td>
                    <td>
                      <Badge variant={escritura.status === 'Concluído' ? 'success' : escritura.status === 'Aguardando cliente' ? 'warning' : 'primary'}>
                        {escritura.status || 'Em andamento'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
                        <Button variant="secondary" size="sm" onClick={() => onView && onView(escritura)} icon={Eye} title="Visualizar" />
                        <Button variant="secondary" size="sm" onClick={() => onEdit && onEdit(escritura)} icon={Edit} title="Editar" />
                        <Button variant="danger" size="sm" onClick={() => setModalDelete({ isOpen: true, escritura })} icon={Trash2} title="Excluir" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Página <strong style={{ color: 'var(--text-primary)' }}>{paginaAtual}</strong> de <strong style={{ color: 'var(--text-primary)' }}>{totalPaginas}</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1} icon={ChevronLeft}>
                Anterior
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} icon={ChevronRight}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={modalDelete.isOpen}
        onClose={() => setModalDelete({ isOpen: false, escritura: null })}
        title="Confirmar Exclusão"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalDelete({ isOpen: false, escritura: null })}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => handleDelete(modalDelete.escritura?.id)}>
              Excluir
            </Button>
          </>
        }
      >
        <p>
          Tem certeza que deseja excluir a escritura <strong>{modalDelete.escritura?.tipo}</strong>?
        </p>
        <p className="text-sm text-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>
          Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}

export default Listagem;
