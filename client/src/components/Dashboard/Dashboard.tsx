import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Download, Filter, TrendingUp, Users, CheckCircle, Clock, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import type { DashboardStats, UserStats } from "@/types";
import { PDFReportGenerator, type PDFReportData } from '@/utils/pdfGenerator';
import type { ProjectWithTasks, TaskWithDetails, User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Filters state
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  
  // Data queries
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery<UserStats>({
    queryKey: ['/api/dashboard/user-stats'],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Get active filters summary
  const getActiveFiltersSummary = () => {
    const activeFilters = [];
    
    if (selectedProject !== 'all') {
      const project = projects.find(p => p.id === Number(selectedProject));
      activeFilters.push(`Projeto: ${project?.name || 'N/A'}`);
    }
    
    if (selectedUser !== 'all') {
      const user = users.find(u => u.id === selectedUser);
      activeFilters.push(`Responsável: ${user?.firstName || 'N/A'} ${user?.lastName || ''}`);
    }
    
    if (selectedStatus !== 'all') {
      const statusLabels = {
        'aberta': 'Aberta',
        'em_andamento': 'Em Andamento',
        'concluida': 'Concluída',
        'cancelada': 'Cancelada'
      };
      activeFilters.push(`Status: ${statusLabels[selectedStatus as keyof typeof statusLabels] || selectedStatus}`);
    }
    
    if (selectedPriority !== 'all') {
      const priorityLabels = {
        'baixa': 'Baixa',
        'media': 'Média',
        'alta': 'Alta',
        'critica': 'Crítica'
      };
      activeFilters.push(`Prioridade: ${priorityLabels[selectedPriority as keyof typeof priorityLabels] || selectedPriority}`);
    }
    
    if (dateRange.from && dateRange.to) {
      activeFilters.push(`Período: ${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`);
    }
    
    return activeFilters;
  };

  // Filter data based on current filters
  const getFilteredData = () => {
    let filteredTasks = [...tasks];
    let filteredProjects = [...projects];

    // Apply date range filter
    if (dateRange.from && dateRange.to) {
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= dateRange.from! && taskDate <= dateRange.to!;
      });
    }

    // Apply user filter
    if (selectedUser !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.assignedUserId === selectedUser);
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === selectedPriority);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === selectedStatus);
    }

    // Apply project filter
    if (selectedProject !== 'all') {
      const projectId = Number(selectedProject);
      filteredTasks = filteredTasks.filter(task => task.projectId === projectId);
      filteredProjects = filteredProjects.filter(project => project.id === projectId);
    } else {
      // If no specific project filter, only include projects that have tasks
      const projectIdsWithTasks = Array.from(new Set(filteredTasks.map(task => task.projectId)));
      filteredProjects = filteredProjects.filter(project => 
        projectIdsWithTasks.includes(project.id)
      );
    }

    // Add tasks to their respective projects
    filteredProjects = filteredProjects.map(project => ({
      ...project,
      tasks: filteredTasks.filter(task => task.projectId === project.id)
    }));

    return {
      tasks: filteredTasks,
      projects: filteredProjects
    };
  };

  // Generate PDF Report based on applied filters
  const generatePDFReport = () => {
    try {
      toast({
        title: "Gerando relatório...",
        description: "Processando dados para exportação em PDF",
      });

      // Apply filters to get the filtered data
      const filteredData = getFilteredData();
      
      // Prepare PDF report data
      const reportData: PDFReportData = {
        projects: filteredData.projects as ProjectWithTasks[],
        tasks: filteredData.tasks as TaskWithDetails[],
        users: users as User[],
        appliedFilters: {
          projectId: selectedProject !== 'all' ? Number(selectedProject) : undefined,
          assignedUserId: selectedUser !== 'all' ? selectedUser : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          priority: selectedPriority !== 'all' ? selectedPriority : undefined,
          dateRange: dateRange.from && dateRange.to ? {
            from: dateRange.from,
            to: dateRange.to
          } : undefined
        },
        exportDate: new Date()
      };

      // Generate the PDF
      const generator = new PDFReportGenerator();
      generator.generateReport(reportData);

      toast({
        title: "Relatório gerado com sucesso!",
        description: `Exportado ${reportData.projects.length} projetos e ${reportData.tasks.length} tarefas`,
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro durante a geração do PDF",
        variant: "destructive",
      });
    }
  };

  // Chart data processing
  const getTasksByStatus = () => {
    const statusCount = tasks.reduce((acc: Record<string, number>, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count as number
    }));
  };

  const getTasksByPriority = () => {
    const priorityCount = tasks.reduce((acc: Record<string, number>, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(priorityCount).map(([priority, count]) => ({
      name: priority,
      value: count as number
    }));
  };

  const getTasksOverTime = () => {
    // Mock data placeholder
    return [
      { name: 'Jan', tasks: 4 },
      { name: 'Fev', tasks: 6 },
      { name: 'Mar', tasks: 8 },
      { name: 'Abr', tasks: 10 },
      { name: 'Mai', tasks: 12 },
      { name: 'Jun', tasks: 15 },
    ];
  };

  if (statsLoading || userStatsLoading || tasksLoading || projectsLoading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="animate-pulse space-y-6 sm:space-y-8">
          <div className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">Visão geral dos seus projetos e tarefas</p>
        </div>
        
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={generatePDFReport}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm"
            title="Exportar relatório PDF com base nos filtros aplicados"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="hidden lg:inline">Exportar Relatório PDF</span>
            <span className="lg:hidden sm:inline">Relatório PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle 
            className="flex items-center justify-between text-sm sm:text-base lg:text-lg cursor-pointer"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              Filtros
            </div>
            {filtersExpanded ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </CardTitle>
        </CardHeader>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${filtersExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
              {/* Date Range */}
              <div className="space-y-2 sm:col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yy")
                      )
                    ) : (
                      "Selecione período"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ 
                      from: range?.from || undefined, 
                      to: range?.to || undefined 
                    })}
                    numberOfMonths={window.innerWidth > 768 ? 2 : 1}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuário</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Projeto</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDateRange({ from: undefined, to: undefined });
                  setSelectedUser('all');
                  setSelectedPriority('all');
                  setSelectedStatus('all');
                  setSelectedProject('all');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
        </div>
      </Card>

      {/* Active Filters Summary */}
      {getActiveFiltersSummary().length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Relatório PDF será gerado com os seguintes filtros:
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {getActiveFiltersSummary().map((filter, index) => (
                <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                  {filter}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
              💡 O relatório incluirá apenas os dados que correspondem aos filtros acima
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Filters Message */}
      {getActiveFiltersSummary().length === 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">
                O relatório PDF será gerado com TODOS os projetos e tarefas (sem filtros aplicados)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total de Tarefas</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats?.totalTasks || 0}</p>
              </div>
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Tarefas Concluídas</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats?.completedTasks || 0}</p>
              </div>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Projetos Ativos</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats?.activeProjects || 0}</p>
              </div>
              <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Horas Trabalhadas</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{Number(dashboardStats?.totalHours || 0).toFixed(2)}</p>
              </div>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {/* Tasks by Status */}
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base lg:text-lg">Tarefas por Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48 sm:h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getTasksByStatus()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={window.innerWidth > 1024 ? 80 : window.innerWidth > 640 ? 70 : 50}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getTasksByStatus().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base lg:text-lg">Tarefas por Prioridade</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48 sm:h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getTasksByPriority()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={window.innerWidth > 640 ? 12 : 10} />
                  <YAxis fontSize={window.innerWidth > 640 ? 12 : 10} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Over Time */}
        <Card className="lg:col-span-2 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base lg:text-lg">Evolução de Tarefas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48 sm:h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getTasksOverTime()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={window.innerWidth > 640 ? 12 : 10} />
                  <YAxis fontSize={window.innerWidth > 640 ? 12 : 10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tasks" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 sm:space-y-3">
            {tasks.slice(0, 5).map((task: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm sm:text-base truncate">{task.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{task.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={task.status === 'concluida' ? 'default' : 'secondary'}>
                    {task.status}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{task.priority}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}