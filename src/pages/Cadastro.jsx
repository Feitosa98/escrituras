import React, { useState, useEffect, useRef } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { cnpjAPI, escriturasAPI } from '../services/api';
import { formatCpfCnpj, isValidCpfCnpjLength, normalizeCpfCnpj } from '../utils/document';
import '../styles/index.css';

const TIPOS_ESCRITURA = [
  'Compra e Venda',
  'Doação',
  'Permuta',
  'Procuração Pública',
  'Testamento',
  'Inventário',
  'Partilha',
  'Outros',
];

const TIPOS_ACOMPANHAMENTO = [
  { value: 'PP', label: 'PP — Procuração Pública' },
  { value: 'EPTT', label: 'EPTT — Escritura Pública' },
  { value: 'EPDV', label: 'EPDV — Escritura Pública' },
];

const ESCREVENTES = ['Escrevente 1', 'Escrevente 2', 'Escrevente 3'];
const TIPOS_LIVRO = ['Livro A', 'Livro B', 'Livro C', 'Livro Auxiliar'];
const MESES = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function Cadastro({ escritura, onSaveSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [consultingCnpj, setConsultingCnpj] = useState({ outorgante: false, outorgado: false });
  const protocolEdited = useRef(false);
  const suggestedProtocol = useRef('');
  const consultedCnpjs = useRef(new Map());
  const [formData, setFormData] = useState({
    tipo: '',
    selagem: '',
    livro: '',
    folha: '',
    protocolo: '',
    outorgante: '',
    cpfCnpjOutorgante: '',
    outorgado: '',
    cpfCnpjOutorgado: '',
    emailCliente: '',
    escrevente: '',
    tipoLivro: '',
    mes: '',
    ano: new Date().getFullYear().toString(),
    observacao: '',
    tipoAcompanhamento: 'EPTT',
    geraAcompanhamento: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (escritura) {
      setFormData({
        tipo: escritura.tipo || '',
        selagem: escritura.selagem || '',
        livro: escritura.livro || '',
        folha: escritura.folha || '',
        protocolo: escritura.protocolo || '',
        outorgante: escritura.outorgante || '',
        cpfCnpjOutorgante: formatCpfCnpj(escritura.cpf_cnpj_outorgante || escritura.cpfCnpjOutorgante),
        outorgado: escritura.outorgado || '',
        cpfCnpjOutorgado: formatCpfCnpj(escritura.cpf_cnpj_outorgado || escritura.cpfCnpjOutorgado),
        emailCliente: escritura.email_cliente || '',
        escrevente: escritura.escrevente || '',
        tipoLivro: escritura.tipoLivro || escritura.tipo_livro || '',
        mes: escritura.mes || '',
        ano: escritura.ano || new Date().getFullYear().toString(),
        observacao: escritura.observacao || '',
        tipoAcompanhamento: escritura.tipo_acompanhamento || 'EPTT',
        geraAcompanhamento: Boolean(escritura.gera_acompanhamento),
      });
    }
  }, [escritura]);

  useEffect(() => {
    if (escritura || protocolEdited.current) return;
    let active = true;
    escriturasAPI.getNextProtocol(formData.ano)
      .then((data) => {
        if (active && !protocolEdited.current && data?.protocolo) {
          suggestedProtocol.current = data.protocolo;
          setFormData((prev) => ({ ...prev, protocolo: data.protocolo }));
        }
      })
      .catch(() => {
        // O servidor ainda gera o protocolo definitivo ao salvar.
      });
    return () => { active = false; };
  }, [escritura, formData.ano]);

  function handleChange(field, value) {
    setFormData((prev) => {
      if (field === 'tipoAcompanhamento') {
        return {
          ...prev,
          [field]: value,
          geraAcompanhamento: value === 'PP' ? false : true,
          tipo: value === 'PP' ? 'Procuração Pública' : prev.tipo,
        };
      }
      return { ...prev, [field]: value };
    });
    // Limpar erro quando digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  async function lookupCompany(party) {
    const documentField = party === 'outorgante' ? 'cpfCnpjOutorgante' : 'cpfCnpjOutorgado';
    const nameField = party === 'outorgante' ? 'outorgante' : 'outorgado';
    const cnpj = normalizeCpfCnpj(formData[documentField]);
    if (cnpj.length !== 14) return;

    setConsultingCnpj((prev) => ({ ...prev, [party]: true }));
    try {
      let company = consultedCnpjs.current.get(cnpj);
      if (!company) {
        company = await cnpjAPI.lookup(cnpj);
        consultedCnpjs.current.set(cnpj, company);
      }
      setFormData((prev) => ({ ...prev, [nameField]: company.razaoSocial || company.nomeFantasia || prev[nameField] }));
      setErrors((prev) => ({ ...prev, [documentField]: '' }));
      toast.success(`CNPJ localizado: ${company.razaoSocial}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível consultar o CNPJ. Preencha o nome manualmente.');
    } finally {
      setConsultingCnpj((prev) => ({ ...prev, [party]: false }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = {};
    if (!isValidCpfCnpjLength(formData.cpfCnpjOutorgante)) validationErrors.cpfCnpjOutorgante = 'Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos';
    if (!isValidCpfCnpjLength(formData.cpfCnpjOutorgado)) validationErrors.cpfCnpjOutorgado = 'Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos';
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);

    try {
      const payload = {
        ...formData,
        protocolo: !escritura && formData.protocolo === suggestedProtocol.current
          ? ''
          : formData.protocolo.trim(),
        cpfCnpjOutorgante: normalizeCpfCnpj(formData.cpfCnpjOutorgante),
        cpfCnpjOutorgado: normalizeCpfCnpj(formData.cpfCnpjOutorgado),
      };
      if (escritura) {
        // Editar
        await escriturasAPI.update(escritura.uuid || escritura.id, payload);
        toast.success('Escritura atualizada com sucesso!');
      } else {
        // Criar
        await escriturasAPI.create(payload);
        toast.success('Escritura cadastrada com sucesso!');
      }

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);

      // Tratar erro de duplicata
      if (
        error.response?.status === 400 &&
        error.response?.data?.error?.includes('Livro e Folha')
      ) {
        toast.error('Já existe uma escritura com este Livro e Folha');
      } else {
        toast.error(error.response?.data?.error || 'Erro ao salvar escritura');
      }
    } finally {
      setLoading(false);
    }
  }

  // Função de cancelar volta para listagem (quem chama o componente gerencia isso)
  // Se o componente for usado em rota direta, poderia ter navegação
  // Mas aqui ele é controlado pelo pai (App.jsx)
  function handleCancelar() {
    if (onSaveSuccess) {
      // fallback para fechar
      onSaveSuccess();
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {escritura ? 'Editar Escritura' : 'Nova Escritura'}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
          Preencha os dados do ato notarial
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="grid grid-cols-2 gap-lg">
            {/* Tipo de Escritura */}
            <Select
              label="Tipo de Escritura"
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              options={TIPOS_ESCRITURA}
              error={errors.tipo}
              required
            />

            <Select
              label="Código do Ato"
              value={formData.tipoAcompanhamento}
              onChange={(e) => handleChange('tipoAcompanhamento', e.target.value)}
              options={TIPOS_ACOMPANHAMENTO}
              disabled={Boolean(escritura)}
              required
            />

            {/* Data de Selagem */}
            <Input
              label="Data de Selagem"
              type="date"
              value={formData.selagem}
              onChange={(e) => handleChange('selagem', e.target.value)}
              error={errors.selagem}
            />

            {/* Livro */}
            <Input
              label="Livro"
              type="text"
              value={formData.livro}
              onChange={(e) => handleChange('livro', e.target.value)}
              placeholder="Ex: 90"
              error={errors.livro}
              required
            />

            {/* Folha */}
            <Input
              label="Folha"
              type="text"
              value={formData.folha}
              onChange={(e) => handleChange('folha', e.target.value)}
              placeholder="Ex: 106/109"
              error={errors.folha}
              required
            />

            <Input
              label="Protocolo (sequência automática)"
              type="text"
              value={formData.protocolo}
              onChange={(e) => {
                protocolEdited.current = true;
                handleChange('protocolo', e.target.value);
              }}
              placeholder="Gerado automaticamente"
              title="A sequência é sugerida pelo sistema e pode ser alterada antes de salvar"
              hint="O número é sugerido pelo sistema; você pode alterá-lo antes de salvar."
              maxLength={40}
              error={errors.protocolo}
            />

            {/* Outorgante */}
            <Input
              label="Outorgante"
              type="text"
              value={formData.outorgante}
              onChange={(e) => handleChange('outorgante', e.target.value)}
              placeholder="Nome do outorgante"
              error={errors.outorgante}
              required
            />

            <Input
              label="CPF/CNPJ do Outorgante"
              type="text"
              value={formData.cpfCnpjOutorgante}
              onChange={(e) => handleChange('cpfCnpjOutorgante', formatCpfCnpj(e.target.value))}
              onBlur={() => lookupCompany('outorgante')}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              error={errors.cpfCnpjOutorgante}
              inputMode="numeric"
              disabled={consultingCnpj.outorgante}
              title="Ao informar um CNPJ completo, a razão social será consultada automaticamente"
              hint={consultingCnpj.outorgante ? 'Consultando dados do CNPJ...' : 'CPF e CNPJ recebem pontuação automática.'}
              maxLength={18}
            />

            {/* Outorgado */}
            <Input
              label="Outorgado"
              type="text"
              value={formData.outorgado}
              onChange={(e) => handleChange('outorgado', e.target.value)}
              placeholder="Nome do outorgado"
              error={errors.outorgado}
            />

            <Input
              label="CPF/CNPJ do Outorgado"
              type="text"
              value={formData.cpfCnpjOutorgado}
              onChange={(e) => handleChange('cpfCnpjOutorgado', formatCpfCnpj(e.target.value))}
              onBlur={() => lookupCompany('outorgado')}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              error={errors.cpfCnpjOutorgado}
              inputMode="numeric"
              disabled={consultingCnpj.outorgado}
              title="Ao informar um CNPJ completo, a razão social será consultada automaticamente"
              hint={consultingCnpj.outorgado ? 'Consultando dados do CNPJ...' : 'CPF e CNPJ recebem pontuação automática.'}
              maxLength={18}
            />

            <Input
              label="E-mail do Requerente"
              type="email"
              value={formData.emailCliente}
              onChange={(e) => handleChange('emailCliente', e.target.value)}
              placeholder="cliente@email.com"
              error={errors.emailCliente}
              required={formData.tipoAcompanhamento !== 'PP' || formData.geraAcompanhamento}
            />

            {/* Escrevente */}
            <Select
              label="Escrevente"
              value={formData.escrevente}
              onChange={(e) => handleChange('escrevente', e.target.value)}
              options={ESCREVENTES}
              error={errors.escrevente}
              required
            />

            {/* Tipo de Livro */}
            <Select
              label="Tipo de Livro"
              value={formData.tipoLivro}
              onChange={(e) => handleChange('tipoLivro', e.target.value)}
              options={TIPOS_LIVRO}
              error={errors.tipoLivro}
              required
            />

            {/* Mês */}
            <Select
              label="Mês"
              value={formData.mes}
              onChange={(e) => handleChange('mes', e.target.value)}
              options={MESES}
              error={errors.mes}
              required
            />

            {/* Ano */}
            <Input
              label="Ano"
              type="number"
              value={formData.ano}
              onChange={(e) => handleChange('ano', e.target.value)}
              placeholder="Ex: 2025"
              error={errors.ano}
              required
            />
          </div>

          {formData.tipoAcompanhamento === 'PP' && !escritura && (
            <div
              style={{
                marginTop: 'var(--spacing-lg)', padding: '1rem', borderRadius: '0.625rem',
                border: '1px solid #bfdbfe', background: '#eff6ff',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.geraAcompanhamento}
                  onChange={(e) => handleChange('geraAcompanhamento', e.target.checked)}
                  style={{ marginTop: '0.2rem' }}
                />
                <span>
                  <strong style={{ display: 'block', color: '#1e3a8a' }}>Gerar acompanhamento para o requerente</strong>
                  <small style={{ color: '#475569' }}>
                    Marcado: gera código PP e senha. Desmarcado: registra somente Livro, Folha, Protocolo, data e responsáveis.
                  </small>
                </span>
              </label>
            </div>
          )}

          {/* Observação */}
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <label className="label">Observação</label>
            <textarea
              className="input"
              value={formData.observacao}
              onChange={(e) => handleChange('observacao', e.target.value)}
              placeholder="Observações adicionais..."
              rows={4}
              style={{ resize: 'vertical', fontFamily: 'var(--font-family)' }}
            />
          </div>

          {/* Botões */}
          <div
            style={{
              marginTop: 'var(--spacing-xl)',
              display: 'flex',
              gap: 'var(--spacing-md)',
              justifyContent: 'flex-end',
            }}
          >
            <Button type="button" variant="secondary" onClick={handleCancelar} icon={X}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading} icon={Save}>
              {loading ? 'Salvando...' : escritura ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default Cadastro;
