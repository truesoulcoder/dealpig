import React from 'react';
import { Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';

interface FileExplorerProps {
  files: Array<{name: string, size: number, lastModified: Date}>;
  selectedFile: string | null;
  onFileSelect: (fileName: string) => void;
  onFileDelete: (fileName: string) => void;
  onFileUpload: (file: File, progress: (percent: number) => void) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  selectedFile, 
  onFileSelect, 
  onFileDelete, 
  onFileUpload 
}) => {
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await onFileUpload(file, (progress) => {
        setUploadProgress(progress);
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">File Explorer</h2>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            color="primary"
            startContent={<Icon icon="lucide:upload" />}
            onPress={handleUploadClick}
            isDisabled={isUploading}
          >
            {isUploading ? `Uploading ${uploadProgress.toFixed(0)}%` : 'Upload CSV'}
          </Button>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto">
        <Table aria-label="Files table" removeWrapper>
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>SIZE</TableColumn>
            <TableColumn>MODIFIED</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No files available">
            {files.map((file) => (
              <TableRow 
                key={file.name} 
                className={selectedFile === file.name ? 'bg-primary-50' : ''}
              >
                <TableCell>
                  <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => onFileSelect(file.name)}
                  >
                    <Icon icon="lucide:file-text" className="text-primary-500" />
                    <span>{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
                <TableCell>{formatDate(file.lastModified)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="View file">
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        onPress={() => onFileSelect(file.name)}
                        aria-label="View file"
                      >
                        <Icon icon="lucide:eye" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete file">
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light" 
                        color="danger" 
                        onPress={() => onFileDelete(file.name)}
                        aria-label="Delete file"
                      >
                        <Icon icon="lucide:trash-2" />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};