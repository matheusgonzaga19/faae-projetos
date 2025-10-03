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

export const THEME_COLORS = {
  primary: '#4c6ef5',
  primarySoft: '#e3e9ff',
  success: '#2fbf9f',
  successSoft: '#d7f2ea',
  warning: '#f4d150',
  warningSoft: '#fff2d6',
  danger: '#f16a6f',
  dangerSoft: '#fbe3e5',
  info: '#4c6ef5',
  infoSoft: '#d2e8ff',
  accent: '#8154f5',
  accentSoft: '#eae1ff',
  neutral: '#6d759b',
} as const;

export const STATUS_BADGE_STYLES = {
  [TASK_STATUS.ABERTA]: 'bg-blue-100 text-blue-800 border border-blue-200/60 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/40',
  [TASK_STATUS.EM_ANDAMENTO]: 'bg-indigo-100 text-indigo-800 border border-indigo-200/60 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800/40',
  [TASK_STATUS.CONCLUIDA]: 'bg-emerald-100 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/40',
  [TASK_STATUS.CANCELADA]: 'bg-red-100 text-red-800 border border-red-200/60 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/40',
};

export const PRIORITY_BADGE_STYLES = {
  [TASK_PRIORITY.BAIXA]: 'bg-emerald-100 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/40',
  [TASK_PRIORITY.MEDIA]: 'bg-yellow-100 text-yellow-800 border border-yellow-200/60 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800/40',
  [TASK_PRIORITY.ALTA]: 'bg-orange-100 text-orange-800 border border-orange-200/60 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800/40',
  [TASK_PRIORITY.CRITICA]: 'bg-red-100 text-red-800 border border-red-200/60 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/40',
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

export const STATUS_COLOR_VALUES = {
  [TASK_STATUS.ABERTA]: THEME_COLORS.info,
  [TASK_STATUS.EM_ANDAMENTO]: THEME_COLORS.accent,
  [TASK_STATUS.CONCLUIDA]: THEME_COLORS.success,
  [TASK_STATUS.CANCELADA]: THEME_COLORS.danger,
} as const;

export const PRIORITY_COLOR_VALUES = {
  [TASK_PRIORITY.BAIXA]: THEME_COLORS.success,
  [TASK_PRIORITY.MEDIA]: THEME_COLORS.warning,
  [TASK_PRIORITY.ALTA]: THEME_COLORS.accent,
  [TASK_PRIORITY.CRITICA]: THEME_COLORS.danger,
} as const;

export const CHART_COLORS = {
  primary: THEME_COLORS.primary,
  secondary: THEME_COLORS.success,
  accent: THEME_COLORS.warning,
  danger: THEME_COLORS.danger,
  warning: THEME_COLORS.warning,
  success: THEME_COLORS.success,
  info: THEME_COLORS.info,
};

export const CHART_COLOR_SEQUENCE = [
  THEME_COLORS.primary,
  THEME_COLORS.success,
  THEME_COLORS.warning,
  THEME_COLORS.accent,
  THEME_COLORS.danger,
];

export const KANBAN_COLUMNS = [
  {
    id: TASK_STATUS.ABERTA,
    title: 'Abertas',
    color: 'bg-blue-50/80 dark:bg-blue-900/20',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  },
  {
    id: TASK_STATUS.EM_ANDAMENTO,
    title: 'Em Andamento',
    color: 'bg-indigo-50/80 dark:bg-indigo-900/20',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
  },
  {
    id: TASK_STATUS.CONCLUIDA,
    title: 'Concluídas',
    color: 'bg-emerald-50/80 dark:bg-emerald-900/20',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
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

