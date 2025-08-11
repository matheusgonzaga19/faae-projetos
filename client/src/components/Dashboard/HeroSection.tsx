import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FAAELogo from "../FAAELogo";
import { Building, Users, Clock, Target } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  description: string;
}

function StatCard({ icon, value, label, description }: StatCardProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            {icon}
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm font-medium text-gray-600">{label}</div>
            <div className="text-xs text-gray-500 mt-1">{description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Column - Hero Content */}
          <div className="mb-12 lg:mb-0">
            <div className="mb-8">
              <FAAELogo className="mb-6" width={300} height={90} />
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-4">
                Gestão Profissional de Projetos
              </Badge>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Especialistas em{" "}
              <span className="text-yellow-300">Construções</span>{" "}
              de Stands Imobiliários
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Oferecemos soluções personalizadas e inovadoras para apresentação de empreendimentos, 
              com projetos de arquitetura funcionais e modelos detalhados em 3D.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <Badge variant="outline" className="bg-white/10 text-white border-white/30 px-4 py-2">
                18 anos de experiência
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/30 px-4 py-2">
                Atendimento em todo Brasil
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/30 px-4 py-2">
                Entrega garantida no prazo
              </Badge>
            </div>
          </div>
          
          {/* Right Column - Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard
              icon={<Building className="w-6 h-6" />}
              value="40+"
              label="Incorporadoras"
              description="Atendidas com excelência"
            />
            <StatCard
              icon={<Target className="w-6 h-6" />}
              value="100+"
              label="Stands Executados"
              description="Projetos de alta qualidade"
            />
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              value="415+"
              label="Reformas & Manutenções"
              description="Realizadas com precisão"
            />
            <StatCard
              icon={<Users className="w-6 h-6" />}
              value="40.000m²"
              label="Construídos"
              description="Em projetos diversos"
            />
          </div>
        </div>
      </div>
      
      {/* Bottom Wave */}
      <div className="absolute bottom-0 w-full">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-16 fill-white"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
          />
        </svg>
      </div>
    </div>
  );
}