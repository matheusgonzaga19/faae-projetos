import { useAuth } from "@/hooks/useAuth";
import ProjectsManager from "@/components/Projects/ProjectsManager";

export default function ProjectsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ProjectsManager />
    </div>
  );
}