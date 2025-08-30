import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { firebaseService, migrationService } from '@/services/firebaseService';
import { auth } from '@/lib/firebase';

// Legacy API compatibility function - routes mutations to Firestore
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  try {
    // Parse the URL to determine which service to call
    const path = url.replace('/api/', '');
    const segments = path.split('/');
    
  switch (method.toUpperCase()) {
    case 'POST':
      return await handlePost(segments, data);
      case 'PUT':
        return await handlePut(segments, data);
      case 'DELETE':
        return await handleDelete(segments);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    console.error('API Request error:', error);
    throw error;
  }
}

async function handlePost(segments: string[], data: any) {
  switch (segments[0]) {
    case 'projects':
      return await firebaseService.createProject(data);
    case 'tasks':
      return await firebaseService.createTask(data);
    case 'comments':
      return await firebaseService.addComment(data);
    case 'files':
      if (segments[1] === 'upload') {
        throw new Error('File upload should use Firebase Storage directly');
      }
      break;
    case 'auth':
      if (segments[1] === 'set-initial-type') {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        const role = data?.userType === 'admin' ? 'admin' : 'collaborator';
        await firebaseService.upsertUser(user.uid, { role });
        return { userId: user.uid, role };
      }
      // Other auth endpoints are handled by Firebase Auth directly
      break;
  }
  throw new Error(`Unsupported POST endpoint: ${segments.join('/')}`);
}

async function handlePut(segments: string[], data: any) {
  switch (segments[0]) {
    case 'projects':
      if (segments.length === 2) {
        return await firebaseService.updateProject(segments[1], data);
      }
      break;
    case 'tasks':
      if (segments.length === 2) {
        await firebaseService.updateTask(segments[1], data);
        return { id: segments[1], ...data };
      }
      break;
    case 'users':
      if (segments[2] === 'role') {
        await firebaseService.updateUser(segments[1], { role: data.role });
        return { userId: segments[1], role: data.role };
      }
      break;
  }
  throw new Error(`Unsupported PUT endpoint: ${segments.join('/')}`);
}

async function handleDelete(segments: string[]) {
  switch (segments[0]) {
    case 'projects':
      if (segments.length === 2) {
        await firebaseService.deleteProject(segments[1]);
        return { id: segments[1] };
      }
      break;
    case 'tasks':
      if (segments.length === 2) {
        await firebaseService.deleteTask(segments[1]);
        return { id: segments[1] };
      }
      break;
  }
  throw new Error(`Unsupported DELETE endpoint: ${segments.join('/')}`);
}

// Firestore-based query function
export const getFirestoreQueryFn: QueryFunction = async ({ queryKey }) => {
  const [endpoint, ...params] = queryKey as string[];
  
  try {
    switch (endpoint) {
      case '/api/users':
        return await firebaseService.getAllUsers();
      
      case '/api/auth/user':
        return null; // Handled by Firebase Auth hook
      
      case '/api/projects':
        return await firebaseService.getProjects();
      
      case '/api/projects/single':
        return await firebaseService.getProject(params[0]);
      
      case '/api/tasks':
        if (params && params.length > 0) {
          if (params[0] === 'filtered' || params[0] === 'kanban') {
            // Handle filtered tasks: ['/api/tasks', 'type', filters]
            const filters = params[1] || {};
            return await firebaseService.getTasks(filters);
          }
        }
        // Default: require at least one filter to prevent full collection scans
        return await firebaseService.getTasks({ status: 'aberta', limit: 50 });
      
      case '/api/tasks/single':
        return await firebaseService.getTask(params[0]);
      
      case '/api/tasks/by-project':
        return await firebaseService.getTasksByProject(params[0]);
      
      case '/api/tasks/by-user':
        return await firebaseService.getTasksByUser(params[0]);
      
      case '/api/comments':
        return await firebaseService.getCommentsByTask(params[0]);
      
      case '/api/files/by-task':
        return await firebaseService.getFilesByTask(params[0]);
      
      case '/api/files/by-project':
        return await firebaseService.getFilesByProject(params[0]);
      
      case '/api/dashboard/stats':
        return await firebaseService.getStats();
      
      case '/api/dashboard/enhanced':
        return await firebaseService.getDashboardData();
      
      case '/api/dashboard/user-stats':
        return await firebaseService.getUserStats(params[0]);
      
      case '/api/notifications':
        return [];
      
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  } catch (error) {
    console.error('Firestore query error:', error);
    throw error;
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getFirestoreQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30 seconds cache
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Initialize the migration when the query client is created
migrationService.checkAndMigrate().catch(console.error);

// Add migration status endpoint for monitoring
export const checkMigrationStatus = async () => {
  try {
    await firebaseService.migrate();
    await firebaseService.cleanupOrphans();
    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, message: (error as Error).message };
  }
};
