import { db } from './db';
import { users, projects, tasks, notifications } from '@shared/schema';

async function seed() {
  try {
    console.log('🌱 Criando dados iniciais...');

    // Create sample users (will be created automatically by Replit Auth on first login)
    
    // Create sample projects
    const sampleProjects = await db.insert(projects).values([
      {
        name: 'Stand Feira Imobiliária São Paulo 2025',
        description: 'Projeto de stand personalizado para a maior feira imobiliária do país',
        status: 'active',
        priority: 'alta',
        startDate: '2025-01-15',
        endDate: '2025-03-30',
        budget: '150000.00',
        clientName: 'Construtora Horizonte',
        clientEmail: 'contato@horizonteconstrutora.com.br',
        clientPhone: '(11) 99999-9999',
        createdUserId: '1' // Will be replaced by actual user ID when they login
      },
      {
        name: 'Projeto de Arquitetura Residencial Villa Mar',
        description: 'Casa de alto padrão com 4 suítes e área de lazer completa',
        status: 'active',
        priority: 'media',
        startDate: '2024-12-01',
        endDate: '2025-06-15',
        budget: '85000.00',
        clientName: 'Maria Silva Santos',
        clientEmail: 'maria.santos@email.com',
        clientPhone: '(11) 88888-8888',
        createdUserId: '1'
      },
      {
        name: 'Reforma Comercial Escritório Central',
        description: 'Modernização de escritório corporativo com 500m²',
        status: 'on_hold',
        priority: 'baixa',
        startDate: '2024-11-01',
        endDate: '2025-02-28',
        budget: '45000.00',
        clientName: 'TechCorp Soluções',
        clientEmail: 'projetos@techcorp.com.br',
        clientPhone: '(11) 77777-7777',
        createdUserId: '1'
      }
    ]).returning();

    console.log(`✅ Criados ${sampleProjects.length} projetos de exemplo`);

    // Create sample tasks
    const sampleTasks = await db.insert(tasks).values([
      {
        title: 'Análise do briefing do cliente',
        description: 'Revisar requisitos e expectativas do cliente para o stand',
        status: 'concluida',
        priority: 'alta',
        projectId: sampleProjects[0].id,
        estimatedHours: '8.00',
        actualHours: '6.50',
        startDate: '2025-01-15',
        dueDate: '2025-01-20',
        completedAt: new Date('2025-01-18'),
        createdUserId: '1'
      },
      {
        title: 'Criação do conceito visual',
        description: 'Desenvolver identidade visual e conceito do stand',
        status: 'em_andamento',
        priority: 'alta',
        projectId: sampleProjects[0].id,
        estimatedHours: '16.00',
        actualHours: '8.00',
        startDate: '2025-01-21',
        dueDate: '2025-02-05',
        createdUserId: '1'
      },
      {
        title: 'Projeto estrutural preliminar',
        description: 'Desenvolvimento da estrutura básica do stand',
        status: 'aberta',
        priority: 'media',
        projectId: sampleProjects[0].id,
        estimatedHours: '24.00',
        startDate: '2025-02-06',
        dueDate: '2025-02-25',
        createdUserId: '1'
      },
      {
        title: 'Levantamento arquitetônico',
        description: 'Medição e análise do terreno para Villa Mar',
        status: 'concluida',
        priority: 'alta',
        projectId: sampleProjects[1].id,
        estimatedHours: '12.00',
        actualHours: '14.00',
        startDate: '2024-12-01',
        dueDate: '2024-12-10',
        completedAt: new Date('2024-12-08'),
        createdUserId: '1'
      },
      {
        title: 'Projeto hidráulico e elétrico',
        description: 'Definição das instalações técnicas da residência',
        status: 'em_andamento',
        priority: 'media',
        projectId: sampleProjects[1].id,
        estimatedHours: '20.00',
        actualHours: '12.00',
        startDate: '2024-12-15',
        dueDate: '2025-01-30',
        createdUserId: '1'
      },
      {
        title: 'Análise de viabilidade da reforma',
        description: 'Estudo técnico das possibilidades de modernização',
        status: 'cancelada',
        priority: 'baixa',
        projectId: sampleProjects[2].id,
        estimatedHours: '6.00',
        startDate: '2024-11-01',
        dueDate: '2024-11-15',
        createdUserId: '1'
      }
    ]).returning();

    console.log(`✅ Criadas ${sampleTasks.length} tarefas de exemplo`);

    console.log('🎉 Dados iniciais criados com sucesso!');
    console.log('\nProjetos criados:');
    sampleProjects.forEach(project => {
      console.log(`- ${project.name} (${project.status})`);
    });
    
    console.log('\nTarefas criadas:');
    sampleTasks.forEach(task => {
      console.log(`- ${task.title} (${task.status})`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar dados iniciais:', error);
  }
}

// Execute seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => {
    console.log('Seed executado com sucesso!');
    process.exit(0);
  }).catch(error => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  });
}

export { seed };