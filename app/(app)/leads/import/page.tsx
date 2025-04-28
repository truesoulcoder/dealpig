"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Divider, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaDownload, FaInfoCircle } from "react-icons/fa";
import UploadCsvForm from "@/components/leads/uploadCsvForm";

export default function ImportLeadsPage() {
  const router = useRouter();

  const downloadSampleCsv = () => {
    // Create sample CSV content
    const headers = "property_address,property_city,property_state,property_zip,wholesale_value,market_value,days_on_market,mls_status,contact_name,contact_email";
    const row1 = "123 Main St,Austin,TX,78701,180000,250000,45,Active,John Smith,john@example.com";
    const row2 = "456 Elm St,Dallas,TX,75001,280000,350000,30,Coming Soon,Jane Doe,jane@example.com";
    
    const csvContent = `${headers}\n${row1}\n${row2}`;
    
    // Create a download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_leads.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Import Leads</h1>
          <p className="text-gray-500">Upload a CSV file to import property leads</p>
        </div>
        <Button 
          color="default" 
          variant="flat" 
          startContent={<FaArrowLeft />} 
          onPress={() => router.push("/leads")}
          className="mt-4 sm:mt-0"
        >
          Back to Leads
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* The new UploadCsvForm component handles both upload and processing */}
          <UploadCsvForm onImportSuccess={() => router.push("/leads")} />
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">CSV Format</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <p className="text-gray-600 mb-4">
                Your CSV file should include the following columns:
              </p>
              <ul className="list-disc pl-4 space-y-2 mb-6">
                <li><span className="font-medium">property_address</span> - Street address</li>
                <li><span className="font-medium">property_city</span> - City name</li>
                <li><span className="font-medium">property_state</span> - State code (e.g., TX)</li>
                <li><span className="font-medium">property_zip</span> - Zip code</li>
                <li><span className="font-medium">wholesale_value</span> (optional) - Estimated wholesale value</li>
                <li><span className="font-medium">market_value</span> (optional) - Estimated market value</li>
                <li><span className="font-medium">days_on_market</span> (optional) - Days on market</li>
                <li><span className="font-medium">contact_name</span> (optional) - Contact name</li>
                <li><span className="font-medium">contact_email</span> (optional) - Contact email</li>
              </ul>
              
              <div className="bg-blue-50 p-4 rounded-md mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <FaInfoCircle className="text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-blue-800">Two-Step Import Process</h3>
                    <p className="mt-1 text-sm text-blue-600">
                      Our new lead import process has two steps:
                    </p>
                    <ol className="mt-2 text-sm text-blue-600 list-decimal pl-4">
                      <li>Upload your CSV file to our secure storage</li>
                      <li>Process the file to import leads into the database</li>
                    </ol>
                    <p className="mt-2 text-sm text-blue-600">
                      This approach ensures more reliable imports, especially for larger files.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                color="default"
                variant="flat"
                startContent={<FaDownload />}
                onPress={downloadSampleCsv}
                className="w-full"
              >
                Download Sample CSV
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}