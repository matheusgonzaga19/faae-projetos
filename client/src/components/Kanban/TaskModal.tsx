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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { firebaseService } from '@/services/firebaseService';

// Task creation schema
const numberPreprocess = (val: any) =>
  val === '' || val === null || val === undefined ? undefined : Number(val);

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
  estimatedHours: z.preprocess(numberPreprocess, z.number().nonnegative().optional()),
  actualHours: z.preprocess(numberPreprocess, z.number().nonnegative().optional()),
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
  checklists: z
    .array(
      z.object({
        title: z.string().min(1, 'Título é obrigatório'),
        items: z
          .array(
            z.object({
              title: z.string().min(1),
              completed: z.boolean().optional(),
            })
          )
          .optional(),
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
    estimatedHours?: number | null;
    actualHours?: number | null;
    assignedUserIds?: string[] | null;
    tags?: string[] | null;
    subtasks?: any[] | null;
    checklists?: any[] | null;
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
      estimatedHours: undefined,
      actualHours: undefined,
      subtasks: [],
      checklists: [],
      relationships: [],
    },
  });

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: 'subtasks',
  });

  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } = useFieldArray({
    control: form.control,
    name: 'checklists',
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
        estimatedHours: task.estimatedHours ?? undefined,
        actualHours: task.actualHours ?? undefined,
        subtasks: task.subtasks || [],
        checklists: task.checklists || [],
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
        estimatedHours: undefined,
        actualHours: undefined,
        subtasks: [],
        checklists: [],
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
        tags: taskData.tags ? taskData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        estimatedHours: taskData.estimatedHours,
        actualHours: taskData.actualHours,
        subtasks: taskData.subtasks?.map(st => ({
          ...st,
          assignedUserIds: st.assignedUserId ? [st.assignedUserId] : [],
          dueDate: st.dueDate ? new Date(st.dueDate) : undefined,
        })),
        checklists: taskData.checklists,
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
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
      subtasks: data.subtasks?.map(st => ({
        ...st,
        assignedUserIds: st.assignedUserId ? [st.assignedUserId] : [],
        dueDate: st.dueDate ? new Date(st.dueDate) : undefined,
      })),
      checklists: data.checklists,
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

  const ChecklistItems = ({ index }: { index: number }) => {
    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: `checklists.${index}.items` as const,
    });
    return (
      <div className="space-y-2">
        {fields.map((item, itemIndex) => (
          <div key={item.id} className="flex items-center space-x-2">
            <FormField
              control={form.control}
              name={`checklists.${index}.items.${itemIndex}.completed` as const}
              render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name={`checklists.${index}.items.${itemIndex}.title` as const}
              render={({ field }) => (
                <Input className="flex-1" placeholder="Item" {...field} />
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(itemIndex)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ title: '', completed: false })}
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar item
        </Button>
      </div>
    );
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
                    <div className="border rounded p-2 max-h-40 overflow-y-auto space-y-2">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(user.id)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              if (checked) field.onChange([...value, user.id]);
                              else field.onChange(value.filter((id: string) => id !== user.id));
                            }}
                          />
                          <span>{getUserDisplayName(user)}</span>
                        </label>
                      ))}
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
                    <FormLabel>Etiquetas (separadas por vírgula)</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: frontend, urgente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estimated Hours */}
              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Estimadas</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actual Hours */}
              <FormField
                control={form.control}
                name="actualHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Reais</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
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
                              <SelectItem value="">Nenhum</SelectItem>
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
                onClick={() => appendSubtask({ title: '', status: 'aberta', priority: 'baixa', assignedUserId: '', dueDate: '' })}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Subtarefa
              </Button>
            </div>

            {/* Checklists */}
            <div className="space-y-2">
              <h4 className="font-medium">Checklists</h4>
              {checklistFields.map((checklist, index) => (
                <div key={checklist.id} className="border p-2 rounded space-y-2">
                  <FormField
                    control={form.control}
                    name={`checklists.${index}.title` as const}
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
                  <ChecklistItems index={index} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeChecklist(index)}>
                    <X className="h-4 w-4" /> Remover
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendChecklist({ title: '', items: [] })}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Checklist
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
                          <Input placeholder="ID da tarefa" {...field} />
                        </FormControl>
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
