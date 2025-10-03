import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, AlertTriangle, RefreshCw, Edit2, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TaskList from './TaskList';
import { useToast } from '@/hooks/use-toast';
import { firebaseService } from '@/services/firebaseService';
import TaskModal from './TaskModal';
import TaskDetailsDrawer from './TaskDetailsDrawer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { TaskTag, User } from '@/types';
import { DEFAULT_TAG_COLOR, getTagTextColor } from '@/utils/tags';
import {
  STATUS_BADGE_STYLES,
  STATUS_LABELS,
  PRIORITY_BADGE_STYLES,
  PRIORITY_LABELS,
} from '@/lib/constants';

type TaskStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
type TaskPriority = 'baixa' | 'media' | 'alta' | 'critica';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string;
  assignedUserIds?: string[];
  startDate?: Date;
  tags?: TaskTag[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

const COLUMNS = [
  { id: 'aberta', title: STATUS_LABELS.aberta },
  { id: 'em_andamento', title: STATUS_LABELS.em_andamento },
  { id: 'concluida', title: STATUS_LABELS.concluida },
  { id: 'cancelada', title: STATUS_LABELS.cancelada },
] as const;

const COLUMN_HEADER_CLASSES: Record<TaskStatus, string> = {
  aberta: 'bg-blue-50/80 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-800/40',
  em_andamento:
    'bg-indigo-50/80 text-indigo-900 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-100 dark:border-indigo-800/40',
  concluida:
    'bg-emerald-50/80 text-emerald-900 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800/40',
  cancelada:
    'bg-red-50/80 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800/40',
};

export default function KanbanBoard() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [tagSearch, setTagSearch] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<TaskTag[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagSuggestionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      if (tagSuggestionsTimeoutRef.current) {
        clearTimeout(tagSuggestionsTimeoutRef.current);
      }
    };
  }, []);

  const normalizedTagSearch = tagSearch.trim().toLowerCase();

  const resolveTagIdentifier = (tag: TaskTag) => {
    const rawId = typeof tag.id === 'string' ? tag.id.trim() : '';
    if (rawId) {
      return rawId;
    }

    const normalizedName = (tag.name || '').trim().toLowerCase();
    const normalizedColor = (tag.color || DEFAULT_TAG_COLOR).trim().toLowerCase();

    return `${normalizedName}-${normalizedColor}`;
  };

  const matchesTagFilter = (task: Task) => {
    if (selectedTags.length === 0 && !normalizedTagSearch) return true;
    if (!task.tags || task.tags.length === 0) return false;

    if (selectedTags.length > 0) {
      const taskTagIds = new Set(task.tags.map(resolveTagIdentifier));
      const hasAllSelectedTags = selectedTags.every(tag => taskTagIds.has(tag.id));

      if (!hasAllSelectedTags) {
        return false;
      }
    }

    if (normalizedTagSearch) {
      return task.tags.some(tag =>
        tag.name.toLowerCase().includes(normalizedTagSearch)
      );
    }

    return true;
  };

  // Fetch tasks and projects with optimized queries and user filtering
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['/api/tasks', 'kanban', selectedProjectId],
    queryFn: () => firebaseService.getTasks({
      projectId: selectedProjectId || undefined,
      limit: 200 // Limit for performance
    }),
    refetchInterval: 30000,
    enabled: true,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => firebaseService.getProjects(),
  });

  // Fetch users for assignee filtering
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: () => firebaseService.getAllUsers(),
    refetchInterval: 60000,
  });

  const availableTags = useMemo(() => {
    const map = new Map<string, TaskTag>();

    tasks.forEach(task => {
      task.tags?.forEach(tag => {
        if (!tag) {
          return;
        }

        const identifier = resolveTagIdentifier(tag);
        const name = tag.name.trim();
        if (!name) {
          return;
        }

        const color = (tag.color || '').trim() || DEFAULT_TAG_COLOR;

        if (!map.has(identifier)) {
          map.set(identifier, {
            id: identifier,
            name,
            color,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR')
    );
  }, [tasks]);

  const filteredTagOptions = useMemo(() => {
    if (availableTags.length === 0) {
      return [] as TaskTag[];
    }

    return availableTags.filter(tag => {
      if (selectedTags.some(selected => selected.id === tag.id)) {
        return false;
      }

      if (!normalizedTagSearch) {
        return true;
      }

      return tag.name.toLowerCase().includes(normalizedTagSearch);
    });
  }, [availableTags, normalizedTagSearch, selectedTags]);

  const handleTagSelect = (tag: TaskTag) => {
    setSelectedTags(prev => {
      if (prev.some(selected => selected.id === tag.id)) {
        return prev;
      }

      return [...prev, tag];
    });
    setTagSearch('');
    if (tagSuggestionsTimeoutRef.current) {
      clearTimeout(tagSuggestionsTimeoutRef.current);
      tagSuggestionsTimeoutRef.current = null;
    }
    setShowTagSuggestions(true);
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      await firebaseService.updateTask(taskId, {
        status: newStatus,
        updatedAt: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/enhanced'] });
      toast({
        title: "Sucesso",
        description: "Status da tarefa atualizado com sucesso!",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error updating task status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da tarefa",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await firebaseService.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/enhanced'] });
      toast({ title: 'Tarefa excluída', description: 'A tarefa foi removida com sucesso.' });
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    },
    onError: (error) => {
      toast({ title: 'Erro', description: (error as Error).message || 'Falha ao excluir tarefa', variant: 'destructive' });
    }
  });

  // Group tasks by status and filter by project/user if selected
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => {
      const statusMatch = task.status === status && (!selectedStatusFilter || task.status === selectedStatusFilter);
      const projectMatch = !selectedProjectId || String((task as any).projectId) === selectedProjectId;
      const userMatch =
        !selectedUserId ||
        task.assigneeId === selectedUserId ||
        (task.assignedUserIds && task.assignedUserIds.includes(selectedUserId));
      const priorityMatch = !selectedPriority || task.priority === selectedPriority;
      const tagMatch = matchesTagFilter(task);
      return statusMatch && projectMatch && userMatch && priorityMatch && tagMatch;
    });
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const statusMatch = !selectedStatusFilter || task.status === selectedStatusFilter;
      const projectMatch = !selectedProjectId || String((task as any).projectId) === selectedProjectId;
      const userMatch =
        !selectedUserId ||
        task.assigneeId === selectedUserId ||
        (task.assignedUserIds && task.assignedUserIds.includes(selectedUserId));
      const priorityMatch = !selectedPriority || task.priority === selectedPriority;
      const tagMatch = matchesTagFilter(task);
      return statusMatch && projectMatch && userMatch && priorityMatch && tagMatch;
    });
  };

  const handleEdit = (task: Task) => {
    setDrawerTask(task);
    setIsTaskDrawerOpen(true);
  };

  const handleView = (task: Task) => {
    setDrawerTask(task);
    setIsTaskDrawerOpen(true);
  };

  const handleOpenAdvancedEdit = (task: Task) => {
    setSelectedTask(task);
    setModalMode('edit');
    setIsTaskModalOpen(true);
    setIsTaskDrawerOpen(false);
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    updateTaskMutation.mutate({ taskId: draggableId, newStatus });
  };

  // Get project name by ID
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Projeto não encontrado';
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Carregando tarefas...</span>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-600 mt-1">Gerencie suas tarefas com drag and drop</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {/* User Filter */}
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os usuários</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>

          {/* Tag Filter */}
          <div className="w-64 self-start">
            <div className="relative">
              <Input
                value={tagSearch}
                onChange={(event) => {
                  if (tagSuggestionsTimeoutRef.current) {
                    clearTimeout(tagSuggestionsTimeoutRef.current);
                    tagSuggestionsTimeoutRef.current = null;
                  }
                  setTagSearch(event.target.value);
                  setShowTagSuggestions(true);
                }}
                onFocus={() => {
                  if (tagSuggestionsTimeoutRef.current) {
                    clearTimeout(tagSuggestionsTimeoutRef.current);
                    tagSuggestionsTimeoutRef.current = null;
                  }
                  setShowTagSuggestions(true);
                }}
                onBlur={() => {
                  if (tagSuggestionsTimeoutRef.current) {
                    clearTimeout(tagSuggestionsTimeoutRef.current);
                  }
                  tagSuggestionsTimeoutRef.current = setTimeout(() => {
                    setShowTagSuggestions(false);
                    tagSuggestionsTimeoutRef.current = null;
                  }, 100);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && !tagSearch && selectedTags.length > 0) {
                    event.preventDefault();
                    const lastTag = selectedTags[selectedTags.length - 1];
                    if (lastTag) {
                      handleTagRemove(lastTag.id);
                    }
                  } else if (event.key === 'Escape') {
                    if (tagSuggestionsTimeoutRef.current) {
                      clearTimeout(tagSuggestionsTimeoutRef.current);
                      tagSuggestionsTimeoutRef.current = null;
                    }
                    setShowTagSuggestions(false);
                  } else if (event.key === 'Enter') {
                    const firstOption = filteredTagOptions[0];
                    if (firstOption) {
                      event.preventDefault();
                      handleTagSelect(firstOption);
                    }
                  }
                }}
                placeholder={selectedTags.length > 0 ? 'Buscar mais etiquetas' : 'Filtrar etiqueta'}
                className="w-full"
              />
              {showTagSuggestions && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                  {availableTags.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Nenhuma etiqueta disponível.</div>
                  ) : filteredTagOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Nenhuma etiqueta encontrada.</div>
                  ) : (
                    <ul className="max-h-48 overflow-y-auto py-1 text-sm text-gray-700">
                      {filteredTagOptions.map((tag) => (
                        <li key={tag.id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleTagSelect(tag);
                            }}
                          >
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: tag.color || DEFAULT_TAG_COLOR }}
                            />
                            <span>{tag.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTags.map((tag) => {
                  const backgroundColor = tag.color || DEFAULT_TAG_COLOR;
                  const textColor = getTagTextColor(backgroundColor);
                  return (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium shadow-sm"
                      style={{ backgroundColor, color: textColor }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag.id)}
                        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[10px] text-current hover:bg-black/20 focus:outline-none"
                        aria-label={`Remover etiqueta ${tag.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <Button onClick={() => refetchTasks()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>

          <Button onClick={() => setViewMode(viewMode === 'board' ? 'list' : 'board')} variant="outline" size="sm">
            {viewMode === 'board' ? 'Ver Lista' : 'Ver Kanban'}
          </Button>

          <Button
            onClick={() => {
              setModalMode('create');
              setSelectedTask(null);
              setDrawerTask(null);
              setIsTaskDrawerOpen(false);
              setIsTaskModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tarefa
          </Button>
        </div>
      </div>
      {viewMode === 'board' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)] overflow-hidden">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.id as TaskStatus);

              return (
                <div key={column.id} className="flex flex-col">
                  <div
                    className={`${COLUMN_HEADER_CLASSES[column.id as TaskStatus]} rounded-t-lg p-4 border-b transition-colors`}
                  >
                    <h3 className="font-semibold flex items-center justify-between">
                      {column.title}
                      <Badge
                        variant="secondary"
                        className={`${
                          STATUS_BADGE_STYLES[column.id as TaskStatus] ?? 'bg-blue-100 text-blue-800'
                        } ml-2`}
                      >
                        {columnTasks.length}
                      </Badge>
                    </h3>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-4 space-y-3 overflow-y-auto rounded-b-lg border border-t-0 transition-colors ${
                          snapshot.isDraggingOver
                            ? 'bg-blue-50/80 border-blue-200 dark:bg-blue-900/25 dark:border-blue-800/50'
                            : 'bg-white/80 border-gray-100 dark:bg-slate-900/30 dark:border-slate-800'
                        }`}
                        style={{ minHeight: '200px' }}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-move transition-all duration-200 ${
                              snapshot.isDragging
                                ? 'rotate-2 shadow-lg ring-2 ring-blue-300 dark:ring-blue-700/60'
                                : 'hover:shadow-md'
                            } ${task.status === 'cancelada' ? 'opacity-60' : ''}`}
                            onClick={() => {
                              if (!snapshot.isDragging) {
                                handleView(task);
                              }
                            }}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle
                                      className={`text-sm font-medium line-clamp-2 ${
                                        task.status === 'cancelada'
                                          ? 'line-through text-gray-500 dark:text-gray-400'
                                          : ''
                                      }`}
                                    >
                                      {task.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-1 ml-2">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          PRIORITY_BADGE_STYLES[
                                            task.priority as keyof typeof PRIORITY_BADGE_STYLES
                                          ] ?? 'bg-gray-100 text-gray-800 border-gray-200'
                                        }`}
                                      >
                                        {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                                      </Badge>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleEdit(task);
                                        }}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-600"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleDelete(task);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                  {task.description && (
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}

                                  {task.tags && task.tags.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-1">
                                      {task.tags.map((tag) => {
                                        const backgroundColor = tag.color || DEFAULT_TAG_COLOR;
                                        const textColor = getTagTextColor(backgroundColor);
                                        return (
                                          <Badge
                                            key={tag.id}
                                            variant="outline"
                                            className="text-xs border-transparent"
                                            style={{
                                              backgroundColor,
                                              color: textColor,
                                            }}
                                          >
                                            {tag.name}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className="text-xs text-gray-500 mb-2">
                                    <strong>Projeto:</strong> {getProjectName(task.projectId)}
                                  </div>

                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    {task.dueDate && (
                                      <div className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {format(new Date(task.dueDate), 'dd/MM', { locale: ptBR })}
                                      </div>
                                    )}

                                    {(task.assigneeId || task.assignedUserIds?.length) && (
                                      <div className="flex items-center">
                                        <User className="h-3 w-3 mr-1" />
                                        Atribuída
                                      </div>
                                    )}
                                  </div>

                                  {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'concluida' && (
                                    <div className="flex items-center mt-2 text-red-600">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      <span className="text-xs">Atrasada</span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {columnTasks.length === 0 && (
                          <div className="text-center text-gray-400 py-8">
                            <p className="text-sm">Nenhuma tarefa</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        <TaskList tasks={getFilteredTasks()} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
          setModalMode('create');
        }}
        projects={projects}
        task={selectedTask || undefined}
        mode={modalMode}
      />

      <TaskDetailsDrawer
        open={isTaskDrawerOpen}
        onOpenChange={(open) => {
          setIsTaskDrawerOpen(open);
          if (!open) {
            setDrawerTask(null);
          }
        }}
        task={drawerTask}
        projects={projects}
        users={users}
        onDelete={(task) => handleDelete(task)}
        onOpenAdvancedEdit={(task) => handleOpenAdvancedEdit(task)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir Tarefa"
        description={`Tem certeza que deseja excluir a tarefa "${taskToDelete?.title ?? ''}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => taskToDelete && deleteTaskMutation.mutate(taskToDelete.id)}
        variant="destructive"
      />
    </div>
  );
}
