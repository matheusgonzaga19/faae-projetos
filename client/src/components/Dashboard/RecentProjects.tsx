import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProjectWithTasks } from "@/types";

interface RecentProjectsProps {
  projects: ProjectWithTasks[];
}

export default function RecentProjects({ projects }: RecentProjectsProps) {
  const getProjectProgress = (project: ProjectWithTasks): number => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(task => task.status === 'concluida').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  const getProjectImage = (projectName: string): string => {
    const imageMap: Record<string, string> = {
      'Edifício Central': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
      'Shopping Norte': 'https://images.unsplash.com/photo-1555636222-cae831e670b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
      'Hospital Municipal': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
      'Praça Pública Central': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
      'Escritório InovaTech': 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
      'Condomínio Green Valley': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
      'Hotel Marítimo': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
      'Loja Conceito': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
    };

    return imageMap[projectName] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const },
      completed: { label: 'Concluído', variant: 'secondary' as const },
      on_hold: { label: 'Pausado', variant: 'outline' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const recentProjects = projects.slice(0, 6);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Projetos Recentes</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
            Ver todos
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {recentProjects.length > 0 ? (
            recentProjects.map((project) => {
              const progress = getProjectProgress(project);
              const mainTask = project.tasks?.[0];
              
              return (
                <div
                  key={project.id}
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                >
                  <img
                    src={getProjectImage(project.name)}
                    alt={`${project.name} project`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {project.description || (mainTask?.title ? `${mainTask.title}` : 'Sem tarefas')}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      {getStatusBadge(project.status)}
                      {project.clientName && (
                        <span className="text-xs text-gray-400">{project.clientName}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{progress}%</p>
                    <div className="w-16 mt-1">
                      <Progress value={progress} className="h-2" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {project.tasks?.length || 0} tarefas
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-project-diagram text-gray-400 text-2xl"></i>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nenhum projeto encontrado
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Crie seu primeiro projeto para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
