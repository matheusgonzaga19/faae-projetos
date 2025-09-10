import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskWithDetails, User } from "@/types";

export default function TeamActivity() {
  const { data: tasks = [] } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const getRecentActivities = () => {
    const activities: Array<{
      id: string;
      user: User;
      action: string;
      target: string;
      timestamp: Date;
      type: 'task_completed' | 'task_created' | 'task_updated' | 'file_uploaded';
    }> = [];

    // Get completed tasks
    tasks
      .filter(task => task.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 10)
      .forEach(task => {
        const user = users.find(u => u.id === task.assignedUserId);
        if (user) {
          activities.push({
            id: `completed-${task.id}`,
            user,
            action: 'concluiu a tarefa',
            target: task.title,
            timestamp: new Date(task.completedAt!),
            type: 'task_completed',
          });
        }
      });

    // Get recently created tasks
    tasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .forEach(task => {
        const user = users.find(u => u.id === task.createdUserId);
        if (user) {
          activities.push({
            id: `created-${task.id}`,
            user,
            action: 'criou a tarefa',
            target: task.title,
            timestamp: new Date(task.createdAt),
            type: 'task_created',
          });
        }
      });

    // Sort by timestamp and take the most recent
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);
  };

  const activities = getRecentActivities();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return 'fas fa-check-circle text-green-500';
      case 'task_created':
        return 'fas fa-plus-circle text-blue-500';
      case 'task_updated':
        return 'fas fa-edit text-amber-500';
      case 'file_uploaded':
        return 'fas fa-upload text-purple-500';
      default:
        return 'fas fa-circle text-gray-500';
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Usuário';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold">Atividade da Equipe</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <img
                  src={
                    activity.user.profileImageUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName(activity.user))}&background=2563eb&color=fff`
                  }
                  alt={getUserDisplayName(activity.user)}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {getUserDisplayName(activity.user)}
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      {activity.action}
                    </span>
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {activity.target}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDistanceToNow(activity.timestamp, { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <i className={getActivityIcon(activity.type)}></i>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-gray-400 text-2xl"></i>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma atividade recente
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                As atividades da equipe aparecerão aqui
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
