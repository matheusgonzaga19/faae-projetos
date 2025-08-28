import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Edit2, Trash2, Building, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProjectWithTasks } from "@shared/schema";
import { firebaseService } from "@/services/firebaseService";

export default function ProjectsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithTasks | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "on_hold" | "cancelled">("active");
  const [type, setType] = useState<"stand_imobiliario" | "projeto_arquitetonico" | "projeto_estrutural" | "reforma" | "manutencao">("stand_imobiliario");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");

  // Data queries
  const { data: projects = [], isLoading, isError, error } = useQuery<ProjectWithTasks[]>({
    queryKey: ['/api/projects'],
    queryFn: () => firebaseService.getProjects(),
    staleTime: 30_000,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/projects', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Projeto criado com sucesso",
        description: "O novo projeto foi adicionado ao sistema.",
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar projeto",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest('PUT', `/api/projects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Projeto atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar projeto",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Projeto excluído",
        description: "O projeto foi removido do sistema.",
      });
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir projeto",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setStatus("active");
    setType("stand_imobiliario");
    setStartDate("");
    setEndDate("");
    setBudget("");
    setLocation("");
    setArea("");
  };

  // Handle modal close
  const handleCloseModal = () => {
    resetForm();
    setSelectedProject(null);
    setShowModal(false);
  };

  // Handle edit
  const handleEdit = (project: ProjectWithTasks) => {
    setSelectedProject(project);
    setName(project.name);
    setDescription(project.description || "");
    setClientName(project.clientName || "");
    setClientEmail(project.clientEmail || "");
    setClientPhone(project.clientPhone || "");
    setStatus(project.status);
    setType(project.type);
    setStartDate(project.startDate || "");
    setEndDate(project.endDate || "");
    setBudget(project.budget?.toString() || "");
    setLocation(project.location || "");
    setArea(project.area || "");
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = (project: ProjectWithTasks) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Erro de validação",
        description: "O nome do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const projectData = {
      name: name.trim(),
      description: description.trim() || null,
      clientName: clientName.trim() || null,
      clientEmail: clientEmail.trim() || null,
      clientPhone: clientPhone.trim() || null,
      status,
      type,
      startDate: startDate || null,
      endDate: endDate || null,
      budget: budget ? parseFloat(budget) : null,
      location: location.trim() || null,
      area: area.trim() || null,
    };

    if (selectedProject) {
      updateProjectMutation.mutate({ id: selectedProject.id, data: projectData });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  const statusLabels = {
    active: "Ativo",
    completed: "Concluído",
    on_hold: "Em Espera",
    cancelled: "Cancelado"
  };

  const typeLabels = {
    stand_imobiliario: "Stand Imobiliário",
    projeto_arquitetonico: "Projeto Arquitetônico",
    projeto_estrutural: "Projeto Estrutural",
    reforma: "Reforma",
    manutencao: "Manutenção"
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const canManageProjects = user?.role === 'admin';

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando projetos...</div>;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        Erro ao carregar projetos: {(error as Error)?.message || 'desconhecido'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Projetos</h2>
        {canManageProjects && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{project.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  {typeLabels[project.type]}
                </div>
                
                {project.clientName && (
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {project.clientName}
                  </div>
                )}
                
                {project.startDate && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(project.startDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}

                <div className="pt-2 text-gray-700">
                  {project.tasks?.length || 0} tarefa(s)
                </div>

                {canManageProjects && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(project)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Project Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProject ? "Editar Projeto" : "Novo Projeto"}
            </DialogTitle>
            <DialogDescription>
              {selectedProject ? "Edite as informações do projeto." : "Preencha as informações para criar um novo projeto."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite o nome do projeto"
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={setType as any}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stand_imobiliario">Stand Imobiliário</SelectItem>
                    <SelectItem value="projeto_arquitetonico">Projeto Arquitetônico</SelectItem>
                    <SelectItem value="projeto_estrutural">Projeto Estrutural</SelectItem>
                    <SelectItem value="reforma">Reforma</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus as any}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="on_hold">Em Espera</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o projeto"
                  rows={3}
                />
              </div>

              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>

              {/* Client Email */}
              <div className="space-y-2">
                <Label htmlFor="clientEmail">E-mail do Cliente</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Client Phone */}
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone do Cliente</Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget">Orçamento</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Endereço do projeto"
                />
              </div>

              {/* Area */}
              <div className="space-y-2">
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
              >
                {createProjectMutation.isPending || updateProjectMutation.isPending
                  ? "Salvando..."
                  : selectedProject
                  ? "Atualizar"
                  : "Criar Projeto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir Projeto"
        description={`Tem certeza que deseja excluir o projeto "${projectToDelete?.name}"? Todas as tarefas associadas também serão afetadas. Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
