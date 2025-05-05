// @ts-nocheck

import type { Key, Selection, SortDescriptor, SortDirection } from "@heroui/react";

"use client";
import { Button, Input, Card, CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Tooltip, Badge } from "@heroui/react";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DotsIcon } from "@/components/icons/accounts/dots-icon";
import { ExportIcon } from "@/components/icons/accounts/export-icon";
import { InfoIcon } from "@/components/icons/accounts/info-icon";
import { TrashIcon } from "@/components/icons/accounts/trash-icon";
import { HouseIcon } from "@/components/icons/breadcrumb/house-icon";
import { UsersIcon } from "@/components/icons/breadcrumb/users-icon";
import { AddSender } from "./addSender";
import { getSenders } from "@/lib/database";
import { Sender } from "@/helpers/types";

// Add the RefreshIcon component
export const RefreshIcon = ({size = 24, width, height, ...props}) => {
  return (
    <svg
      aria-hidden="true" 
      fill="none"
      focusable="false"
      height={size || height}
      role="presentation"
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path
        d="M21.1679 8C19.6247 4.46819 16.1006 2 11.9999 2C6.81486 2 2.55145 5.94668 2.04932 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M2.88146 16C4.42458 19.5318 7.94874 22 12.0494 22C17.2344 22 21.4978 18.0533 22 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M7.04932 16H2.64932C2.31795 16 2.04932 16.2686 2.04932 16.6V21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
};

// Add the vertical dots icon for consistency
export const VerticalDotsIcon = ({size = 24, width, height, ...props}) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size || height}
      role="presentation"
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path
        d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
        fill="currentColor"
      />
    </svg>
  );
};

const statusColorMap = {
  authorized: "success",
  unauthorized: "warning",
  expired: "danger",
};

// Helper function to determine sender status
const getSenderStatus = (sender) => {
  if (!sender.oauth_token) return "unauthorized";
  // Check if token might be expired - this would need more logic in a real app
  return "authorized";
};

import { useSearchParams } from "next/navigation";

