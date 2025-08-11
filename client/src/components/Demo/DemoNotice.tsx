export default function DemoNotice() {
  const isDemoMode = import.meta.env.VITE_FIREBASE_PROJECT_ID === 'demo-faae-projetos';
  
  if (!isDemoMode) return null;
  
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <i className="fas fa-exclamation-triangle text-amber-400"></i>
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-700 dark:text-amber-200">
            <strong>Modo Demonstração:</strong> Configure suas chaves Firebase no arquivo <code>.env.local</code> para ativar todas as funcionalidades.
            Consulte o arquivo <code>FIREBASE_SETUP.md</code> para instruções detalhadas.
          </p>
        </div>
      </div>
    </div>
  );
}