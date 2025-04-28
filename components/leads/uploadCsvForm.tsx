"use client";

import { useState, useEffect } from 'react';
import { FormikProvider, Form, useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, CardBody, Spinner, Accordion, AccordionItem } from '@heroui/react';
import { uploadLeadFile, parseLeadFile, getImportProgress } from '@/actions/ingestLeads.action';
import { FaUpload, FaArrowRight } from 'react-icons/fa';

interface UploadCsvFormProps {
  onImportSuccess?: () => void;
}

// Form validation schema
const UploadCsvSchema = Yup.object().shape({
  csvFile: Yup.mixed()
    .required('A file is required')
    .test(
      'fileFormat',
      'Unsupported file format. Please upload a CSV file.',
      (value: any) => !value || value?.name?.endsWith('.csv')
    )
    .test(
      'fileSize',
      'File size is too large (max 50MB)',
      (value: any) => !value || value?.size <= 50 * 1024 * 1024
    )
});

export default function UploadCsvForm({ onImportSuccess }: UploadCsvFormProps) {
  // State for upload process
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    fileId: string;
    fileName: string;
    message: string;
    error?: string;
  } | null>(null);
  const [processResult, setProcessResult] = useState<{
    success: boolean;
    totalRows: number;
    insertedLeads: number;
    contactsCreated?: number;
    message: string;
    error?: string;
  } | null>(null);
  const [progress, setProgress] = useState<{
    stage: string;
    percentage: number;
    message: string;
  } | null>(null);
  
  // Formik setup
  const formik = useFormik({
    initialValues: {
      csvFile: null as File | null,
    },
    validationSchema: UploadCsvSchema,
    onSubmit: handleUpload
  });

  // Set up progress polling when we have a fileId
  useEffect(() => {
    if (!uploadResult?.fileId || !uploadResult.success) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const progressData = await getImportProgress(uploadResult.fileId);
        if (progressData) {
          setProgress(progressData);
          
          if (progressData.stage === 'complete' || progressData.stage === 'error') {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 1000);
    
    return () => clearInterval(pollInterval);
  }, [uploadResult?.fileId, uploadResult?.success]);
  
  // Function to handle file upload (step 1)
  async function handleUpload(values: { csvFile: File | null }) {
    if (!values.csvFile) return;
    
    setIsUploading(true);
    setUploadResult(null);
    setProcessResult(null);
    setProgress(null);
    
    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', values.csvFile);
      
      // Upload the file to storage
      const result = await uploadLeadFile(formData);
      setUploadResult(result);
    } catch (error) {
      setUploadResult({
        success: false,
        fileId: '',
        fileName: values.csvFile.name,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsUploading(false);
    }
  }
  
  // Function to handle file processing (step 2)
  async function handleProcess() {
    if (!uploadResult?.fileId) return;
    
    setIsProcessing(true);
    
    try {
      // Process the uploaded file
      const result = await parseLeadFile(uploadResult.fileId);
      
      setProcessResult({
        success: result.success,
        totalRows: result.totalRows,
        insertedLeads: result.insertedLeads,
        contactsCreated: result.contactsCreated,
        message: result.message,
        error: result.errors?.[0]
      });
      
      // If leads were successfully imported, call the success callback after a delay
      if (result.success && result.insertedLeads > 0 && onImportSuccess) {
        setTimeout(() => {
          onImportSuccess();
        }, 3000);
      }
    } catch (error) {
      setProcessResult({
        success: false,
        totalRows: 0,
        insertedLeads: 0,
        message: 'Processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  }
  
  // Function to reset the form
  function handleReset() {
    formik.resetForm();
    setUploadResult(null);
    setProcessResult(null);
    setProgress(null);
  }

  // Function to calculate background color for progress bar
  function getProgressBarColor() {
    if (!progress) return 'bg-blue-500';
    
    if (progress.stage === 'error') return 'bg-red-500';
    if (progress.stage === 'complete') return 'bg-green-500';
    return 'bg-blue-500';
  }

  return (
    <Card>
      <CardBody>
        <FormikProvider value={formik}>
          <Form>
            <div className="space-y-6">
              {/* Step 1: File Upload */}
              <div>
                <label htmlFor="csvFile" className="block text-sm font-medium mb-1">
                  Step 1: Upload CSV File
                </label>
                <input
                  id="csvFile"
                  name="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    formik.setFieldValue('csvFile', e.currentTarget.files?.[0] || null);
                    setUploadResult(null);
                    setProcessResult(null);
                    setProgress(null);
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  disabled={isUploading || isProcessing || !!processResult}
                />
                {formik.errors.csvFile && formik.touched.csvFile && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.csvFile as string}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Upload a CSV file with lead information. Files should include property data and contact information. Maximum file size: 50MB.
                </p>
                
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isUploading}
                  disabled={!formik.values.csvFile || isUploading || !!uploadResult?.success}
                  className="mt-4"
                  startContent={!isUploading && <FaUpload />}
                >
                  {isUploading ? 'Uploading...' : 'Upload CSV'}
                </Button>
              </div>
              
              {/* Upload Progress */}
              {progress && (
                <div className="mt-4">
                  <div className="mb-2 flex justify-between">
                    <p className="text-sm font-medium">{progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)}</p>
                    <p className="text-sm text-gray-500">{progress.percentage}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getProgressBarColor()}`}
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm">{progress.message}</p>
                </div>
              )}
              
              {/* Step 2: Process File */}
              {uploadResult?.success && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h3 className="text-base font-medium">Step 2: Process File</h3>
                  <p className="mt-1 text-sm text-gray-600 mb-4">
                    File "{uploadResult.fileName}" has been uploaded successfully. You can now process it to import the leads.
                  </p>
                  <Button
                    color="success"
                    onClick={handleProcess}
                    isLoading={isProcessing}
                    disabled={isProcessing || !!processResult}
                    startContent={!isProcessing && <FaArrowRight />}
                  >
                    {isProcessing ? 'Processing...' : 'Process File'}
                  </Button>
                </div>
              )}
              
              {/* Upload Error */}
              {uploadResult && !uploadResult.success && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-medium text-red-800">Upload Failed</h3>
                  <p className="mt-1 text-sm text-red-700">{uploadResult.message}</p>
                  {uploadResult.error && (
                    <p className="mt-1 text-xs text-red-600">{uploadResult.error}</p>
                  )}
                  <Button
                    color="primary"
                    onClick={handleReset}
                    size="sm"
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              {/* Process Results */}
              {processResult && (
                <div className={`mt-4 p-3 ${processResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} rounded-md`}>
                  <h3 className={`font-medium ${processResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {processResult.success ? 'Import Completed' : 'Import Failed'}
                  </h3>
                  <p className={`mt-1 text-sm ${processResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {processResult.message}
                  </p>
                  
                  {processResult.success && (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-gray-500 text-xs">Total Rows</p>
                        <p className="font-bold">{processResult.totalRows}</p>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-gray-500 text-xs">Imported Leads</p>
                        <p className="font-bold">{processResult.insertedLeads}</p>
                      </div>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-gray-500 text-xs">Contacts Created</p>
                        <p className="font-bold">{processResult.contactsCreated || 0}</p>
                      </div>
                    </div>
                  )}
                  
                  {processResult.error && (
                    <Accordion className="mt-2">
                      <AccordionItem title="View Error Details">
                        <p className="text-xs text-red-700">{processResult.error}</p>
                      </AccordionItem>
                    </Accordion>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      color="primary"
                      onClick={handleReset}
                      size="sm"
                    >
                      Import Another File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Form>
        </FormikProvider>
      </CardBody>
    </Card>
  );
}