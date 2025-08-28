import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, User, AlertTriangle, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { firebaseService } from '@/services/firebaseService';
import TaskModal from './TaskModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

const COLUMNS = [
  { id: 'aberta', title: 'Backlog', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'em_andamento', title: 'Em Andamento', color: 'bg-blue-100 border-blue-300' },
  { id: 'concluida', title: 'Concluída', color: 'bg-green-100 border-green-300' },
  { id: 'cancelada', title: 'Cancelada', color: 'bg-red-100 border-red-300' },
] as const;

const PRIORITY_COLORS = {
  baixa: 'bg-gray-100 text-gray-800 border-gray-300',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  alta: 'bg-orange-100 text-orange-800 border-orange-300',
  critica: 'bg-red-100 text-red-800 border-red-300',
};

const PRIORITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export default function KanbanBoard() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks and projects with optimized queries and user filtering
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['/api/tasks', 'kanban', selectedProjectId, selectedUserId],
    queryFn: () => firebaseService.getTasks({ 
      projectId: selectedProjectId || undefined,
      assigneeId: selectedUserId || undefined,
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
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => firebaseService.getAllUsers(),
    refetchInterval: 60000,
  });

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
      const statusMatch = task.status === status;
      const projectMatch = !selectedProjectId || task.projectId === selectedProjectId;
      const userMatch = !selectedUserId || task.assigneeId === selectedUserId;
      return statusMatch && projectMatch && userMatch;
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
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

          <Button onClick={() => refetchTasks()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>

          <Button onClick={() => setIsTaskModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tarefa
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)] overflow-hidden">
          {COLUMNS.map((column) => {
            const columnTasks = getTasksByStatus(column.id as TaskStatus);
            
            return (
              <div key={column.id} className="flex flex-col">
                <div className={`${column.color} rounded-t-lg p-4 border-b-2`}>
                  <h3 className="font-semibold text-gray-800 flex items-center justify-between">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {columnTasks.length}
                    </Badge>
                  </h3>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50 rounded-b-lg border-l border-r border-b ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
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
                                  ? 'rotate-2 shadow-lg ring-2 ring-blue-400' 
                                  : 'hover:shadow-md'
                              }`}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <CardTitle className="text-sm font-medium line-clamp-2">
                                    {task.title}
                                  </CardTitle>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}
                                    >
                                      {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                                    </Badge>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(task)}>
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleDelete(task)}>
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
                                  
                                  {task.estimatedHours && (
                                    <div className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {task.estimatedHours}h
                                    </div>
                                  )}
                                  
                                  {task.assigneeId && (
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

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
        projects={projects}
        task={editingTask || undefined}
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
