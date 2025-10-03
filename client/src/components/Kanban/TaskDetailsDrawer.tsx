import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Edit,
  ListChecks,
  Tag as TagIcon,
  Trash2,
  UserRound,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { firebaseService } from "@/services/firebaseService";
import type { Project, Task, TaskTag, User } from "@/types";
import { DEFAULT_TAG_COLOR, getTagTextColor } from "@/utils/tags";
import { cn } from "@/lib/utils";

interface TaskDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  projects: Project[];
  users: User[];
  onDelete?: (task: Task) => void;
  onOpenAdvancedEdit?: (task: Task) => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const STATUS_LABELS: Record<string, string> = {
  aberta: "A Fazer",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export function TaskDetailsDrawer({
  open,
  onOpenChange,
  task,
  projects,
  users,
  onDelete,
  onOpenAdvancedEdit,
}: TaskDetailsDrawerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("aberta");
  const [priority, setPriority] = useState<Task["priority"]>("media");
  const [projectId, setProjectId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<{ id: string; text: string; createdAt: Date }[]>([]);

  useEffect(() => {
    if (!task || !open) {
      return;
    }

    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus((task.status as Task["status"]) || "aberta");
    setPriority((task.priority as Task["priority"]) || "media");
    setProjectId(task.projectId || "");
    setStartDate(task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "");
    setDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");

    if (task.assignedUserIds && task.assignedUserIds.length > 0) {
      setAssignedUserIds(task.assignedUserIds);
    } else if ((task as any).assigneeId) {
      setAssignedUserIds([(task as any).assigneeId]);
    } else {
      setAssignedUserIds([]);
    }

    setLocalComments([]);
    setCommentText("");
  }, [task, open]);

  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) return;

      const updates = {
        title,
        description,
        status,
        priority,
        projectId: projectId || null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedUserIds,
        updatedAt: new Date(),
      } as Partial<Task> & { updatedAt: Date };

      await firebaseService.updateTask(task.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/enhanced"] });
      toast({
        title: "Tarefa atualizada",
        description: "As informações da tarefa foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error?.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!task) return;
    updateTaskMutation.mutate();
  };

  const handleMarkAsCompleted = () => {
    if (!task) return;
    const nextStatus = status === "concluida" ? "em_andamento" : "concluida";
    setStatus(nextStatus as Task["status"]);
    updateTaskMutation.mutate();
  };

  const handleToggleUser = (userId: string) => {
    setAssignedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) {
      toast({
        title: "Mensagem vazia",
        description: "Digite um comentário antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setLocalComments((prev) => [
      {
        id: `${Date.now()}`,
        text: trimmed,
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setCommentText("");
    toast({ title: "Comentário adicionado", description: "Comentário salvo localmente." });
  };

  const assignedUsers = useMemo(
    () => users.filter((user) => assignedUserIds.includes(user.id)),
    [users, assignedUserIds]
  );

  const activeProjectName = useMemo(() => {
    if (!projectId) return "Sem projeto";
    return projects.find((project) => project.id === projectId)?.name || "Projeto não encontrado";
  }, [projectId, projects]);

  const statusColor = useMemo(() => {
    switch (status) {
      case "concluida":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
      case "em_andamento":
        return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200";
      case "cancelada":
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200";
      default:
        return "border-muted bg-muted/60 text-foreground";
    }
  }, [status]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {task ? (
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl lg:max-w-3xl p-0 overflow-hidden"
        >
          <div className="flex h-full flex-col bg-background text-foreground">
            <div className="border-b border-border px-6 py-6">
              <SheetHeader className="space-y-3">
                <SheetTitle className="text-xl font-semibold">
                  {title || task.title || "Detalhes da tarefa"}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  Gerencie os principais detalhes da tarefa selecionada.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant={status === "concluida" ? "outline" : "default"}
                  className="rounded-full px-4"
                  onClick={handleMarkAsCompleted}
                  type="button"
                  disabled={updateTaskMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {status === "concluida" ? "Marcar como em andamento" : "Marcar como concluída"}
                </Button>

                <Badge className={cn("rounded-full px-3 py-1 text-xs", statusColor)}>
                  {STATUS_LABELS[status] || status}
                </Badge>

                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs border-amber-200/60 text-amber-700 dark:border-amber-700/60 dark:text-amber-300"
                >
                  Prioridade: {PRIORITY_LABELS[priority] || priority}
                </Badge>

                {dueDate && (
                  <span className="flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                    Vencimento em {format(new Date(dueDate), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-8 px-6 py-6">
                <section className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium uppercase text-muted-foreground">Título</Label>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Dê um título claro à tarefa"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium uppercase text-muted-foreground">Descrição</Label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Adicione detalhes importantes, links e anexos relevantes."
                      rows={4}
                      className="mt-1 resize-none"
                    />
                  </div>
                </section>

                <section className="space-y-3 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Responsáveis & Status</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-muted-foreground"
                      type="button"
                      onClick={() => task && onOpenAdvancedEdit?.(task)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modo avançado
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium uppercase text-muted-foreground">Responsáveis</Label>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              type="button"
                            >
                              <UserRound className="mr-2 h-4 w-4" />
                              Selecionar membros
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Selecione os responsáveis</DropdownMenuLabel>
                            {users.length === 0 && (
                              <p className="px-2 py-2 text-sm text-muted-foreground">Nenhum usuário disponível</p>
                            )}
                            {users.map((user) => (
                              <DropdownMenuCheckboxItem
                                key={user.id}
                                checked={assignedUserIds.includes(user.id)}
                                onCheckedChange={() => handleToggleUser(user.id)}
                              >
                                {user.firstName || user.lastName
                                  ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                                  : user.email}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="flex -space-x-2">
                          {assignedUsers.length > 0 ? (
                            assignedUsers.map((user) => {
                              const displayName =
                                user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email;
                              return (
                                <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                                  <AvatarImage
                                    src={
                                      user.profileImageUrl ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`
                                    }
                                    alt={displayName}
                                  />
                                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                                    {displayName
                                      .split(" ")
                                      .map((part) => part[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              );
                            })
                          ) : (
                            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                              Nenhum responsável
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <Label className="text-xs font-medium uppercase text-muted-foreground">Status</Label>
                        <Select
                          value={status}
                          onValueChange={(value: Task["status"]) => setStatus(value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aberta">A fazer</SelectItem>
                            <SelectItem value="em_andamento">Em andamento</SelectItem>
                            <SelectItem value="concluida">Concluída</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs font-medium uppercase text-muted-foreground">Prioridade</Label>
                        <Select
                          value={priority}
                          onValueChange={(value: Task["priority"]) => setPriority(value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="critica">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
                  <div>
                    <Label className="text-xs font-medium uppercase text-muted-foreground">Projeto</Label>
                    <Select
                      value={projectId === "" ? "none" : projectId}
                      onValueChange={(value) => setProjectId(value === "none" ? "" : value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem projeto</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-2 flex items-center text-xs text-muted-foreground">
                      <ListChecks className="mr-2 h-4 w-4 text-primary" />
                      {activeProjectName}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-medium uppercase text-muted-foreground">Início</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium uppercase text-muted-foreground">Vencimento</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </section>

                {(task.tags && task.tags.length > 0) && (
                  <section className="space-y-3 rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <TagIcon className="h-4 w-4 text-primary" />
                      Etiquetas
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag: TaskTag) => {
                        const backgroundColor = tag.color || DEFAULT_TAG_COLOR;
                        const textColor = getTagTextColor(backgroundColor);
                        return (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="border-transparent text-xs font-medium"
                            style={{ backgroundColor, color: textColor }}
                          >
                            {tag.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section className="space-y-3 rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold">Comentários rápidos</h3>
                  <p className="text-xs text-muted-foreground">
                    Registre alinhamentos ou decisões importantes. Os comentários são salvos localmente por enquanto.
                  </p>
                  <Textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Escreva um comentário ou atualize o andamento da tarefa..."
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <Button type="button" size="sm" onClick={handleAddComment}>
                      Adicionar comentário
                    </Button>
                    {onDelete && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => task && onDelete(task)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {localComments.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                        Nenhum comentário adicionado ainda.
                      </p>
                    ) : (
                      localComments.map((comment) => (
                        <div key={comment.id} className="rounded-xl border border-border bg-muted/60 p-3 text-sm text-foreground">
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Você</span>
                            <span>{format(comment.createdAt, "dd/MM/yyyy HH:mm")}</span>
                          </div>
                          <p>{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <div className="border-t border-border bg-muted/30 px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    As alterações são sincronizadas automaticamente com o projeto vinculado.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => onOpenChange(false)}
                      disabled={updateTaskMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateTaskMutation.isPending}
                    >
                      {updateTaskMutation.isPending ? "Salvando..." : "Salvar alterações"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

export default TaskDetailsDrawer;
