import OpenAI from 'openai';
import { TaskWithDetails } from '@shared/schema';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not configured');
    return null;
  }
  return new OpenAI({ apiKey });
}

class OpenAIService {
  async findTasksWithAI(query: string, tasks: TaskWithDetails[]): Promise<TaskWithDetails[]> {
    const openai = getOpenAIClient();
    
    if (!openai) {
      // Fallback to basic search if OpenAI is not available
      return this.basicSearch(query, tasks);
    }

    try {
      // Create a context string from tasks
      const taskContext = tasks.map(task => 
        `ID: ${task.id}, Título: ${task.title}, Descrição: ${task.description || 'N/A'}, Status: ${task.status}, Prioridade: ${task.priority}, Projeto: ${task.project?.name || 'N/A'}`
      ).join('\n');

      const prompt = `
        Você é um assistente especializado em gerenciamento de projetos de arquitetura.
        Aqui está a lista de tarefas disponíveis:
        ${taskContext}
        
        Pergunta do usuário: "${query}"
        
        Retorne apenas os IDs das tarefas mais relevantes para a pergunta, separados por vírgula.
        Se nenhuma tarefa for relevante, retorne "NENHUMA".
        Considere sinônimos, contexto e relevância semântica.
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 100,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response || response === 'NENHUMA') {
        return [];
      }

      const taskIds = response.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      return tasks.filter(task => taskIds.includes(task.id));
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.basicSearch(query, tasks);
    }
  }

  private basicSearch(query: string, tasks: TaskWithDetails[]): TaskWithDetails[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    return tasks.filter(task => {
      const searchableText = [
        task.title,
        task.description || '',
        task.status,
        task.priority,
        task.project?.name || '',
      ].join(' ').toLowerCase();
      
      return searchTerms.some(term => searchableText.includes(term));
    });
  }

  async generateTaskSuggestions(projectName: string, taskCount: number = 5): Promise<string[]> {
    const openai = getOpenAIClient();
    
    if (!openai) {
      return [
        'Definir requisitos do projeto',
        'Criar cronograma inicial',
        'Revisar documentação',
        'Validar entregáveis',
        'Preparar relatório final'
      ];
    }

    try {
      const prompt = `
        Você é um especialista em gerenciamento de projetos de arquitetura.
        Gere ${taskCount} sugestões de tarefas para um projeto chamado "${projectName}".
        
        Retorne apenas uma lista de títulos de tarefas, uma por linha, sem numeração.
        Foque em tarefas típicas de projetos de arquitetura brasileiros.
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        return [];
      }

      return response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      return [];
    }
  }

  async analyzeProjectHealth(tasks: TaskWithDetails[]): Promise<{
    score: number;
    insights: string[];
    recommendations: string[];
  }> {
    const openai = getOpenAIClient();
    
    if (!openai) {
      return this.basicProjectAnalysis(tasks);
    }

    try {
      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'concluida').length,
        inProgress: tasks.filter(t => t.status === 'em_andamento').length,
        open: tasks.filter(t => t.status === 'aberta').length,
        cancelled: tasks.filter(t => t.status === 'cancelada').length,
        highPriority: tasks.filter(t => t.priority === 'alta' || t.priority === 'critica').length,
        overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
      };

      const prompt = `
        Analise a saúde deste projeto arquitetônico com base nestas estatísticas:
        
        Total de tarefas: ${stats.total}
        Concluídas: ${stats.completed}
        Em andamento: ${stats.inProgress}
        Abertas: ${stats.open}
        Canceladas: ${stats.cancelled}
        Alta prioridade: ${stats.highPriority}
        Atrasadas: ${stats.overdue}
        
        Retorne um JSON com:
        {
          "score": número de 0 a 100 representando a saúde do projeto,
          "insights": array de até 3 insights sobre o estado atual,
          "recommendations": array de até 3 recomendações de ação
        }
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        return this.basicProjectAnalysis(tasks);
      }

      const analysis = JSON.parse(response);
      return {
        score: analysis.score || 50,
        insights: analysis.insights || [],
        recommendations: analysis.recommendations || [],
      };
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.basicProjectAnalysis(tasks);
    }
  }

  private basicProjectAnalysis(tasks: TaskWithDetails[]): {
    score: number;
    insights: string[];
    recommendations: string[];
  } {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'concluida').length;
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
    const highPriority = tasks.filter(t => t.priority === 'alta' || t.priority === 'critica').length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const overdueRate = total > 0 ? (overdue / total) * 100 : 0;
    
    let score = completionRate;
    if (overdueRate > 20) score -= 30;
    if (highPriority > total * 0.3) score -= 20;
    
    score = Math.max(0, Math.min(100, score));
    
    const insights = [];
    const recommendations = [];
    
    if (completionRate > 80) {
      insights.push('Projeto com alta taxa de conclusão');
    } else if (completionRate < 30) {
      insights.push('Projeto com baixa taxa de conclusão');
      recommendations.push('Revisar cronograma e prioridades');
    }
    
    if (overdueRate > 20) {
      insights.push('Muitas tarefas atrasadas');
      recommendations.push('Renegociar prazos ou realocar recursos');
    }
    
    if (highPriority > total * 0.3) {
      insights.push('Muitas tarefas de alta prioridade');
      recommendations.push('Priorizar tarefas críticas');
    }
    
    return { score, insights, recommendations };
  }
}

export const openaiService = new OpenAIService();