import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { File } from "@/types";

interface FilePreviewProps {
  file: File;
}

export default function FilePreview({ file }: FilePreviewProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) {
      return 'fas fa-image text-green-500';
    } else if (mimeType === 'application/pdf') {
      return 'fas fa-file-pdf text-red-500';
    } else if (mimeType.includes('dwg') || fileName.toLowerCase().endsWith('.dwg')) {
      return 'fas fa-drafting-compass text-blue-500';
    } else if (mimeType.includes('word')) {
      return 'fas fa-file-word text-blue-600';
    } else if (mimeType.includes('excel')) {
      return 'fas fa-file-excel text-green-600';
    } else if (mimeType.includes('powerpoint')) {
      return 'fas fa-file-powerpoint text-orange-600';
    } else {
      return 'fas fa-file text-gray-500';
    }
  };

  const canPreview = file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf';
  const previewUrl = canPreview ? `/api/files/${file.id}/download` : null;

  const handleDownload = () => {
    window.open(`/api/files/${file.id}/download`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Preview do Arquivo</h3>
      
      {/* File Preview */}
      <div className="mb-4">
        {previewUrl && file.mimeType.startsWith('image/') ? (
          <img
            src={previewUrl}
            alt={file.originalName}
            className="w-full h-48 rounded-lg object-cover"
          />
        ) : previewUrl && file.mimeType === 'application/pdf' ? (
          <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <i className="fas fa-file-pdf text-red-500 text-4xl mb-2"></i>
              <p className="text-sm text-gray-600 dark:text-gray-400">PDF Document</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <i className={`${getFileIcon(file.mimeType, file.originalName)} text-4xl mb-2`}></i>
              <p className="text-sm text-gray-600 dark:text-gray-400">Preview não disponível</p>
            </div>
          </div>
        )}
      </div>

      {/* File Details */}
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {file.originalName}
          </h4>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
            <span className="font-medium">{file.mimeType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Tamanho:</span>
            <span className="font-medium">{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Criado:</span>
            <span className="font-medium">
              {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 space-y-2">
          <Button onClick={handleDownload} className="w-full">
            <i className="fas fa-download mr-2"></i>
            Download
          </Button>
          
          {previewUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(previewUrl, '_blank')}
              className="w-full"
            >
              <i className="fas fa-external-link-alt mr-2"></i>
              Abrir em nova aba
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
