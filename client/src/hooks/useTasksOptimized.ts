import { useQuery } from '@tanstack/react-query';
import { firebaseService } from '@/services/firebaseService';

interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export const useTasksOptimized = (filters: TaskFilters = {}, enabled: boolean = true) => {
  // Always ensure at least one filter is present to prevent full collection scans
  const optimizedFilters = {
    ...filters,
    limit: filters.limit || 200,
  };

  // Require at least one filter to prevent reading entire collection
  if (!optimizedFilters.projectId && !optimizedFilters.assigneeId && !optimizedFilters.status) {
    optimizedFilters.status = 'aberta'; // Default filter
  }

  return useQuery({
    queryKey: ['/api/tasks', 'optimized', optimizedFilters],
    queryFn: () => firebaseService.getTasks(optimizedFilters),
    refetchInterval: 30000,
    enabled,
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
};

export const useTasksByProject = (projectId: string, enabled: boolean = true) => {
  return useTasksOptimized({ projectId, limit: 200 }, enabled && !!projectId);
};

export const useTasksByAssignee = (assigneeId: string, enabled: boolean = true) => {
  return useTasksOptimized({ assigneeId, limit: 200 }, enabled && !!assigneeId);
};

export const useTasksByStatus = (status: string, enabled: boolean = true) => {
  return useTasksOptimized({ status, limit: 100 }, enabled && !!status);
};

export const useTasksCalendar = (filters: TaskFilters = {}, enabled: boolean = true) => {
  const calendarFilters = {
    ...filters,
    orderBy: 'dueDate',
    orderDirection: 'asc' as const,
    limit: 500, // Higher limit for calendar view
  };

  // Ensure filtered query for calendar
  if (!calendarFilters.projectId && !calendarFilters.assigneeId && !calendarFilters.status) {
    calendarFilters.status = 'aberta';
  }

  return useQuery({
    queryKey: ['/api/tasks', 'calendar', calendarFilters],
    queryFn: () => firebaseService.getTasks(calendarFilters),
    refetchInterval: 60000, // Less frequent updates for calendar
    enabled,
    staleTime: 30000,
  });
};