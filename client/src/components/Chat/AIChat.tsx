import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ChatMessage from "./ChatMessage";
import { AI_SUGGESTIONS } from "@/lib/constants";
import type { ChatMessage as ChatMessageType, TaskWithDetails } from "@/types";

export default function AIChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      content: 'Olá! Sou seu assistente IA especializado em gestão de projetos arquitetônicos. Posso ajudá-lo a:\n\n• Buscar tarefas específicas\n• Analisar progresso de projetos\n• Sugerir otimizações de workflow\n• Gerar relatórios personalizados\n\nComo posso ajudá-lo hoje?',
      isAI: true,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tasks = [] } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks'],
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/chat/search', { query });
      return response.json();
    },
    onSuccess: (results, query) => {
      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        content: query,
        isAI: false,
        timestamp: new Date(),
      };

      let aiResponse: ChatMessageType;

      if (results.length === 0) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          content: 'Não encontrei tarefas relacionadas à sua consulta. Tente ser mais específico ou use palavras-chave diferentes.',
          isAI: true,
          timestamp: new Date(),
        };
      } else {
        const taskSummary = results.length === 1 
          ? `Encontrei 1 tarefa relacionada:`
          : `Encontrei ${results.length} tarefas relacionadas:`;

        aiResponse = {
          id: (Date.now() + 1).toString(),
          content: taskSummary,
          isAI: true,
          timestamp: new Date(),
          data: results,
        };
      }

      setMessages(prev => [...prev, userMessage, aiResponse]);
    },
    onError: (error) => {
      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        content: inputValue,
        isAI: false,
        timestamp: new Date(),
      };

      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua consulta. Por favor, tente novamente.',
        isAI: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, errorMessage]);
      
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || searchMutation.isPending) return;

    searchMutation.mutate(inputValue.trim());
    setInputValue('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Recurso não disponível",
        description: "Seu navegador não suporta reconhecimento de voz.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Erro no reconhecimento de voz",
        description: "Não foi possível capturar o áudio. Tente novamente.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: 'Chat limpo! Como posso ajudá-lo?',
        isAI: true,
        timestamp: new Date(),
      }
    ]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Chat Inteligente</h2>
            <p className="text-gray-600 dark:text-gray-400">Busque informações sobre tarefas e projetos com IA</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={clearChat}>
              <i className="fas fa-broom mr-2"></i>
              Limpar Chat
            </Button>
            <Button>
              <i className="fas fa-brain mr-2"></i>
              Nova Conversa
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-white"></i>
              </div>
              <div>
                <h3 className="font-semibold">Assistente IA FAAE</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Especialista em gestão de projetos arquitetônicos
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Online
                </Badge>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {searchMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-robot text-white text-sm"></i>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-w-md">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Analisando sua consulta...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="flex items-center space-x-4 mb-4">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Digite sua pergunta sobre tarefas e projetos..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={searchMutation.isPending}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isListening || searchMutation.isPending}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    isListening 
                      ? 'text-red-500 animate-pulse' 
                      : 'text-gray-400 hover:text-blue-600'
                  }`}
                >
                  <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                </button>
              </div>
              <Button 
                type="submit" 
                disabled={!inputValue.trim() || searchMutation.isPending}
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </form>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Sugestões:</span>
              <div className="flex flex-wrap gap-2">
                {AI_SUGGESTIONS.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
