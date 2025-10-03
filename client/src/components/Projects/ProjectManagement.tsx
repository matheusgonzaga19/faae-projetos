import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import type { ProjectWithTasks, User } from "@shared/schema";
import { firebaseService } from "@/services/firebaseService";

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
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery<ProjectWithTasks[]>({
    queryKey: ['/api/projects'],
  });

  const handleSelectProject = (project: ProjectWithTasks) => {
    setSelectedProject(project);
    setIsProjectDrawerOpen(true);
  };

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

      <ProjectDetailsDrawer
        open={isProjectDrawerOpen}
        onOpenChange={(open) => {
          setIsProjectDrawerOpen(open);
          if (!open) {
            setSelectedProject(null);
          }
        }}
        project={selectedProject}
      />
    </div>
  );
}

interface ProjectDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithTasks | null;
}

function ProjectDetailsDrawer({ open, onOpenChange, project }: ProjectDetailsDrawerProps) {
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [localNotes, setLocalNotes] = useState<{ id: string; text: string; createdAt: Date }[]>([]);
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    status: "active",
    priority: "media",
    type: "stand_imobiliario",
    startDate: "",
    endDate: "",
    budget: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    managerUserId: "",
    companyName: "",
    location: "",
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users', 'project-drawer'],
    queryFn: () => firebaseService.getAllUsers(),
    enabled: open,
  });

  useEffect(() => {
    if (!project || !open) {
      return;
    }

    setFormState({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "active",
      priority: project.priority || "media",
      type: project.type || "stand_imobiliario",
      startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : "",
      endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : "",
      budget: project.budget != null ? String(project.budget) : "",
      clientName: project.clientName || "",
      clientEmail: project.clientEmail || "",
      clientPhone: project.clientPhone || "",
      managerUserId: project.managerUserId || "",
      companyName: (project as any).companyName || "",
      location: project.location || "",
    });
    setNoteText("");
    setLocalNotes([]);
  }, [project, open]);

  const buildPayload = (override: Partial<typeof formState> = {}) => {
    const merged = { ...formState, ...override };
    const parsedBudget = parseFloat(merged.budget);

    return {
      name: merged.name,
      description: merged.description,
      status: merged.status,
      priority: merged.priority,
      type: merged.type,
      startDate: merged.startDate || null,
      endDate: merged.endDate || null,
      budget: merged.budget ? (Number.isNaN(parsedBudget) ? null : parsedBudget) : null,
      clientName: merged.clientName || null,
      clientEmail: merged.clientEmail || null,
      clientPhone: merged.clientPhone || null,
      managerUserId: merged.managerUserId || null,
      companyName: merged.companyName || null,
      location: merged.location || null,
    };
  };

  const updateProjectMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof buildPayload>) => {
      if (!project) return;
      await apiRequest('PUT', `/api/projects/${project.id}`, payload);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Projeto atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar projeto",
        description: error?.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    updateProjectMutation.mutate(buildPayload());
  };

  const handleToggleCompletion = () => {
    if (!project) return;
    const nextStatus = formState.status === 'completed' ? 'active' : 'completed';
    setFormState(prev => ({ ...prev, status: nextStatus }));
    updateProjectMutation.mutate(buildPayload({ status: nextStatus }));
  };

  const handleAddNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) {
      toast({
        title: "Mensagem vazia",
        description: "Adicione um comentário antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setLocalNotes(prev => [
      { id: `${Date.now()}`, text: trimmed, createdAt: new Date() },
      ...prev,
    ]);
    setNoteText("");
    toast({ title: "Comentário registrado", description: "Comentário salvo localmente." });
  };

  const totalTasks = project?.tasks?.length ?? 0;
  const completedTasks = project?.tasks?.filter(task => task.status === 'concluida').length ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusLabel = {
    active: 'Ativo',
    completed: 'Concluído',
    on_hold: 'Em pausa',
    cancelled: 'Cancelado',
  }[formState.status as keyof typeof statusLabel] || 'Ativo';

  const statusTone = (() => {
    switch (formState.status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      case 'on_hold':
        return 'bg-amber-500/20 text-amber-200 border border-amber-500/40';
      case 'cancelled':
        return 'bg-red-500/20 text-red-200 border border-red-500/40';
      default:
        return 'bg-blue-500/20 text-blue-200 border border-blue-500/40';
    }
  })();

  const manager = users.find(user => user.id === formState.managerUserId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {project ? (
        <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-3xl p-0 overflow-hidden">
          <div className="flex h-full flex-col bg-slate-950 text-slate-100">
            <div className="border-b border-slate-800 px-6 py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <SheetHeader className="space-y-2">
                  <SheetTitle className="text-xl font-semibold text-white">
                    {formState.name || project.name}
                  </SheetTitle>
                  <SheetDescription className="text-slate-400">
                    Atualize rapidamente os campos principais e acompanhe o andamento deste projeto.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    type="button"
                    onClick={handleToggleCompletion}
                    disabled={updateProjectMutation.isPending}
                    className={formState.status === 'completed'
                      ? 'rounded-full border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                      : 'rounded-full bg-emerald-500 text-white hover:bg-emerald-600'}
                  >
                    {formState.status === 'completed' ? 'Reabrir projeto' : 'Marcar como concluído'}
                  </Button>
                  <Badge className={`rounded-full px-3 py-1 text-xs ${statusTone}`}>
                    {statusLabel}
                  </Badge>
                  {progress > 0 && (
                    <span className="flex items-center rounded-full bg-slate-800/70 px-3 py-1 text-xs text-slate-300">
                      <Clock className="mr-1.5 h-3.5 w-3.5 text-indigo-300" />
                      {progress}% concluído
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-8 px-6 py-6">
                <section className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase text-slate-400">Nome do projeto</Label>
                    <Input
                      value={formState.name}
                      onChange={(event) => setFormState(prev => ({ ...prev, name: event.target.value }))}
                      placeholder="Ex: Retrofit Edifício Tietê"
                      className="mt-1 border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-slate-400">Descrição</Label>
                    <Textarea
                      value={formState.description}
                      onChange={(event) => setFormState(prev => ({ ...prev, description: event.target.value }))}
                      rows={4}
                      placeholder="Compartilhe os objetivos, escopo e pontos de atenção deste projeto."
                      className="mt-1 resize-none border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </section>

                <section className="grid gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 lg:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-slate-400">Responsável</Label>
                    <Select
                      value={formState.managerUserId}
                      onValueChange={(value) => setFormState(prev => ({ ...prev, managerUserId: value }))}
                    >
                      <SelectTrigger className="border-slate-800 bg-slate-900/60 text-slate-100">
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Não definido</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName || user.lastName
                              ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                              : user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {manager ? (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-900/50 p-3 text-sm text-slate-200">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              manager.profileImageUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                `${manager.firstName ?? ''} ${manager.lastName ?? ''}`.trim() || manager.email
                              )}&background=312e81&color=fff`
                            }
                            alt={manager.email}
                          />
                          <AvatarFallback className="bg-indigo-600 text-white">
                            {(manager.firstName || manager.lastName
                              ? `${manager.firstName ?? ''}${manager.lastName ?? ''}`
                              : manager.email)
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">
                            {manager.firstName || manager.lastName
                              ? `${manager.firstName ?? ''} ${manager.lastName ?? ''}`.trim()
                              : manager.email}
                          </p>
                          <p className="text-xs text-slate-400">Responsável principal</p>
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed border-slate-800/70 px-4 py-3 text-xs text-slate-400">
                        Defina um responsável para centralizar as atualizações e aprovações.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs uppercase text-slate-400">Status</Label>
                      <Select
                        value={formState.status}
                        onValueChange={(value) => setFormState(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="border-slate-800 bg-slate-900/60 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="on_hold">Em pausa</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-slate-400">Prioridade</Label>
                      <Select
                        value={formState.priority}
                        onValueChange={(value) => setFormState(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger className="border-slate-800 bg-slate-900/60 text-slate-100">
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
                      <Label className="text-xs uppercase text-slate-400">Tipo</Label>
                      <Select
                        value={formState.type}
                        onValueChange={(value) => setFormState(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="border-slate-800 bg-slate-900/60 text-slate-100">
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
                      <Label className="text-xs uppercase text-slate-400">Orçamento previsto (R$)</Label>
                      <Input
                        value={formState.budget}
                        onChange={(event) => setFormState(prev => ({ ...prev, budget: event.target.value }))}
                        type="number"
                        step="0.01"
                        className="border-slate-800 bg-slate-900/60 text-slate-100"
                      />
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 lg:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-slate-400">Datas do projeto</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-[11px] uppercase tracking-wide text-slate-500">Início</Label>
                        <Input
                          type="date"
                          value={formState.startDate}
                          onChange={(event) => setFormState(prev => ({ ...prev, startDate: event.target.value }))}
                          className="border-slate-800 bg-slate-900/60 text-slate-100"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-wide text-slate-500">Previsão de entrega</Label>
                        <Input
                          type="date"
                          value={formState.endDate}
                          onChange={(event) => setFormState(prev => ({ ...prev, endDate: event.target.value }))}
                          className="border-slate-800 bg-slate-900/60 text-slate-100"
                        />
                      </div>
                    </div>
                    {formState.startDate && formState.endDate && (
                      <p className="flex items-center text-xs text-slate-400">
                        <Calendar className="mr-2 h-4 w-4 text-indigo-300" />
                        {`Período: ${format(new Date(formState.startDate), 'dd/MM/yyyy')} até ${format(new Date(formState.endDate), 'dd/MM/yyyy')}`}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-slate-400">Contato do cliente</Label>
                    <Input
                      value={formState.clientName}
                      onChange={(event) => setFormState(prev => ({ ...prev, clientName: event.target.value }))}
                      placeholder="Nome do cliente"
                      className="border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                    />
                    <Input
                      type="email"
                      value={formState.clientEmail}
                      onChange={(event) => setFormState(prev => ({ ...prev, clientEmail: event.target.value }))}
                      placeholder="cliente@empresa.com"
                      className="border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                    />
                    <Input
                      value={formState.clientPhone}
                      onChange={(event) => setFormState(prev => ({ ...prev, clientPhone: event.target.value }))}
                      placeholder="(11) 99999-0000"
                      className="border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </section>

                <section className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5">
                  <h3 className="text-sm font-semibold text-white">Detalhes adicionais</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs uppercase text-slate-400">Empresa / Cliente</Label>
                      <Input
                        value={formState.companyName}
                        onChange={(event) => setFormState(prev => ({ ...prev, companyName: event.target.value }))}
                        placeholder="Razão social ou responsável"
                        className="border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-slate-400">Localização</Label>
                      <Input
                        value={formState.location}
                        onChange={(event) => setFormState(prev => ({ ...prev, location: event.target.value }))}
                        placeholder="Cidade, estado ou endereço principal"
                        className="border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Tarefas vinculadas</h3>
                    <Badge variant="secondary" className="rounded-full bg-indigo-600/20 text-indigo-200">
                      {completedTasks}/{totalTasks} concluídas
                    </Badge>
                  </div>
                  {totalTasks === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-800/70 px-4 py-6 text-center text-xs text-slate-400">
                      Nenhuma tarefa associada a este projeto ainda.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {project.tasks?.map(task => (
                        <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/50 p-3 text-sm text-slate-200">
                          <div>
                            <p className="font-medium text-white">{task.title}</p>
                            <p className="text-xs text-slate-400">{task.description || 'Sem descrição'}</p>
                          </div>
                          <Badge variant="outline" className="rounded-full border-slate-700 text-xs text-slate-300">
                            {task.status === 'concluida' ? 'Concluída' : task.status === 'em_andamento' ? 'Em andamento' : task.status === 'aberta' ? 'A fazer' : 'Cancelada'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5">
                  <h3 className="text-sm font-semibold text-white">Comentários rápidos</h3>
                  <Textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    rows={3}
                    placeholder="Anote alinhamentos ou próximos passos discutidos com o cliente."
                    className="border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                  />
                  <div className="flex items-center justify-between">
                    <Button type="button" onClick={handleAddNote} size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500">
                      Registrar comentário
                    </Button>
                    <ProjectModal
                      project={project}
                      trigger={
                        <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-800">
                          <Edit className="mr-2 h-4 w-4" /> Modo avançado
                        </Button>
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    {localNotes.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-800/70 px-4 py-6 text-center text-xs text-slate-400">
                        Nenhum comentário registrado neste painel ainda.
                      </p>
                    ) : (
                      localNotes.map(note => (
                        <div key={note.id} className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-3 text-sm text-slate-200">
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                            <span>Você</span>
                            <span>{format(note.createdAt, 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                          <p>{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <div className="border-t border-slate-800 bg-slate-950/90 px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    As alterações são sincronizadas com o painel de projetos e notificam os responsáveis.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-slate-300 hover:bg-slate-800"
                      onClick={() => onOpenChange(false)}
                      disabled={updateProjectMutation.isPending}
                    >
                      Fechar
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateProjectMutation.isPending}
                      className="bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      {updateProjectMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}