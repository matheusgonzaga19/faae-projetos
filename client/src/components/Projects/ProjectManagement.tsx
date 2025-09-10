import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  Users,
  FileText,
  Clock,
  Target,
  Building,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProjectWithTasks, User, TaskWithDetails } from "@shared/schema";
import TaskModal from "@/components/Kanban/TaskModal";

interface ProjectModalProps {
  project?: ProjectWithTasks;
  trigger?: React.ReactNode;
}

function ProjectModal({ project, trigger }: ProjectModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "active",
    type: project?.type || "stand_imobiliario",
    priority: project?.priority || "media",
    startDate: project?.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : "",
    endDate: project?.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : "",
    budget: project?.budget?.toString() || "",
    clientName: project?.clientName || "",
    clientEmail: project?.clientEmail || "",
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/projects', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Projeto criado",
        description: "O projeto foi criado com sucesso.",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar projeto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro de validação",
        description: "O nome do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const projectData = {
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      managerUserId: user?.id,
    };

    createProjectMutation.mutate(projectData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Editar Projeto' : 'Novo Projeto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Stand Morumbi Plaza"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o projeto"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo de Projeto</Label>
              <Select value={formData.type} onValueChange={(value: "stand_imobiliario" | "projeto_arquitetonico" | "projeto_estrutural" | "reforma" | "manutencao") => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stand_imobiliario">Stand Imobiliário</SelectItem>
                  <SelectItem value="projeto_arquitetura">Projeto de Arquitetura</SelectItem>
                  <SelectItem value="projeto_estrutural">Projeto Estrutural</SelectItem>
                  <SelectItem value="reforma">Reforma</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value: "baixa" | "media" | "alta" | "urgente") => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>

            <div>
              <Label htmlFor="clientEmail">Email do Cliente</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                placeholder="cliente@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Data de Entrega</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="budget">Orçamento (R$)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="Ex: 50000.00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending}
            >
              {project ? 'Atualizar' : 'Criar'} Projeto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectCard({ project, onSelectProject }: { project: ProjectWithTasks; onSelectProject: (project: ProjectWithTasks) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/projects/${project.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir projeto",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const taskCount = project.tasks?.length || 0;
    const message = taskCount > 0 
      ? `Tem certeza que deseja excluir este projeto? Esta ação irá excluir permanentemente:\n\n• O projeto "${project.name}"\n• ${taskCount} tarefa(s) vinculada(s)\n• Todos os arquivos e comentários relacionados\n\nEsta ação não pode ser desfeita.`
      : `Tem certeza que deseja excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`;
    
    if (window.confirm(message)) {
      deleteProjectMutation.mutate();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // O modal de edição será aberto
  };
  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: "Ativo",
      completed: "Concluído",
      on_hold: "Em Pausa",
      cancelled: "Cancelado",
    };
    return labels[status as keyof typeof labels] || "Ativo";
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      stand_imobiliario: "Stand Imobiliário",
      projeto_arquitetura: "Projeto de Arquitetura",
      projeto_estrutural: "Projeto Estrutural",
      reforma: "Reforma",
      manutencao: "Manutenção",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(task => task.status === 'concluida').length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-gray-200 dark:border-gray-700" onClick={() => onSelectProject(project)}>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-sm sm:text-base lg:text-lg line-clamp-1">{project.name}</CardTitle>
            <CardDescription className="line-clamp-2 text-xs sm:text-sm">
              {project.description || "Sem descrição"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <Badge className={`${getStatusColor(project.status)} text-xs px-2 py-1`}>
              {getStatusLabel(project.status)}
            </Badge>
            
            {/* Menu de ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <ProjectModal
                  project={project}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  }
                />
                {user?.role === 'admin' && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Building className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{getTypeLabel(project.type)}</span>
          </div>
          {project.endDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{format(new Date(project.endDate), 'dd/MM/yyyy')}</span>
            </div>
          )}
        </div>

        {totalTasks > 0 && (
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progresso das Tarefas</span>
              <span className="font-medium">{completedTasks}/{totalTasks}</span>
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{totalTasks} tarefas</span>
            </div>
            {project.budget && (
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>R$ {project.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectManagement() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null);

  const { data: projects = [], isLoading } = useQuery<ProjectWithTasks[]>({
    queryKey: ['/api/projects'],
  });

  const handleSelectProject = (project: ProjectWithTasks) => {
    setSelectedProject(project);
  };

  if (selectedProject) {
    return (
      <ProjectDetails 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="animate-pulse space-y-6 sm:space-y-8">
          <div className="h-12 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 sm:h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Projetos</h2>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seus projetos arquitetônicos
          </p>
        </div>
        <ProjectModal
          trigger={
            <Button className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="hidden sm:inline">Novo Projeto</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          }
        />
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Building className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Nenhum projeto encontrado</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Crie seu primeiro projeto para começar
                </p>
              </div>
              <ProjectModal
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Projeto
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelectProject={handleSelectProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente ProjectDetails será criado em seguida
function ProjectDetails({ project, onBack }: { project: ProjectWithTasks; onBack: () => void }) {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="outline">
          ← Voltar aos Projetos
        </Button>
        
        <ProjectModal
          project={project}
          trigger={
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Editar Projeto
            </Button>
          }
        />
      </div>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <p>{project.clientName || "Não informado"}</p>
              </div>
              <div>
                <Label>Email do Cliente</Label>
                <p>{project.clientEmail || "Não informado"}</p>
              </div>
              <div>
                <Label>Orçamento</Label>
                <p>{project.budget ? `R$ ${project.budget.toLocaleString()}` : "Não informado"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tarefas do Projeto</CardTitle>
                <TaskModal
                  trigger={
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Tarefa
                    </Button>
                  }
                  defaultStatus="aberta"
                  defaultProjectId={project.id}
                />
              </div>
            </CardHeader>
            <CardContent>
              {project.tasks && project.tasks.length > 0 ? (
                <div className="space-y-3">
                  {project.tasks.map((task) => (
                    <TaskModal
                      key={task.id}
                      task={task}
                      trigger={
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{task.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{task.status}</Badge>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-500 mb-4">Nenhuma tarefa criada para este projeto</p>
                    <TaskModal
                      trigger={
                        <Button variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Primeira Tarefa
                        </Button>
                      }
                      defaultStatus="aberta"
                      defaultProjectId={project.id}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}