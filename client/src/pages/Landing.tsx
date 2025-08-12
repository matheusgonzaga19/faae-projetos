import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import UserRegistration from "@/components/Auth/UserRegistration";
import FAAELogo from "@/components/FAAELogo";
import { 
  Building, 
  Calendar, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Target,
  Clock,
  Award,
  Zap,
  UserPlus
} from "lucide-react";

export default function Landing() {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        
        <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <FAAELogo width={200} height={60} />
            <div className="flex items-center space-x-4">
              <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrar / Login
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Acesso ao FAAE Projetos</DialogTitle>
                  </DialogHeader>
                  <UserRegistration onClose={() => setShowLoginDialog(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div className="mb-12 lg:mb-0">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-6">
                  Plataforma Profissional de Gestão
                </Badge>
                
                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Sistema Completo para{" "}
                  <span className="text-yellow-300">Gestão de Projetos</span>{" "}
                  de Arquitetura
                </h1>
                
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Plataforma avançada com dashboards interativos, análises de IA, 
                  visualizações de dados e colaboração em tempo real para equipes de arquitetura.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    size="lg"
                    onClick={() => setShowLoginDialog(true)}
                    className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-semibold px-8 py-4"
                  >
                    Entrar
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30 px-4 py-2">
                    📊 Analytics de IA
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30 px-4 py-2">
                    ⚡ Tempo Real
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30 px-4 py-2">
                    🔒 100% Seguro
                  </Badge>
                </div>
              </div>
              
              <div className="relative">
                <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Executivo</h3>
                      <p className="text-gray-600">Visão completa dos seus projetos</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium">Stand Morumbi Plaza</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Concluído</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-medium">Projeto Vila Olímpia</span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">Em Andamento</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Target className="w-5 h-5 text-orange-500" />
                          <span className="text-sm font-medium">Stand Brooklin Tower</span>
                        </div>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">Planejamento</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 w-full">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-16 fill-white"
          >
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Recursos Profissionais para Gestão Completa
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Todas as ferramentas necessárias para gerenciar projetos arquitetônicos 
              com eficiência e precisão
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cronogramas Inteligentes</h3>
                <p className="text-gray-600 text-sm">
                  Planejamento automático com alertas e marcos importantes
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Equipes</h3>
                <p className="text-gray-600 text-sm">
                  Controle de acesso e colaboração em tempo real
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">IA Integrada</h3>
                <p className="text-gray-600 text-sm">
                  Análises inteligentes e sugestões automatizadas
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Qualidade Garantida</h3>
                <p className="text-gray-600 text-sm">
                  Controle de qualidade e aprovações automatizadas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Pronto para Revolucionar sua Gestão?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Junte-se aos profissionais que já transformaram seus processos com nossa plataforma
          </p>
          <Button
            size="lg"
            onClick={() => setShowLoginDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4"
          >
            Começar Agora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <FAAELogo width={200} height={60} />
            <div className="mt-4 md:mt-0">
              <p className="text-blue-200">
                © 2025 FAAE Projetos. Sistema de Gestão Profissional.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}