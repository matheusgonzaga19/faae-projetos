// Test users for development and demonstration
export const TEST_ADMIN_USER = {
  email: 'admin@faae.com',
  password: 'admin123',
  firstName: 'Administrador',
  lastName: 'FAAE',
  role: 'admin' as const,
  displayName: 'Administrador FAAE'
};

export const createTestAdminUser = async () => {
  const { registerUser } = await import('@/lib/firebase');
  
  try {
    console.log('🔧 Criando usuário administrador de teste...');
    const result = await registerUser(
      TEST_ADMIN_USER.email,
      TEST_ADMIN_USER.password,
      TEST_ADMIN_USER.firstName,
      TEST_ADMIN_USER.lastName,
      TEST_ADMIN_USER.role
    );
    
    console.log('✅ Usuário administrador criado com sucesso!');
    return result;
  } catch (error: any) {
    if (error.message.includes('email já está em uso')) {
      console.log('ℹ️ Usuário administrador já existe');
      return { message: 'Admin user already exists' };
    }
    throw error;
  }
};

// Demo users for testing (when in demo mode)
export const demoUsers = [
  {
    id: 'admin-demo-123',
    email: 'admin@faae.com',
    firstName: 'Administrador',
    lastName: 'FAAE',
    role: 'admin' as const,
    isActive: true,
    profileImageUrl: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-08-09'),
  },
  {
    id: 'colaborador-demo-456',
    email: 'colaborador@faae.com',
    firstName: 'Maria',
    lastName: 'Silva',
    role: 'colaborador' as const,
    isActive: true,
    profileImageUrl: null,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-08-09'),
  },
  {
    id: 'arquiteto-demo-789',
    email: 'arquiteto@faae.com',
    firstName: 'João',
    lastName: 'Santos',
    role: 'colaborador' as const,
    isActive: true,
    profileImageUrl: null,
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-08-09'),
  }
];