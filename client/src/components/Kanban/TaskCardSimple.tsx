import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import TaskModal from "./TaskModal";
import type { TaskWithDetails } from "@shared/schema";
import { PRIORITY_BADGE_STYLES, PRIORITY_LABELS } from "@/lib/constants";

interface TaskCardProps {
  task: TaskWithDetails;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export default function TaskCardSimple({ task, onDragStart }: TaskCardProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    return task.assignedUserId === user.id || task.createdUserId === user.id;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, task.id.toString())}
        onClick={handleCardClick}
        className={`bg-white dark:bg-gray-700 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-600 cursor-grab hover:cursor-grab hover:shadow-md transition-all duration-200 group ${isCanceled ? 'opacity-60' : ''}`}
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

        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center text-xs mb-3 ${isOverdue() ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <i className={`fas ${isOverdue() ? 'fa-exclamation-triangle' : 'fa-calendar'} mr-1`}></i>
            <span>{getDueDateDisplay()}</span>
          </div>
        )}

        {/* Assigned User */}
        {task.assignedUser && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <i className="fas fa-user mr-1"></i>
              <span>{getUserDisplayName()}</span>
            </div>
            <Avatar className="w-6 h-6">
              <AvatarImage src={task.assignedUser.profileImageUrl || ''} />
              <AvatarFallback className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Task metadata */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-600">
          <div className="text-xs text-gray-400">
            #{task.id}
          </div>
          {canEditTask() && (
            <div className="text-xs text-gray-400">
              <i className="fas fa-edit"></i>
            </div>
          )}
        </div>
      </div>

      {/* Complete Task Modal */}
      <TaskModal
        task={task}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultStatus={task.status}
        defaultProjectId={task.projectId || undefined}
      />
    </>
  );
}