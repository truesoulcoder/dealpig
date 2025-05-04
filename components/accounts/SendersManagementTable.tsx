import React from "react";
import TableAsyncPaginated from '../table-async-paginated-table';

export default function SendersManagementTable(props: any) {
  return <TableAsyncPaginated {...props} apiEndpoint="/api/senders" tableType="senders" />;
}
