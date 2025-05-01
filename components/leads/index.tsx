'use client';

import React, { useState, useCallback } from 'react';
import UploadForm from './UploadForm';
import FileExplorer from './FileExplorer'; // Placeholder
import SourceSelector from './SourceSelector';
import LeadsTable from './LeadsTable';

export default function LeadsSection() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  // State to trigger refetch in SourceSelector after upload
  const [uploadCounter, setUploadCounter] = useState(0); 

  const handleSourceChange = useCallback((sourceId: string | null) => {
    setSelectedSourceId(sourceId);
  }, []);

  const handleUploadComplete = useCallback((sourceId: string) => {
    console.log('Upload complete for new source:', sourceId);
    // Increment counter to trigger useEffect in SourceSelector
    setUploadCounter(prev => prev + 1); 
    // Optionally, automatically select the newly uploaded source
    // setSelectedSourceId(sourceId); 
  }, []);

  return (
    <div className="space-y-6">
      {/* Row 1: Upload and File Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UploadForm onUploadComplete={handleUploadComplete} />
        <FileExplorer /> {/* Placeholder for now */}
      </div>

      {/* Row 2: Source Selector and Leads Table */}
      <div className="space-y-4">
        <SourceSelector 
          key={uploadCounter} // Force re-render/refetch when upload completes
          selectedSourceId={selectedSourceId} 
          onSourceChange={handleSourceChange} 
        />
        <LeadsTable sourceId={selectedSourceId} />
      </div>
    </div>
  );
}