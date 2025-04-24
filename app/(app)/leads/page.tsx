"use client";

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { useRouter } from 'next/navigation';
import { FaPlus } from "react-icons/fa6";
import LeadsTable from '@/components/table/leadsTable';

export default function LeadsPage() {
  const router = useRouter();
  
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
          <Button 
            color="primary" 
            startContent={<FaPlus />}
            onClick={() => router.push('/leads/import')}
          >
            Import Leads
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardBody>
          <LeadsTable onRowClick={(leadId) => router.push(`/leads/${leadId}`)} />
        </CardBody>
      </Card>
    </div>
  );
}