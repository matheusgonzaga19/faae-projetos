export type { 
  User, 
  Task, 
  Project, 
  TaskWithDetails, 
  ProjectWithTasks, 
  UserWithStats,
  File,
  Notification,
  TimeEntry,
} from "@shared/schema";

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  activeProjects: number;
  totalHours: number;
  efficiency: number;
}

export interface UserStats {
  taskCount: number;
  completedTaskCount: number;
  hoursWorked: number;
  efficiency: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  data?: any;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: TaskWithDetails[];
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'deadline' | 'milestone';
  priority?: string;
}

export interface FilePreview {
  isImage: boolean;
  isPDF: boolean;
  isCAD: boolean;
  thumbnail?: string;
}
