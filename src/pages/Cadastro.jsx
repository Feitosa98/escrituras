import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { escriturasAPI } from '../services/api';
import '../styles/index.css';

const TIPOS_ESCRITURA = [
    'Compra e Venda',
    'Doação',
    'Permuta',
    'Procuração',
    'Testamento',
    'Inventário',
    'Partilha',
    'Outros'
];

const ESCREVENTES = ['Escrevente 1', 'Escrevente 2', 'Escrevente 3'];
const TIPOS_LIVRO = ['Livro A', 'Livro B', 'Livro C', 'Livro Auxiliar'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function Cadastro({ escritura, onSaveSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tipo: '',
        selagem: '',
        livro: '',
        folha: '',
        outorgante: '',
        outorgado: '',
        escrevente: '',
        tipoLivro: '',
        mes: '',
        ano: new Date().getFullYear().toString(),
        observacao: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (escritura) {
            setFormData({
                tipo: escritura.tipo || '',
                selagem: escritura.selagem || '',
                livro: escritura.livro || '',
                folha: escritura.folha || '',
                outorgante: escritura.outorgante || '',
                outorgado: escritura.outorgado || '',
                escrevente: escritura.escrevente || '',
                tipoLivro: escritura.tipoLivro || escritura.tipo_livro || '',
                mes: escritura.mes || '',
                ano: escritura.ano || new Date().getFullYear().toString(),
                observacao: escritura.observacao || ''
            });
        }
    }, [escritura]);

    function handleChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpar erro quando digitar
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            if (escritura) {
                // Editar
                await escriturasAPI.update(escritura.uuid || escritura.id, formData);
                toast.success('Escritura atualizada com sucesso!');
            } else {
                // Criar
                await escriturasAPI.create(formData);
                toast.success('Escritura cadastrada com sucesso!');
            }

            if (onSaveSuccess) {
                onSaveSuccess();
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);

            // Tratar erro de duplicata
            if (error.response?.status === 400 && error.response?.data?.error?.includes('Livro e Folha')) {
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
        if (onSaveSuccess) { // fallback para fechar
            onSaveSuccess();
        }
    }

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 className="text-3xl font-bold text-primary">
                    {escritura ? 'Editar Escritura' : 'Nova Escritura'}
                </h2>
                <p className="text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
                    Preencha os dados da escritura
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

                        {/* Outorgado */}
                        <Input
                            label="Outorgado"
                            type="text"
                            value={formData.outorgado}
                            onChange={(e) => handleChange('outorgado', e.target.value)}
                            placeholder="Nome do outorgado"
                            error={errors.outorgado}
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
                    <div style={{
                        marginTop: 'var(--spacing-xl)',
                        display: 'flex',
                        gap: 'var(--spacing-md)',
                        justifyContent: 'flex-end'
                    }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancelar}
                            icon={X}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            icon={Save}
                        >
                            {loading ? 'Salvando...' : (escritura ? 'Atualizar' : 'Salvar')}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
}

export default Cadastro;
