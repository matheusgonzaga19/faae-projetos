import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import TimelinePage from './pages/TimelinePage'; // New Page
import { APP_ROUTES } from './constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path={APP_ROUTES.LOGIN} element={isAuthenticated ? <Navigate to={APP_ROUTES.DASHBOARD} /> : <LoginPage />} />
      <Route 
        path={APP_ROUTES.DASHBOARD} 
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path={APP_ROUTES.PROJECTS} 
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProjectsPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path={APP_ROUTES.TIMELINE} 
        element={
          <ProtectedRoute>
            <MainLayout>
              <TimelinePage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path={APP_ROUTES.TASKS} 
        element={
          <ProtectedRoute>
            <MainLayout>
              <TasksPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
       <Route 
        path={APP_ROUTES.REPORTS} 
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReportsPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
       <Route 
        path={APP_ROUTES.SETTINGS} 
        element={
          <ProtectedRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? APP_ROUTES.DASHBOARD : APP_ROUTES.LOGIN} />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;