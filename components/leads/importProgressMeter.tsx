'use client';

import { useEffect, useState } from 'react';
import { Progress, Card, CardBody, CardHeader } from "@heroui/react";
import { getImportProgress } from '@/actions/ingestLeads.action';

type ImportProgress = {
  stage: 'uploading' | 'parsing' | 'creating_table' | 'inserting_records' | 'processing_leads' | 'complete' | 'error';
  percentage: number;
  message: string;
  error?: string;
};

export default function ImportProgressMeter({ importId }: { importId: string }) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!importId) return;
    
    const fetchProgress = async () => {
      try {
        // Use the server action instead of a fetch request
        const data = await getImportProgress(importId);
        
        if (data) {
          setProgress(data);
          
          // If there's an error or it's complete, stop polling
          if (data.stage === 'complete' || data.stage === 'error') {
            if (data.error) setError(data.error);
            return;
          }
        }
        
        // Continue polling
        setTimeout(fetchProgress, 1000);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    
    fetchProgress();
  }, [importId]);
  
  if (!importId || (!progress && !error)) {
    return <div className="py-4">Initializing import...</div>;
  }
  
  if (error) {
    return (
      <Card className="border-red-500">
        <CardHeader className="text-red-600 font-medium">
          Import Error
        </CardHeader>
        <CardBody>
          <p className="text-red-600">{error}</p>
        </CardBody>
      </Card>
    );
  }
  
  const getStageTitle = (stage?: string) => {
    switch(stage) {
      case 'uploading': return 'Uploading file';
      case 'parsing': return 'Parsing CSV file';
      case 'creating_table': return 'Creating database table';
      case 'inserting_records': return 'Inserting records';
      case 'processing_leads': return 'Processing leads';
      case 'complete': return 'Import complete';
      case 'error': return 'Import failed';
      default: return 'Processing...';
    }
  };
  
  const getProgressColor = (stage?: string) => {
    if (stage === 'error') return 'danger';
    if (stage === 'complete') return 'success';
    return 'primary';
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-medium">
          Import Progress: {getStageTitle(progress?.stage)}
        </h3>
      </CardHeader>
      <CardBody>
        <Progress 
          value={progress?.percentage || 0} 
          color={getProgressColor(progress?.stage)}
          className="w-full mb-3" 
        />
        <p className="text-sm text-gray-600 mt-2">{progress?.message}</p>
      </CardBody>
    </Card>
  );
}