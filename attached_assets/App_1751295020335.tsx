
import React, { useState, useCallback } from 'react';
import { User, UserRole, Page, Task, Status, TaskHistory } from './types';
import { USERS as INITIAL_USERS, TASKS } from './constants';
import Header from './components/Header';
import AdminDashboard from './components/AdminDashboard';
import CollaboratorDashboard from './components/CollaboratorDashboard';
import ChatInterface from './components/ChatInterface';
import UserManagement from './components/UserManagement';
import Button from './components/ui/Button';
import TutorialModal from './components/TutorialModal';
import TaskDetailModal from './components/TaskDetailModal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleLogin = (role: UserRole) => {
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      setCurrentPage(Page.DASHBOARD);
      setShowTutorial(true); // Show tutorial on first login
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddTask = useCallback((newTask: Omit<Task, 'id'>) => {
    setTasks(prevTasks => [...prevTasks, { ...newTask, id: prevTasks.length + 1 }]);
  }, []);

  const handleAddUser = useCallback((newUser: Omit<User, 'id'>) => {
    setUsers(prevUsers => {
        const newId = prevUsers.length > 0 ? Math.max(...prevUsers.map(u => u.id)) + 1 : 1;
        return [...prevUsers, { ...newUser, id: newId }];
    });
  }, []);
  
  const handleUpdateUser = useCallback((updatedUser: User) => {
    setUsers(prevUsers => 
      prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
  }, []);

  const handleShowTutorial = () => setShowTutorial(true);
  const handleCloseTutorial = () => setShowTutorial(false);

  const handleSelectTask = (task: Task) => setSelectedTask(task);
  const handleCloseTaskModal = () => setSelectedTask(null);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    if (!currentUser) return;

    const originalTask = tasks.find(t => t.id === updatedTask.id);
    if (!originalTask) return;

    const changes: string[] = [];
    const originalUser = users.find(u => u.id === originalTask.userId)?.name || 'N/A';
    const updatedUser = users.find(u => u.id === updatedTask.userId)?.name || 'N/A';

    if (originalTask.title !== updatedTask.title) changes.push(`Título alterado de "${originalTask.title}" para "${updatedTask.title}".`);
    if (originalTask.description !== updatedTask.description) changes.push('Descrição alterada.');
    if (originalTask.priority !== updatedTask.priority) changes.push(`Prioridade alterada de "${originalTask.priority}" para "${updatedTask.priority}".`);
    if (originalTask.status !== updatedTask.status) changes.push(`Status alterado de "${originalTask.status}" para "${updatedTask.status}".`);
    if (originalTask.dueDate !== updatedTask.dueDate) changes.push(`Data de entrega alterada de "${new Date(originalTask.dueDate).toLocaleDateString()}" para "${new Date(updatedTask.dueDate).toLocaleDateString()}".`);
    if (originalTask.userId !== updatedTask.userId) changes.push(`Responsável alterado de "${originalUser}" para "${updatedUser}".`);
    
    // Handle completion date
    if (originalTask.status !== Status.CONCLUIDA && updatedTask.status === Status.CONCLUIDA) {
        updatedTask.completedAt = new Date().toISOString();
    } else if (originalTask.status === Status.CONCLUIDA && updatedTask.status !== Status.CONCLUIDA) {
        updatedTask.completedAt = null;
    }

    const taskWithHistory = { ...updatedTask };
    if (changes.length > 0) {
        const historyEntry: TaskHistory = {
            date: new Date().toISOString(),
            user: currentUser.name,
            changes: changes.join(' '),
        };
        taskWithHistory.history = [...originalTask.history, historyEntry];
    }
    
    setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? taskWithHistory : t));
    setSelectedTask(taskWithHistory); // Keep modal updated
  }, [tasks, currentUser, users]);

  const renderContent = () => {
    if (!currentUser) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
          <div className="text-center bg-white p-12 rounded-xl shadow-2xl">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">FAAE Projetos</h1>
            <p className="text-gray-500 mb-8">Plataforma de Gestão de Tarefas</p>
            <div className="space-y-4">
              <Button onClick={() => handleLogin(UserRole.ADMIN)} fullWidth>
                Entrar como Administrador
              </Button>
              <Button onClick={() => handleLogin(UserRole.COLLABORATOR)} fullWidth variant="secondary">
                Entrar como Colaborador
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          user={currentUser}
          onLogout={handleLogout}
          onNavigate={setCurrentPage}
          currentPage={currentPage}
          onShowTutorial={handleShowTutorial}
        />
        <main className="p-4 sm:p-6 lg:p-8">
          {currentPage === Page.DASHBOARD && currentUser.role === UserRole.ADMIN && (
            <AdminDashboard tasks={tasks} users={users} onSelectTask={handleSelectTask} />
          )}
          {currentPage === Page.DASHBOARD && currentUser.role === UserRole.COLLABORATOR && (
            <CollaboratorDashboard 
              userTasks={tasks.filter(t => t.userId === currentUser.id)} 
              onAddTask={handleAddTask} 
              currentUser={currentUser}
              onSelectTask={handleSelectTask}
             />
          )}
          {currentPage === Page.CHAT && currentUser.role === UserRole.ADMIN && (
            <ChatInterface allTasks={tasks} users={users} />
          )}
          {currentPage === Page.USERS && currentUser.role === UserRole.ADMIN && (
            <UserManagement users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} />
          )}
        </main>
        <TutorialModal isOpen={showTutorial} onClose={handleCloseTutorial} userRole={currentUser.role} />
        {selectedTask && (
            <TaskDetailModal 
                task={selectedTask}
                users={users}
                currentUser={currentUser}
                isOpen={!!selectedTask}
                onClose={handleCloseTaskModal}
                onUpdate={handleUpdateTask}
            />
        )}
      </div>
    );
  };

  return renderContent();
};

export default App;