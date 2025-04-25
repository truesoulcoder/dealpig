import { Button, Card, CardBody } from "@heroui/react";
import { FaPlus } from "react-icons/fa6";
import { ImportButton, LeadsTableClient } from './client-components';

export default async function LeadsPage() {
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
          <LeadsTableClient />
        </CardBody>
      </Card>
    </div>
  );
}