import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ProjectWithTasks, TaskWithDetails, User } from '@shared/schema';

export interface PDFReportData {
  projects: ProjectWithTasks[];
  tasks: TaskWithDetails[];
  users: User[];
  appliedFilters: {
    projectId?: string;
    assignedUserId?: string;
    status?: string;
    priority?: string;
    dateRange?: { from: Date; to: Date };
  };
  exportDate: Date;
}

export class PDFReportGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private margin: number;
  private lineHeight: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = 20;
    this.margin = 20;
    this.lineHeight = 7;
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = 20;
  }

  private checkPageBreak(neededSpace: number = 20): void {
    if (this.currentY + neededSpace > this.pageHeight - this.margin) {
      this.addNewPage();
    }
  }

  private addTitle(title: string, fontSize: number = 16): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += this.lineHeight + 3;
  }

  private addSubtitle(subtitle: string, fontSize: number = 12): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(subtitle, this.margin, this.currentY);
    this.currentY += this.lineHeight;
  }

  private addText(text: string, fontSize: number = 10, indent: number = 0): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    
    const maxWidth = this.pageWidth - (this.margin * 2) - indent;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak();
      this.doc.text(line, this.margin + indent, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private addSeparator(): void {
    this.currentY += 3;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'aberta': 'Aberta',
      'em_andamento': 'Em Andamento',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  private getPriorityText(priority: string): string {
    const priorityMap: Record<string, string> = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
      'critica': 'Crítica'
    };
    return priorityMap[priority] || priority;
  }

  private formatDate(date?: Date | string | null): string {
    if (!date) return 'Não definido';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  }

  private formatDateTime(date?: Date | string | null): string {
    if (!date) return 'Não definido';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  }

  private addCoverPage(data: PDFReportData): void {
    // Logo/Header
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('FAAE PROJETOS', this.pageWidth / 2, 40, { align: 'center' });
    
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Relatório Detalhado de Projetos e Tarefas', this.pageWidth / 2, 55, { align: 'center' });
    
    // Export date
    this.doc.setFontSize(12);
    this.doc.text(`Data de Exportação: ${this.formatDateTime(data.exportDate)}`, this.pageWidth / 2, 70, { align: 'center' });
    
    // Filters applied
    this.currentY = 90;
    this.addTitle('Filtros Aplicados:', 14);
    
    if (Object.keys(data.appliedFilters).length === 0) {
      this.addText('• Nenhum filtro aplicado - Relatório completo de todos os projetos');
    } else {
      if (data.appliedFilters.projectId) {
        const project = data.projects.find(p => p.id === data.appliedFilters.projectId);
        this.addText(`• Projeto: ${project?.name || 'Não encontrado'}`);
      }
      if (data.appliedFilters.assignedUserId) {
        const user = data.users.find(u => u.id === data.appliedFilters.assignedUserId);
        this.addText(`• Responsável: ${user?.firstName || 'Não encontrado'} ${user?.lastName || ''}`);
      }
      if (data.appliedFilters.status) {
        this.addText(`• Status: ${this.getStatusText(data.appliedFilters.status)}`);
      }
      if (data.appliedFilters.priority) {
        this.addText(`• Prioridade: ${this.getPriorityText(data.appliedFilters.priority)}`);
      }
      if (data.appliedFilters.dateRange) {
        this.addText(`• Período: ${this.formatDate(data.appliedFilters.dateRange.from)} até ${this.formatDate(data.appliedFilters.dateRange.to)}`);
      }
    }
    
    // Summary
    this.currentY += 20;
    this.addTitle('Resumo do Relatório:', 14);
    this.addText(`• Total de Projetos: ${data.projects.length}`);
    this.addText(`• Total de Tarefas: ${data.tasks.length}`);
    this.addText(`• Tarefas Concluídas: ${data.tasks.filter(t => t.status === 'concluida').length}`);
    this.addText(`• Tarefas em Andamento: ${data.tasks.filter(t => t.status === 'em_andamento').length}`);
    this.addText(`• Tarefas Abertas: ${data.tasks.filter(t => t.status === 'aberta').length}`);
    this.addText(`• Tarefas Canceladas: ${data.tasks.filter(t => t.status === 'cancelada').length}`);
    
    this.addNewPage();
  }

  private addProjectDetails(project: ProjectWithTasks, projectTasks: TaskWithDetails[]): void {
    this.checkPageBreak(50);
    
    // Project header
    this.addTitle(`PROJETO: ${project.name}`, 16);
    this.addSeparator();
    
    // Project info
    this.addSubtitle('Informações do Projeto:');
    this.addText(`Descrição: ${project.description || 'Não informado'}`, 10, 10);
    this.addText(`Data de Criação: ${this.formatDateTime(project.createdAt)}`, 10, 10);
    this.addText(`Última Atualização: ${this.formatDateTime(project.updatedAt)}`, 10, 10);
    this.addText(`Status: ${project.status || 'Ativo'}`, 10, 10);
    
    if (project.startDate) {
      this.addText(`Data de Início: ${this.formatDate(project.startDate)}`, 10, 10);
    }
    if (project.endDate) {
      this.addText(`Data de Término: ${this.formatDate(project.endDate)}`, 10, 10);
    }
    if (project.estimatedHours) {
      this.addText(`Horas Estimadas: ${Number(project.estimatedHours).toFixed(2)}h`, 10, 10);
    }
    
    this.currentY += 10;
    
    // Project statistics
    this.addSubtitle('Estatísticas do Projeto:');
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'concluida').length;
    const inProgressTasks = projectTasks.filter(t => t.status === 'em_andamento').length;
    const openTasks = projectTasks.filter(t => t.status === 'aberta').length;
    const canceledTasks = projectTasks.filter(t => t.status === 'cancelada').length;
    
    this.addText(`Total de Tarefas: ${totalTasks}`, 10, 10);
    this.addText(`Tarefas Concluídas: ${completedTasks} (${totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0}%)`, 10, 10);
    this.addText(`Tarefas em Andamento: ${inProgressTasks}`, 10, 10);
    this.addText(`Tarefas Abertas: ${openTasks}`, 10, 10);
    this.addText(`Tarefas Canceladas: ${canceledTasks}`, 10, 10);
    
    this.currentY += 10;
    
    // Project tasks
    if (projectTasks.length > 0) {
      this.addSubtitle('Tarefas do Projeto:');
      
      projectTasks.forEach((task, index) => {
        this.checkPageBreak(40);
        
        this.addText(`${index + 1}. ${task.title}`, 11, 10);
        this.addText(`   Status: ${this.getStatusText(task.status)}`, 9, 15);
        this.addText(`   Prioridade: ${this.getPriorityText(task.priority)}`, 9, 15);
        
        if (task.assignedUser) {
          this.addText(`   Responsável: ${task.assignedUser.firstName} ${task.assignedUser.lastName || ''}`, 9, 15);
        }
        
        if (task.description) {
          this.addText(`   Descrição: ${task.description}`, 9, 15);
        }
        
        if (task.startDate) {
          this.addText(`   Data de Início: ${this.formatDate(task.startDate)}`, 9, 15);
        }
        
        if (task.dueDate) {
          this.addText(`   Data de Vencimento: ${this.formatDate(task.dueDate)}`, 9, 15);
        }
        
        if (task.estimatedHours) {
          this.addText(`   Horas Estimadas: ${Number(task.estimatedHours).toFixed(2)}h`, 9, 15);
        }
        
        this.addText(`   Criado em: ${this.formatDateTime(task.createdAt)}`, 9, 15);
        
        if (task.completedAt) {
          this.addText(`   Concluído em: ${this.formatDateTime(task.completedAt)}`, 9, 15);
        }
        
        this.currentY += 5;
      });
    } else {
      this.addText('Nenhuma tarefa encontrada para este projeto.', 10, 10);
    }
    
    this.addNewPage();
  }

  private addUserSummary(data: PDFReportData): void {
    this.checkPageBreak(30);
    
    this.addTitle('RESUMO POR RESPONSÁVEL', 16);
    this.addSeparator();
    
    const userStats = data.users.map(user => {
      const userTasks = data.tasks.filter(task => task.assignedUserId === user.id);
      const completedTasks = userTasks.filter(task => task.status === 'concluida').length;
      const inProgressTasks = userTasks.filter(task => task.status === 'em_andamento').length;
      const openTasks = userTasks.filter(task => task.status === 'aberta').length;
      
      return {
        user,
        totalTasks: userTasks.length,
        completedTasks,
        inProgressTasks,
        openTasks,
        efficiency: userTasks.length > 0 ? (completedTasks / userTasks.length) * 100 : 0
      };
    }).filter(stat => stat.totalTasks > 0);
    
    if (userStats.length === 0) {
      this.addText('Nenhum usuário com tarefas atribuídas encontrado.');
      return;
    }
    
    userStats.forEach(stat => {
      this.checkPageBreak(25);
      
      this.addSubtitle(`${stat.user.firstName} ${stat.user.lastName || ''}`);
      this.addText(`Email: ${stat.user.email || 'Não informado'}`, 10, 10);
      this.addText(`Total de Tarefas: ${stat.totalTasks}`, 10, 10);
      this.addText(`Tarefas Concluídas: ${stat.completedTasks}`, 10, 10);
      this.addText(`Tarefas em Andamento: ${stat.inProgressTasks}`, 10, 10);
      this.addText(`Tarefas Abertas: ${stat.openTasks}`, 10, 10);
      this.addText(`Taxa de Conclusão: ${stat.efficiency.toFixed(1)}%`, 10, 10);
      
      this.currentY += 8;
    });
    
    this.addNewPage();
  }

  private addTasksSummary(data: PDFReportData): void {
    this.checkPageBreak(30);
    
    this.addTitle('RESUMO DE TAREFAS', 16);
    this.addSeparator();
    
    // Tasks by status
    this.addSubtitle('Tarefas por Status:');
    const statusCounts = {
      aberta: data.tasks.filter(t => t.status === 'aberta').length,
      em_andamento: data.tasks.filter(t => t.status === 'em_andamento').length,
      concluida: data.tasks.filter(t => t.status === 'concluida').length,
      cancelada: data.tasks.filter(t => t.status === 'cancelada').length
    };
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      this.addText(`${this.getStatusText(status)}: ${count}`, 10, 10);
    });
    
    this.currentY += 10;
    
    // Tasks by priority
    this.addSubtitle('Tarefas por Prioridade:');
    const priorityCounts = {
      baixa: data.tasks.filter(t => t.priority === 'baixa').length,
      media: data.tasks.filter(t => t.priority === 'media').length,
      alta: data.tasks.filter(t => t.priority === 'alta').length,
      critica: data.tasks.filter(t => t.priority === 'critica').length
    };
    
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      this.addText(`${this.getPriorityText(priority)}: ${count}`, 10, 10);
    });
    
    this.currentY += 10;
    
    // Overdue tasks
    const now = new Date();
    const overdueTasks = data.tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'concluida' && 
      task.status !== 'cancelada'
    );
    
    if (overdueTasks.length > 0) {
      this.addSubtitle('Tarefas em Atraso:');
      this.addText(`Total de tarefas em atraso: ${overdueTasks.length}`, 10, 10);
      
      overdueTasks.forEach((task, index) => {
        this.checkPageBreak(15);
        this.addText(`${index + 1}. ${task.title} - Vencimento: ${this.formatDate(task.dueDate)}`, 9, 15);
        if (task.project) {
          this.addText(`   Projeto: ${task.project.name}`, 9, 20);
        }
        if (task.assignedUser) {
          this.addText(`   Responsável: ${task.assignedUser.firstName} ${task.assignedUser.lastName || ''}`, 9, 20);
        }
      });
    }
  }

  public generateReport(data: PDFReportData): void {
    // Cover page
    this.addCoverPage(data);
    
    // Project details (one page per project)
    if (data.projects.length > 0) {
      data.projects.forEach(project => {
        const projectTasks = data.tasks.filter(task => task.projectId === project.id);
        this.addProjectDetails(project, projectTasks);
      });
    }
    
    // User summary
    this.addUserSummary(data);
    
    // Tasks summary
    this.addTasksSummary(data);
    
    // Generate filename
    const dateStr = format(data.exportDate, 'yyyy-MM-dd-HHmm');
    const filename = data.appliedFilters.projectId 
      ? `relatorio-projeto-${data.appliedFilters.projectId}-${dateStr}.pdf`
      : `relatorio-completo-${dateStr}.pdf`;
    
    this.doc.save(filename);
  }
}