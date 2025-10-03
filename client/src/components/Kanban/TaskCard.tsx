import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import type { TaskWithDetails } from "@shared/schema";
import { PRIORITY_BADGE_STYLES, PRIORITY_LABELS } from "@/lib/constants";

interface TaskCardProps {
  task: TaskWithDetails;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export default function TaskCard({ task, onDragStart }: TaskCardProps) {
  const { user } = useAuth();
  const isCanceled = task.status === 'cancelada';
  
  const getUserDisplayName = () => {
    if (task.assignedUser?.firstName && task.assignedUser?.lastName) {
      return `${task.assignedUser.firstName} ${task.assignedUser.lastName}`;
    }
    return task.assignedUser?.email || 'Usuário';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOverdue = () => {
    if (!task.dueDate || task.status === 'concluida') return false;
    return new Date(task.dueDate) < new Date();
  };

  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const isToday = dueDate.toDateString() === today.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) return "Hoje";
    if (isTomorrow) return "Amanhã";
    
    return formatDistanceToNow(dueDate, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const canEditTask = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const createdById = (task as TaskWithDetails & { createdUserId?: string }).createdUserId;
    return task.assignedUserId === user.id || createdById === user.id;
  };

  const cardContent = (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id.toString())}
      className={`bg-white dark:bg-gray-700 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-600 cursor-move hover:shadow-md transition-shadow group ${isCanceled ? 'opacity-60' : ''}`}
    >
      {/* Priority and Drag Handle */}
      <div className="flex items-center justify-between mb-2">
        <Badge
          variant="secondary"
          className={`${
            PRIORITY_BADGE_STYLES[task.priority as keyof typeof PRIORITY_BADGE_STYLES] ??
            'bg-gray-100 text-gray-800'
          } text-xs px-1.5 py-0.5`}
        >
          {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
        </Badge>
        <i className="fas fa-grip-dots text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 text-sm"></i>
      </div>

      {/* Task Title */}
      <h4
        className={`font-semibold mb-2 line-clamp-2 transition-colors text-sm sm:text-base ${
          isCanceled
            ? 'line-through text-gray-500 dark:text-gray-400'
            : 'group-hover:text-blue-600'
        }`}
      >
        {task.title}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Project Badge */}
      {task.project && (
        <div className="mb-3">
          <Badge variant="outline" className="text-xs">
            <i className="fas fa-project-diagram mr-1"></i>
            {task.project.name}
          </Badge>
        </div>
      )}

      {/* Files Indicator */}
      {(() => {
        const files = (task as TaskWithDetails & { files?: Array<{ id: string }> }).files;
        if (!files || files.length === 0) {
          return null;
        }
        return (
        <div className="mb-3">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-paperclip mr-1"></i>
            {files.length} arquivo{files.length !== 1 ? 's' : ''}
          </div>
        </div>
        );
      })()}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assigned User Avatar */}
        {task.assignedUser && (
          <Avatar className="w-6 h-6">
            <AvatarImage 
              src={
                task.assignedUser.profileImageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName())}&background=2563eb&color=fff`
              }
              alt={getUserDisplayName()}
            />
            <AvatarFallback className="text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <span 
            className={`text-xs ${
              isOverdue() 
                ? 'text-red-600 dark:text-red-400 font-medium' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <i className={`fas fa-calendar-alt mr-1 ${isOverdue() ? 'text-red-500' : ''}`}></i>
            {getDueDateDisplay()}
          </span>
        )}
      </div>

      {/* Overdue Warning */}
      {isOverdue() && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Tarefa em atraso
          </p>
        </div>
      )}
    </div>
  );

  return cardContent;
}
