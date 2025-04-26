"use client";

import { useState } from 'react';
import { FormikProvider, Form, useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Card, CardBody, Spinner, Accordion, AccordionItem } from '@heroui/react';
import { uploadCsv } from '@/actions/ingestLeads.action';

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
      'File size is too large (max 10MB)',
      (value: any) => !value || value?.size <= 10 * 1024 * 1024
    )
});

export default function UploadCsvForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    total: number;
    success: number;
    failed: number;
    campaignName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailedErrors, setDetailedErrors] = useState<string[]>([]);

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
      
      try {
        // Create FormData to send the file
        const formData = new FormData();
        formData.append('file', values.csvFile);
        
        // Use the server action to upload the CSV
        const result = await uploadCsv(formData);
        
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
            campaignName
          });
          
          // Save errors for detailed view if any
          if (result.errors && result.errors.length > 0) {
            setDetailedErrors(result.errors);
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
              campaignName: ''
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
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formik.errors.csvFile && formik.touched.csvFile && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.csvFile as string}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Upload a CSV file with lead information. Maximum file size: 10MB.
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

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-medium text-red-800">Import Failed</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              )}

              {uploadStats && (
                <div className={`mt-4 p-3 ${uploadStats.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'} rounded-md`}>
                  <h3 className={`font-medium ${uploadStats.failed === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                    {uploadStats.failed === 0 ? 'Upload Successful' : 'Upload Partially Successful'}
                  </h3>
                  <ul className={`mt-2 text-sm ${uploadStats.failed === 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                    <li>Total records: {uploadStats.total}</li>
                    <li>Successfully imported: {uploadStats.success}</li>
                    <li>Failed to import: {uploadStats.failed}</li>
                    {uploadStats.campaignName && (
                      <li>Campaign created: {uploadStats.campaignName} Campaign</li>
                    )}
                  </ul>
                </div>
              )}

              {detailedErrors.length > 0 && (
                <Accordion className="mt-4">
                  <AccordionItem
                    key="errors"
                    aria-label="Detailed Error Information"
                    title="View Detailed Errors"
                    subtitle={`${detailedErrors.length} errors occurred`}
                    className="bg-red-50 border border-red-200 rounded-md"
                  >
                    <div className="max-h-60 overflow-y-auto p-2">
                      <ul className="list-disc pl-5 text-sm text-red-700">
                        {detailedErrors.slice(0, 50).map((err, index) => (
                          <li key={index} className="my-1">{err}</li>
                        ))}
                        {detailedErrors.length > 50 && (
                          <li className="font-medium">...and {detailedErrors.length - 50} more errors</li>
                        )}
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