export const Accounts = () => {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredSenders, setFilteredSenders] = useState<Sender[]>([]);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "name" as Key, direction: "ascending" as SortDirection });

  useEffect(() => {
    loadSenders();
  }, []);

  // Feedback effect for OAuth callback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('success')) {
        setFeedback({ type: 'success', message: 'Gmail account authorized successfully!' });
        // Remove query param from URL without reload
        params.delete('success');
        window.history.replaceState({}, '', window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
      } else if (params.has('error')) {
        setFeedback({ type: 'error', message: decodeURIComponent(params.get('error') || 'Unknown error') });
        params.delete('error');
        window.history.replaceState({}, '', window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
      }
    }
  }, []);

  const filterSenders = useCallback(() => {
    if (!searchQuery) {
      setFilteredSenders(senders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = senders.filter(sender => 
      sender.name?.toLowerCase().includes(query) || 
      sender.email?.toLowerCase().includes(query) ||
      (sender.title && sender.title.toLowerCase().includes(query))
    );
    
    setFilteredSenders(filtered);
  }, [searchQuery, senders]);

  useEffect(() => {
    if (senders.length > 0) {
      filterSenders();
    }
  }, [senders, searchQuery, filterSenders]);

  const loadSenders = async () => {
    setIsLoading(true);
    try {
      const sendersData = await getSenders();
      setSenders(sendersData);
      setFilteredSenders(sendersData);
    } catch (error) {
      console.error('Error loading senders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (senders.length === 0) {
      alert('No senders to export');
      return;
    }

    // Create CSV content
    const headers = ['Name', 'Email', 'Title', 'Emails Sent', 'Daily Quota', 'Last Sent'];
    const csvContent = [
      headers.join(','),
      ...filteredSenders.map(sender => [
        sender.name,
        sender.email,
        sender.title || '',
        sender.emails_sent || '0',
        sender.daily_quota || '100',
        sender.last_sent_at ? new Date(sender.last_sent_at).toLocaleString() : 'Never'
      ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `email-senders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshOAuth = (senderId: string) => {
    // Redirect to refresh OAuth page
    window.location.href = `/api/auth/gmail/refresh?sender_id=${senderId}`;
  };

  const deleteSender = async (senderId: string) => {
    if (!confirm('Are you sure you want to delete this sender? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/senders/${senderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh sender list
        loadSenders();
      } else {
        alert('Failed to delete sender');
      }
    } catch (error) {
      console.error('Error deleting sender:', error);
      alert('An error occurred while deleting the sender');
    }
  };

  // Calculate pagination
  const pages = Math.ceil(filteredSenders.length / rowsPerPage) || 1;
  const pageItems = filteredSenders.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  
  // Sort items
  const sortedItems = React.useMemo(() => {
    return [...pageItems].sort((a: Sender, b: Sender) => {
      let first, second;
      
      switch (sortDescriptor.column) {
        case "name":
          first = a.name || '';
          second = b.name || '';
          break;
        case "email":
          first = a.email || '';
          second = b.email || '';
          break;
        case "title":
          first = a.title || '';
          second = b.title || '';
          break;
        case "emails_sent":
          first = a.emails_sent || 0;
          second = b.emails_sent || 0;
          break;
        case "daily_quota":
          first = a.daily_quota || 0;
          second = b.daily_quota || 0;
          break;
        case "last_sent_at":
          first = a.last_sent_at ? new Date(a.last_sent_at).getTime() : 0;
          second = b.last_sent_at ? new Date(b.last_sent_at).getTime() : 0;
          break;
        case "status":
          first = getSenderStatus(a);
          second = getSenderStatus(b);
          break;
        default:
          first = a[sortDescriptor.column] || '';
          second = b[sortDescriptor.column] || '';
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [pageItems, sortDescriptor]);

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);
  
  const onClear = () => {
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
      {feedback && (
        <div className={`mb-4 rounded px-4 py-3 border ${feedback.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700'} flex items-center justify-between`} role="alert">
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-4 text-xl font-bold focus:outline-none">&times;</button>
        </div>
      )}
      <ul className="flex">
        <li className="flex gap-2">
          <HouseIcon />
          <Link href={"/"}>
            <span>Home</span>
          </Link>
          <span> / </span>{" "}
        </li>

        <li className="flex gap-2">
          <UsersIcon />
          <span>Senders</span>
        </li>
      </ul>

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h3 className="text-xl font-semibold">Email Senders</h3>
            <p className="text-sm text-gray-500">Manage all your Gmail senders for campaigns</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <AddSender />
            <Button color="primary" startContent={<ExportIcon />} onPress={handleExportCSV}>
              Export to CSV
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-end">
              <Input
                className="w-full sm:max-w-[44%]"
                placeholder="Search by name, email, or title..."
                startContent={
                  <svg
                    aria-hidden="true"
                    fill="none"
                    focusable="false"
                    height="1em"
                    role="presentation"
                    viewBox="0 0 24 24"
                    width="1em"
                  >
                    <path
                      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M22 22L20 20"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                isClearable
                onClear={onClear}
              />
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Badge content={filteredSenders.filter(s => getSenderStatus(s) === "authorized").length} color="success" variant="flat">
                    <Chip color="success" variant="dot">Authorized</Chip>
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge content={filteredSenders.filter(s => getSenderStatus(s) !== "authorized").length} color="warning" variant="flat">
                    <Chip color="warning" variant="dot">Unauthorized</Chip>
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-default-400 text-small">Total {filteredSenders.length} senders</span>
              <label className="flex items-center text-default-400 text-small">
                Rows per page:
                <select
                  className="bg-transparent outline-none text-default-400 text-small"
                  onChange={onRowsPerPageChange}
                  value={rowsPerPage}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                </select>
              </label>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-2"></div>
                <p>Loading senders...</p>
              </div>
            </div>
          ) : filteredSenders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500 mb-4">No email senders found</p>
              <p className="text-sm text-gray-400 mb-6">Add email senders to start sending campaigns</p>
              <AddSender />
            </div>
          ) : (
            <>
              <Table 
                aria-label="Email senders table"
                isHeaderSticky
                classNames={{
                  wrapper: "max-h-[500px]",
                }}
                sortDescriptor={sortDescriptor}
                onSortChange={(descriptor) => setSortDescriptor(descriptor)}
              >
                <TableHeader>
                  <TableColumn key="name" allowsSorting>NAME</TableColumn>
                  <TableColumn key="email" allowsSorting>EMAIL</TableColumn>
                  <TableColumn key="title" allowsSorting>TITLE</TableColumn>
                  <TableColumn key="emails_sent" allowsSorting>QUOTA & USAGE</TableColumn>
                  <TableColumn key="last_sent_at" allowsSorting>LAST SENT</TableColumn>
                  <TableColumn key="status" allowsSorting>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((sender) => (
                    <TableRow key={sender.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar 
                            src={sender.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name)}&background=random`} 
                            className="w-8 h-8"
                            showFallback
                            name={sender.name}
                          />
                          <div>
                            <p className="font-medium">{sender.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{sender.email}</TableCell>
                      <TableCell>{sender.title || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-bold text-small">{sender.emails_sent || 0}/{sender.daily_quota || 100}</p>
                            <Badge 
                              content={`${Math.round(((sender.emails_sent || 0)/(sender.daily_quota || 100)) * 100)}%`} 
                              color={((sender.emails_sent || 0)/(sender.daily_quota || 100)) > 0.8 ? "warning" : "success"}
                              variant="flat"
                              size="sm"
                            />
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                ((sender.emails_sent || 0)/(sender.daily_quota || 100)) > 0.8 
                                  ? "bg-warning" 
                                  : "bg-success"
                              }`} 
                              style={{ 
                                width: `${Math.min(100, Math.round(((sender.emails_sent || 0)/(sender.daily_quota || 100)) * 100))}%` 
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sender.last_sent_at ? (
                          <Tooltip content={new Date(sender.last_sent_at).toLocaleString()}>
                            <span>{new Date(sender.last_sent_at).toLocaleDateString()}</span>
                          </Tooltip>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          color={sender.oauth_token ? "success" : "warning"}
                          variant="flat"
                          size="sm"
                          className="capitalize"
                        >
                          {sender.oauth_token ? "Authorized" : "Unauthorized"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="relative flex justify-end items-center gap-2">
                          {!sender.oauth_token && (
                            <Tooltip content="Authorize Gmail Account">
                              <Button 
                                isIconOnly 
                                size="sm" 
                                color="primary"
                                onPress={() => refreshOAuth(sender.id)}
                              >
                                <RefreshIcon className="text-white" />
                              </Button>
                            </Tooltip>
                          )}
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly variant="light" size="sm">
                                <VerticalDotsIcon className="text-default-300" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Sender actions">
                              <DropdownItem onPress={() => refreshOAuth(sender.id)}>
                                Refresh Authorization
                              </DropdownItem>
                              <DropdownItem onPress={() => deleteSender(sender.id)} className="text-danger">
                                Delete Sender
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-4">
                <span className="text-small text-default-400">
                  Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, filteredSenders.length)} of {filteredSenders.length} senders
                </span>
                <div className="flex gap-2">
                  <Button 
                    isDisabled={page === 1} 
                    size="sm" 
                    variant="flat" 
                    onPress={onPreviousPage}
                  >
                    Previous
                  </Button>
                  <Button 
                    isDisabled={page >= pages} 
                    size="sm" 
                    variant="flat" 
                    onPress={onNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
