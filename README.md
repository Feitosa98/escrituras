# Sistema de Controle de Escrituras

Sistema profissional para gerenciamento de escrituras cartorárias, desenvolvido com arquitetura moderna e segura.

## 🚀 Funcionalidades

- **Dashboard**: Estatísticas em tempo real e gráficos interativos.
- **Consultas Avançadas**: Busca rápida, filtros por período e ordenação.
- **Gestão Completa**: Cadastro, edição e controle de usuários com permissões (Admin/Editor/Visualizador).
- **Segurança**: Autenticação robusta (JWT), hash de senhas, auditoria de ações e logs de integridade.
- **Relatórios**: Exportação para Excel, PDF e sistema de Metas mensais.
- **Design**: Interface moderna, modo escuro/claro e totalmente responsiva.

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + Vite + Recharts + Lucide Icons
- **Backend**: Node.js + Express
- **Banco de Dados**: SQLite (com better-sqlite3)
- **Segurança**: Bcrypt + JWT + Helmet + Rate Limiting
- **Utilitários**: SheetJS (Excel), jsPDF (PDF)

## 📦 Como Executar (Do Zero)

Siga estes passos para rodar o projeto em sua máquina após baixar do GitHub:

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) (versão 18 ou superior) instalado.

### 2. Instalação
Abra o terminal na pasta do projeto e instale as dependências:
```bash
npm install
```

### 3. Build (Construção)
Compile o frontend para produção (necessário porque o backend serve os arquivos estáticos):
```bash
npm run build
```

### 4. Executar
Inicie o servidor backend:
```bash
node backend/server.js
```
O servidor iniciará em `http://localhost:3001`.

---

## 🔑 Acesso Padrão

Para o primeiro acesso, utilize a conta de super-administrador (criada automaticamente):

- **Email**: `admin@sistema.local`
- **Senha**: `admin123`

> **Nota**: Recomenda-se criar um novo usuário admin e desativar este padrão em produção.

## 📂 Estrutura de Pastas

- `/src` - Código fonte do Frontend (React)
- `/backend` - Código fonte do Servidor e API (Node.js)
- `/dist` - Arquivos estáticos gerados pelo build (não editar manualmente)
- `/database` - Arquivos do banco de dados SQLite

## 🔒 Segurança e Dados

- O banco de dados é um arquivo local (`escrituras.db`).
- Faça backups regulares do arquivo `.db` ou use a função de exportação do sistema.
- Todas as senhas são criptografadas.

## 📄 Licença e Créditos

**Desenvolvido por:** Iago Feitosa  
**Empresa:** Feitosa Soluções em Informática  
**Ano:** 2026

© 2026 Feitosa Soluções em Informática. Todos os direitos reservados.
