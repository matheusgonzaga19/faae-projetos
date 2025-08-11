# Firestore Security Rules for FAAE Projetos

## Security Implementation

Para implementar regras de segurança baseadas em roles no Firebase, configure as seguintes regras no Firestore:

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - only authenticated users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins can read all users
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Projects collection - authenticated users can read, admins can write
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Tasks collection - users can only access tasks assigned to them or their projects
    match /tasks/{taskId} {
      allow read: if request.auth != null && (
        // User is assigned to the task
        resource.data.assigneeId == request.auth.uid ||
        // User is admin
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      allow create: if request.auth != null && (
        // User is admin
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      allow update: if request.auth != null && (
        // User is assigned to the task (can update status and progress)
        resource.data.assigneeId == request.auth.uid ||
        // User is admin (can update anything)
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      
      allow delete: if request.auth != null && 
                       exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Files collection - similar to tasks
    match /files/{fileId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Como Configurar

1. **Acesse o Firebase Console**
   - Vá para Firestore Database → Rules
   - Cole as regras acima
   - Clique em "Publish"

2. **Validação das Regras**
   - Use o simulador do Firebase para testar as regras
   - Teste cenários de admin e colaborador
   - Verifique se usuários só acessam suas próprias tarefas

### Regras de Negócio Implementadas

#### Usuários (Users)
- ✅ Usuários podem ler/editar apenas seus próprios dados
- ✅ Admins podem ler dados de todos os usuários
- ✅ Criação de usuários via Firebase Auth + Cloud Function

#### Projetos (Projects)
- ✅ Todos os usuários autenticados podem ler projetos
- ✅ Apenas admins podem criar/editar/deletar projetos

#### Tarefas (Tasks)
- ✅ Usuários só podem ler tarefas atribuídas a eles
- ✅ Admins podem ler/editar todas as tarefas
- ✅ Colaboradores podem atualizar status de suas tarefas
- ✅ Apenas admins podem criar/deletar tarefas

#### Arquivos (Files)
- ✅ Usuários autenticados podem acessar arquivos
- ✅ Arquivos vinculados a projetos/tarefas específicos

### Implementação no Frontend

#### AuthContext
```typescript
// client/src/components/Auth/AuthContext.tsx
const hasProjectAccess = (projectId: string): boolean => {
  if (!userData) return false;
  if (isAdmin) return true;
  
  // Colaboradores têm acesso a projetos específicos
  return userData.isActive;
};

const canEditTask = (task: Task): boolean => {
  if (!userData) return false;
  if (isAdmin) return true;
  
  // Colaboradores podem editar apenas suas tarefas
  return task.assigneeId === userData.id;
};
```

#### Query Filtering
```typescript
// Sempre filtrar consultas por usuário
const getTasks = (filters: TaskFilters) => {
  if (!isAdmin) {
    filters.assigneeId = currentUser.uid;
  }
  return firebaseService.getTasks(filters);
};
```

### Benefícios de Segurança

1. **Isolamento de Dados**: Usuários só acessam dados relevantes
2. **Role-based Access**: Diferenciação entre admin e colaborador
3. **Performance**: Consultas filtradas reduzem transferência de dados
4. **Compliance**: Atende requisitos de proteção de dados
5. **Escalabilidade**: Regras aplicadas automaticamente

### Monitoramento

- Firebase Console → Authentication → Users (verificar roles)
- Firestore → Data (verificar estrutura de permissões)
- Cloud Functions → Logs (monitorar criação de usuários)
- Security Rules → Usage (verificar violações de regras)

### Troubleshooting

**Erro: "permission-denied"**
- Verificar se usuário está autenticado
- Conferir se role está corretamente definida
- Validar filtros assigneeId nas consultas

**Tarefas não aparecem**
- Verificar se assigneeId está definido
- Confirmar filtros de consulta
- Testar com usuário admin