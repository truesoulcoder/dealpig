import Papa from 'papaparse';

export class FileStorage {
  private storage: Map<string, { content: string, size: number, lastModified: Date }>;
  
  constructor() {
    this.storage = new Map();
    this.loadFromLocalStorage();
  }
  
  private loadFromLocalStorage() {
    try {
      const storedFiles = localStorage.getItem('csv-files');
      if (storedFiles) {
        const parsedFiles = JSON.parse(storedFiles);
        Object.entries(parsedFiles).forEach(([key, value]: [string, any]) => {
          this.storage.set(key, {
            ...value,
            lastModified: new Date(value.lastModified)
          });
        });
      }
    } catch (error) {
      console.error('Error loading files from localStorage:', error);
    }
  }
  
  private saveToLocalStorage() {
    try {
      const filesObject: Record<string, any> = {};
      this.storage.forEach((value, key) => {
        filesObject[key] = value;
      });
      localStorage.setItem('csv-files', JSON.stringify(filesObject));
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
    }
  }
  
  listFiles() {
    const files: Array<{ name: string, size: number, lastModified: Date }> = [];
    this.storage.forEach((value, key) => {
      files.push({
        name: key,
        size: value.size,
        lastModified: value.lastModified
      });
    });
    return files;
  }
  
  async uploadFile(file: File, progressCallback?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const content = reader.result as string;
          
          // Validate that it's a valid CSV
          try {
            Papa.parse(content, { header: true });
          } catch (error) {
            reject(new Error('Invalid CSV format'));
            return;
          }
          
          this.storage.set(file.name, {
            content,
            size: file.size,
            lastModified: new Date()
          });
          
          this.saveToLocalStorage();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      if (progressCallback) {
        // Simulate progress since FileReader doesn't have built-in progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          progressCallback(Math.min(progress, 99));
          if (progress >= 100) {
            clearInterval(interval);
          }
        }, 100);
        
        reader.onloadend = () => {
          clearInterval(interval);
          progressCallback(100);
        };
      }
      
      reader.readAsText(file);
    });
  }
  
  async getFileContent(fileName: string): Promise<string | null> {
    const file = this.storage.get(fileName);
    return file ? file.content : null;
  }
  
  async deleteFile(fileName: string): Promise<void> {
    this.storage.delete(fileName);
    this.saveToLocalStorage();
  }
  
  parseCSV(csvContent: string): { data: any[], headers: string[] } {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });
    
    return {
      data: result.data as any[],
      headers: result.meta.fields || []
    };
  }
}
