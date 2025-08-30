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
  if (data.endDate instanceof Date) result.endDate = Timestamp.fromDate(data.endDate);
  return result;
};

const fromFirestoreData = (doc: any) => {
  const data = doc.data();
  if (!data) return null;

  const toJsDate = (value: any) => {
    if (!value) return value;
    // Firestore Timestamp
    if (typeof value?.toDate === 'function') return value.toDate();
    // Already a Date
    if (value instanceof Date) return value;
    // String or number
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const result: any = { ...data, id: doc.id };
  if (data.createdAt) result.createdAt = toJsDate(data.createdAt);
  if (data.updatedAt) result.updatedAt = toJsDate(data.updatedAt);
  if (data.dueDate) result.dueDate = toJsDate(data.dueDate);
  if (data.startDate) result.startDate = toJsDate(data.startDate);
  if (data.endDate) result.endDate = toJsDate(data.endDate);
  return result;
};

// Data migration functions
export const migrationService = {
  async checkAndMigrate() {

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
    const now = new Date();
    // Normalize incoming payload (form sends strings)
    const normalizeDate = (v: any) => (typeof v === 'string' && v ? new Date(v) : v || null);
    const normalizeNumber = (n: any) => (typeof n === 'string' ? (n.trim() ? Number(n) : null) : n);

    const data = {
      ...projectData,
      status: projectData.status || 'active',
      type: projectData.type || 'projeto_arquitetonico',
      stage: projectData.stage || 'briefing',
      priority: projectData.priority || 'media',
      startDate: normalizeDate(projectData.startDate),
      endDate: normalizeDate(projectData.endDate),
      budget: normalizeNumber(projectData.budget),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'projects'), toFirestoreData(data));
    return { ...data, id: docRef.id };
  },

  async getProjects() {
    const querySnapshot = await getDocs(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(fromFirestoreData);
  },

  async getProject(id: string) {
    const docRef = doc(db, 'projects', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? fromFirestoreData(docSnap) : null;
  },

  async updateProject(id: string, data: any) {
    const docRef = doc(db, 'projects', id);
    const normalizeDate = (v: any) => (typeof v === 'string' && v ? new Date(v) : v ?? null);
    const normalizeNumber = (n: any) => (typeof n === 'string' ? (n.trim() ? Number(n) : null) : n);
    const updateData = {
      ...data,
      type: data?.type ?? undefined,
      startDate: data?.startDate !== undefined ? normalizeDate(data.startDate) : undefined,
      endDate: data?.endDate !== undefined ? normalizeDate(data.endDate) : undefined,
      budget: data?.budget !== undefined ? normalizeNumber(data.budget) : undefined,
      updatedAt: new Date(),
    };
    await updateDoc(docRef, toFirestoreData(updateData));
    return { id, ...updateData };
  },

  async deleteProject(id: string) {
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
  async addTask(taskData: any) {
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

    // If no indexed filters are provided, allow a limited, ordered query (used by Kanban)
    if (!hasIndexedFilter) {
      // Fallback: order by createdAt and apply a safe limit
      queryConstraints.push(orderBy('createdAt', 'desc'));
      if (filters.limit) {
        queryConstraints.push(limit(filters.limit));
      } else {
        queryConstraints.push(limit(100));
      }
    }

    // Add appropriate ordering based on use case
    if (filters.orderByDueDate) {
      queryConstraints.push(orderBy('dueDate', 'asc'));
    } else {
      // Only add createdAt ordering if not already added by the fallback above
      if (!queryConstraints.some((c: any) => c.type === 'orderBy' || c._methodName === 'orderBy')) {
        queryConstraints.push(orderBy('createdAt', 'desc'));
      }
    }

    // Limit results to prevent excessive data transfer
    if (filters.limit) {
      queryConstraints.push(limit(filters.limit));
    } else {
      queryConstraints.push(limit(100)); // Default limit
    }

    const tasksQuery = query(collection(db, 'tasks'), ...queryConstraints);
    const querySnapshot = await getDocs(tasksQuery);
    const tasks = querySnapshot.docs.map(fromFirestoreData);
    return tasks;
  },

  async getTask(id: string) {
    const docRef = doc(db, 'tasks', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? fromFirestoreData(docSnap) : null;
  },

  async updateTask(id: string, data: any) {
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
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(fromFirestoreData);
  },

  async getUser(id: string) {
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
    const data = { ...taskData };
    if (!data.assigneeId || data.assigneeId === 'none') {
      delete data.assigneeId;
    }
    return await taskService.addTask(data);
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

  async getFileById(fileId: string) {
    const docRef = doc(db, 'files', fileId);
    const snap = await getDoc(docRef);
    return snap.exists() ? fromFirestoreData(snap) : null;
  },

  async deleteFile(fileId: string) {
    const docRef = doc(db, 'files', fileId);
    await deleteDoc(docRef);
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
