import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import FileGrid from "./FileGrid";
import FilePreview from "./FilePreview";
import type { File, Project } from "@/types";

export default function FileManager() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: files = [], isLoading: filesLoading } = useQuery<File[]>({
    queryKey: ['/api/files'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Falha no upload do arquivo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      setUploadDialogOpen(false);
      toast({
        title: "Arquivo enviado",
        description: "O arquivo foi enviado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    uploadMutation.mutate(formData);
  };

  const filteredFiles = files.filter(file => {
    // Search filter
    if (searchQuery && !file.originalName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filterType !== 'all') {
      switch (filterType) {
        case 'images':
          if (!file.mimeType.startsWith('image/')) return false;
          break;
        case 'pdfs':
          if (file.mimeType !== 'application/pdf') return false;
          break;
        case 'cad':
          if (!file.mimeType.includes('dwg') && !file.originalName.toLowerCase().endsWith('.dwg')) return false;
          break;
        case 'documents':
          if (!file.mimeType.includes('word') && !file.mimeType.includes('excel') && !file.mimeType.includes('powerpoint')) return false;
          break;
      }
    }

    // Project filter
    if (filterProject !== 'all' && file.projectId?.toString() !== filterProject) {
      return false;
    }

    return true;
  });

  const getStorageStats = () => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    const usedPercentage = (totalSize / maxSize) * 100;

    const sizeByType = {
      images: files.filter(f => f.mimeType.startsWith('image/')).reduce((sum, f) => sum + f.size, 0),
      pdfs: files.filter(f => f.mimeType === 'application/pdf').reduce((sum, f) => sum + f.size, 0),
      cad: files.filter(f => f.mimeType.includes('dwg') || f.originalName.toLowerCase().endsWith('.dwg')).reduce((sum, f) => sum + f.size, 0),
      others: files.filter(f => !f.mimeType.startsWith('image/') && f.mimeType !== 'application/pdf' && !f.mimeType.includes('dwg')).reduce((sum, f) => sum + f.size, 0),
    };

    return {
      totalSize,
      maxSize,
      usedPercentage,
      sizeByType,
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storageStats = getStorageStats();

  if (filesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Arquivos</h2>
          <p className="text-gray-600 dark:text-gray-400">Organize seus projetos e documentos</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <i className="fas fa-upload mr-2"></i>
                Upload Arquivos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload de Arquivo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Selecione o arquivo
                  </label>
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.dwg,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    disabled={uploadMutation.isPending}
                  />
                </div>
                {uploadMutation.isPending && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Enviando arquivo...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <i className="fas fa-folder-plus mr-2"></i>
            Nova Pasta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* File Browser */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold">Arquivos do Projeto</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <i className="fas fa-th-large"></i>
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <i className="fas fa-list"></i>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Input
                    placeholder="Buscar arquivos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="images">Imagens</SelectItem>
                      <SelectItem value="pdfs">PDFs</SelectItem>
                      <SelectItem value="cad">CAD</SelectItem>
                      <SelectItem value="documents">Documentos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os projetos</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <FileGrid
                files={filteredFiles}
                viewMode={viewMode}
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* File Preview */}
          {selectedFile && (
            <FilePreview file={selectedFile} />
          )}

          {/* Storage Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Armazenamento</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Usado</span>
                  <span>{formatFileSize(storageStats.totalSize)} de {formatFileSize(storageStats.maxSize)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(storageStats.usedPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-image text-green-500 mr-2"></i>
                    Imagens
                  </span>
                  <span>{formatFileSize(storageStats.sizeByType.images)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                    PDFs
                  </span>
                  <span>{formatFileSize(storageStats.sizeByType.pdfs)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-drafting-compass text-blue-500 mr-2"></i>
                    CAD
                  </span>
                  <span>{formatFileSize(storageStats.sizeByType.cad)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-file text-gray-500 mr-2"></i>
                    Outros
                  </span>
                  <span>{formatFileSize(storageStats.sizeByType.others)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Arquivos Recentes</h3>
            <div className="space-y-3">
              {files.slice(0, 5).map((file) => {
                const getFileIcon = (mimeType: string, fileName: string) => {
                  if (mimeType.startsWith('image/')) return 'fas fa-image text-green-500';
                  if (mimeType === 'application/pdf') return 'fas fa-file-pdf text-red-500';
                  if (mimeType.includes('dwg') || fileName.toLowerCase().endsWith('.dwg')) return 'fas fa-drafting-compass text-blue-500';
                  return 'fas fa-file text-gray-500';
                };

                return (
                  <div
                    key={file.id}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="w-8 h-8 rounded flex items-center justify-center">
                      <i className={getFileIcon(file.mimeType, file.originalName)}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.originalName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(file.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
