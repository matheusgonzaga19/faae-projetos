import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { firebaseService } from "@/services/firebaseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { USER_ROLES, type FirebaseUser, type UserRole, DEFAULT_ALLOWED_SECTIONS } from "@/types/auth";

export default function UserManagement() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading, updateUserRole } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const sectionOptions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'kanban', label: 'Kanban' },
    { id: 'projects', label: 'Projetos' },
    { id: 'files', label: 'Arquivos' },
    { id: 'chat', label: 'IA Chat' },
  ];

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || currentUser?.role !== 'admin')) {
      toast({
        title: "Acesso negado",
        description: "Você precisa ser administrador para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, currentUser?.role, toast]);

  const { data: users = [], isLoading: usersLoading, refetch } = useQuery<FirebaseUser[]>({
    queryKey: ['users'],
    queryFn: () => firebaseService.getAllUsers(),
    enabled: isAuthenticated && currentUser?.role === 'admin',
    retry: false,
  });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      await refetch();
      toast({
        title: "Cargo atualizado",
        description: "O cargo do usuário foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cargo",
        description: error?.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleSectionChange = async (userId: string, sectionId: string, checked: boolean) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const current = user.allowedSections || [...DEFAULT_ALLOWED_SECTIONS];
      const updated = checked ? [...current, sectionId] : current.filter(s => s !== sectionId);
      await firebaseService.updateUser(userId, { allowedSections: updated });
      await refetch();
      toast({ title: 'Permissões atualizadas', description: 'Acesso do usuário atualizado com sucesso.' });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar permissões',
        description: error?.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return null;
  }

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleDisplay = (role: UserRole) => {
    return USER_ROLES[role] || role;
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    return role === 'admin' ? 'destructive' : 'secondary';
  };

  const getDisplayName = (user: FirebaseUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Usuário';
  };

  const getInitials = (user: FirebaseUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie cargos e permissões dos usuários do sistema
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{filteredUsers.length} usuários</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cargos</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="collaborator">Colaboradores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getDisplayName(user)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleDisplay(user.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt ? formatDistanceToNow(user.createdAt, { addSuffix: true, locale: ptBR }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(role: UserRole) => handleRoleChange(user.id, role)}
                        disabled={user.id === currentUser?.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="collaborator">Colaborador</SelectItem>
                        </SelectContent>
                      </Select>
                      {user.role !== 'admin' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">Permissões</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {sectionOptions.map(section => (
                              <DropdownMenuCheckboxItem
                                key={section.id}
                                  checked={user.allowedSections?.includes(section.id as any)}
                                  onCheckedChange={(checked) => handleSectionChange(user.id, section.id as any, !!checked)}
                              >
                                {section.label}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {searchQuery || roleFilter !== "all" 
                ? "Nenhum usuário encontrado com os filtros aplicados."
                : "Nenhum usuário encontrado."
              }
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Sobre os Cargos
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Administrador:</strong> Acesso total ao sistema, pode gerenciar usuários, projetos e configurações.</li>
                <li><strong>Colaborador:</strong> Pode visualizar e editar projetos atribuídos, criar tarefas e comentários.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}