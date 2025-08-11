// Types for Firebase Auth integration
export type UserRole = 'admin' | 'collaborator';

export interface FirebaseUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: UserRole;
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