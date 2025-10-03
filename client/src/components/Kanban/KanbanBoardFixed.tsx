import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertCircle, Clock, CheckCircle, X, Filter, Users, Building } from "lucide-react";
import type { TaskWithDetails, Project, User } from "@shared/schema";
import TaskCardSimple from "./TaskCardSimple";
import TaskDetailsDrawer from "./TaskDetailsDrawer";
import { Badge } from "@/components/ui/badge";

type TaskStatus = "aberta" | "em_andamento" | "concluida" | "cancelada";

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const columns: KanbanColumn[] = [
  {
    id: "aberta",
    title: "📋 Abertas",
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
  },
  {
    id: "em_andamento",
    title: "⚡ Em Andamento", 
    icon: <Clock className="w-4 h-4" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
  },
  {
    id: "concluida",
    title: "✅ Concluídas",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
  },
  {
    id: "cancelada",
    title: "❌ Canceladas",
    icon: <X className="w-4 h-4" />,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
  }
];

export default function KanbanBoardFixed() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState<TaskWithDetails | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');

  // Data queries
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string, newStatus: TaskStatus }) => {
      console.log("🔄 Atualizando status da tarefa:", taskId, "para:", newStatus);
      return await apiRequest('PUT', `/api/tasks/${taskId}`, { status: newStatus });
    },
    onSuccess: (updatedTask, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      const statusLabels = {
        aberta: "Aberta",
        em_andamento: "Em Andamento", 
        concluida: "Concluída",
        cancelada: "Cancelada"
      };
      
      toast({
        title: "Tarefa atualizada",
        description: `Status alterado para: ${statusLabels[variables.newStatus]}`,
      });
    },
    onError: (error: any) => {
      console.error("❌ Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Filter tasks based on selected filters
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];

    if (selectedProject !== "all") {
      filteredTasks = filteredTasks.filter(task => task.projectId?.toString() === selectedProject);
    }

    if (selectedUser !== "all") {
      filteredTasks = filteredTasks.filter(task => task.assignedUserId === selectedUser);
    }

    return filteredTasks;
  };

  // Group tasks by status
  const getTasksByStatus = (status: TaskStatus) => {
    const filteredTasks = getFilteredTasks();
    return filteredTasks.filter(task => task.status === status);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    console.log("🚀 Iniciando drag da tarefa:", taskId);
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    
    const taskId = e.dataTransfer.getData("text/plain");
    
    if (!taskId || !draggedTaskId) {
      console.warn("⚠️ ID da tarefa não encontrado no drop");
      return;
    }

    const task = tasks.find(t => t.id.toString() === taskId);
    if (!task) {
      console.warn("⚠️ Tarefa não encontrada:", taskId);
      return;
    }

    if (task.status === targetStatus) {
      console.log("ℹ️ Tarefa já está neste status:", targetStatus);
      setDraggedTaskId(null);
      return;
    }

    console.log("✅ Movendo tarefa", taskId, "de", task.status, "para", targetStatus);
    
    // Update task status
    updateTaskStatusMutation.mutate({
      taskId: taskId,
      newStatus: targetStatus
    });

    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  // Check if user can edit task
  const canEditTask = (task: TaskWithDetails) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const createdById = (task as TaskWithDetails & { createdUserId?: string }).createdUserId;
    return task.assignedUserId === user.id || createdById === user.id;
  };

  // Open create task modal
  const handleCreateTask = () => {
    setDrawerTask(null);
    setDrawerMode('create');
    setIsTaskDrawerOpen(true);
  };

  const handleSelectTask = (task: TaskWithDetails) => {
    setDrawerTask(task);
    setDrawerMode('edit');
    setIsTaskDrawerOpen(true);
  };

  if (tasksLoading || projectsLoading || usersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kanban Board</h2>
          <p className="text-gray-600 dark:text-gray-400">Arraste os cards entre as colunas para alterar o status</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleCreateTask}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedProject !== "all" || selectedUser !== "all") && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Filtros ativos:</span>
            
            {selectedProject !== "all" && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                Projeto: {projects.find(p => p.id.toString() === selectedProject)?.name}
              </Badge>
            )}
            
            {selectedUser !== "all" && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                Usuário: {users.find(u => u.id === selectedUser)?.firstName} {users.find(u => u.id === selectedUser)?.lastName}
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProject("all");
                setSelectedUser("all");
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <Card className={`mb-4 ${column.bgColor}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      {column.icon}
                      <span className={column.color}>{column.title}</span>
                    </div>
                    <Badge variant="secondary" className="bg-white/50 dark:bg-gray-800/50">
                      {columnTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Drop Zone */}
              <div
                className="flex-1 min-h-[500px] p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragEnd={handleDragEnd}
              >
                {/* Add Task Button */}
                <Button
                  variant="ghost"
                  className="w-full mb-4 h-10 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:hover:border-gray-500 dark:hover:text-gray-300"
                  onClick={handleCreateTask}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar tarefa
                </Button>

                {/* Tasks */}
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCardSimple
                      key={task.id}
                      task={task}
                      onDragStart={handleDragStart}
                      onSelectTask={handleSelectTask}
                    />
                  ))}
                </div>

                {/* Empty State */}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-sm">Nenhuma tarefa</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDetailsDrawer
        open={isTaskDrawerOpen}
        onOpenChange={(open) => {
          setIsTaskDrawerOpen(open);
          if (!open) {
            setDrawerTask(null);
          }
        }}
        task={drawerTask}
        mode={drawerMode}
        projects={projects}
        users={users}
        defaultProjectId={selectedProject === 'all' ? undefined : selectedProject}
      />
    </div>
  );
}