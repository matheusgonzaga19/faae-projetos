import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PRIORITY_COLORS, STATUS_COLORS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { ChatMessage as ChatMessageType, TaskWithDetails } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const renderTaskCard = (task: TaskWithDetails) => {
    const progress = task.estimatedHours && task.actualHours 
      ? Math.min((Number(task.actualHours) / Number(task.estimatedHours)) * 100, 100)
      : 0;

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'concluida';

    return (
      <div
        key={task.id}
        className={`bg-white dark:bg-gray-600 rounded-lg p-4 border ${
          isOverdue ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-500'
        } mb-3 last:mb-0`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
            {task.title}
          </h4>
          <div className="flex items-center space-x-2 ml-3">
            <Badge
              variant="secondary"
              className={PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}
            >
              {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
            </Badge>
            <Badge
              variant="secondary"
              className={STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]}
            >
              {STATUS_LABELS[task.status as keyof typeof STATUS_LABELS]}
            </Badge>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {task.description}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {task.project && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <i className="fas fa-project-diagram mr-2 text-blue-500"></i>
              <span>{task.project.name}</span>
            </div>
          )}

          {task.assignedUser && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <i className="fas fa-user mr-2 text-green-500"></i>
              <span>
                {task.assignedUser.firstName && task.assignedUser.lastName
                  ? `${task.assignedUser.firstName} ${task.assignedUser.lastName}`
                  : task.assignedUser.email || 'Usuário'
                }
              </span>
            </div>
          )}

          {task.dueDate && (
            <div className={`flex items-center ${
              isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              <i className={`fas fa-calendar-alt mr-2 ${isOverdue ? 'text-red-500' : 'text-purple-500'}`}></i>
              <span>
                {isOverdue ? 'Venceu ' : 'Vence '}
                {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          )}

          {task.estimatedHours && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <i className="fas fa-clock mr-2 text-orange-500"></i>
              <span>
                {task.actualHours ? Number(task.actualHours).toFixed(1) : '0.0'}h / {Number(task.estimatedHours).toFixed(1)}h
              </span>
            </div>
          )}
        </div>

        {progress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {task.files && task.files.length > 0 && (
          <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-paperclip mr-1"></i>
            {task.files.length} arquivo{task.files.length !== 1 ? 's' : ''}
          </div>
        )}

        {isOverdue && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Esta tarefa está em atraso
            </p>
          </div>
        )}
      </div>
    );
  };

  if (message.isAI) {
    return (
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <i className="fas fa-robot text-white text-sm"></i>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-w-3xl">
          <p className="text-sm mb-2">
            {formatMessageContent(message.content)}
          </p>
          
          {message.data && Array.isArray(message.data) && message.data.length > 0 && (
            <div className="mt-4">
              {message.data.map(renderTaskCard)}
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Precisa de mais informações? Tente ser mais específico na sua próxima consulta.
                </p>
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {formatDistanceToNow(message.timestamp, { addSuffix: true, locale: ptBR })}
          </p>
        </div>
      </div>
    );
  }

  // User message
  return (
    <div className="flex items-start space-x-3 justify-end">
      <div className="bg-blue-600 text-white rounded-lg p-4 max-w-2xl">
        <p className="text-sm">
          {formatMessageContent(message.content)}
        </p>
        <p className="text-xs text-blue-200 mt-2">
          {formatDistanceToNow(message.timestamp, { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <i className="fas fa-user text-white text-sm"></i>
      </div>
    </div>
  );
}
