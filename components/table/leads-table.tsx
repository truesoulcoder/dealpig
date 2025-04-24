import { useEffect } from 'react';
import { useState } from 'react';
import { useGetLeadsQuery } from '../generated/graphql';
import { Spinner } from '@fluentui/react-components';
import { Table } from '@fluentui/react-components/unstable';
import { useTable } from 'react-table';
import React from 'react';

export const LeadsTable = () => {
  const { data, loading, error } = useGetLeadsQuery();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (data) {
      setLeads(data.getLeads);
    }
  }, [data]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
      },
      {
        Header: 'Email',
        accessor: 'email',
      },
      {
        Header: 'Phone',
        accessor: 'phone',
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: leads });

  if (loading) return (
    <div className="py-10 flex justify-center">
      <Spinner color="primary" label="Loading..." />
    </div>
  );
  if (error) return <div>Error loading leads</div>;

  return (
    <Table {...getTableProps()} aria-label="Leads Table">
      <Table.Header>
        {headerGroups.map(headerGroup => (
          <Table.Row {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
            {headerGroup.headers.map(column => (
              <Table.Cell {...column.getHeaderProps()} key={column.id}>{column.render('Header')}</Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Header>
      <Table.Body {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <Table.Row {...row.getRowProps()} key={row.id}>
              {row.cells.map(cell => {
                return <Table.Cell {...cell.getCellProps()} key={cell.column.id}>{cell.render('Cell')}</Table.Cell>
              })}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
};