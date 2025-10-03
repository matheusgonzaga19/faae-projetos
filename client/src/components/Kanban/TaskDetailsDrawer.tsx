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
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
      case "em_andamento":
        return "bg-blue-500/20 text-blue-300 border border-blue-500/40";
      case "cancelada":
        return "bg-red-500/20 text-red-300 border border-red-500/40";
      default:
        return "bg-slate-700/60 text-slate-200 border border-slate-600";
    }
  }, [status]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {task ? (
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl lg:max-w-3xl p-0 overflow-hidden"
        >
          <div className="flex h-full flex-col bg-slate-950 text-slate-100">
            <div className="border-b border-slate-800 px-6 py-6">
              <SheetHeader className="space-y-3">
                <SheetTitle className="text-xl font-semibold text-white">
                  {title || task.title || "Detalhes da tarefa"}
                </SheetTitle>
                <SheetDescription className="text-slate-400">
                  Gerencie os principais detalhes da tarefa selecionada.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  className={cn(
                    "rounded-full px-4",
                    status === "concluida"
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  )}
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

                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-amber-300 border-amber-500/40">
                  Prioridade: {PRIORITY_LABELS[priority] || priority}
                </Badge>

                {dueDate && (
                  <span className="flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    Vencimento em {format(new Date(dueDate), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-8 px-6 py-6">
                <section className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase text-slate-400">Título</Label>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Dê um título claro à tarefa"
                      className="mt-1 border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <Label className="text-xs uppercase text-slate-400">Descrição</Label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Adicione detalhes importantes, links e anexos relevantes."
                      rows={4}
                      className="mt-1 resize-none border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </section>

                <section className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Responsáveis & Status</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 hover:bg-slate-800"
                      type="button"
                      onClick={() => task && onOpenAdvancedEdit?.(task)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modo avançado
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-slate-400">Responsáveis</Label>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
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
                                <Avatar key={user.id} className="h-8 w-8 border-2 border-slate-900">
                                  <AvatarImage
                                    src={
                                      user.profileImageUrl ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`
                                    }
                                    alt={displayName}
                                  />
                                  <AvatarFallback className="bg-indigo-600 text-xs text-white">
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
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                              Nenhum responsável
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <Label className="text-xs uppercase text-slate-400">Status</Label>
                        <Select
                          value={status}
                          onValueChange={(value: Task["status"]) => setStatus(value)}
                        >
                          <SelectTrigger className="mt-1 border-slate-800 bg-slate-900/60 text-slate-100">
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
                        <Label className="text-xs uppercase text-slate-400">Prioridade</Label>
                        <Select
                          value={priority}
                          onValueChange={(value: Task["priority"]) => setPriority(value)}
                        >
                          <SelectTrigger className="mt-1 border-slate-800 bg-slate-900/60 text-slate-100">
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

                <section className="grid gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 md:grid-cols-2">
                  <div>
                    <Label className="text-xs uppercase text-slate-400">Projeto</Label>
                    <Select
                      value={projectId === "" ? "none" : projectId}
                      onValueChange={(value) => setProjectId(value === "none" ? "" : value)}
                    >
                      <SelectTrigger className="mt-1 border-slate-800 bg-slate-900/60 text-slate-100">
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
                    <p className="mt-2 flex items-center text-xs text-slate-400">
                      <ListChecks className="mr-2 h-4 w-4 text-indigo-400" />
                      {activeProjectName}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs uppercase text-slate-400">Início</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="mt-1 border-slate-800 bg-slate-900/60 text-slate-100"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-slate-400">Vencimento</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        className="mt-1 border-slate-800 bg-slate-900/60 text-slate-100"
                      />
                    </div>
                  </div>
                </section>

                {(task.tags && task.tags.length > 0) && (
                  <section className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <TagIcon className="h-4 w-4 text-indigo-400" />
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

                <section className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5">
                  <h3 className="text-sm font-semibold text-white">Comentários rápidos</h3>
                  <p className="text-xs text-slate-400">
                    Registre alinhamentos ou decisões importantes. Os comentários são salvos localmente por enquanto.
                  </p>
                  <Textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Escreva um comentário ou atualize o andamento da tarefa..."
                    rows={3}
                    className="border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                  />
                  <div className="flex items-center justify-between">
                    <Button type="button" size="sm" onClick={handleAddComment} className="bg-indigo-600 text-white hover:bg-indigo-500">
                      Adicionar comentário
                    </Button>
                    {onDelete && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => task && onDelete(task)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {localComments.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-800/70 px-4 py-6 text-center text-xs text-slate-500">
                        Nenhum comentário adicionado ainda.
                      </p>
                    ) : (
                      localComments.map((comment) => (
                        <div key={comment.id} className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-3 text-sm text-slate-200">
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
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

              <div className="border-t border-slate-800 bg-slate-950/90 px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    As alterações são sincronizadas automaticamente com o projeto vinculado.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-slate-300 hover:bg-slate-800"
                      onClick={() => onOpenChange(false)}
                      disabled={updateTaskMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateTaskMutation.isPending}
                      className="bg-indigo-600 text-white hover:bg-indigo-500"
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
