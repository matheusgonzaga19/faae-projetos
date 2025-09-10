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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Trash2, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { firebaseService } from '@/services/firebaseService';
import type { Subtask } from '@shared/schema';

// Task creation schema
const subtaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  status: z.enum(['aberta', 'em_andamento', 'concluida', 'cancelada']).default('aberta'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Projeto é obrigatório'),
  priority: z.enum(['baixa', 'media', 'alta', 'critica', 'urgente'], {
    required_error: 'Prioridade é obrigatória',
  }),
  status: z.enum(['aberta', 'em_andamento', 'concluida', 'cancelada']).default('aberta'),
  startDate: z.date().optional(),
  dueDate: z.date({ required_error: 'Data de vencimento é obrigatória' }),
  assignedUserIds: z.array(z.string()).optional(),
  tags: z.string().optional(),
  subtasks: z.array(subtaskSchema).optional(),
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
  isOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactNode;
  defaultStatus?: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
  defaultProjectId?: string;
  projects?: Project[];
  task?: {
    id: string;
    title: string;
    description?: string | null;
    projectId: string | null;
    priority: 'baixa' | 'media' | 'alta' | 'critica' | 'urgente';
    status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
    startDate?: Date | string | null;
    dueDate?: Date | string | null;
    estimatedHours?: number | null;
    assignedUserId?: string | null;
    assignedUserIds?: string[] | null;
    tags?: string[] | null;
    subtasks?: Subtask[] | null;
    actualHours?: number | null;
  };
}

export default function TaskModal({
  isOpen,
  onClose,
  trigger,
  defaultStatus,
  defaultProjectId,
  projects = [],
  task
}: TaskModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen ?? internalOpen;
  const close = () => {
    if (onClose) onClose();
    setInternalOpen(false);
  };

  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isDueCalendarOpen, setIsDueCalendarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for assignee selection
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => firebaseService.getAllUsers(),
    enabled: open, // Only fetch when modal is open
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: defaultProjectId || '',
      priority: 'media',
      status: defaultStatus || 'aberta',
      startDate: undefined,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      assignedUserIds: [],
      tags: '',
      subtasks: [],
    },
  });

  const { fields: subtaskFields, append: addSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: 'subtasks',
  });

  // Prefill when editing
  React.useEffect(() => {
    if (!open) return;
    if (task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId || '',
        priority: (task.priority as any) || 'media',
        status: (task.status as any) || 'aberta',
        startDate: task.startDate ? new Date(task.startDate as any) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate as any) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedUserIds: task.assignedUserIds || ((task as any).assignedUserId ? [(task as any).assignedUserId] : []),
        tags: task.tags ? task.tags.join(', ') : '',
        subtasks: (task.subtasks as Subtask[] | undefined) || [],
      });
    } else {
      form.reset({
        title: '',
        description: '',
        projectId: defaultProjectId || '',
        priority: 'media',
        status: defaultStatus || 'aberta',
        startDate: undefined,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedUserIds: [],
        tags: '',
        subtasks: [],
      });
    }
  }, [open, task]);

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
      close();
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
    mutationFn: async (taskData: any) => {
      if (!task) throw new Error('Tarefa não encontrada');
      const updated = { ...taskData, updatedAt: new Date() };
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
      assignedUserIds: data.assignedUserIds?.filter(Boolean) || [],
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      subtasks: data.subtasks?.map(st => ({
        id: st.id || Math.random().toString(36).slice(2),
        title: st.title,
        status: st.status,
      })),
    };
    if (task?.id) {
      updateTaskMutation.mutate(formattedData);
    } else {
      createTaskMutation.mutate(formattedData);
    }
  };

  const handleOpenChange = (state: boolean) => {
    if (isOpen !== undefined) {
      if (!state) close();
    } else {
      setInternalOpen(state);
      if (!state) close();
    }
  };

  const handleClose = () => {
    form.reset();
    close();
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
    <>
      {trigger && (
        <div onClick={() => handleOpenChange(true)}>{trigger}</div>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
                        <SelectItem value="urgente">Urgente</SelectItem>
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
                    <div className="border rounded-md p-2 h-32 overflow-auto">
                      {users.map((user) => {
                        const checked = field.value?.includes(user.id) || false;
                        return (
                          <div key={user.id} className="flex items-center space-x-2 py-1">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, user.id]);
                                } else {
                                  field.onChange(current.filter((id: string) => id !== user.id));
                                }
                              }}
                            />
                            <span className="text-sm">{getUserDisplayName(user)}</span>
                          </div>
                        );
                      })}
                    </div>
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
                    <FormLabel>Etiquetas</FormLabel>
                    <FormControl>
                      <Input placeholder="tag1, tag2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <FormLabel>Subtarefas</FormLabel>
              {subtaskFields.map((subtask, index) => (
                <div key={subtask.id} className="flex items-center space-x-2">
                  <Input
                    placeholder="Título da subtarefa"
                    {...form.register(`subtasks.${index}.title` as const)}
                  />
                  <FormField
                    control={form.control}
                    name={`subtasks.${index}.status` as const}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSubtask(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSubtask({ title: '', status: 'aberta' })}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Subtarefa
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
    </>
  );
}
