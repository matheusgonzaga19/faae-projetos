# Configuração Firebase - FAAE Projetos

Este projeto agora usa Firebase para autenticação, banco de dados (Firestore) e armazenamento de arquivos (Firebase Storage).

## Configuração Necessária

### 1. Criar Projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em "Criar projeto" ou "Add project"
3. Digite um nome para seu projeto (ex: "faae-projetos")
4. Configure o Google Analytics se desejar
5. Clique em "Criar projeto"

### 2. Configurar Authentication

1. No console Firebase, vá para "Authentication"
2. Clique na aba "Sign-in method"
3. Habilite "Google" como provider
4. Configure o nome público do projeto
5. Adicione seu domínio autorizado (para desenvolvimento: `localhost`)

### 3. Configurar Firestore Database

1. No console Firebase, vá para "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de teste" (para desenvolvimento)
4. Selecione uma localização (recomendado: southamerica-east1)

### 4. Configurar Storage

1. No console Firebase, vá para "Storage"
2. Clique em "Começar"
3. Aceite as regras padrão (para desenvolvimento)
4. Escolha a mesma localização do Firestore

### 5. Obter Chaves de Configuração

1. No console Firebase, vá para "Configurações do projeto" (ícone de engrenagem)
2. Na aba "Geral", desça até "Seus apps"
3. Clique em "Adicionar app" e escolha "Web" (</>)
4. Digite um nome para o app (ex: "FAAE Projetos Web")
5. Marque "Configurar Firebase Hosting" se desejar
6. Clique em "Registrar app"
7. Copie as informações de configuração

### 6. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` na raiz do projeto e substitua os valores pelas suas chaves Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSyA... (sua API Key real)
VITE_FIREBASE_PROJECT_ID=meu-projeto-firebase (seu Project ID real)
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef... (seu App ID real)
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789 (seu Sender ID real)
```

**IMPORTANTE**: 
- NÃO use aspas nas variáveis de ambiente
- Substitua TODOS os valores pelos dados reais do seu Firebase Console
- As chaves devem começar com `VITE_` para serem acessíveis no frontend

### 7. Executar o Projeto

**No Windows:**
```bash
npm run dev:win
```

**No macOS/Linux:**
```bash
npm run dev
```

**Ou usando cross-env (funciona em qualquer sistema):**
```bash
npx cross-env NODE_ENV=development tsx server/index.ts
```

### 7. Configurar Regras de Segurança

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projetos, tarefas, comentários e arquivos para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Funcionalidades Migradas

✅ **Autenticação**: Login com Google via Firebase Auth
✅ **Banco de Dados**: Todos os dados agora salvos no Firestore
✅ **Armazenamento**: Upload de arquivos via Firebase Storage
✅ **Real-time**: Atualizações em tempo real via Firestore listeners
✅ **Compatibilidade**: Mantém todas as funcionalidades existentes

## Próximos Passos

1. Configure as chaves Firebase no arquivo `.env.local`
2. Execute `npm run dev` para testar localmente
3. Para produção, configure as variáveis no ambiente de deployment
4. Opcional: Configure Firebase Hosting para deploy automático

## Suporte

Se precisar de ajuda, verifique:
- [Documentação Firebase](https://firebase.google.com/docs)
- [Console Firebase](https://console.firebase.google.com)
- Logs do navegador para erros de configuração