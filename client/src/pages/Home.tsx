import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Layout/Header";
import MobileBottomNav from "@/components/Layout/MobileBottomNav";
import DashboardEnhanced from "@/components/Dashboard/DashboardEnhanced";
import KanbanBoard from "@/components/Kanban/KanbanBoard";
import CalendarView from "@/components/Calendar/CalendarView";
import FileManager from "@/components/Files/FileManager";
import AIChat from "@/components/Chat/AIChat";
import UserManagement from "@/components/Users/UserManagement";
import ProjectsManager from "@/components/Projects/ProjectsManager";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useUserTypeSetup } from "@/hooks/useUserTypeSetup";
import type { User } from "@shared/schema";

type Section = 'dashboard' | 'kanban' | 'projects' | 'calendar' | 'files' | 'chat' | 'users';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  // Initialize WebSocket connection
  useWebSocket();
  
  // Setup user type if needed
  useUserTypeSetup();

  // Show landing page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // User will see Landing page instead of redirect
      return;
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      if (!user.allowedSections?.includes(activeSection)) {
        const fallback = user.allowedSections?.[0] as Section | undefined;
        if (fallback) setActiveSection(fallback);
      }
    }
  }, [user, activeSection]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardEnhanced />;

      case 'kanban':
        return <KanbanBoard />;
      case 'projects':
        return <ProjectsManager />;
      case 'calendar':
        return <CalendarView />;
      case 'files':
        return <FileManager />;
      case 'chat':
        return <AIChat />;
      case 'users':
        return user.role === 'admin' ? <UserManagement /> : <DashboardEnhanced />;
      default:
        return <DashboardEnhanced />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <main className="transition-all duration-300 pb-16 lg:pb-0 min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)]">
        {renderActiveSection()}
      </main>

      <MobileBottomNav
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section as Section)}
        userRole={user.role}
        allowedSections={user.allowedSections}
      />
    </div>
  );
}
