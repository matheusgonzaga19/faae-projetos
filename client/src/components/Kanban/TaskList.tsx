import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';
import { Edit2, Trash2 } from 'lucide-react';
import { DEFAULT_TAG_COLOR, getTagTextColor } from '@/utils/tags';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: any) => void;
  onDelete: (task: any) => void;
}

export default function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-2">Título</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Prioridade</th>
            <th className="px-2 py-2">Início</th>
            <th className="px-2 py-2">Vencimento</th>
            <th className="px-2 py-2">Responsáveis</th>
            <th className="px-2 py-2">Tags</th>
            <th className="px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t">
              <td className="px-2 py-2">{task.title}</td>
              <td className="px-2 py-2">{task.status}</td>
              <td className="px-2 py-2">{task.priority}</td>
              <td className="px-2 py-2">
                {task.startDate ? format(new Date(task.startDate), 'dd/MM/yyyy', { locale: ptBR }) : ''}
              </td>
              <td className="px-2 py-2">
                {task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR }) : ''}
              </td>
              <td className="px-2 py-2">
                {task.assignedUserIds && task.assignedUserIds.length > 0
                  ? task.assignedUserIds.join(', ')
                  : ''}
              </td>
              <td className="px-2 py-2">
                {task.tags && task.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => {
                      const backgroundColor = tag.color || DEFAULT_TAG_COLOR;
                      const textColor = getTagTextColor(backgroundColor);
                      return (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs border-transparent"
                          style={{ backgroundColor, color: textColor }}
                        >
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                ) : null}
              </td>
              <td className="px-2 py-2 flex space-x-2">
                <Button size="icon" variant="ghost" onClick={() => onEdit(task)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-red-600" onClick={() => onDelete(task)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-gray-500">
                Nenhuma tarefa encontrada
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
