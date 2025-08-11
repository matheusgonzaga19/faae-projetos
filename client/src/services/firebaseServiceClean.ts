// Clean Firebase service without duplicates
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { demoUsers } from '@/lib/testUsers';

// Demo mode check
const isDemoMode = () => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return !projectId || projectId === 'demo-faae-projetos';
};

// Data conversion helpers
const toFirestoreData = (data: any) => {
  const result = { ...data };
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Date) {
      result[key] = Timestamp.fromDate(result[key]);
    }
  });
  return result;
};

const fromFirestoreData = (doc: DocumentSnapshot | DocumentData) => {
  if ('exists' in doc) {
    if (!doc.exists()) return null;
    const data = doc.data();
    const result = { ...data, id: doc.id };
    
    Object.keys(result).forEach(key => {
      if (result[key] instanceof Timestamp) {
        result[key] = result[key].toDate();
      }
    });
    return result;
  }
  return doc;
};

// Subscription manager
class SubscriptionManager {
  private activeSubscriptions = new Map<string, () => void>();

  subscribe(subscriptionId: string, callback: (data: any[]) => void, queryRef: any) {
    // Cleanup existing subscription
    this.unsubscribe(subscriptionId);
    
    const unsubscribe = onSnapshot(queryRef, (snapshot: QuerySnapshot) => {
      try {
        const data = snapshot.docs.map(fromFirestoreData);
        callback(data);
      } catch (error) {
        console.error('Subscription error:', error);
        callback([]);
      }
    });

    this.activeSubscriptions.set(subscriptionId, unsubscribe);
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string) {
    const unsubscribe = this.activeSubscriptions.get(subscriptionId);
    if (unsubscribe) {
      unsubscribe();
      this.activeSubscriptions.delete(subscriptionId);
    }
  }

  unsubscribeAll() {
    for (const [id, unsubscribe] of this.activeSubscriptions) {
      unsubscribe();
    }
    this.activeSubscriptions.clear();
  }
}

export const subscriptionManager = new SubscriptionManager();

export const firebaseService = {
  // Users
  async createUser(userData: any) {
    const now = new Date();
    const userWithTimestamps = { 
      ...userData, 
      createdAt: now, 
      updatedAt: now,
      isActive: true
    };

    if (isDemoMode()) {
      console.log('Demo mode: User creation simulated', userWithTimestamps);
      return Promise.resolve(userWithTimestamps);
    }

    try {
      const docRef = doc(db, 'users', userData.id);
      await setDoc(docRef, toFirestoreData(userWithTimestamps));
      return userWithTimestamps;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async getUser(userId: string) {
    if (isDemoMode()) {
      return demoUsers.find(u => u.id === userId) || null;
    }

    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? fromFirestoreData(docSnap) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async getAllUsers() {
    if (isDemoMode()) {
      return Promise.resolve(demoUsers);
    }

    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => fromFirestoreData(doc));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  async updateUser(userId: string, userData: any) {
    if (isDemoMode()) {
      console.log('Demo mode: User update simulated', { userId, userData });
      return Promise.resolve({ id: userId, ...userData });
    }

    try {
      const docRef = doc(db, 'users', userId);
      const updateData = { ...userData, updatedAt: new Date() };
      await updateDoc(docRef, toFirestoreData(updateData));
      return { id: userId, ...updateData };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Tasks with optimized queries
  async getTasks(filters: {
    projectId?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}) {
    if (isDemoMode()) {
      console.log('Demo mode: Task query simulated', filters);
      return Promise.resolve([]);
    }

    try {
      const queryConstraints = [];

      // Always require at least one filter to prevent full collection scans
      let hasFilter = false;

      if (filters.projectId) {
        queryConstraints.push(where('projectId', '==', filters.projectId));
        hasFilter = true;
      }

      if (filters.assigneeId) {
        queryConstraints.push(where('assigneeId', '==', filters.assigneeId));
        hasFilter = true;
      }

      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
        hasFilter = true;
      }

      if (filters.priority) {
        queryConstraints.push(where('priority', '==', filters.priority));
        hasFilter = true;
      }

      // If no filters provided, default to status filter to prevent full scan
      if (!hasFilter) {
        queryConstraints.push(where('status', '==', 'aberta'));
      }

      // Add ordering
      const orderByField = filters.orderBy || 'createdAt';
      const orderDirection = filters.orderDirection || 'desc';
      queryConstraints.push(orderBy(orderByField, orderDirection));

      // Add limit
      if (filters.limit) {
        queryConstraints.push(limit(filters.limit));
      }

      const q = query(collection(db, 'tasks'), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => fromFirestoreData(doc));
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  },

  async createTask(taskData: any) {
    const now = new Date();
    const data = { ...taskData, createdAt: now, updatedAt: now };
    
    if (isDemoMode()) {
      console.log('Demo mode: Task creation simulated', data);
      return Promise.resolve({ ...data, id: 'demo-task-' + Date.now() });
    }

    try {
      const docRef = await addDoc(collection(db, 'tasks'), toFirestoreData(data));
      return { ...data, id: docRef.id };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  async updateTask(taskId: string, data: any) {
    if (isDemoMode()) {
      console.log('Demo mode: Task update simulated', { taskId, data });
      return Promise.resolve({ id: taskId, ...data });
    }

    try {
      const docRef = doc(db, 'tasks', taskId);
      const updateData = { ...data, updatedAt: new Date() };
      await updateDoc(docRef, toFirestoreData(updateData));
      return { id: taskId, ...updateData };
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Projects
  async getProjects() {
    if (isDemoMode()) {
      return Promise.resolve([]);
    }

    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => fromFirestoreData(doc));
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  },

  async createProject(projectData: any) {
    const now = new Date();
    const data = { ...projectData, createdAt: now, updatedAt: now };
    
    if (isDemoMode()) {
      console.log('Demo mode: Project creation simulated', data);
      return Promise.resolve({ ...data, id: 'demo-project-' + Date.now() });
    }

    try {
      const docRef = await addDoc(collection(db, 'projects'), toFirestoreData(data));
      return { ...data, id: docRef.id };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Subscription methods
  subscribeToTasks(filters: any, callback: (tasks: any[]) => void) {
    const subscriptionId = `tasks-${JSON.stringify(filters)}-${Date.now()}`;
    
    if (isDemoMode()) {
      // In demo mode, just call callback with empty array
      setTimeout(() => callback([]), 100);
      return subscriptionId;
    }

    try {
      const queryConstraints = [];
      
      // Always require filters for subscriptions
      let hasFilter = false;

      if (filters.projectId) {
        queryConstraints.push(where('projectId', '==', filters.projectId));
        hasFilter = true;
      }

      if (filters.assigneeId) {
        queryConstraints.push(where('assigneeId', '==', filters.assigneeId));
        hasFilter = true;
      }

      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
        hasFilter = true;
      }

      if (!hasFilter) {
        queryConstraints.push(where('status', '==', 'aberta'));
      }

      queryConstraints.push(orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        queryConstraints.push(limit(filters.limit));
      }

      const q = query(collection(db, 'tasks'), ...queryConstraints);
      return subscriptionManager.subscribe(subscriptionId, callback, q);
    } catch (error) {
      console.error('Task subscription error:', error);
      callback([]);
      return subscriptionId;
    }
  },

  unsubscribe(subscriptionId: string) {
    subscriptionManager.unsubscribe(subscriptionId);
  },

  unsubscribeAll() {
    subscriptionManager.unsubscribeAll();
  }
};