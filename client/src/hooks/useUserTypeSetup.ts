import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useUserTypeSetup() {
  const { toast } = useToast();

  const setUserTypeMutation = useMutation({
    mutationFn: async (userType: 'admin' | 'collaborator') => {
      return await apiRequest('POST', '/api/auth/set-initial-type', { userType });
    },
    onSuccess: () => {
      // Invalidate user queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      // Clear the stored user type
      localStorage.removeItem('selectedUserType');
      toast({
        title: "Tipo de usuário configurado",
        description: "Seu perfil foi configurado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error setting user type:", error);
      toast({
        title: "Erro ao configurar perfil",
        description: "Não foi possível configurar seu tipo de usuário.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Check if user selected a type before login
    const selectedUserType = localStorage.getItem('selectedUserType') as 'admin' | 'collaborator' | null;
    
    if (selectedUserType) {
      // Set the user type
      setUserTypeMutation.mutate(selectedUserType);
    }
  }, []);

  return {
    isSettingUserType: setUserTypeMutation.isPending,
  };
}