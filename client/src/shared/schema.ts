// Minimal shared types to support the client without the Replit DB server

export type TaskStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
export type TaskPriority = 'baixa' | 'media' | 'alta' | 'critica' | 'urgente';

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assignedUserIds?: string[];
  dueDate?: Date | string | null;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface TaskRelationship {
  id: string;
  type: 'blocks' | 'blocked_by' | 'relates_to';
  taskId: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'list' | 'date' | 'boolean';
  value: string | number | boolean | null;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: 'admin' | 'collaborator';
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  type?: string;
  stage?: string;
  priority?: string;
  // New business fields
  companyName?: string | null;
  cnpj?: string | null;
  nfeEmail?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  budget?: number | null;
  estimatedHours?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  location?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  managerUserId?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  assignedUserId?: string | null; // legacy single responsible
  assignedUserIds?: string[]; // multiple responsáveis
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  tags?: string[];
  relationships?: TaskRelationship[];
  customFields?: CustomField[];
  subtasks?: Subtask[];
  checklists?: Checklist[];
  estimatedHours?: number | null;
  actualHours?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  completedAt?: Date | string | null;
}

export interface TaskWithDetails extends Task {
  project?: Project | null;
  assignedUser?: User | null;
  assignedUsers?: User[];
  timeEntries?: Array<{ id: string; startedAt: Date; endedAt?: Date | null; hours?: number | null }>;
}

export interface ProjectWithTasks extends Project {
  tasks?: TaskWithDetails[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  createdAt: Date;
}

export interface File {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  mimeType: string;
  originalName: string;
  taskId?: string;
  projectId?: string;
  uploadedUserId?: string;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date | null;
  hours?: number | null;
}
