# Sistema de Controle de Escrituras

Sistema moderno para gerenciamento de escrituras cartorárias, desenvolvido com React e Vite.

## 🚀 Funcionalidades

- **Dashboard**: Estatísticas em tempo real e gráficos interativos.
- **Listagem Completa**: Tabela com busca, filtros avançados e ordenação.
- **Cadastro Simplificado**: Formulário intuitivo com validação de duplicatas.
- **Visualização Detalhada**: Página exclusiva para conferência de dados.
- **Importação/Exportação**: Suporte a Excel, PDF e Backup JSON.
- **Tema**: Modo claro e escuro.
- **Design Web**: Interface responsiva e moderna.

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **Estilização**: CSS Modules / Variáveis CSS (Design System)
- **Banco de Dados**: IndexedDB (via Dexie.js)
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Utilitários**: SheetJS (Excel), jsPDF (PDF)

## 📦 Instalação e Execução

Necessário ter o [Node.js](https://nodejs.org/) instalado.

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acesse no navegador:**
   O terminal mostrará o link, geralmente: `http://localhost:5173`

## 📖 Como Usar

### Importar Dados Antigos
1. Vá para a página **Importar**.
2. Selecione sua planilha Excel antiga (formato compatível).
3. Aguarde o processamento.

### Cadastrar Nova Escritura
1. Clique em **Nova Escritura**.
2. Preencha os campos obrigatórios.
3. O sistema avisará se houver duplicidade de Livro/Folha.

### Fazer Backup
1. Vá para a página **Exportar**.
2. Clique em **Fazer Backup** para baixar um arquivo JSON com todos os seus dados.
3. Guarde este arquivo em segurança.

## 🔒 Segurança dos Dados

Os dados são armazenados **localmente no seu navegador** (IndexedDB). Não há envio para nuvem.
**IMPORTANTE**: Faça backups regulares (Exportar -> Backup) para evitar perda de dados em caso de limpeza de cache ou problemas no computador.

## 📄 Documentação Legal

O sistema inclui documentação completa de:
- **Termos de Uso**: Acesse pelo ícone no header
- **Política de Privacidade**: Conforme LGPD, acesse pelo ícone no header

## 👨‍💻 Créditos

**Desenvolvido por:** Iago Feitosa  
**Empresa:** Feitosa Soluções em Informática  
**Ano:** 2026

---

© 2026 Feitosa Soluções em Informática. Todos os direitos reservados.
