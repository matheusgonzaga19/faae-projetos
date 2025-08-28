import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { queryClient } from "@/lib/queryClient";

export function useWebSocket() {
  const enabled = import.meta.env.VITE_WEBSOCKET_ENABLED === 'true';
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!isAuthenticated || !user) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttempts.current = 0;
        
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'connected':
        console.log("WebSocket connection established:", message.message);
        break;

      case 'task_created':
        toast({
          title: "Nova tarefa criada",
          description: `Tarefa "${message.data.title}" foi criada`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;

      case 'task_updated':
        toast({
          title: "Tarefa atualizada",
          description: `Tarefa "${message.data.title}" foi atualizada`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;

      case 'project_created':
        toast({
          title: "Novo projeto criado",
          description: `Projeto "${message.data.name}" foi criado`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        break;

      case 'comment_added':
        toast({
          title: "Novo comentário",
          description: "Um comentário foi adicionado à tarefa",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks', message.data.taskId] });
        break;

      case 'notification':
        toast({
          title: message.data.title,
          description: message.data.message,
          variant: message.data.type === 'error' ? 'destructive' : 'default',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        break;

      default:
        console.log("Unknown WebSocket message type:", message.type);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Component unmounting");
      wsRef.current = null;
    }
  };

  useEffect(() => {
    if (enabled && isAuthenticated && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, isAuthenticated, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected: enabled && wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect,
  };
}
