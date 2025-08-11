import { createTestAdminUser, TEST_ADMIN_USER } from './testUsers';

let adminUserInitialized = false;

export const initializeTestAdminUser = async () => {
  if (adminUserInitialized) {
    return;
  }

  try {
    console.log('🚀 Inicializando usuário administrador de teste...');
    console.log('📧 Email:', TEST_ADMIN_USER.email);
    console.log('🔑 Senha:', TEST_ADMIN_USER.password);
    
    await createTestAdminUser();
    adminUserInitialized = true;
    
    console.log('✅ Sistema pronto! Use as credenciais acima para fazer login como administrador.');
  } catch (error) {
    console.warn('⚠️ Erro ao criar usuário de teste:', error);
    console.log('💡 Dica: Você pode criar manualmente usando o formulário de registro.');
  }
};

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  // Only run in browser
  setTimeout(() => {
    initializeTestAdminUser();
  }, 2000); // Wait for Firebase to be ready
}