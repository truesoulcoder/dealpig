import TableAsyncPaginated from '../table-async-paginated-table';

export default function SendersManagementTable(props: any) {
  // This will wrap the generic async table for senders management
  // Pass the correct API endpoint and columns for senders
  return <TableAsyncPaginated {...props} apiEndpoint="/api/senders" tableType="senders" />;
}
