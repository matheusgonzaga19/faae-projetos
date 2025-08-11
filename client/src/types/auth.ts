// Types for Firebase Auth integration
export type UserRole = 'admin' | 'collaborator';

export type Section =
  | 'dashboard'
  | 'kanban'
  | 'projects'
  | 'calendar'
  | 'files'
  | 'chat'
  | 'users';

export const DEFAULT_ALLOWED_SECTIONS: Section[] = [
  'dashboard',
  'kanban',
  'projects',
  'calendar',
  'files',
  'chat',
];

export interface FirebaseUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: UserRole;
  allowedSections?: Section[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const USER_ROLES = {
  admin: 'Administrador',
  collaborator: 'Colaborador',
} as const;

export const ROLE_PERMISSIONS = {
  admin: {
    canManageUsers: true,
    canDeleteProjects: true,
    canEditAllTasks: true,
    canViewReports: true,
    canManageSettings: true,
  },
  collaborator: {
    canManageUsers: false,
    canDeleteProjects: false,
    canEditAllTasks: false,
    canViewReports: true,
    canManageSettings: false,
  },
} as const;