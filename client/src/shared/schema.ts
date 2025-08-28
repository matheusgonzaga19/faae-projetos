// Minimal shared types to support the client without the Replit DB server

export type TaskStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
export type TaskPriority = 'baixa' | 'media' | 'alta' | 'critica';

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
  assignedUserId?: string | null;
  dueDate?: Date | string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TaskWithDetails extends Task {
  project?: Project | null;
  assignedUser?: User | null;
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

