import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Filter } from "lucide-react";
import { TaskWithDetails, Project, User } from "@shared/schema";

interface KanbanFiltersProps {
  projects: Project[];
  users: User[];
  filters: {
    search: string;
    projectId: string;
    assignedUserId: string;
    priority: string;
    status: string;
    dateFrom: string;
    dateTo: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function KanbanFilters({
  projects,
  users,
  filters,
  onFiltersChange,
  onClearFilters,
  isCollapsed,
  onToggleCollapse
}: KanbanFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value && value.trim() !== '').length;
  };

  const priorityOptions = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'critica', label: 'Crítica' }
  ];

  const statusOptions = [
    { value: 'aberta', label: 'Aberta' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  return (
    <Card className="mb-6 border-2 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Kanban
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFilterCount() > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
            >
              {isCollapsed ? 'Expandir' : 'Recolher'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Busca por texto */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Título, descrição..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Filtro por projeto */}
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select
                value={filters.projectId || "todos"}
                onValueChange={(value) => handleFilterChange('projectId', value === 'todos' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os projetos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por responsável */}
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                value={filters.assignedUserId || "todos"}
                onValueChange={(value) => handleFilterChange('assignedUserId', value === 'todos' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os usuários</SelectItem>
                  {users
                    .filter(user => user.id) // Garante que o usuário tem ID
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email?.split('@')[0] || `Usuário ${user.id}`
                        }
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por prioridade */}
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={filters.priority || "todas"}
                onValueChange={(value) => handleFilterChange('priority', value === 'todas' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as prioridades</SelectItem>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || "todos"}
                onValueChange={(value) => handleFilterChange('status', value === 'todos' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por data de início */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data de início (a partir de)</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            {/* Filtro por data de vencimento */}
            <div className="space-y-2">
              <Label htmlFor="dateTo">Data de vencimento (até)</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Filtros ativos */}
          {getActiveFilterCount() > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 mr-2">Filtros ativos:</span>
                {filters.search && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Busca: "{filters.search}"
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('search', '')}
                    />
                  </Badge>
                )}
                {filters.projectId && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Projeto: {projects.find(p => p.id.toString() === filters.projectId)?.name || 'N/A'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('projectId', '')}
                    />
                  </Badge>
                )}
                {filters.assignedUserId && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Responsável: {users.find(u => u.id === filters.assignedUserId)?.firstName || 'N/A'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('assignedUserId', '')}
                    />
                  </Badge>
                )}
                {filters.priority && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Prioridade: {priorityOptions.find(p => p.value === filters.priority)?.label || 'N/A'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('priority', '')}
                    />
                  </Badge>
                )}
                {filters.status && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Status: {statusOptions.find(s => s.value === filters.status)?.label || 'N/A'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('status', '')}
                    />
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    De: {new Date(filters.dateFrom).toLocaleDateString('pt-BR')}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('dateFrom', '')}
                    />
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Até: {new Date(filters.dateTo).toLocaleDateString('pt-BR')}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('dateTo', '')}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}