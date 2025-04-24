"use client";

import { useState } from 'react';
import { FormikProvider, Form, useFormik } from 'formik';
import * as Yup from 'yup';
import Papa from 'papaparse';
import { Button, Card, CardBody } from '@heroui/react';
import { supabase } from '@/lib/supabaseClient';

const UploadCsvSchema = Yup.object().shape({
  csvFile: Yup.mixed()
    .required('A file is required')
    .test(
      'fileFormat',
      'Unsupported file format. Please upload a CSV file.',
      (value: any) => !value || value?.name?.endsWith('.csv')
    )
});

export default function UploadCsvForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const formik = useFormik({
    initialValues: {
      csvFile: null as File | null,
    },
    validationSchema: UploadCsvSchema,
    onSubmit: async (values) => {
      if (!values.csvFile) return;
      
      setIsLoading(true);
      setUploadStats(null);
      
      try {
        // Parse the CSV file
        const results = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
          Papa.parse(values.csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject
          });
        });
        
        // Process the data and insert into Supabase
        let successCount = 0;
        let failedCount = 0;
        
        for (const row of results.data) {
          // Transform field names to match the database schema
          const lead = {
            property_address: row.property_address || row.address || '',
            property_city: row.property_city || row.city || '',
            property_state: row.property_state || row.state || '',
            property_zip: row.property_zip || row.zip || '',
            wholesale_value: parseFloat(row.wholesale_value || '0') || 0,
            market_value: parseFloat(row.market_value || '0') || 0,
            days_on_market: parseInt(row.days_on_market || '0') || 0,
            mls_status: row.mls_status || '',
            mls_list_date: row.mls_list_date || null,
            mls_list_price: parseFloat(row.mls_list_price || '0') || null,
            status: row.status || 'new',
            email_status: 'pending',
            source_id: row.source_id || null
          };

          const { error } = await supabase.from('leads').insert(lead);
          
          if (error) {
            console.error('Error inserting lead:', error.message);
            failedCount++;
          } else {
            successCount++;
          }
        }
        
        setUploadStats({
          total: results.data.length,
          success: successCount,
          failed: failedCount
        });
        
      } catch (error) {
        console.error('Error processing CSV:', error);
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
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formik.errors.csvFile && formik.touched.csvFile && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.csvFile as string}</p>
                )}
              </div>

              <Button
                type="submit"
                color="primary"
                isLoading={isLoading}
                disabled={isLoading || !formik.values.csvFile}
                className="w-full"
              >
                {isLoading ? 'Uploading...' : 'Upload CSV'}
              </Button>

              {uploadStats && (
                <div className="mt-4 p-3 bg-green-50 rounded-md">
                  <h3 className="font-medium text-green-800">Upload Summary</h3>
                  <ul className="mt-2 text-sm text-green-700">
                    <li>Total records: {uploadStats.total}</li>
                    <li>Successfully imported: {uploadStats.success}</li>
                    <li>Failed to import: {uploadStats.failed}</li>
                  </ul>
                </div>
              )}
            </div>
          </Form>
        </FormikProvider>
      </CardBody>
    </Card>
  );
}