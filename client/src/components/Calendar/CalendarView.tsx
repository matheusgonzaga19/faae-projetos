import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Calendar from 'react-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, User, AlertTriangle, RefreshCw, Filter } from 'lucide-react';
import { firebaseService } from '@/services/firebaseService';
import { format, startOfMonth, endOfMonth, isSameDay, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-calendar/dist/Calendar.css';
import GanttChart from './GanttChart';

type TaskStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
type TaskPriority = 'baixa' | 'media' | 'alta' | 'critica';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignedUserId?: string;
  dueDate?: string | Date;
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

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Filters {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  month: number;
  year: number;
}

const STATUS_COLORS = {
  aberta: 'bg-yellow-500',
  em_andamento: 'bg-blue-500',
  concluida: 'bg-green-500',
  cancelada: 'bg-red-500'
};

const PRIORITY_COLORS = {
  baixa: 'bg-gray-400',
  media: 'bg-yellow-500',
  alta: 'bg-orange-500',
  critica: 'bg-red-600'
};

const STATUS_LABELS = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

const PRIORITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica'
};

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'gantt'>('calendar');
  const [filters, setFilters] = useState<Filters>({
    projectId: undefined,
    assigneeId: undefined,
    status: undefined,
    month: selectedDate.getMonth() + 1,
    year: selectedDate.getFullYear(),
  });

  // Fetch data
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => firebaseService.getProjects(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => firebaseService.getAllUsers(),
  });

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/tasks', 'calendar', filters],
    queryFn: () => firebaseService.getTasks({
      ...filters,
      orderByDueDate: true, // Order by due date for calendar view
      limit: 500 // Higher limit for calendar view to show all tasks in month
    }),
    refetchInterval: 60000, // Less frequent updates for calendar
    enabled: true,
  });

  // Update filters when date changes
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      month: selectedDate.getMonth() + 1,
      year: selectedDate.getFullYear(),
    }));
  }, [selectedDate]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  // Get upcoming deadlines (next 30 days)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(task => {
        if (!task.dueDate || task.status === 'concluida' || task.status === 'cancelada') return false;
        const dueDate = new Date(task.dueDate);
        return isAfter(dueDate, now) && isBefore(dueDate, thirtyDaysFromNow);
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 10);
  }, [tasks]);

  // Custom tile content for calendar
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const dayTasks = getTasksForDate(date);
    if (dayTasks.length === 0) return null;

    return (
      <div className="flex justify-center mt-1">
        <div className="flex space-x-1">
          {dayTasks.slice(0, 3).map((task, index) => (
            <div
              key={task.id}
              className={`w-2 h-2 rounded-full ${STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]}`}
              title={`${task.title} - ${STATUS_LABELS[task.status as keyof typeof STATUS_LABELS]}`}
            />
          ))}
          {dayTasks.length > 3 && (
            <div className="w-2 h-2 bg-gray-300 rounded-full" title={`+${dayTasks.length - 3} mais`} />
          )}
        </div>
      </div>
    );
  };

  // Custom tile class name for highlighting dates with tasks
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';
    
    const dayTasks = getTasksForDate(date);
    if (dayTasks.length === 0) return '';
    
    const hasOverdue = dayTasks.some(task => 
      new Date(task.dueDate!) < new Date() && task.status !== 'concluida'
    );
    
    return hasOverdue ? 'overdue-date' : 'has-tasks';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Projeto não encontrado';
  };

  const getUserDisplayName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'Não atribuído';
    
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  const handleFilterChange = (
    filterType: 'projectId' | 'assigneeId' | 'status',
    value: string
  ) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value === 'all' ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      projectId: undefined,
      assigneeId: undefined,
      status: undefined,
      month: selectedDate.getMonth() + 1,
      year: selectedDate.getFullYear(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Carregando calendário...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendário de Tarefas</h1>
          <p className="text-gray-600 mt-1">Visualize prazos e gerencie seu cronograma</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendário
            </Button>
            <Button
              variant={viewMode === 'gantt' ? 'default' : 'outline'}
              onClick={() => setViewMode('gantt')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Gantt
            </Button>
          </div>

          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Project Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Projeto</label>
              <Select value={filters.projectId ?? 'all'} onValueChange={(value) => handleFilterChange('projectId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Responsável</label>
              <Select value={filters.assigneeId ?? 'all'} onValueChange={(value) => handleFilterChange('assigneeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserDisplayName(user.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status ?? 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar or Gantt View */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <style>{`
                .react-calendar {
                  width: 100% !important;
                  border: none !important;
                  font-family: inherit !important;
                }
                .react-calendar__tile {
                  position: relative;
                  padding: 10px 6px 30px 6px !important;
                }
                .react-calendar__tile.has-tasks {
                  background-color: #f0f9ff !important;
                }
                .react-calendar__tile.overdue-date {
                  background-color: #fef2f2 !important;
                }
                .react-calendar__tile--active {
                  background-color: #3b82f6 !important;
                  color: white !important;
                }
                .react-calendar__tile:hover {
                  background-color: #e5e7eb !important;
                }
                .react-calendar__navigation button {
                  font-size: 16px !important;
                  font-weight: 600 !important;
                }
              `}</style>
              <Calendar
                onChange={(value: any) => {
                  if (value instanceof Date) {
                    setSelectedDate(value);
                  }
                }}
                value={selectedDate}
                locale="pt-BR"
                tileContent={tileContent}
                tileClassName={tileClassName}
                prev2Label={null}
                next2Label={null}
                minDetail="month"
              />
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>Próximos Prazos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Nenhum prazo próximo encontrado
                  </p>
                ) : (
                  upcomingDeadlines.map((task) => (
                    <div key={task.id} className="border-l-4 border-blue-500 pl-3 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {task.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {getProjectName(task.projectId)}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]} text-white border-none`}
                            >
                              {STATUS_LABELS[task.status as keyof typeof STATUS_LABELS]}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(task.dueDate!), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <GanttChart projects={projects} tasks={tasks} />
      )}
    </div>
  );
}
