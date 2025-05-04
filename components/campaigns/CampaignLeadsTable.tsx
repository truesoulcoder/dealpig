import React from "react";
import TableAsyncPaginated from '../table-async-paginated-table';

export default function CampaignLeadsTable(props: any) {
  return <TableAsyncPaginated {...props} apiEndpoint="/api/campaigns/leads" tableType="campaignLeads" />;
}
