import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CalendarIcon,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { firebaseService } from '@/services/firebaseService';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { Task } from '@/types';

type TaskOption = Pick<Task, 'id' | 'title' | 'projectId'>;

// Task creation schema
const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Projeto é obrigatório'),
  priority: z.enum(['baixa', 'media', 'alta', 'critica'], {
    required_error: 'Prioridade é obrigatória',
  }),
  status: z.enum(['aberta', 'em_andamento', 'concluida', 'cancelada']).default('aberta'),
  startDate: z.date().optional(),
  dueDate: z.date({
    required_error: 'Data de vencimento é obrigatória',
  }),
  assignedUserIds: z.array(z.string()).optional(),
  tags: z.string().optional(),
  subtasks: z
    .array(
      z.object({
        title: z.string().min(1, 'Título é obrigatório'),
        status: z.enum(['aberta', 'em_andamento', 'concluida', 'cancelada']).default('aberta'),
        priority: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
        assignedUserId: z.string().optional(),
        dueDate: z.any().optional(),
      })
    )
    .optional(),
  relationships: z
    .array(
      z.object({
        type: z.enum(['blocks', 'blocked_by', 'relates_to']),
        taskId: z.string().min(1),
      })
    )
    .optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

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

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  task?: {
    id: string;
    title: string;
    description?: string | null;
    projectId: string;
    priority: 'baixa' | 'media' | 'alta' | 'critica';
    status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
    startDate?: Date | string | null;
    dueDate?: Date | string | null;
    assignedUserIds?: string[] | null;
    tags?: string[] | null;
    subtasks?: any[] | null;
    relationships?: any[] | null;
  };
}

