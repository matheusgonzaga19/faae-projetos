import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, User, CheckCircle2 } from "lucide-react";

interface UserTypeSelectorProps {
  onSelectUserType: (userType: 'admin' | 'collaborator') => void;
}

export default function UserTypeSelector({ onSelectUserType }: UserTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<'admin' | 'collaborator' | null>(null);

  const userTypes = [
    {
      id: 'admin' as const,
      title: 'Administrador',
      description: 'Acesso completo ao sistema',
      icon: Shield,
      features: [
        'Gerenciar todos os projetos e tarefas',
        'Editar tarefas de qualquer usuário',
        'Gerenciar equipe e permissões',
        'Visualizar relatórios completos',
        'Configurar sistema'
      ],
      color: 'bg-gradient-to-br from-purple-500 to-blue-600',
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'collaborator' as const,
      title: 'Colaborador',
      description: 'Acesso às suas tarefas e projetos',
      icon: User,
      features: [
        'Visualizar seus projetos',
        'Gerenciar suas próprias tarefas',
        'Colaborar em projetos de equipe',
        'Acompanhar progresso',
        'Compartilhar arquivos'
      ],
      color: 'bg-gradient-to-br from-green-500 to-blue-500',
      badgeColor: 'bg-green-100 text-green-800'
    }
  ];

  const handleContinue = () => {
    if (selectedType) {
      onSelectUserType(selectedType);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bem-vindo ao FAAE Projetos
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Selecione o tipo de acesso para continuar
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {userTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <Card 
                key={type.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                    : 'hover:scale-102'
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl ${type.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{type.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {type.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {type.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Badge className={type.badgeColor}>
                      {type.title}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            size="lg"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continuar como {selectedType ? userTypes.find(t => t.id === selectedType)?.title : '...'}
          </Button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Você poderá alterar suas permissões posteriormente através do administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}