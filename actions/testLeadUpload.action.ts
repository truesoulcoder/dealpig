import { uploadLeads } from './leadUpload.action';
import fs from 'fs';

export async function testRawCsvUpload() {
  // Read the raw CSV file from /data
  const filePath = 'data/logs/supabase-edge-logs-ygkbhfdqvrluegsrjpaj.csv (1).csv';
  const fileBuffer = fs.readFileSync(filePath);
  const file = new File([fileBuffer], 'supabase-edge-logs-ygkbhfdqvrluegsrjpaj.csv', { type: 'text/csv' });

  // Prepare FormData
  const formData = new FormData();
  formData.append('leadCsv', file);

  // Call the server action
  const result = await uploadLeads(formData);
  console.log('Lead upload result:', result);
  return result;
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRawCsvUpload().then(console.log).catch(console.error);
}
