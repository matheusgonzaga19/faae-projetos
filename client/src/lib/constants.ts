export const TASK_STATUS = {
  ABERTA: 'aberta',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
} as const;

export const TASK_PRIORITY = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
  CRITICA: 'critica',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  SENIOR_ARCHITECT: 'senior_architect',
  JUNIOR_ARCHITECT: 'junior_architect',
  BUDGET_SPECIALIST: 'budget_specialist',
  COLLABORATOR: 'collaborator',
} as const;

export const PROJECT_TYPES = {
  STAND_IMOBILIARIO: 'stand_imobiliario',
  PROJETO_ARQUITETURA: 'projeto_arquitetura',
  PROJETO_ESTRUTURAL: 'projeto_estrutural',
  REFORMA: 'reforma',
  MANUTENCAO: 'manutencao',
} as const;

export const PROJECT_STAGES = {
  BRIEFING: 'briefing',
  CONCEITO: 'conceito',
  PROJETO: 'projeto',
  APROVACAO: 'aprovacao',
  ORCAMENTO: 'orcamento',
  PRODUCAO: 'producao',
  ENTREGA: 'entrega',
} as const;

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
} as const;

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export const STATUS_COLORS = {
  [TASK_STATUS.ABERTA]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  [TASK_STATUS.EM_ANDAMENTO]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [TASK_STATUS.CONCLUIDA]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [TASK_STATUS.CANCELADA]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export const PRIORITY_COLORS = {
  [TASK_PRIORITY.BAIXA]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [TASK_PRIORITY.MEDIA]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [TASK_PRIORITY.ALTA]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  [TASK_PRIORITY.CRITICA]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export const STATUS_LABELS = {
  [TASK_STATUS.ABERTA]: 'Aberta',
  [TASK_STATUS.EM_ANDAMENTO]: 'Em Andamento',
  [TASK_STATUS.CONCLUIDA]: 'Concluída',
  [TASK_STATUS.CANCELADA]: 'Cancelada',
};

export const PRIORITY_LABELS = {
  [TASK_PRIORITY.BAIXA]: 'Baixa',
  [TASK_PRIORITY.MEDIA]: 'Média',
  [TASK_PRIORITY.ALTA]: 'Alta',
  [TASK_PRIORITY.CRITICA]: 'Crítica',
};

export const CHART_COLORS = {
  primary: '#2563EB',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
};

export const KANBAN_COLUMNS = [
  {
    id: TASK_STATUS.ABERTA,
    title: 'Abertas',
    color: 'bg-gray-50 dark:bg-gray-800',
    badgeColor: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  },
  {
    id: TASK_STATUS.EM_ANDAMENTO,
    title: 'Em Andamento',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    badgeColor: 'bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-400',
  },
  {
    id: TASK_STATUS.CONCLUIDA,
    title: 'Concluídas',
    color: 'bg-green-50 dark:bg-green-900/20',
    badgeColor: 'bg-green-200 dark:bg-green-800 text-green-600 dark:text-green-400',
  },
];

export const FILE_ICONS = {
  'image': 'fas fa-image',
  'pdf': 'fas fa-file-pdf',
  'word': 'fas fa-file-word',
  'excel': 'fas fa-file-excel',
  'powerpoint': 'fas fa-file-powerpoint',
  'video': 'fas fa-file-video',
  'audio': 'fas fa-file-audio',
  'archive': 'fas fa-file-archive',
  'cad': 'fas fa-drafting-compass',
  'default': 'fas fa-file',
};

export const AI_SUGGESTIONS = [
  'Tarefas em atraso',
  'Progresso da equipe',
  'Próximos prazos',
  'Projetos ativos',
  'Eficiência geral',
  'Tarefas por prioridade',
];

