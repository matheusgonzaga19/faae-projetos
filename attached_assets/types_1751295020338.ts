export enum UserRole {
  ADMIN = 'Administrador',
  COLLABORATOR = 'Colaborador',
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
  avatar?: string;
}

export enum Priority {
  BAIXA = 'Baixa',
  MEDIA = 'Média',
  ALTA = 'Alta',
}

export enum Status {
  ABERTA = 'Aberta',
  EM_ANDAMENTO = 'Em andamento',
  CONCLUIDA = 'Concluída',
}

export interface TaskHistory {
    date: string;
    user: string;
    changes: string;
}

export interface Task {
  id: number;
  userId: number;
  title: string;
  description: string;
  priority: Priority;
  startDate: string;
  dueDate: string;
  status: Status;
  project: string;
  files?: File[];
  createdAt: string;
  completedAt: string | null;
  history: TaskHistory[];
}

export enum Page {
  DASHBOARD = 'Dashboard',
  CHAT = 'Chat-Tarefas',
  USERS = 'Usuários',
}

export interface File {
  name: string;
  size: number;
}