// This is a Server Component
import { Suspense } from 'react';
import { Card, CardBody } from "@heroui/react";
import { ImportButton, LeadsTableClient } from './client-components';
import { Spinner } from '@heroui/react';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center p-8">
      <Spinner size="lg" />
      <span className="ml-4">Loading leads...</span>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Leads Management</h1>
          <p className="text-gray-500">
            View, filter, and manage your property leads
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <ImportButton />
        </div>
      </div>

      <Card className="mb-6">
        <CardBody>
          <Suspense fallback={<LoadingFallback />}>
            <LeadsTableClient />
          </Suspense>
        </CardBody>
      </Card>
    </div>
  );
}