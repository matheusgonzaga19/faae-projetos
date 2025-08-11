import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  runTransaction,
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_ALLOWED_SECTIONS } from '@/types/auth';

// Helper functions
const toFirestoreData = (data: any) => {
  const result: any = { ...data };
  if (data.createdAt instanceof Date) result.createdAt = Timestamp.fromDate(data.createdAt);
  if (data.updatedAt instanceof Date) result.updatedAt = Timestamp.fromDate(data.updatedAt);
  if (data.dueDate instanceof Date) result.dueDate = Timestamp.fromDate(data.dueDate);
  if (data.startDate instanceof Date) result.startDate = Timestamp.fromDate(data.startDate);
  return result;
};

const fromFirestoreData = (doc: any) => {
  const data = doc.data();
  if (!data) return null;
  
  const result: any = { ...data, id: doc.id };
  if (data.createdAt) result.createdAt = data.createdAt.toDate();
  if (data.updatedAt) result.updatedAt = data.updatedAt.toDate();
  if (data.dueDate) result.dueDate = data.dueDate.toDate();
  if (data.startDate) result.startDate = data.startDate.toDate();
  return result;
};

// Demo data
const demoUsers = [
  {
    id: 'demo-user-123',
    email: 'admin@faaeprojetos.com.br',
    firstName: 'Admin',
    lastName: 'FAAE',
    profileImageUrl: '',
    role: 'admin',
    allowedSections: [...DEFAULT_ALLOWED_SECTIONS, 'users'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-user-456',
    email: 'colaborador@faaeprojetos.com.br',
    firstName: 'João',
    lastName: 'Silva',
    profileImageUrl: '',
    role: 'collaborator',
    allowedSections: [...DEFAULT_ALLOWED_SECTIONS],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const isDemoMode = () => {
  return (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID === 'demo-faae-projetos';
};

// Data migration functions
export const migrationService = {
  async checkAndMigrate() {
    if (isDemoMode()) {
      console.log('Demo mode: Skipping migration checks');
      return Promise.resolve();
    }

    try {
      // Check if new structure exists
      const projectsSnapshot = await getDocs(query(collection(db, 'projects'), limit(1)));
      const tasksSnapshot = await getDocs(query(collection(db, 'tasks'), limit(1)));
      
      if (projectsSnapshot.empty && tasksSnapshot.empty) {
        console.log('Fresh database - no migration needed');
        return;
      }

      // Check for legacy data structures that need migration
      await this.migrateLegacyData();
    } catch (error) {
      console.error('Migration check failed:', error);
    }
  },

  async migrateLegacyData() {
    console.log('Checking for legacy data to migrate...');
    
    const batch = writeBatch(db);
    let operationCount = 0;

    try {
      // Check for projects with inconsistent structure
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      for (const projectDoc of projectsSnapshot.docs) {
        const data = projectDoc.data();
        
        // Ensure required fields exist
        const updates: any = {};
        if (!data.status) updates.status = 'active';
        if (!data.type) updates.type = 'projeto_arquitetura';
        if (!data.stage) updates.stage = 'briefing';
        if (!data.priority) updates.priority = 'media';
        if (!data.createdAt) updates.createdAt = Timestamp.now();
        if (!data.updatedAt) updates.updatedAt = Timestamp.now();
        
        if (Object.keys(updates).length > 0) {
          batch.update(projectDoc.ref, updates);
          operationCount++;
        }
      }

      // Check for tasks with inconsistent structure
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      for (const taskDoc of tasksSnapshot.docs) {
        const data = taskDoc.data();
        
        // Ensure required fields exist and projectId is valid
        const updates: any = {};
        if (!data.status) updates.status = 'aberta';
        if (!data.priority) updates.priority = 'media';
        if (!data.createdAt) updates.createdAt = Timestamp.now();
        if (!data.updatedAt) updates.updatedAt = Timestamp.now();
        
        // Ensure projectId exists and is valid
        if (!data.projectId) {
          console.warn(`Task ${taskDoc.id} missing projectId - will be orphaned`);
          updates.projectId = null; // Mark as orphaned
        }
        
        if (Object.keys(updates).length > 0) {
          batch.update(taskDoc.ref, updates);
          operationCount++;
        }
      }

      if (operationCount > 0) {
        await batch.commit();
        console.log(`Migration completed: ${operationCount} documents updated`);
      } else {
        console.log('No migration needed - data structure is consistent');
      }
    } catch (error) {
      console.error('Data migration failed:', error);
      throw error;
    }
  },

  async cleanupOrphanedTasks() {
    if (isDemoMode()) return;

    try {
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const validProjectIds = new Set(projectsSnapshot.docs.map(doc => doc.id));
      
      const batch = writeBatch(db);
      let cleanupCount = 0;

      for (const taskDoc of tasksSnapshot.docs) {
        const taskData = taskDoc.data();
        const projectId = taskData.projectId;
        
        if (projectId && !validProjectIds.has(projectId.toString())) {
          console.log(`Removing orphaned task: ${taskDoc.id} (project ${projectId} not found)`);
          batch.delete(taskDoc.ref);
          cleanupCount++;
        }
      }

      if (cleanupCount > 0) {
        await batch.commit();
        console.log(`Cleanup completed: ${cleanupCount} orphaned tasks removed`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
};

// Project management functions
export const projectService = {
  async addProject(projectData: any) {
    if (isDemoMode()) {
      console.log('Demo mode: Project creation simulated', projectData);
      return Promise.resolve({
        ...projectData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const now = new Date();
    const data = {
      ...projectData,
      status: projectData.status || 'active',
      type: projectData.type || 'projeto_arquitetura',
      stage: projectData.stage || 'briefing',
      priority: projectData.priority || 'media',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'projects'), toFirestoreData(data));
    return { ...data, id: docRef.id };
  },

  async getProjects() {
    if (isDemoMode()) {
      return Promise.resolve([
        {
          id: '1',
          name: 'Stand Imobiliário - Residencial Aurora',
          description: 'Desenvolvimento de stand de vendas para empreendimento residencial',
          status: 'active',
          type: 'stand_imobiliario',
          stage: 'projeto',
          priority: 'alta',
          clientName: 'Construtora Aurora Ltda',
          clientEmail: 'contato@aurora.com.br',
          managerUserId: 'demo-user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Projeto Arquitetônico - Casa dos Sonhos',
          description: 'Projeto residencial unifamiliar de alto padrão',
          status: 'active',
          type: 'projeto_arquitetura',
          stage: 'conceito',
          priority: 'media',
          clientName: 'Família Silva',
          clientEmail: 'silva@email.com',
          managerUserId: 'demo-user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Reforma Residencial - Apartamento Moderno',
          description: 'Reforma completa de apartamento de 120m²',
          status: 'on_hold',
          type: 'reforma',
          stage: 'orcamento',
          priority: 'media',
          clientName: 'João Pereira',
          clientEmail: 'joao@email.com',
          managerUserId: 'demo-user-456',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]);
    }

    const querySnapshot = await getDocs(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(fromFirestoreData);
  },

  async getProject(id: string) {
    if (isDemoMode()) {
      const projects = await this.getProjects();
      return projects.find(p => p.id === id) || null;
    }

    const docRef = doc(db, 'projects', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? fromFirestoreData(docSnap) : null;
  },

  async updateProject(id: string, data: any) {
    if (isDemoMode()) {
      console.log('Demo mode: Project update simulated', { id, data });
      return Promise.resolve({ id, ...data, updatedAt: new Date() });
    }

    const docRef = doc(db, 'projects', id);
    const updateData = { ...data, updatedAt: new Date() };
    await updateDoc(docRef, toFirestoreData(updateData));
    return { id, ...updateData };
  },

  async deleteProject(id: string) {
    if (isDemoMode()) {
      console.log('Demo mode: Project deletion simulated', { id });
      return Promise.resolve({ id });
    }

    return await runTransaction(db, async (transaction) => {
      const projectRef = doc(db, 'projects', id);
      
      // Delete project
      transaction.delete(projectRef);
      
      // Get and delete all related tasks
      const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', id));
      const tasksSnapshot = await getDocs(tasksQuery);
      
      tasksSnapshot.docs.forEach((taskDoc) => {
        transaction.delete(taskDoc.ref);
      });
      
      // Get and delete all related files
      const filesQuery = query(collection(db, 'files'), where('projectId', '==', id));
      const filesSnapshot = await getDocs(filesQuery);
      
      filesSnapshot.docs.forEach((fileDoc) => {
        transaction.delete(fileDoc.ref);
      });

      return { id };
    });
  }
};

// Task management functions
export const taskService = {
  // Synchronous task filtering for demo mode
  getTasksSync(filters = {}) {
    const demoTasks = [
      {
        id: 'demo-task-1',
        title: 'Análise de Projeto Stand Imobiliário',
        description: 'Realizar análise inicial do projeto para stand imobiliário',
        status: 'aberta',
        priority: 'alta',
        projectId: '1',
        assignedUserId: 'demo-user-123',
        createdUserId: 'demo-user-123',
        estimatedHours: 8,
        actualHours: 0,
        dueDate: '2025-08-15',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'demo-task-2',
        title: 'Desenvolvimento de Conceito Arquitetônico',
        description: 'Criar conceito inicial para projeto residencial',
        status: 'em_andamento',
        priority: 'media',
        projectId: '2',
        assignedUserId: 'demo-user-456',
        createdUserId: 'demo-user-123',
        estimatedHours: 12,
        actualHours: 4,
        dueDate: '2025-08-20',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'demo-task-3',
        title: 'Revisão de Documentação Técnica',
        description: 'Revisar e atualizar documentação do projeto',
        status: 'concluida',
        priority: 'baixa',
        projectId: '1',
        assignedUserId: 'demo-user-456',
        createdUserId: 'demo-user-123',
        estimatedHours: 4,
        actualHours: 3.5,
        dueDate: '2025-08-10',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'demo-task-4',
        title: 'Preparação de Apresentação Final',
        description: 'Preparar apresentação para o cliente final',
        status: 'cancelada',
        priority: 'critica',
        projectId: '2',
        assignedUserId: 'demo-user-123',
        createdUserId: 'demo-user-456',
        estimatedHours: 6,
        actualHours: 1,
        dueDate: '2025-08-12',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    let filteredTasks = [...demoTasks];
    
    if (filters.projectId) {
      filteredTasks = filteredTasks.filter(task => task.projectId === filters.projectId);
    }
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }
    if (filters.assigneeId) {
      filteredTasks = filteredTasks.filter(task => task.assignedUserId === filters.assigneeId);
    }
    if (filters.month && filters.year) {
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate.getMonth() === filters.month - 1 && dueDate.getFullYear() === filters.year;
      });
    }
    
    return filteredTasks;
  },
  async addTask(taskData: any) {
    if (isDemoMode()) {
      const newTask = {
        ...taskData,
        id: `demo-task-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('Demo mode: Task created', newTask);
      await new Promise(resolve => setTimeout(resolve, 500));
      return Promise.resolve(newTask);
    }

    // Validate projectId is required
    if (!taskData.projectId) {
      throw new Error('projectId é obrigatório para criar uma tarefa');
    }

    // Verify project exists
    const projectRef = doc(db, 'projects', taskData.projectId.toString());
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      throw new Error(`Projeto com ID ${taskData.projectId} não encontrado`);
    }

    const now = new Date();
    const data = {
      ...taskData,
      projectId: taskData.projectId, // Ensure projectId is preserved
      status: taskData.status || 'aberta',
      priority: taskData.priority || 'media',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'tasks'), toFirestoreData(data));
    return { ...data, id: docRef.id };
  },

  async getTasks(filters = {}) {
    if (isDemoMode()) {
      const demoTasks = [
        {
          id: 'demo-task-1',
          title: 'Análise de Projeto Stand Imobiliário',
          description: 'Realizar análise inicial do projeto para stand imobiliário',
          status: 'aberta',
          priority: 'alta',
          projectId: '1',
          assignedUserId: 'demo-user-123',
          createdUserId: 'demo-user-123',
          estimatedHours: 8,
          actualHours: 0,
          dueDate: '2025-08-15',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'demo-task-2',
          title: 'Desenvolvimento de Conceito Arquitetônico',
          description: 'Criar conceito inicial para projeto residencial',
          status: 'em_andamento',
          priority: 'media',
          projectId: '2',
          assignedUserId: 'demo-user-456',
          createdUserId: 'demo-user-123',
          estimatedHours: 12,
          actualHours: 4,
          dueDate: '2025-08-20',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'demo-task-3',
          title: 'Revisão de Documentação Técnica',
          description: 'Revisar e atualizar documentação do projeto',
          status: 'concluida',
          priority: 'baixa',
          projectId: '1',
          assignedUserId: 'demo-user-456',
          createdUserId: 'demo-user-123',
          estimatedHours: 4,
          actualHours: 3.5,
          dueDate: '2025-08-10',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'demo-task-4',
          title: 'Preparação de Apresentação Final',
          description: 'Preparar apresentação para o cliente final',
          status: 'cancelada',
          priority: 'critica',
          projectId: '2',
          assignedUserId: 'demo-user-123',
          createdUserId: 'demo-user-456',
          estimatedHours: 6,
          actualHours: 1,
          dueDate: '2025-08-12',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      // Apply filters to demo data
      let filteredTasks = [...demoTasks];
      
      if (filters.projectId) {
        filteredTasks = filteredTasks.filter(task => task.projectId === filters.projectId);
      }
      if (filters.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filters.status);
      }
      if (filters.assigneeId) {
        filteredTasks = filteredTasks.filter(task => task.assignedUserId === filters.assigneeId);
      }
      if (filters.month && filters.year) {
        filteredTasks = filteredTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate.getMonth() === filters.month - 1 && dueDate.getFullYear() === filters.year;
        });
      }
      
      return filteredTasks;
    }

    // Performance optimization: Always require at least one indexed filter
    // to avoid full collection scans
    const queryConstraints = [];
    let hasIndexedFilter = false;

    // Composite index: (projectId, status) for project-based queries
    if (filters.projectId) {
      queryConstraints.push(where('projectId', '==', filters.projectId));
      hasIndexedFilter = true;
      
      // Add status filter if provided (uses composite index)
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
      }
    } 
    // Composite index: (assignedUserId, status) for user-based queries
    else if (filters.assigneeId) {
      queryConstraints.push(where('assignedUserId', '==', filters.assigneeId));
      hasIndexedFilter = true;
      
      // Add status filter if provided (uses composite index)
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
      }
    }
    // Single field index: status only if no other filters
    else if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
      hasIndexedFilter = true;
    }

    // If no indexed filters are provided, return empty array to prevent full scans
    if (!hasIndexedFilter) {
      console.warn('getTasks called without indexed filters - returning empty array to prevent full collection scan');
      return [];
    }

    // Add appropriate ordering based on use case
    if (filters.orderByDueDate) {
      queryConstraints.push(orderBy('dueDate', 'asc'));
    } else {
      queryConstraints.push(orderBy('createdAt', 'desc'));
    }

    // Limit results to prevent excessive data transfer
    if (filters.limit) {
      queryConstraints.push(limit(filters.limit));
    } else {
      queryConstraints.push(limit(100)); // Default limit
    }

    const tasksQuery = query(collection(db, 'tasks'), ...queryConstraints);
    const querySnapshot = await getDocs(tasksQuery);
    let tasks = querySnapshot.docs.map(fromFirestoreData);

    // Apply client-side date filtering if needed (for calendar view)
    if (filters.month && filters.year) {
      tasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        return dueDate.getMonth() === filters.month - 1 && dueDate.getFullYear() === filters.year;
      });
    }

    return tasks;
  },

  async getTask(id: string) {
    if (isDemoMode()) {
      const tasks = await this.getTasks();
      return tasks.find(t => t.id === id) || null;
    }

    const docRef = doc(db, 'tasks', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? fromFirestoreData(docSnap) : null;
  },

  async updateTask(id: string, data: any) {
    if (isDemoMode()) {
      console.log('Demo mode: Task updated', { id, data });
      await new Promise(resolve => setTimeout(resolve, 300));
      return Promise.resolve({ id, ...data, updatedAt: new Date() });
    }

    // If updating projectId, validate it exists
    if (data.projectId) {
      const projectRef = doc(db, 'projects', data.projectId.toString());
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) {
        throw new Error(`Projeto com ID ${data.projectId} não encontrado`);
      }
    }

    const docRef = doc(db, 'tasks', id);
    const updateData = { ...data, updatedAt: new Date() };
    await updateDoc(docRef, toFirestoreData(updateData));
    return { id, ...updateData };
  },

  async deleteTask(id: string) {
    if (isDemoMode()) {
      console.log('Demo mode: Task deleted', { id });
      await new Promise(resolve => setTimeout(resolve, 300));
      return Promise.resolve({ id });
    }

    return await runTransaction(db, async (transaction) => {
      const taskRef = doc(db, 'tasks', id);
      
      // Delete task
      transaction.delete(taskRef);
      
      // Delete related comments
      const commentsQuery = query(collection(db, 'comments'), where('taskId', '==', id));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.docs.forEach((commentDoc) => {
        transaction.delete(commentDoc.ref);
      });
      
      // Delete related files
      const filesQuery = query(collection(db, 'files'), where('taskId', '==', id));
      const filesSnapshot = await getDocs(filesQuery);
      filesSnapshot.docs.forEach((fileDoc) => {
        transaction.delete(fileDoc.ref);
      });

      return { id };
    });
  }
};

// Generic service functions
// Real-time subscription management
export const subscriptionService = {
  // Store active subscriptions to prevent memory leaks
  activeSubscriptions: new Map<string, Unsubscribe>(),

  // Subscribe to tasks with automatic cleanup
  subscribeToTasks(filters: any, callback: (tasks: any[]) => void): string {
    const subscriptionId = `tasks_${Date.now()}_${Math.random()}`;
    
    if (isDemoMode()) {
      // For demo mode, simulate real-time updates
      const interval = setInterval(() => {
        callback(taskService.getTasksSync(filters));
      }, 5000);
      
      this.activeSubscriptions.set(subscriptionId, () => clearInterval(interval));
      return subscriptionId;
    }

    // Build optimized query with required filters
    const queryConstraints = [];
    let hasIndexedFilter = false;

    if (filters.projectId) {
      queryConstraints.push(where('projectId', '==', filters.projectId));
      hasIndexedFilter = true;
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
      }
    } else if (filters.assigneeId) {
      queryConstraints.push(where('assignedUserId', '==', filters.assigneeId));
      hasIndexedFilter = true;
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
      }
    } else if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
      hasIndexedFilter = true;
    }

    if (!hasIndexedFilter) {
      console.warn('Real-time subscription requires indexed filters');
      callback([]);
      return subscriptionId;
    }

    queryConstraints.push(orderBy('createdAt', 'desc'));
    queryConstraints.push(limit(filters.limit || 100));

    const tasksQuery = query(collection(db, 'tasks'), ...queryConstraints);
    
    const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
      let tasks = querySnapshot.docs.map(fromFirestoreData);
      
      // Apply client-side filtering if needed
      if (filters.month && filters.year) {
        tasks = tasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate.getMonth() === filters.month - 1 && dueDate.getFullYear() === filters.year;
        });
      }
      
      callback(tasks);
    }, (error) => {
      console.error('Task subscription error:', error);
      callback([]);
    });

    this.activeSubscriptions.set(subscriptionId, unsubscribe);
    return subscriptionId;
  },

  // Unsubscribe from specific subscription
  unsubscribe(subscriptionId: string) {
    const unsubscribe = this.activeSubscriptions.get(subscriptionId);
    if (unsubscribe) {
      unsubscribe();
      this.activeSubscriptions.delete(subscriptionId);
    }
  },

  // Clean up all subscriptions
  unsubscribeAll() {
    for (const [id, unsubscribe] of this.activeSubscriptions) {
      unsubscribe();
    }
    this.activeSubscriptions.clear();
  }
};

export const firebaseService = {
  // Users

  async getAllUsers() {
    if (isDemoMode()) {
      return Promise.resolve(demoUsers);
    }
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(fromFirestoreData);
  },

  async getUser(id: string) {
    if (isDemoMode()) {
      return Promise.resolve(demoUsers.find(user => user.id === id) || null);
    }
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? fromFirestoreData(docSnap) : null;
  },

  async createUser(data: any) {
    const now = new Date();
    const defaultSections = data.role === 'admin'
      ? [...DEFAULT_ALLOWED_SECTIONS, 'users']
      : [...DEFAULT_ALLOWED_SECTIONS];
    const userData = {
      ...data,
      role: data.role || 'collaborator', // Default role
      allowedSections: data.allowedSections || defaultSections,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    const docRef = doc(db, 'users', data.id);
    await setDoc(docRef, toFirestoreData(userData));
    return userData;
  },

  async updateUser(id: string, data: any) {
    if (isDemoMode()) {
      console.log('Demo mode: User update simulated', { id, data });
      return Promise.resolve();
    }
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, toFirestoreData({ ...data, updatedAt: new Date() }));
  },

  async upsertUser(id: string, data: any) {
    const docRef = doc(db, 'users', id);
    const now = new Date();
    
    // Check if user exists
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Create new user with default role
      const userData = {
        ...data,
        id,
        role: data.role || 'collaborator',
        allowedSections:
          data.role === 'admin'
            ? [...DEFAULT_ALLOWED_SECTIONS, 'users']
            : data.allowedSections || [...DEFAULT_ALLOWED_SECTIONS],
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(docRef, toFirestoreData(userData));
      return userData;
    } else {
      // Update existing user
      const existingData = fromFirestoreData(docSnap);
      const updatedData = { ...existingData, ...data, updatedAt: now };
      await updateDoc(docRef, toFirestoreData(updatedData));
      return updatedData;
    }
  },

  // Projects (delegated to projectService)
  async getProjects() {
    return await projectService.getProjects();
  },

  async getProject(id: string) {
    return await projectService.getProject(id);
  },

  async createProject(projectData: any) {
    return await projectService.addProject(projectData);
  },

  async updateProject(id: string, data: any) {
    return await projectService.updateProject(id, data);
  },

  async deleteProject(id: string) {
    return await projectService.deleteProject(id);
  },

  // Tasks (delegated to taskService)
  async getTasks(filters = {}) {
    return await taskService.getTasks(filters);
  },

  async getTask(id: string) {
    return await taskService.getTask(id);
  },

  async getTasksByProject(projectId: string) {
    return await taskService.getTasks(projectId);
  },

  async getTasksByUser(userId: string) {
    if (isDemoMode()) {
      const allTasks = await taskService.getTasks();
      return allTasks.filter(task => task.assignedUserId === userId);
    }

    const querySnapshot = await getDocs(
      query(
        collection(db, 'tasks'),
        where('assignedUserId', '==', userId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(fromFirestoreData);
  },

  async createTask(taskData: any) {
    return await taskService.addTask(taskData);
  },

  async updateTask(id: string, data: any) {
    return await taskService.updateTask(id, data);
  },

  async updateTaskStatus(id: string, status: string) {
    return await taskService.updateTask(id, { status });
  },

  async deleteTask(id: string) {
    return await taskService.deleteTask(id);
  },

  // Comments
  async getCommentsByTask(taskId: string) {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'comments'),
        where('taskId', '==', taskId),
        orderBy('createdAt', 'asc')
      )
    );
    return querySnapshot.docs.map(fromFirestoreData);
  },

  async addComment(commentData: any) {
    const now = new Date();
    const data = { ...commentData, createdAt: now, updatedAt: now };
    const docRef = await addDoc(collection(db, 'comments'), toFirestoreData(data));
    return { ...data, id: docRef.id };
  },

  // Files
  async getFilesByTask(taskId: string) {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'files'),
        where('taskId', '==', taskId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(fromFirestoreData);
  },

  async getFilesByProject(projectId: string) {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'files'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      )
    );
    return querySnapshot.docs.map(fromFirestoreData);
  },

  async addFile(fileData: any) {
    const now = new Date();
    const data = { ...fileData, createdAt: now, updatedAt: now };
    const docRef = await addDoc(collection(db, 'files'), toFirestoreData(data));
    return { ...data, id: docRef.id };
  },

  // Dashboard stats
  async getStats() {
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    const tasks = tasksSnapshot.docs.map(fromFirestoreData);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'concluida').length;
    const activeTasks = tasks.filter(task => task.status === 'em_andamento').length;
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'concluida'
    ).length;

    return { totalTasks, completedTasks, activeTasks, overdueTasks };
  },

  async getUserStats(userId: string) {
    const tasksSnapshot = await getDocs(
      query(collection(db, 'tasks'), where('assignedUserId', '==', userId))
    );
    const tasks = tasksSnapshot.docs.map(fromFirestoreData);
    
    const taskCount = tasks.length;
    const completedTaskCount = tasks.filter(task => task.status === 'concluida').length;
    const activeTasks = tasks.filter(task => task.status === 'em_andamento').length;

    return { taskCount, completedTaskCount, activeTasks };
  },

  // Dashboard data aggregations
  async getDashboardData() {
    if (isDemoMode()) {
      return {
        totalTasks: 15,
        completedTasks: 8,
        activeProjects: 3,
        totalWorkedHours: 127.5,
        tasksByStatus: {
          aberta: 4,
          em_andamento: 3,
          concluida: 8,
          cancelada: 0
        },
        tasksByPriority: {
          baixa: 3,
          media: 7,
          alta: 4,
          critica: 1
        },
        tasksEvolution: [
          { month: 'Jun', tasks: 12 },
          { month: 'Jul', tasks: 15 },
          { month: 'Ago', tasks: 15 }
        ],
        recentActivities: [
          {
            id: 'demo-1',
            type: 'task_updated',
            description: 'Tarefa "Desenvolvimento de Conceito" foi concluída',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            user: 'Admin User'
          },
          {
            id: 'demo-2',
            type: 'project_created',
            description: 'Novo projeto "Stand Comercial" foi criado',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            user: 'Admin User'
          },
          {
            id: 'demo-3',
            type: 'task_created',
            description: 'Nova tarefa "Análise Estrutural" foi criada',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
            user: 'Collaborator'
          },
          {
            id: 'demo-4',
            type: 'task_updated',
            description: 'Tarefa "Revisão de Documentação" mudou para Em Andamento',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
            user: 'Admin User'
          },
          {
            id: 'demo-5',
            type: 'project_updated',
            description: 'Projeto "Casa dos Sonhos" foi atualizado',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
            user: 'Admin User'
          }
        ]
      };
    }

    try {
      // Parallel queries for efficient data fetching
      const [
        totalTasksSnapshot,
        completedTasksSnapshot,
        activeProjectsSnapshot,
        allTasksSnapshot,
        allProjectsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'tasks')),
        getDocs(query(collection(db, 'tasks'), where('status', '==', 'concluida'))),
        getDocs(query(collection(db, 'projects'), where('status', '==', 'active'))),
        getDocs(collection(db, 'tasks')),
        getDocs(collection(db, 'projects'))
      ]);

      // Calculate aggregations
      const totalTasks = totalTasksSnapshot.size;
      const completedTasks = completedTasksSnapshot.size;
      const activeProjects = activeProjectsSnapshot.size;

      // Calculate worked hours and status/priority distributions
      let totalWorkedHours = 0;
      const tasksByStatus = { aberta: 0, em_andamento: 0, concluida: 0, cancelada: 0 };
      const tasksByPriority = { baixa: 0, media: 0, alta: 0, critica: 0 };
      const monthlyTasks = new Map();

      allTasksSnapshot.docs.forEach(doc => {
        const task = doc.data();
        
        // Sum worked hours
        if (task.actualHours && typeof task.actualHours === 'number') {
          totalWorkedHours += task.actualHours;
        }

        // Count by status
        if (task.status && tasksByStatus.hasOwnProperty(task.status)) {
          tasksByStatus[task.status]++;
        }

        // Count by priority
        if (task.priority && tasksByPriority.hasOwnProperty(task.priority)) {
          tasksByPriority[task.priority]++;
        }

        // Count by month for evolution chart
        if (task.createdAt) {
          const date = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          monthlyTasks.set(monthKey, (monthlyTasks.get(monthKey) || 0) + 1);
        }
      });

      // Convert monthly tasks to array and sort
      const tasksEvolution = Array.from(monthlyTasks.entries())
        .map(([month, tasks]) => ({ month, tasks }))
        .sort((a, b) => new Date(`${a.month} 2025`) - new Date(`${b.month} 2025`))
        .slice(-6); // Last 6 months

      // Get recent activities from tasks and projects
      const recentActivities = [];
      
      // Recent task updates
      const recentTasks = allTasksSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt);
          const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt);
          return dateB - dateA;
        })
        .slice(0, 3);

      recentTasks.forEach(task => {
        recentActivities.push({
          id: `task-${task.id}`,
          type: 'task_updated',
          description: `Tarefa "${task.title}" foi atualizada`,
          timestamp: task.updatedAt?.toDate ? task.updatedAt.toDate() : new Date(task.updatedAt),
          user: 'Usuário'
        });
      });

      // Recent project updates
      const recentProjects = allProjectsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt);
          const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt);
          return dateB - dateA;
        })
        .slice(0, 2);

      recentProjects.forEach(project => {
        recentActivities.push({
          id: `project-${project.id}`,
          type: 'project_updated',
          description: `Projeto "${project.name}" foi atualizado`,
          timestamp: project.updatedAt?.toDate ? project.updatedAt.toDate() : new Date(project.updatedAt),
          user: 'Usuário'
        });
      });

      // Sort recent activities by timestamp
      recentActivities.sort((a, b) => b.timestamp - a.timestamp);

      return {
        totalTasks,
        completedTasks,
        activeProjects,
        totalWorkedHours,
        tasksByStatus,
        tasksByPriority,
        tasksEvolution,
        recentActivities: recentActivities.slice(0, 5)
      };

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Migration and maintenance
  async migrate() {
    return await migrationService.checkAndMigrate();
  },

  async cleanupOrphans() {
    return await migrationService.cleanupOrphanedTasks();
  }
};

// Initialize migration on service load
migrationService.checkAndMigrate().catch(console.error);