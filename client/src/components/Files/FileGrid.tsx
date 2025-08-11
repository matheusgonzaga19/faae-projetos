import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { File } from "@/types";

interface FileGridProps {
  files: File[];
  viewMode: 'grid' | 'list';
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export default function FileGrid({ files, viewMode, onFileSelect, selectedFile }: FileGridProps) {
  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) {
      return 'fas fa-image text-green-500';
    } else if (mimeType === 'application/pdf') {
      return 'fas fa-file-pdf text-red-500';
    } else if (mimeType.includes('dwg') || fileName.toLowerCase().endsWith('.dwg')) {
      return 'fas fa-drafting-compass text-blue-500';
    } else if (mimeType.includes('word') || fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx')) {
      return 'fas fa-file-word text-blue-600';
    } else if (mimeType.includes('excel') || fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx')) {
      return 'fas fa-file-excel text-green-600';
    } else if (mimeType.includes('powerpoint') || fileName.toLowerCase().endsWith('.ppt') || fileName.toLowerCase().endsWith('.pptx')) {
      return 'fas fa-file-powerpoint text-orange-600';
    } else if (mimeType.startsWith('video/')) {
      return 'fas fa-file-video text-purple-500';
    } else if (mimeType.startsWith('audio/')) {
      return 'fas fa-file-audio text-pink-500';
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
      return 'fas fa-file-archive text-yellow-600';
    } else {
      return 'fas fa-file text-gray-500';
    }
  };

  const getFilePreviewImage = (file: File) => {
    if (file.mimeType.startsWith('image/')) {
      return `/api/files/${file.id}/download`;
    }
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (file: File, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/files/${file.id}/download`, '_blank');
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-folder-open text-gray-400 text-2xl"></i>
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Nenhum arquivo encontrado
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Faça upload dos seus arquivos para começar
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
          <div className="col-span-5">Nome</div>
          <div className="col-span-2">Tamanho</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2">Modificado</div>
          <div className="col-span-1">Ações</div>
        </div>
        {files.map((file) => (
          <div
            key={file.id}
            className={`grid grid-cols-12 gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
              selectedFile?.id === file.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''
            }`}
            onClick={() => onFileSelect(file)}
          >
            <div className="col-span-5 flex items-center space-x-3">
              <i className={getFileIcon(file.mimeType, file.originalName)}></i>
              <span className="font-medium truncate">{file.originalName}</span>
            </div>
            <div className="col-span-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
              {formatFileSize(file.size)}
            </div>
            <div className="col-span-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
              {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
            </div>
            <div className="col-span-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
              {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true, locale: ptBR })}
            </div>
            <div className="col-span-1 flex items-center">
              <button
                onClick={(e) => handleDownload(file, e)}
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Download"
              >
                <i className="fas fa-download"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => {
        const previewImage = getFilePreviewImage(file);
        
        return (
          <div
            key={file.id}
            className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md cursor-pointer transition-all group ${
              selectedFile?.id === file.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => onFileSelect(file)}
          >
            {/* File Preview */}
            <div className="w-full h-32 rounded-lg flex items-center justify-center mb-3 bg-white dark:bg-gray-600 overflow-hidden">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={file.originalName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className={`${getFileIcon(file.mimeType, file.originalName)} text-3xl`}></i>
              )}
            </div>

            {/* File Info */}
            <h4 className="font-semibold text-sm mb-1 truncate group-hover:text-blue-600 transition-colors">
              {file.originalName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {formatFileSize(file.size)} • {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
            </p>

            {/* File Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
              <button
                onClick={(e) => handleDownload(file, e)}
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Download"
              >
                <i className="fas fa-download"></i>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