export default function TaskModal({ isOpen, onClose, projects, task }: TaskModalProps) {
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isDueCalendarOpen, setIsDueCalendarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for assignee selection
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => firebaseService.getAllUsers(),
    enabled: isOpen, // Only fetch when modal is open
  });

  const { data: relationshipTaskResults = [], isLoading: isLoadingRelationshipTasks } = useQuery<TaskOption[]>({
    queryKey: ['/api/tasks', 'relationship-options'],
    queryFn: async () => {
      const tasks = await firebaseService.getTasks({ limit: 500 });
      return (tasks || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        projectId: task.projectId ?? null,
      }));
    },
    enabled: isOpen,
  });

  const selectableTasks = React.useMemo(() => {
    const seen = new Set<string>();
    const filtered: TaskOption[] = [];

    for (const relationshipTask of relationshipTaskResults) {
      if (!relationshipTask || !relationshipTask.id) continue;
      if (task?.id && relationshipTask.id === task.id) continue;
      if (seen.has(relationshipTask.id)) continue;

      seen.add(relationshipTask.id);
      filtered.push(relationshipTask);
    }

    return filtered.sort((a, b) => {
      const firstTitle = a.title ?? '';
      const secondTitle = b.title ?? '';
      return firstTitle.localeCompare(secondTitle, 'pt-BR', { sensitivity: 'base' });
    });
  }, [relationshipTaskResults, task?.id]);

  const projectNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach(project => {
      if (project.id) {
        map[project.id] = project.name;
      }
    });
    return map;
  }, [projects]);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      priority: 'media',
      status: 'aberta',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      assignedUserIds: [],
      tags: '',
      subtasks: [],
      relationships: [],
    },
  });

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: 'subtasks',
  });

  const { fields: relationshipFields, append: appendRelationship, remove: removeRelationship } = useFieldArray({
    control: form.control,
    name: 'relationships',
  });

  // Prefill when editing
  React.useEffect(() => {
    if (!isOpen) return;
    if (task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId || '',
        priority: (task.priority as any) || 'media',
        status: (task.status as any) || 'aberta',
        startDate: task.startDate ? new Date(task.startDate as any) : new Date(),
        dueDate: task.dueDate ? new Date(task.dueDate as any) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedUserIds:
          task.assignedUserIds && task.assignedUserIds.length > 0
            ? task.assignedUserIds
            : (task as any).assignedUserId
            ? [(task as any).assignedUserId]
            : [],
        tags: task.tags ? task.tags.join(', ') : '',
        subtasks: task.subtasks || [],
        relationships: task.relationships || [],
      });
    } else {
      form.reset({
        title: '',
        description: '',
        projectId: '',
        priority: 'media',
        status: 'aberta',
        startDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedUserIds: [],
        tags: '',
        subtasks: [],
        relationships: [],
      });
    }
  }, [isOpen, task]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      // Validate that project exists
      const project = projects.find(p => p.id === taskData.projectId);
      if (!project) {
        throw new Error('Projeto selecionado não encontrado');
      }

      const newTask = {
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return await firebaseService.createTask(newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/enhanced'] });
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso!",
        variant: "default",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar tarefa",
        variant: "destructive",
      });
    },
  });

  // Update task (edit mode)
  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      if (!task) throw new Error('Tarefa não encontrada');
      const updated = {
        title: taskData.title,
        description: taskData.description || '',
        projectId: taskData.projectId,
        priority: taskData.priority,
        status: taskData.status,
        startDate: taskData.startDate,
        dueDate: taskData.dueDate,
        assignedUserIds: taskData.assignedUserIds || [],
        tags: Array.isArray(taskData.tags)
          ? taskData.tags
          : taskData.tags
          ? taskData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        subtasks: taskData.subtasks?.map(st => ({
          ...st,
          assignedUserIds:
            st.assignedUserId && st.assignedUserId !== 'none'
              ? [st.assignedUserId]
              : [],
          dueDate: st.dueDate ? new Date(st.dueDate) : undefined,
        })),
        relationships: taskData.relationships,
        updatedAt: new Date(),
      };
      return await firebaseService.updateTask(task.id, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/enhanced'] });
      toast({ title: 'Sucesso', description: 'Tarefa atualizada com sucesso!' });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message || 'Erro desconhecido', variant: 'destructive' });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    const formattedData: any = {
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      assignedUserIds: data.assignedUserIds || [],
      subtasks: data.subtasks?.map(st => ({
        ...st,
        assignedUserIds:
          st.assignedUserId && st.assignedUserId !== 'none'
            ? [st.assignedUserId]
            : [],
        dueDate: st.dueDate ? new Date(st.dueDate) : undefined,
      })),
      relationships: data.relationships,
    };
    if (task?.id) {
      updateTaskMutation.mutate(formattedData);
    } else {
      createTaskMutation.mutate(formattedData);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Get user display name
  const getUserDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  // Filter active projects
  const activeProjects = projects.filter(project => project.status === 'active');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o título da tarefa" 
                      {...field} 
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a tarefa (opcional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Selection */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeProjects.length === 0 ? (
                        <div className="p-2 text-muted-foreground">
                          Nenhum projeto ativo encontrado
                        </div>
                      ) : (
                        activeProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {activeProjects.length === 0 && (
                    <p className="text-sm text-amber-600">
                      Crie um projeto ativo antes de adicionar tarefas.
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aberta">Aberta</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsStartCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento *</FormLabel>
                    <Popover open={isDueCalendarOpen} onOpenChange={setIsDueCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsDueCalendarOpen(false);
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assignees */}
              <FormField
                control={form.control}
                name="assignedUserIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsáveis</FormLabel>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {field.value && field.value.length
                            ? users
                                .filter((u) => field.value?.includes(u.id))
                                .map((u) => getUserDisplayName(u))
                                .join(', ')
                            : 'Selecione'}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                        {users.map((user) => (
                          <DropdownMenuCheckboxItem
                            key={user.id}
                            checked={field.value?.includes(user.id)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              if (checked) field.onChange([...value, user.id]);
                              else field.onChange(value.filter((id: string) => id !== user.id));
                            }}
                          >
                            {getUserDisplayName(user)}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiquetas (separadas por vírgula)</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: frontend, urgente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <h4 className="font-medium">Subtarefas</h4>
              {subtaskFields.map((subtask, index) => (
                <div key={subtask.id} className="border p-2 rounded space-y-2">
                  <FormField
                    control={form.control}
                    name={`subtasks.${index}.title` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`subtasks.${index}.status` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="aberta">Aberta</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="concluida">Concluída</SelectItem>
                              <SelectItem value="cancelada">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`subtasks.${index}.priority` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="baixa">Baixa</SelectItem>
                              <SelectItem value="media">Média</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="critica">Crítica</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`subtasks.${index}.assignedUserId` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsável</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {getUserDisplayName(user)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`subtasks.${index}.dueDate` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vencimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSubtask(index)}>
                    <X className="h-4 w-4" /> Remover
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendSubtask({
                    id: Date.now().toString(),
                    title: '',
                    status: 'aberta',
                    priority: 'baixa',
                    assignedUserId: '',
                    dueDate: undefined,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Subtarefa
              </Button>
            </div>

            {/* Relationships */}
            <div className="space-y-2">
              <h4 className="font-medium">Relacionamentos</h4>
              {relationshipFields.map((rel, index) => (
                <div key={rel.id} className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name={`relationships.${index}.type` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blocks">Bloqueia</SelectItem>
                              <SelectItem value="blocked_by">Bloqueado por</SelectItem>
                              <SelectItem value="relates_to">Relacionado a</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`relationships.${index}.taskId` as const}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <TaskRelationshipSelector
                            ref={field.ref}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            tasks={selectableTasks}
                            projectNameById={projectNameById}
                            isLoading={isLoadingRelationshipTasks}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRelationship(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendRelationship({ type: 'blocks', taskId: '' })}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar relação
              </Button>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending || activeProjects.length === 0}
              >
                {(createTaskMutation.isPending || updateTaskMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {task ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface TaskRelationshipSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  tasks: TaskOption[];
  projectNameById: Record<string, string>;
  isLoading: boolean;
}

const TaskRelationshipSelector = React.forwardRef<HTMLButtonElement, TaskRelationshipSelectorProps>(
  ({ value = '', onChange, onBlur, tasks, projectNameById, isLoading }, ref) => {
    const [open, setOpen] = React.useState(false);
    const selectedTask = React.useMemo(() => tasks.find(task => task.id === value) ?? null, [tasks, value]);
    const [fallbackTask, setFallbackTask] = React.useState<TaskOption | null>(null);

    React.useEffect(() => {
      let isActive = true;

      if (value && !selectedTask) {
        firebaseService
          .getTask(value)
          .then(task => {
            if (!isActive) return;
            if (task && task.id) {
              setFallbackTask({
                id: task.id,
                title: task.title,
                projectId: task.projectId ?? null,
              });
            } else {
              setFallbackTask(null);
            }
          })
          .catch(() => {
            if (isActive) {
              setFallbackTask(null);
            }
          });
      } else {
        setFallbackTask(null);
      }

      return () => {
        isActive = false;
      };
    }, [value, selectedTask]);

    const displayTask = selectedTask ?? fallbackTask;

    const getProjectName = React.useCallback(
      (projectId: string | null | undefined) => {
        if (!projectId) return 'Sem projeto';
        return projectNameById[projectId] || 'Projeto desconhecido';
      },
      [projectNameById],
    );

    const handleSelect = (taskId: string) => {
      onChange(taskId);
      setOpen(false);
      onBlur?.();
    };

    const handleOpenChange = (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        onBlur?.();
      }
    };

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            className={cn('w-full justify-between', !displayTask && !value && !isLoading && 'text-muted-foreground')}
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando tarefas...
              </span>
            ) : displayTask ? (
              `${displayTask.title} (${getProjectName(displayTask.projectId ?? null)})`
            ) : value ? (
              `ID: ${value}`
            ) : (
              'Selecione uma tarefa'
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar tarefa..." />
            <CommandEmpty>{isLoading ? 'Carregando tarefas...' : 'Nenhuma tarefa encontrada.'}</CommandEmpty>
            <CommandList>
              {tasks.length > 0 && (
                <CommandGroup heading="Tarefas">
                  {tasks.map(task => {
                    const projectName = getProjectName(task.projectId ?? null);
                    const isSelected = displayTask?.id === task.id;
                    return (
                      <CommandItem
                        key={task.id}
                        value={`${task.title} ${projectName} ${task.id}`}
                        onSelect={() => handleSelect(task.id)}
                      >
                        <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                        <div className="flex flex-col text-left">
                          <span className="font-medium leading-none">{task.title}</span>
                          <span className="text-xs text-muted-foreground">{projectName}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

TaskRelationshipSelector.displayName = 'TaskRelationshipSelector';
