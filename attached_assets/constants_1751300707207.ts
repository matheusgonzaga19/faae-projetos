export const APP_NAME = "FAAE PROJETOS";

export const PRIMARY_COLOR = 'bg-blue-600'; // Example: #4C6EF5
export const ACCENT_COLOR = 'bg-yellow-500'; // Example: #F4D150
export const SUCCESS_COLOR = 'bg-green-500'; // Example: #2FBF9F
export const WARNING_COLOR = 'bg-orange-500'; // Example: #E2A32F
export const DEFAULT_KANBAN_STAGE_COLOR = 'bg-gray-400';

export enum UserRole {
  ADMIN = 'Administrador',
  PROJECT_MANAGER = 'Gerente de Projeto',
  SENIOR_ARCHITECT = 'Arquiteto Sênior',
  JUNIOR_ARCHITECT = 'Arquiteto Júnior',
  BUDGET_SPECIALIST = 'Orçamentista',
}

export const USER_ROLES_DETAILS: Record<UserRole, { name: string; color: string }> = {
  [UserRole.ADMIN]: { name: 'Administrador', color: 'bg-red-600' },
  [UserRole.PROJECT_MANAGER]: { name: 'Gerente de Projeto', color: 'bg-blue-600' },
  [UserRole.SENIOR_ARCHITECT]: { name: 'Arquiteto Sênior', color: 'bg-green-600' },
  [UserRole.JUNIOR_ARCHITECT]: { name: 'Arquiteto Júnior', color: 'bg-yellow-500' },
  [UserRole.BUDGET_SPECIALIST]: { name: 'Orçamentista', color: 'bg-purple-600' },
};

// Renamed for initial state, actual stages will be managed in component state
export const PROJECT_WORKFLOW_STAGES_INITIAL = [
  { id: 'briefing', name: 'Briefing', color: 'bg-sky-500', wipLimit: 5 },
  { id: 'conceito', name: 'Conceito', color: 'bg-purple-500', wipLimit: 3 },
  { id: 'projeto', name: 'Projeto', color: 'bg-amber-500', wipLimit: 4 },
  { id: 'aprovacao', name: 'Aprovação', color: 'bg-emerald-500', wipLimit: 2 },
  { id: 'orcamento', name: 'Orçamento', color: 'bg-indigo-500', wipLimit: 3 },
  { id: 'producao', name: 'Produção', color: 'bg-pink-500', wipLimit: 2 },
  { id: 'entrega', name: 'Entrega', color: 'bg-teal-500', wipLimit: null }, // No limit for delivered
];

export const PROJECT_WORKFLOW_STAGES = PROJECT_WORKFLOW_STAGES_INITIAL;


export const APP_ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  PROJECTS: '/projects',
  TIMELINE: '/timeline',
  TASKS: '/tasks',
  REPORTS: '/reports',
  SETTINGS: '/settings',
};

export const TASK_PRIORITIES: Record<Required<import('./types').Task['priority']>, string> = {
  Baixa: 'border-l-4 border-green-500',
  Média: 'border-l-4 border-yellow-500',
  Alta: 'border-l-4 border-orange-500',
  Urgente: 'border-l-4 border-red-500',
};

export const TASK_STATUSES = [
    { id: 'Pendente', name: 'Pendente', color: 'bg-gray-400' },
    { id: 'Em Andamento', name: 'Em Andamento', color: 'bg-blue-500' },
    { id: 'Concluída', name: 'Concluída', color: 'bg-green-500' },
    { id: 'Bloqueada', name: 'Bloqueada', color: 'bg-red-500' },
    { id: 'Revisão', name: 'Revisão', color: 'bg-yellow-500'},
];

export const WIP_LIMIT_DEFAULT = 5; // Default WIP limit if not specified in stage

// Chart Colors (Tailwind shades)
export const CHART_COLORS = {
  blue: 'rgba(59, 130, 246, 0.7)', // blue-500
  sky: 'rgba(14, 165, 233, 0.7)', // sky-500
  purple: 'rgba(168, 85, 247, 0.7)', // purple-500
  amber: 'rgba(245, 158, 11, 0.7)', // amber-500
  emerald: 'rgba(16, 185, 129, 0.7)', // emerald-500
  indigo: 'rgba(99, 102, 241, 0.7)', // indigo-500
  pink: 'rgba(236, 72, 153, 0.7)', // pink-500
  teal: 'rgba(20, 184, 166, 0.7)', // teal-500
  red: 'rgba(239, 68, 68, 0.7)', // red-500
  green: 'rgba(34, 197, 94, 0.7)', // green-500
  yellow: 'rgba(234, 179, 8, 0.7)', // yellow-500
  gray: 'rgba(107, 114, 128, 0.7)', // gray-500
  // Added from PROJECT_WORKFLOW_STAGES_INITIAL that were not in CHART_COLORS
  briefing: 'rgba(14, 165, 233, 0.7)', // bg-sky-500
  conceito: 'rgba(168, 85, 247, 0.7)', // bg-purple-500
  projeto: 'rgba(245, 158, 11, 0.7)', // bg-amber-500
  aprovacao: 'rgba(16, 185, 129, 0.7)', // bg-emerald-500
  orcamento: 'rgba(99, 102, 241, 0.7)', // bg-indigo-500
  producao: 'rgba(236, 72, 153, 0.7)', // bg-pink-500
  entrega: 'rgba(20, 184, 166, 0.7)', // bg-teal-500
};
export const CHART_BORDER_COLORS = {
  blue: 'rgb(59, 130, 246)',
  sky: 'rgb(14, 165, 233)',
  purple: 'rgb(168, 85, 247)',
  amber: 'rgb(245, 158, 11)',
  emerald: 'rgb(16, 185, 129)',
  indigo: 'rgb(99, 102, 241)',
  pink: 'rgb(236, 72, 153)',
  teal: 'rgb(20, 184, 166)',
  red: 'rgb(239, 68, 68)',
  green: 'rgb(34, 197, 94)',
  yellow: 'rgb(234, 179, 8)',
  gray: 'rgb(107, 114, 128)',
  // Added from PROJECT_WORKFLOW_STAGES_INITIAL that were not in CHART_BORDER_COLORS
  briefing: 'rgb(14, 165, 233)',
  conceito: 'rgb(168, 85, 247)',
  projeto: 'rgb(245, 158, 11)',
  aprovacao: 'rgb(16, 185, 129)',
  orcamento: 'rgb(99, 102, 241)',
  producao: 'rgb(236, 72, 153)',
  entrega: 'rgb(20, 184, 166)',
};

// Available Tailwind background colors for dynamic stages
export const KANBAN_STAGE_COLORS = [
  'bg-sky-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500', 
  'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 
  'bg-cyan-500', 'bg-lime-500', 'bg-fuchsia-500', 'bg-violet-500'
];