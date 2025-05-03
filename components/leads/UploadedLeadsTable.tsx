import TableAsyncPaginated from '../table-async-paginated-table';

export default function UploadedLeadsTable(props: any) {
  // This will wrap the generic async table for uploaded leads
  // Pass the correct API endpoint and columns for uploaded leads
  return <TableAsyncPaginated {...props} apiEndpoint="/api/leads/data" tableType="uploadedLeads" />;
}
