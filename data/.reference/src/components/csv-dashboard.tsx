import React from 'react';
import { FileExplorer } from './file-explorer';
import { ConsoleLog } from './console-log';
import { DataTable } from './data-table';
import { FileStorage } from '../services/file-storage';
import { Card, CardBody } from '@heroui/react';

export const CSVDashboard: React.FC = () => {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [consoleMessages, setConsoleMessages] = React.useState<Array<{type: 'info' | 'error' | 'success', message: string}>>([]);
  const [csvData, setCsvData] = React.useState<any[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [files, setFiles] = React.useState<{name: string, size: number, lastModified: Date}[]>([]);
  
  const fileStorage = React.useMemo(() => new FileStorage(), []);
  
  React.useEffect(() => {
    // Load initial files
    const storedFiles = fileStorage.listFiles();
    setFiles(storedFiles);
    addConsoleMessage('info', 'File explorer initialized');
  }, [fileStorage]);
  
  const addConsoleMessage = (type: 'info' | 'error' | 'success', message: string) => {
    setConsoleMessages(prev => [...prev, { type, message }]);
  };
  
  const handleFileUpload = async (file: File, progress: (percent: number) => void) => {
    try {
      addConsoleMessage('info', `Uploading ${file.name}...`);
      await fileStorage.uploadFile(file, progress);
      addConsoleMessage('success', `Successfully uploaded ${file.name}`);
      
      // Refresh file list
      const updatedFiles = fileStorage.listFiles();
      setFiles(updatedFiles);
    } catch (error) {
      addConsoleMessage('error', `Error uploading ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleFileSelect = async (fileName: string) => {
    try {
      setSelectedFile(fileName);
      addConsoleMessage('info', `Loading ${fileName}...`);
      
      const fileContent = await fileStorage.getFileContent(fileName);
      if (fileContent) {
        const { data, headers } = fileStorage.parseCSV(fileContent);
        setCsvData(data);
        setHeaders(headers);
        addConsoleMessage('success', `Successfully loaded ${fileName}`);
      }
    } catch (error) {
      addConsoleMessage('error', `Error loading ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
      setCsvData([]);
      setHeaders([]);
    }
  };
  
  const handleFileDelete = async (fileName: string) => {
    try {
      addConsoleMessage('info', `Deleting ${fileName}...`);
      await fileStorage.deleteFile(fileName);
      
      // Refresh file list
      const updatedFiles = fileStorage.listFiles();
      setFiles(updatedFiles);
      
      // Clear selected file if it was deleted
      if (selectedFile === fileName) {
        setSelectedFile(null);
        setCsvData([]);
        setHeaders([]);
      }
      
      addConsoleMessage('success', `Successfully deleted ${fileName}`);
    } catch (error) {
      addConsoleMessage('error', `Error deleting ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">CSV File Explorer & Viewer</h1>
      
      {/* Top section: File Explorer and Console Log */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <Card className="h-[400px]">
            <CardBody>
              <FileExplorer 
                files={files}
                onFileSelect={handleFileSelect}
                onFileDelete={handleFileDelete}
                onFileUpload={handleFileUpload}
                selectedFile={selectedFile}
              />
            </CardBody>
          </Card>
        </div>
        <div className="w-full md:w-1/2">
          <Card className="h-[400px]">
            <CardBody>
              <ConsoleLog messages={consoleMessages} />
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Bottom section: Data Table */}
      <Card className="w-full">
        <CardBody>
          <DataTable 
            data={csvData} 
            headers={headers}
            fileName={selectedFile}
          />
        </CardBody>
      </Card>
    </div>
  );
}