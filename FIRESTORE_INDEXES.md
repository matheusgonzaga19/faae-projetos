# Firestore Composite Indexes for Performance Optimization

## Required Composite Indexes

Para otimizar o desempenho das consultas do FAAE Projetos, configure os seguintes índices compostos no Firestore:

### Tasks Collection

#### 1. projectId + status + createdAt
```javascript
Collection: tasks
Fields: 
  - projectId (Ascending)
  - status (Ascending) 
  - createdAt (Descending)
```
**Uso**: Consultas do Kanban filtradas por projeto e status

#### 2. assignedUserId + status + createdAt  
```javascript
Collection: tasks
Fields:
  - assignedUserId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```
**Uso**: Consultas de tarefas por usuário responsável

#### 3. projectId + dueDate
```javascript
Collection: tasks
Fields:
  - projectId (Ascending) 
  - dueDate (Ascending)
```
**Uso**: Calendário e Gantt chart ordenados por data de vencimento

#### 4. status + dueDate
```javascript
Collection: tasks
Fields:
  - status (Ascending)
  - dueDate (Ascending) 
```
**Uso**: Próximos prazos e deadlines por status

#### 5. assignedUserId + dueDate
```javascript
Collection: tasks
Fields:
  - assignedUserId (Ascending)
  - dueDate (Ascending)
```
**Uso**: Calendário pessoal de tarefas por usuário

### Projects Collection

#### 1. status + createdAt
```javascript
Collection: projects
Fields:
  - status (Ascending)
  - createdAt (Descending)
```
**Uso**: Listagem de projetos ativos/inativos

## Como Configurar

### Via Firebase Console:
1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá para Firestore Database → Indexes
4. Clique em "Create Index"
5. Configure cada índice conforme especificado acima

### Via Firebase CLI:
```bash
# firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "projectId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "tasks", 
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "assignedUserId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "projectId", "order": "ASCENDING"},
        {"fieldPath": "dueDate", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "dueDate", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "assignedUserId", "order": "ASCENDING"}, 
        {"fieldPath": "dueDate", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

Deploy com:
```bash
firebase deploy --only firestore:indexes
```

## Benefícios de Performance

- **Eliminação de Scans Completos**: Evita ler toda a coleção de tarefas
- **Consultas Rápidas**: Índices otimizados para casos de uso específicos
- **Redução de Custos**: Menos operações de leitura no Firestore
- **Escalabilidade**: Performance mantida com crescimento da base de dados
- **Tempo Real Eficiente**: onSnapshot() funciona melhor com índices

## Monitoramento

Monitore o uso dos índices em:
- Firebase Console → Firestore → Usage
- Verifique "Index usage" e "Query performance"
- Identifique consultas lentas em "Query insights"

## Regras de Performance

1. **Sempre filtrar por campos indexados**: projectId, assignedUserId ou status
2. **Limitar resultados**: Use `limit()` nas consultas (max 100-500)
3. **Evitar consultas sem filtros**: Retorna array vazio se não houver filtros
4. **Usar onSnapshot() apenas quando necessário**: Para dados em tempo real
5. **Cleanup de subscriptions**: Sempre fazer unsubscribe no useEffect cleanup