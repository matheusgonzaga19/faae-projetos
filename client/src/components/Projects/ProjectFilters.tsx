import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

interface ProjectFiltersProps {
  filters: {
    search: string;
    status: string;
    type: string;
    priority: string;
    companyName: string;
    clientName: string;
    dateFrom: string;
    dateTo: string;
  };
  onFiltersChange: (filters: ProjectFiltersProps['filters']) => void;
  onClearFilters: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function ProjectFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  isExpanded,
  onToggleExpand
}: ProjectFiltersProps) {
  const handleFilterChange = (key: keyof ProjectFiltersProps['filters'], value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((v) => v && v.trim() !== '').length;
  };

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'completed', label: 'Concluído' },
    { value: 'on_hold', label: 'Em Espera' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  const typeOptions = [
    { value: 'stand_imobiliario', label: 'Stand Imobiliário' },
    { value: 'projeto_arquitetonico', label: 'Projeto Arquitetônico' },
    { value: 'projeto_estrutural', label: 'Projeto Estrutural' },
    { value: 'reforma', label: 'Reforma' },
    { value: 'manutencao', label: 'Manutenção' }
  ];

  const priorityOptions = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];

  return (
    <Card className="mb-6 border-2 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Projetos
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
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
              {isExpanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Nome do projeto"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || 'todos'}
              onValueChange={(v) => handleFilterChange('status', v === 'todos' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={filters.type || 'todos'}
              onValueChange={(v) => handleFilterChange('type', v === 'todos' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {typeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select
              value={filters.priority || 'todas'}
              onValueChange={(v) => handleFilterChange('priority', v === 'todas' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as prioridades</SelectItem>
                {priorityOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                placeholder="Nome da empresa"
                value={filters.companyName}
                onChange={(e) => handleFilterChange('companyName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                placeholder="Nome do cliente"
                value={filters.clientName}
                onChange={(e) => handleFilterChange('clientName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data início</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Data fim</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        )}
        {getActiveFilterCount() > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 mr-2">Filtros ativos:</span>
              {filters.search && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Busca: "{filters.search}"
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('search', '')} />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Status: {statusOptions.find((o) => o.value === filters.status)?.label || filters.status}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('status', '')} />
                </Badge>
              )}
              {filters.type && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Tipo: {typeOptions.find((o) => o.value === filters.type)?.label || filters.type}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('type', '')} />
                </Badge>
              )}
              {filters.priority && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Prioridade: {priorityOptions.find((o) => o.value === filters.priority)?.label || filters.priority}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('priority', '')} />
                </Badge>
              )}
              {filters.companyName && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Empresa: {filters.companyName}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('companyName', '')} />
                </Badge>
              )}
              {filters.clientName && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Cliente: {filters.clientName}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('clientName', '')} />
                </Badge>
              )}
              {filters.dateFrom && (
                <Badge variant="outline" className="flex items-center gap-1">
                  De: {new Date(filters.dateFrom).toLocaleDateString('pt-BR')}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('dateFrom', '')} />
                </Badge>
              )}
              {filters.dateTo && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Até: {new Date(filters.dateTo).toLocaleDateString('pt-BR')}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('dateTo', '')} />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
