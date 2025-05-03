import TableAsyncPaginated from '../table-async-paginated-table';

export default function CampaignLeadsTable(props: any) {
  // This will wrap the generic async table for campaign leads
  // Pass the correct API endpoint and columns for campaign leads
  return <TableAsyncPaginated {...props} apiEndpoint="/api/campaigns/leads" tableType="campaignLeads" />;
}
