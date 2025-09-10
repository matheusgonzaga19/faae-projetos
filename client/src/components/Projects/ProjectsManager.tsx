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
import ProjectFilters from "./ProjectFilters";

export default function ProjectsManager() {
  // Helpers: formatting and validation
  const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
  const formatCNPJ = (digits: string) => {
    const d = digits.slice(0, 14);
    const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 12), d.slice(12, 14)];
    let out = '';
    if (parts[0]) out = parts[0];
    if (parts[1]) out += '.' + parts[1];
    if (parts[2]) out += '.' + parts[2];
    if (parts[3]) out += '/' + parts[3];
    if (parts[4]) out += '-' + parts[4];
    return out;
  };
  const isValidEmail = (v?: string) => !!(v && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
  const isValidPhone = (v?: string) => {
    const d = onlyDigits(v || '');
    return d.length === 10 || d.length === 11;
  };
  const formatPhoneBR = (digits: string) => {
    const d = digits.slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  };
  const isValidCNPJ = (v?: string) => {
    if (!v) return false;
    const c = onlyDigits(v);
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    const calc = (cstr: string, pos: number) => {
      const weights = pos === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
      const sum = weights.reduce((acc, w, i) => acc + parseInt(cstr[i], 10) * w, 0);
      const r = sum % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const d1 = calc(c, 12);
    const d2 = calc(c, 13);
    return d1 === parseInt(c[12], 10) && d2 === parseInt(c[13], 10);
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithTasks | null>(null);

  const initialFilters = {
    search: "",
    status: "",
    type: "",
    priority: "",
    companyName: "",
    clientName: "",
    dateFrom: "",
    dateTo: "",
  };
  const [filters, setFilters] = useState(initialFilters);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [nfeEmail, setNfeEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "on_hold" | "cancelled">("active");
  const [type, setType] = useState<"stand_imobiliario" | "projeto_arquitetonico" | "projeto_estrutural" | "reforma" | "manutencao">("stand_imobiliario");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");

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
      toast({ title: "Projeto criado com sucesso" });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar projeto", description: error.message || "Erro desconhecido", variant: "destructive" });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest('PUT', `/api/projects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Projeto atualizado" });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar projeto", description: error.message || "Erro desconhecido", variant: "destructive" });
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
      toast({ title: "Projeto excluido" });
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir projeto", description: error.message || "Erro desconhecido", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCompanyName("");
    setCnpj("");
    setNfeEmail("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setStatus("active");
    setType("stand_imobiliario");
    setStartDate("");
    setEndDate("");
    setBudget("");
    setLocation("");
  };

  const handleCloseModal = () => {
    resetForm();
    setSelectedProject(null);
    setShowModal(false);
  };

  const handleEdit = (project: ProjectWithTasks) => {
    setSelectedProject(project);
    setName(project.name);
    setDescription(project.description || "");
    setCompanyName((project as any).companyName || "");
    setCnpj((project as any).cnpj || "");
    setNfeEmail((project as any).nfeEmail || "");
    setClientName((project as any).clientName || "");
    setClientEmail((project as any).clientEmail || "");
    setClientPhone((project as any).clientPhone || "");
    setStatus(project.status);
    setType(project.type);
    setStartDate((project as any).startDate || "");
    setEndDate((project as any).endDate || "");
    setBudget(project.budget?.toString() || "");
    setLocation(project.location || "");
    setShowModal(true);
  };

  const handleDelete = (project: ProjectWithTasks) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) deleteProjectMutation.mutate(projectToDelete.id);
  };

  // Input formatters
  const handleCnpjChange = (v: string) => setCnpj(formatCNPJ(onlyDigits(v)));
  const handlePhoneChange = (v: string) => setClientPhone(formatPhoneBR(onlyDigits(v)));
  const handleNfeEmailChange = (v: string) => setNfeEmail((v || '').trim().toLowerCase());
  const handleClientEmailChange = (v: string) => setClientEmail((v || '').trim().toLowerCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: 'Erro de validacao', description: 'O nome do projeto e obrigatorio.', variant: 'destructive' });
      return;
    }
    if (!companyName.trim()) {
      toast({ title: 'Erro de validacao', description: 'O nome da empresa e obrigatorio.', variant: 'destructive' });
      return;
    }
    if (!clientName.trim()) {
      toast({ title: 'Erro de validacao', description: 'O nome do cliente e obrigatorio.', variant: 'destructive' });
      return;
    }
    if (!startDate) {
      toast({ title: 'Erro de validacao', description: 'A data de inicio e obrigatoria.', variant: 'destructive' });
      return;
    }

    const projectData = {
      name: name.trim(),
      description: description.trim() || null,
      companyName: companyName.trim(),
      cnpj: cnpj.trim() || null,
      nfeEmail: nfeEmail.trim().toLowerCase() || null,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase() || null,
      clientPhone: clientPhone.trim() || null,
      status,
      type,
      startDate: startDate || null,
      endDate: endDate || null,
      budget: budget ? parseFloat(budget) : null,
      location: location.trim() || null,
    };

    if (selectedProject) {
      updateProjectMutation.mutate({ id: selectedProject.id, data: projectData });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  const statusLabels = {
    active: "Ativo",
    completed: "Concluido",
    on_hold: "Em Espera",
    cancelled: "Cancelado"
  } as const;

  const typeLabels = {
    stand_imobiliario: "Stand Imobiliario",
    projeto_arquitetonico: "Projeto Arquitetonico",
    projeto_estrutural: "Projeto Estrutural",
    reforma: "Reforma",
    manutencao: "Manutencao"
  } as const;

  const statusColors = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800"
  } as const;

  const filteredProjects = projects.filter((project) => {
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status && project.status !== filters.status) return false;
    if (filters.type && project.type !== filters.type) return false;
    if (filters.priority && (project as any).priority !== filters.priority) return false;
    if (filters.companyName && !(project as any).companyName?.toLowerCase().includes(filters.companyName.toLowerCase())) return false;
    if (filters.clientName && !(project as any).clientName?.toLowerCase().includes(filters.clientName.toLowerCase())) return false;
    if (filters.dateFrom) {
      const start = (project as any).startDate ? new Date((project as any).startDate) : null;
      if (!start || start < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const end = (project as any).endDate ? new Date((project as any).endDate) : null;
      if (!end || end > new Date(filters.dateTo)) return false;
    }
    return true;
  });

  const canManageProjects = user?.role === 'admin';

  if (isLoading) return <div className="flex items-center justify-center p-8">Carregando projetos...</div>;
  if (isError) return <div className="flex items-center justify-center p-8 text-red-600">Erro ao carregar projetos: {(error as Error)?.message || 'desconhecido'}</div>;

  return (
    <div className="space-y-6">
      <ProjectFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters(initialFilters)}
        isExpanded={filtersExpanded}
        onToggleExpand={() => setFiltersExpanded(!filtersExpanded)}
      />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Projetos</h2>
        {canManageProjects && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{project.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[project.status as keyof typeof statusColors]}`}>
                  {statusLabels[project.status as keyof typeof statusLabels]}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(project as any).companyName && (
                  <div className="flex items-center text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    {(project as any).companyName}
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  {typeLabels[project.type as keyof typeof typeLabels]}
                </div>
                {(project as any).cnpj && (
                  <div className="flex items-center text-gray-600">
                    <i className="fas fa-id-card mr-2" />
                    CNPJ: {(project as any).cnpj}
                  </div>
                )}
                {(project as any).nfeEmail && (
                  <div className="flex items-center text-gray-600">
                    <i className="fas fa-envelope mr-2" />
                    NF-e: {(project as any).nfeEmail}
                  </div>
                )}
                {(project as any).clientName && (
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {(project as any).clientName}
                  </div>
                )}
                {project.clientEmail && (
                  <div className="flex items-center text-gray-600">
                    <i className="fas fa-at mr-2" />
                    {project.clientEmail}
                  </div>
                )}
                {project.clientPhone && (
                  <div className="flex items-center text-gray-600">
                    <i className="fas fa-phone mr-2" />
                    {project.clientPhone}
                  </div>
                )}
                {(project as any).startDate && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date((project as any).startDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
                {(project as any).endDate && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    ate {format(new Date((project as any).endDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
                {project.budget != null && (
                  <div className="flex items-center text-gray-600">
                    <i className="fas fa-coins mr-2" />
                    Orcamento: R$ {Number(project.budget).toFixed(2)}
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center text-gray-600">
                    <i className="fas fa-map-marker-alt mr-2" />
                    {project.location}
                  </div>
                )}
                <div className="pt-2 text-gray-700">
                  {project.tasks?.length || 0} tarefa(s)
                </div>

                {canManageProjects && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(project)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(project)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
            <DialogDescription>{selectedProject ? "Edite as informacoes do projeto." : "Preencha as informacoes para criar um novo projeto."}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={setType as any}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stand_imobiliario">Stand Imobiliario</SelectItem>
                    <SelectItem value="projeto_arquitetonico">Projeto Arquitetonico</SelectItem>
                    <SelectItem value="projeto_estrutural">Projeto Estrutural</SelectItem>
                    <SelectItem value="reforma">Reforma</SelectItem>
                    <SelectItem value="manutencao">Manutencao</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus as any}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="completed">Concluido</SelectItem>
                    <SelectItem value="on_hold">Em Espera</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da empresa *</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" value={cnpj} onChange={(e) => handleCnpjChange(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nfeEmail">Email NF-e</Label>
                <Input id="nfeEmail" type="email" value={nfeEmail} onChange={(e) => handleNfeEmailChange(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente *</Label>
                <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">E-mail do Cliente</Label>
                <Input id="clientEmail" type="email" value={clientEmail} onChange={(e) => handleClientEmailChange(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone do Cliente</Label>
                <Input id="clientPhone" value={clientPhone} onChange={(e) => handlePhoneChange(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Orcamento</Label>
                <Input id="budget" type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Inicio *</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Termino</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localizacao</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
              <Button type="submit" disabled={createProjectMutation.isPending || updateProjectMutation.isPending}>
                {createProjectMutation.isPending || updateProjectMutation.isPending ? "Salvando..." : selectedProject ? "Atualizar" : "Criar Projeto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir Projeto"
        description={`Tem certeza que deseja excluir o projeto "${projectToDelete?.name}"? Esta acao nao pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

