'use client';

import { useEffect, useState } from 'react';
import { Progress, Card, CardBody, CardHeader } from "@heroui/react";

type ImportProgress = {
  stage: 'parsing' | 'creating_table' | 'inserting_records' | 'processing_leads' | 'complete';
  percentage: number;
  message: string;
};

export default function ImportProgressMeter({ importId }: { importId: string }) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!importId) return;
    
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/leads/import/progress?id=${importId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch import progress');
        }
        
        const data = await response.json();
        setProgress(data);
        
        // If not complete, continue polling
        if (data.stage !== 'complete') {
          setTimeout(fetchProgress, 1000);
        }
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
      case 'parsing': return 'Parsing CSV file';
      case 'creating_table': return 'Creating database table';
      case 'inserting_records': return 'Inserting records';
      case 'processing_leads': return 'Processing leads';
      case 'complete': return 'Import complete';
      default: return 'Processing...';
    }
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
          color={progress?.stage === 'complete' ? 'success' : 'primary'}
          className="w-full mb-3" 
        />
        <p className="text-sm text-gray-600 mt-2">{progress?.message}</p>
      </CardBody>
    </Card>
  );
}