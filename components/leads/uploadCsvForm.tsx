"use client";

import { useState } from 'react';
import { FormikProvider, Form, useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, CardBody, Spinner, Accordion, AccordionItem } from '@heroui/react';
import { uploadCsv } from '@/actions/ingestLeads.action';
import ImportProgressMeter from './importProgressMeter';

interface UploadCsvFormProps {
  onImportSuccess?: () => void;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    total: number;
    success: number;
    failed: number;
    campaignName: string;
    contactsCount?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailedErrors, setDetailedErrors] = useState<string[]>([]);
  const [importId, setImportId] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      csvFile: null as File | null,
    },
    validationSchema: UploadCsvSchema,
    onSubmit: async (values) => {
      if (!values.csvFile) return;
      
      setIsLoading(true);
      setUploadStats(null);
      setError(null);
      setDetailedErrors([]);
      setImportId(null);
      
      try {
        // Create FormData to send the file
        const formData = new FormData();
        formData.append('file', values.csvFile);
        
        // Use the server action to upload the CSV
        const result = await uploadCsv(formData);
        
        // Set the importId for progress tracking
        if (result.importId) {
          setImportId(result.importId);
        }
        
        if (result.success) {
          // Get filename without extension to display as campaign name
          const filename = values.csvFile.name;
          const campaignName = filename.endsWith('.csv') 
            ? filename.slice(0, -4) 
            : filename;
            
          setUploadStats({
            total: result.totalRows,
            success: result.insertedLeads,
            failed: result.totalRows - result.insertedLeads,
            campaignName,
            contactsCount: result.contactsCount // New field to track contact count
          });
          
          // Save errors for detailed view if any
          if (result.errors && result.errors.length > 0) {
            setDetailedErrors(result.errors);
          }
          
          // If leads were successfully imported, call the success callback after a delay
          if (result.insertedLeads > 0 && onImportSuccess) {
            // Add a slight delay to allow the user to see the success message
            setTimeout(() => {
              onImportSuccess();
            }, 3000);
          }
        } else {
          console.error('Upload failed:', result.message);
          setError(result.message || 'Failed to import leads. Please try again.');
          
          // Display detailed errors if available
          if (result.errors && result.errors.length > 0) {
            setDetailedErrors(result.errors);
          }
          
          // Show partial stats if any rows were processed
          if (result.totalRows > 0) {
            setUploadStats({
              total: result.totalRows,
              success: result.insertedLeads,
              failed: result.totalRows - result.insertedLeads,
              campaignName: '',
              contactsCount: result.contactsCount
            });
          }
        }
      } catch (error) {
        console.error('Error processing CSV:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  });

  return (
    <Card>
      <CardBody>
        <FormikProvider value={formik}>
          <Form>
            <div className="space-y-4">
              <div>
                <label htmlFor="csvFile" className="block text-sm font-medium mb-1">
                  Upload Leads CSV
                </label>
                <input
                  id="csvFile"
                  name="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    formik.setFieldValue('csvFile', e.currentTarget.files?.[0] || null);
                    // Reset states when a new file is selected
                    setError(null);
                    setDetailedErrors([]);
                    setUploadStats(null);
                    setImportId(null);
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formik.errors.csvFile && formik.touched.csvFile && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.csvFile as string}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Upload a CSV file with lead information. Files should include property data and contact information. Maximum file size: 50MB.
                </p>
                <p className="mt-1 text-xs text-blue-500">
                  Note: We support multiple contacts per property. Up to 5 contacts can be processed for each property.
                </p>
              </div>

              <Button
                type="submit"
                color="primary"
                isLoading={isLoading}
                disabled={isLoading || !formik.values.csvFile}
                className="w-full"
                startContent={isLoading ? <Spinner size="sm" /> : undefined}
              >
                {isLoading ? 'Uploading...' : 'Upload CSV'}
              </Button>

              {importId && (
                <div className="mt-4">
                  <ImportProgressMeter importId={importId} />
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-medium text-red-800">Import Failed</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              )}

              {uploadStats && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium text-green-800">Import Complete: {uploadStats.campaignName}</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Total properties: {uploadStats.total}</p>
                    <p>Successfully imported: {uploadStats.success}</p>
                    {uploadStats.contactsCount !== undefined && (
                      <p>Total contacts extracted: {uploadStats.contactsCount}</p>
                    )}
                    <p>Average contacts per property: {uploadStats.contactsCount !== undefined && uploadStats.success > 0 
                      ? (uploadStats.contactsCount / uploadStats.success).toFixed(1) 
                      : 'N/A'}</p>
                    {uploadStats.failed > 0 && (
                      <p className="text-amber-700">Failed to import: {uploadStats.failed}</p>
                    )}
                  </div>
                </div>
              )}

              {detailedErrors.length > 0 && (
                <Accordion>
                  <AccordionItem title="View Error Details">
                    <div className="max-h-60 overflow-auto">
                      <ul className="list-disc pl-5 text-xs text-red-700 space-y-1">
                        {detailedErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </Form>
        </FormikProvider>
      </CardBody>
    </Card>
  );
}