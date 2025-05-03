import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  Tooltip,
  ChipProps,
  Selection
} from '@heroui/react';
import type { SortDescriptor as LibrarySortDescriptor, SortDirection as LibrarySortDirection } from '@react-types/shared';
import { getSenders, updateSender, deleteSender } from '@/actions/senders.action';
import type { Sender } from '@/helpers/types';

// Extend Sender type locally if needed
interface ExtendedSender extends Sender {
  is_authorized: boolean;
  expired: boolean;
}

// Column definitions
interface Column { uid: ColumnUid; name: string; sortable: boolean; }
const columns: Column[] = [
  { uid: 'sender', name: 'Sender', sortable: true },
  { uid: 'email', name: 'Email', sortable: true },
  { uid: 'title', name: 'Title', sortable: true },
  { uid: 'quota', name: 'Quota', sortable: true },
  { uid: 'sent', name: 'Sent', sortable: true },
  { uid: 'status', name: 'Status', sortable: true },
  { uid: 'lastSent', name: 'Last Sent', sortable: true },
  { uid: 'actions', name: 'Actions', sortable: false },
];

type ColumnUid = 'sender' | 'email' | 'title' | 'quota' | 'sent' | 'status' | 'lastSent' | 'actions';
type SortDescriptor = LibrarySortDescriptor;
type SortDirection = LibrarySortDirection;

// Helper function to determine sender status
const getSenderStatus = (sender: Sender): string => {
  if ('is_authorized' in sender && !sender.is_authorized) return 'unauthorized';
  if ('expired' in sender && sender.expired) return 'expired';
  return 'authorized';
};

const SendersTable: FC = () => {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [visibleCols, setVisibleCols] = useState<Selection>(new Set(columns.map(c => c.uid)));
  const [sortDesc, setSortDesc] = useState<SortDescriptor>({ column: 'sender', direction: 'ascending' });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getSenders();
      setSenders(data);
      setLoading(false);
    })();
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Delete this sender?')) {
      await deleteSender(id);
      setSenders(await getSenders());
    }
  }, []);

  const handleUpdate = useCallback(async (s: Sender) => {
    await updateSender(s);
    setSenders(await getSenders());
  }, []);

  const filtered = useMemo(() => {
    return senders.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [senders, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const { column, direction } = sortDesc;
      const aVal = (a as any)[column];
      const bVal = (b as any)[column];
      if (aVal < bVal) return direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  const renderCell = (s: Sender, col: ColumnUid) => {
    switch(col) {
      case 'sender': return <User name={s.name} description={s.email} avatarProps={{ radius:'lg', src:'' }}>{s.name}</User>;
      case 'email': return s.email;
      case 'title': return s.title;
      case 'quota': return `${s.daily_quota} / day`;
      case 'sent': return s.emails_sent;
      case 'status': return <Chip>{getSenderStatus(s)}</Chip>;
      case 'lastSent': return s.last_sent_at ? new Date(s.last_sent_at).toLocaleDateString() : 'Never';
      case 'actions': return <><Button size='sm' onPress={()=>handleUpdate(s)}>Edit</Button><Button size='sm' color='danger' onPress={()=>handleDelete(s.id)}>Delete</Button></>;
    }
  };

  return (
    <div>
      <Input placeholder='Search senders' value={search} onValueChange={setSearch} />
      <Dropdown>
        <DropdownTrigger><Button>Columns</Button></DropdownTrigger>
        <DropdownMenu selectionMode='multiple' selectedKeys={visibleCols} onSelectionChange={setVisibleCols}>
          {columns.map(c=> <DropdownItem key={c.uid}>{c.name}</DropdownItem>)}
        </DropdownMenu>
      </Dropdown>
      <Table
        isHeaderSticky
        sortDescriptor={sortDesc}
        onSortChange={setSortDesc}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
      >
        <TableHeader columns={columns}>
          {col=> <TableColumn key={col.uid} allowsSorting={col.sortable}>{col.name}</TableColumn>}
        </TableHeader>
        <TableBody items={pageItems} emptyContent='No senders'>
          {s=> <TableRow key={s.id}>{colKey=><TableCell>{renderCell(s,colKey as ColumnUid)}</TableCell>}</TableRow>}
        </TableBody>
      </Table>
      <div>
        <Button onPress={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</Button>
        <Button onPress={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next</Button>
        <select value={pageSize} onChange={(e: ChangeEvent<HTMLSelectElement>)=>{setPageSize(Number(e.target.value));setPage(1);}}>
          {[5,10,20].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

export default SendersTable;

