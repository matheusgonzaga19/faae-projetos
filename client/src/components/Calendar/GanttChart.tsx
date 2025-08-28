import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TaskStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  projectId: string;
  dueDate?: string | Date;
  createdAt: Date;
}

interface Project {
  id: string;
  name: string;
  status: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

interface GanttChartProps {
  projects: Project[];
  tasks: Task[];
}

const STATUS_COLORS = {
  aberta: '#f59e0b',
  em_andamento: '#3b82f6',
  concluida: '#10b981',
  cancelada: '#ef4444'
};

const STATUS_LABELS = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

export default function GanttChart({ projects, tasks }: GanttChartProps) {
  const ganttData = useMemo(() => {
    const series: any[] = [];
    const categories: string[] = [];

    projects.forEach(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      
      if (projectTasks.length === 0) return;

      // Calculate project timeline based on tasks
      const taskDates = projectTasks
        .map(task => task.dueDate ? new Date(task.dueDate) : null)
        .filter(Boolean) as Date[];

      const createdDates = projectTasks
        .map(task => new Date(task.createdAt));

      if (taskDates.length === 0) return;

      const earliestStart = new Date(Math.min(...createdDates.map(d => d.getTime())));
      const latestEnd = new Date(Math.max(...taskDates.map(d => d.getTime())));

      categories.push(project.name);

      // Group tasks by status for this project
      const statusGroups = {
        aberta: projectTasks.filter(t => t.status === 'aberta'),
        em_andamento: projectTasks.filter(t => t.status === 'em_andamento'),
        concluida: projectTasks.filter(t => t.status === 'concluida'),
        cancelada: projectTasks.filter(t => t.status === 'cancelada')
      };

      // Create series for each status that has tasks
      Object.entries(statusGroups).forEach(([status, statusTasks]) => {
        if (statusTasks.length === 0) return;

        let seriesName = `${project.name} - ${STATUS_LABELS[status as TaskStatus]}`;
        
        // Find existing series or create new one
        let statusSeries = series.find(s => s.name === STATUS_LABELS[status as TaskStatus]);
        if (!statusSeries) {
          statusSeries = {
            name: STATUS_LABELS[status as TaskStatus],
            data: []
          };
          series.push(statusSeries);
        }

        // Calculate timeline for this status group
        const statusTaskDates = statusTasks
          .map(task => task.dueDate ? new Date(task.dueDate) : null)
          .filter(Boolean) as Date[];

        if (statusTaskDates.length > 0) {
          const statusStart = new Date(Math.min(...statusTasks.map(t => new Date(t.createdAt).getTime())));
          const statusEnd = new Date(Math.max(...statusTaskDates.map(d => d.getTime())));

          statusSeries.data.push({
            x: project.name,
            y: [
              statusStart.getTime(),
              statusEnd.getTime()
            ],
            fillColor: STATUS_COLORS[status as TaskStatus],
            tasks: statusTasks.length,
            tasksList: statusTasks.map(t => t.title).join(', ')
          });
        }
      });
    });

    return { series, categories };
  }, [projects, tasks]);

  const options: import('apexcharts').ApexOptions = {
    chart: {
      type: 'rangeBar',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '50%',
        rangeBarGroupRows: true
      }
    },
    colors: Object.values(STATUS_COLORS),
    fill: {
      type: 'solid'
    },
    xaxis: {
      type: 'datetime',
      labels: {
        formatter: function (_value: string, timestamp?: number) {
          return timestamp ? format(new Date(timestamp), 'dd/MM', { locale: ptBR }) : String(_value);
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    tooltip: {
      custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        const startDate = format(new Date(data.y[0]), 'dd/MM/yyyy', { locale: ptBR });
        const endDate = format(new Date(data.y[1]), 'dd/MM/yyyy', { locale: ptBR });
        
        return `
          <div class="p-3 bg-white border rounded shadow-lg">
            <div class="font-semibold">${data.x}</div>
            <div class="text-sm text-gray-600">${w.globals.seriesNames[seriesIndex]}</div>
            <div class="text-sm">Período: ${startDate} - ${endDate}</div>
            <div class="text-sm">${data.tasks} tarefa(s)</div>
            ${data.tasksList ? `<div class="text-xs text-gray-500 mt-1">${data.tasksList}</div>` : ''}
          </div>
        `;
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    },
    title: {
      text: 'Cronograma de Projetos - Gantt',
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600
      }
    }
  };

  const hasData = ganttData.series.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Gráfico de Gantt - Cronograma dos Projetos</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Nenhum projeto com tarefas encontrado para exibir no Gantt.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Crie projetos e adicione tarefas com datas de vencimento para visualizar o cronograma.
            </p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-600">
                    {STATUS_LABELS[status as TaskStatus]}
                  </span>
                </div>
              ))}
            </div>

            {/* Gantt Chart */}
            <div className="w-full">
              <Chart
                options={options}
                series={ganttData.series}
                type="rangeBar"
                height={Math.max(350, ganttData.categories.length * 60)}
              />
            </div>

            {/* Project Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => {
                const projectTasks = tasks.filter(task => task.projectId === project.id);
                if (projectTasks.length === 0) return null;

                const statusCounts = {
                  aberta: projectTasks.filter(t => t.status === 'aberta').length,
                  em_andamento: projectTasks.filter(t => t.status === 'em_andamento').length,
                  concluida: projectTasks.filter(t => t.status === 'concluida').length,
                  cancelada: projectTasks.filter(t => t.status === 'cancelada').length
                };

                return (
                  <Card key={project.id} className="border-l-4 border-blue-500">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{project.name}</h4>
                      <div className="space-y-1">
                        {Object.entries(statusCounts).map(([status, count]) => {
                          if (count === 0) return null;
                          return (
                            <div key={status} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                {STATUS_LABELS[status as TaskStatus]}:
                              </span>
                              <Badge 
                                variant="outline"
                                style={{ 
                                  backgroundColor: STATUS_COLORS[status as TaskStatus],
                                  color: 'white',
                                  borderColor: STATUS_COLORS[status as TaskStatus]
                                }}
                              >
                                {count}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
