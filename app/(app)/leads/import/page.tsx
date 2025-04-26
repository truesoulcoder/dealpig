"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardFooter, Button, Divider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaUpload, FaDownload, FaFileAlt } from "react-icons/fa";
import { uploadCsv } from "@/actions/ingestLeads.action";

export default function ImportLeadsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    totalRows?: number;
    insertedLeads?: number;
    insertedContacts?: number;
    errors?: string[];
  } | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadResult(null);
      
      const formData = new FormData();
      formData.append("file", file);
      
      console.log(`Starting upload for file: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      
      // Set a longer timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        const result = await uploadCsv(formData);
        clearTimeout(timeoutId);
        
        setUploadResult(result);
        
        if (result.success) {
          console.log('CSV import successful:', result);
        } else {
          console.error('CSV import failed:', result);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('Error during CSV upload fetch:', fetchError);
        
        // Handle network errors or timeout
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          setUploadResult({
            success: false,
            message: "The request timed out. The file might be too large or the server is busy. Try a smaller file or try again later.",
            errors: ["Request timeout"]
          });
        } else {
          setUploadResult({
            success: false,
            message: fetchError instanceof Error ? fetchError.message : "Network error occurred",
            errors: [fetchError instanceof Error ? fetchError.message : "Unknown network error"]
          });
        }
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
        errors: [error instanceof Error ? error.message : "Unknown error"]
      });
    } finally {
      setIsUploading(false);
    }
  };

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
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold">Upload CSV File</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                  <FaFileAlt className="text-gray-400 text-5xl mb-4" />
                  <p className="mb-4 text-center text-gray-600">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <input
                    type="file"
                    id="csv-upload"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="csv-upload">
                    <Button 
                      as="span" 
                      color="primary" 
                      variant="flat"
                      startContent={<FaUpload />}
                      className="cursor-pointer"
                    >
                      Select CSV File
                    </Button>
                  </label>
                  {file && (
                    <p className="mt-4 text-sm font-medium">
                      Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                    </p>
                  )}
                </div>
                
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    isLoading={isUploading}
                    isDisabled={!file || isUploading}
                    startContent={!isUploading && <FaUpload />}
                  >
                    {isUploading ? "Uploading..." : "Upload and Import Leads"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {uploadResult && (
            <Card className={`mb-6 ${uploadResult.success ? "border-green-500" : "border-red-500"}`}>
              <CardHeader className={uploadResult.success ? "bg-green-50" : "bg-red-50"}>
                <h2 className={`text-lg font-semibold ${uploadResult.success ? "text-green-700" : "text-red-700"}`}>
                  {uploadResult.success ? "Import Successful" : "Import Failed"}
                </h2>
              </CardHeader>
              <CardBody>
                <p className="mb-4">{uploadResult.message}</p>
                
                {uploadResult.success && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                      <p className="text-gray-500 text-sm">Total Rows</p>
                      <p className="text-xl font-bold">{uploadResult.totalRows}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                      <p className="text-gray-500 text-sm">Imported Leads</p>
                      <p className="text-xl font-bold">{uploadResult.insertedLeads}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                      <p className="text-gray-500 text-sm">Imported Contacts</p>
                      <p className="text-xl font-bold">{uploadResult.insertedContacts}</p>
                    </div>
                  </div>
                )}
                
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Errors:</h3>
                    <div className="bg-red-50 p-3 rounded-md max-h-40 overflow-y-auto text-sm">
                      <ul className="list-disc pl-4 space-y-1">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index} className="text-red-700">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardBody>
              <CardFooter>
                <div className="flex gap-2 w-full justify-end">
                  {uploadResult.success && (
                    <Button color="primary" onPress={() => router.push("/leads")}>
                      View All Leads
                    </Button>
                  )}
                  {!uploadResult.success && (
                    <Button color="primary" onPress={() => setUploadResult(null)}>
                      Try Again
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          )}
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