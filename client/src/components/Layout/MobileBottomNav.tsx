import { 
  BarChart3, 
  Kanban,
  Building,
  Folder,
  Bot,
  Users,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: string;
  allowedSections?: string[];
}

export default function MobileBottomNav({ activeSection, onSectionChange, userRole, allowedSections }: MobileBottomNavProps) {
  let navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'kanban', label: 'Kanban', icon: Kanban },
    { id: 'projects', label: 'Projetos', icon: Building },
    { id: 'files', label: 'Arquivos', icon: Folder },
  ];

  if (userRole !== 'admin' && allowedSections) {
    navItems = navItems.filter(item => allowedSections.includes(item.id));
  }

  // Add users tab for admins and limit to 5 items to fit mobile
  if (userRole === 'admin') {
    navItems.push({ id: 'users', label: 'Usuários', icon: Users });
  } else {
    if (!allowedSections || allowedSections.includes('chat')) {
      navItems.push({ id: 'chat', label: 'IA Chat', icon: Bot });
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden z-40 safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1.5 sm:px-2 sm:py-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center justify-center px-1 py-1.5 sm:px-2 sm:py-2 min-w-0 flex-1 transition-all duration-200 rounded-lg mx-0.5 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}