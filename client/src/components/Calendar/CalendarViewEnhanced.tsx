import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CalendarHeatmap from "./CalendarHeatmap";
import TaskModal from "@/components/Kanban/TaskModal";
import { formatDistanceToNow, format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails, Project, User } from "@shared/schema";
import { Filter, X, Calendar, Users, Building, AlertTriangle, Clock, CheckCircle } from "lucide-react";

// Feriados de São Paulo 2024-2025
const SP_HOLIDAYS = {
  2024: [
    { date: '2024-01-01', name: 'Ano Novo', type: 'nacional' },
    { date: '2024-01-25', name: 'Aniversário de São Paulo', type: 'municipal' },
    { date: '2024-02-12', name: 'Carnaval', type: 'nacional' },
    { date: '2024-02-13', name: 'Carnaval', type: 'nacional' },
    { date: '2024-02-14', name: 'Quarta-feira de Cinzas', type: 'ponto_facultativo' },
    { date: '2024-03-29', name: 'Sexta-feira Santa', type: 'nacional' },
    { date: '2024-04-21', name: 'Tiradentes', type: 'nacional' },
    { date: '2024-05-01', name: 'Dia do Trabalho', type: 'nacional' },
    { date: '2024-05-30', name: 'Corpus Christi', type: 'municipal' },
    { date: '2024-07-09', name: 'Revolução Constitucionalista', type: 'estadual' },
    { date: '2024-09-07', name: 'Independência do Brasil', type: 'nacional' },
    { date: '2024-10-12', name: 'Nossa Senhora Aparecida', type: 'nacional' },
    { date: '2024-11-02', name: 'Finados', type: 'nacional' },
    { date: '2024-11-15', name: 'Proclamação da República', type: 'nacional' },
    { date: '2024-11-20', name: 'Consciência Negra', type: 'municipal' },
    { date: '2024-12-25', name: 'Natal', type: 'nacional' },
  ],
  2025: [
    { date: '2025-01-01', name: 'Ano Novo', type: 'nacional' },
    { date: '2025-01-25', name: 'Aniversário de São Paulo', type: 'municipal' },
    { date: '2025-03-03', name: 'Carnaval', type: 'nacional' },
    { date: '2025-03-04', name: 'Carnaval', type: 'nacional' },
    { date: '2025-03-05', name: 'Quarta-feira de Cinzas', type: 'ponto_facultativo' },
    { date: '2025-04-18', name: 'Sexta-feira Santa', type: 'nacional' },
    { date: '2025-04-21', name: 'Tiradentes', type: 'nacional' },
    { date: '2025-05-01', name: 'Dia do Trabalho', type: 'nacional' },
    { date: '2025-06-19', name: 'Corpus Christi', type: 'municipal' },
    { date: '2025-07-09', name: 'Revolução Constitucionalista', type: 'estadual' },
    { date: '2025-09-07', name: 'Independência do Brasil', type: 'nacional' },
    { date: '2025-10-12', name: 'Nossa Senhora Aparecida', type: 'nacional' },
    { date: '2025-10-15', name: 'Dia do Professor', type: 'ponto_facultativo' },
    { date: '2025-10-28', name: 'Dia do Servidor Público', type: 'ponto_facultativo' },
    { date: '2025-11-02', name: 'Finados', type: 'nacional' },
    { date: '2025-11-15', name: 'Proclamação da República', type: 'nacional' },
    { date: '2025-11-20', name: 'Consciência Negra', type: 'municipal' },
    { date: '2025-12-25', name: 'Natal', type: 'nacional' },
  ]
};

