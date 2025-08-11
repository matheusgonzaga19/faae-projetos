import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  BarChart3, 
  Kanban, 
  Building, 
  Calendar, 
  Folder, 
  Bot, 
  Users, 
  Menu 
} from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: string;
  allowedSections?: string[];
}

export default function Navigation({ activeSection, onSectionChange, userRole, allowedSections }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  let navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'kanban', label: 'Kanban', icon: Kanban },
    { id: 'projects', label: 'Projetos', icon: Building },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'files', label: 'Arquivos', icon: Folder },
    { id: 'chat', label: 'IA Chat', icon: Bot },
  ];

  if (userRole !== 'admin' && allowedSections) {
    navItems = navItems.filter(item => allowedSections.includes(item.id));
  }

  // Add users tab for admins
  if (userRole === 'admin') {
    navItems.push({ id: 'users', label: 'Usuários', icon: Users });
  }

  const handleNavigation = (section: string) => {
    onSectionChange(section);
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeSection === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                        activeSection === item.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
