// Global state management for Kanban data persistence
import { create } from 'zustand';
import type { TaskWithDetails, Project, User } from '@shared/schema';

interface KanbanStore {
  // Data
  tasks: TaskWithDetails[];
  projects: Project[];
  users: User[];
  
  // Loading states
  isLoading: boolean;
  lastUpdate: number;
  
  // Actions
  setTasks: (tasks: TaskWithDetails[]) => void;
  setProjects: (projects: Project[]) => void;
  setUsers: (users: User[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Task operations with optimistic updates
  addTaskOptimistic: (task: TaskWithDetails) => void;
  updateTaskOptimistic: (taskId: string, updates: Partial<TaskWithDetails>) => void;
  deleteTaskOptimistic: (taskId: string) => void;
  moveTaskOptimistic: (taskId: string, newStatus: string) => void;
  
  // Sync operations
  syncTasks: () => void;
  revertOptimisticUpdate: (taskId: string, originalTask: TaskWithDetails) => void;
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
    // Initial state
    tasks: [],
    projects: [],
    users: [],
    isLoading: false,
    lastUpdate: 0,
    
    // Basic setters
    setTasks: (tasks) => set({ tasks, lastUpdate: Date.now() }),
    setProjects: (projects) => set({ projects }),
    setUsers: (users) => set({ users }),
    setLoading: (isLoading) => set({ isLoading }),
    
    // Optimistic updates for better UX
    addTaskOptimistic: (task) => {
      const state = get();
      const newTask = {
        ...task,
        id: task.id || `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set({ 
        tasks: [...state.tasks, newTask], 
        lastUpdate: Date.now() 
      });
    },
    
    updateTaskOptimistic: (taskId, updates) => {
      const state = get();
      const tasks = state.tasks.map(task => 
        task.id.toString() === taskId 
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      );
      set({ tasks, lastUpdate: Date.now() });
    },
    
    deleteTaskOptimistic: (taskId) => {
      const state = get();
      const tasks = state.tasks.filter(task => task.id.toString() !== taskId);
      set({ tasks, lastUpdate: Date.now() });
    },
    
    moveTaskOptimistic: (taskId, newStatus) => {
      const state = get();
      const tasks = state.tasks.map(task => 
        task.id.toString() === taskId 
          ? { ...task, status: newStatus as any, updatedAt: new Date() }
          : task
      );
      set({ tasks, lastUpdate: Date.now() });
    },
    
    syncTasks: () => {
      // This will be called to sync with server
      set({ lastUpdate: Date.now() });
    },
    
    revertOptimisticUpdate: (taskId, originalTask) => {
      const state = get();
      const tasks = state.tasks.map(task => 
        task.id.toString() === taskId ? originalTask : task
      );
      set({ tasks, lastUpdate: Date.now() });
    },
  }));

// Auto-sync every 30 seconds in background
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useKanbanStore.getState();
    if (!store.isLoading) {
      store.syncTasks();
    }
  }, 30000);
}