export default function CalendarViewEnhanced() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Filters
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Task modal
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Obter feriados do ano selecionado
  const holidays = useMemo(() => {
    return SP_HOLIDAYS[selectedYear as keyof typeof SP_HOLIDAYS] || [];
  }, [selectedYear]);

  // Filter tasks based on all criteria
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (selectedProject !== "all") {
      result = result.filter(task => task.projectId?.toString() === selectedProject);
    }

    if (selectedUser !== "all") {
      result = result.filter(task => task.assignedUserId === selectedUser);
    }

    if (selectedPriority !== "all") {
      result = result.filter(task => task.priority === selectedPriority);
    }

    if (selectedStatus !== "all") {
      result = result.filter(task => task.status === selectedStatus);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [tasks, selectedProject, selectedUser, selectedPriority, selectedStatus, searchTerm]);

  // Get tasks for the selected month
  const monthTasks = useMemo(() => {
    return filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.getMonth() === selectedMonth && taskDate.getFullYear() === selectedYear;
    });
  }, [filteredTasks, selectedMonth, selectedYear]);

  // Get tasks by date for calendar display
  const tasksByDate = useMemo(() => {
    const dateMap: Record<string, TaskWithDetails[]> = {};
    
    filteredTasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = [];
        }
        dateMap[dateKey].push(task);
      }
    });

    return dateMap;
  }, [filteredTasks]);

  // Generate calendar days for the selected month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth));
    const end = endOfMonth(new Date(selectedYear, selectedMonth));
    const days = eachDayOfInterval({ start, end });
    
    // Add days from previous month to fill first week
    const firstDayWeekday = getDay(start);
    const paddingDays = [];
    
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const paddingDate = new Date(start);
      paddingDate.setDate(start.getDate() - i - 1);
      paddingDays.push(paddingDate);
    }
    
    return [...paddingDays, ...days];
  }, [selectedYear, selectedMonth]);

  // Upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    return filteredTasks
      .filter(task => {
        if (!task.dueDate || task.status === 'concluida') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= twoWeeksFromNow;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 10);
  }, [filteredTasks]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return filteredTasks
      .filter(task => {
        if (!task.dueDate || task.status === 'concluida') return false;
        return new Date(task.dueDate) < now;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [filteredTasks]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedProject("all");
    setSelectedUser("all");
    setSelectedPriority("all");
    setSelectedStatus("all");
    setSearchTerm("");
  };

  // Check if filters are active
  const hasActiveFilters = selectedProject !== "all" || selectedUser !== "all" || 
                          selectedPriority !== "all" || selectedStatus !== "all" || searchTerm.trim();

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'alta': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'media': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'em_andamento': return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'cancelada': return <X className="w-3 h-3 text-red-600" />;
      default: return <AlertTriangle className="w-3 h-3 text-blue-600" />;
    }
  };

  // Handle task click
  const handleTaskClick = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  if (tasksLoading || projectsLoading || usersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Calendário de Projetos</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Visualize prazos e marcos importantes com filtros avançados
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros Avançados
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="sm:col-span-2">
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Project Filter */}
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Projeto" />
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

            {/* User Filter */}
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Usuário" />
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

            {/* Priority Filter */}
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
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

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {months[selectedMonth]} {selectedYear}
            <Badge variant="outline" className="ml-2">
              {monthTasks.length} tarefa{monthTasks.length !== 1 ? 's' : ''} no mês
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate[dateKey] || [];
              const isCurrentMonth = day.getMonth() === selectedMonth;
              const isToday = isSameDay(day, new Date());
              const holiday = holidays.find(h => h.date === dateKey);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-1 sm:p-2 border rounded-lg transition-colors ${
                    isCurrentMonth 
                      ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' 
                      : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''} ${
                    holiday ? 'bg-red-50 dark:bg-red-900/10' : ''
                  }`}
                >
                  {/* Day Number */}
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                    {day.getDate()}
                  </div>

                  {/* Holiday */}
                  {holiday && (
                    <div className="text-xs text-red-600 dark:text-red-400 mb-1 truncate">
                      {holiday.name}
                    </div>
                  )}

                  {/* Tasks */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getPriorityColor(task.priority)}`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          <span className="truncate">{task.title}</span>
                        </div>
                      </div>
                    ))}
                    
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayTasks.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Tarefas em Atraso ({overdueTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`flex items-center gap-3 p-3 border-l-4 ${getPriorityColor(task.priority)} rounded-r-lg cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm">{task.title}</h4>
                      <p className="text-red-700 dark:text-red-300 text-xs">
                        Venceu {formatDistanceToNow(new Date(task.dueDate!), { addSuffix: true, locale: ptBR })}
                      </p>
                      {task.project && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {task.project.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Próximos Prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((task) => {
                  const daysUntilDue = Math.ceil((new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntilDue <= 3;
                  
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className={`flex items-center gap-3 p-3 border-l-4 ${
                        isUrgent 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                          : getPriorityColor(task.priority)
                      } rounded-r-lg cursor-pointer hover:shadow-md transition-shadow`}
                    >
                      <div className={`w-10 h-10 ${
                        isUrgent ? 'bg-orange-100 dark:bg-orange-900' : 'bg-blue-100 dark:bg-blue-900'
                      } rounded-lg flex items-center justify-center flex-shrink-0`}>
                        {getStatusIcon(task.status)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{task.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {daysUntilDue === 0 ? 'Hoje' : 
                           daysUntilDue === 1 ? 'Amanhã' : 
                           `Em ${daysUntilDue} dias`}
                        </p>
                        {task.project && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {task.project.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Nenhum prazo próximo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        defaultStatus={selectedTask?.status}
        defaultProjectId={selectedTask?.projectId || undefined}
      />
    </div>
  );
}