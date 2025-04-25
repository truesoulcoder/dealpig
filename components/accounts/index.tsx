"use client";
import { Button, Input, Card, CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@heroui/react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { DotsIcon } from "@/components/icons/accounts/dots-icon";
import { ExportIcon } from "@/components/icons/accounts/export-icon";
import { InfoIcon } from "@/components/icons/accounts/info-icon";
import { TrashIcon } from "@/components/icons/accounts/trash-icon";
import { HouseIcon } from "@/components/icons/breadcrumb/house-icon";
import { UsersIcon } from "@/components/icons/breadcrumb/users-icon";
import { AddSender } from "./add-user";
import { getSenders } from "@/lib/database";

export const Accounts = () => {
  const [senders, setSenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSenders, setFilteredSenders] = useState([]);

  useEffect(() => {
    loadSenders();
  }, []);

  const filterSenders = useCallback(() => {
    if (!searchQuery) {
      setFilteredSenders(senders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = senders.filter(sender => 
      sender.name.toLowerCase().includes(query) || 
      sender.email.toLowerCase().includes(query)
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

  const refreshOAuth = (senderId) => {
    // Redirect to refresh OAuth page
    window.location.href = `/api/auth/gmail/refresh?sender_id=${senderId}`;
  };

  const deleteSender = async (senderId) => {
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

  return (
    <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
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
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Email Senders</h3>
          <div className="flex gap-2">
            <AddSender />
            <Button color="primary" startContent={<ExportIcon />} onPress={handleExportCSV}>
              Export to CSV
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          <div className="flex justify-between mb-4">
            <Input
              className="w-full max-w-sm"
              placeholder="Search senders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              isClearable
              onClear={() => setSearchQuery("")}
            />
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
            <Table aria-label="Email senders table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>TITLE</TableColumn>
                <TableColumn>EMAILS SENT</TableColumn>
                <TableColumn>DAILY QUOTA</TableColumn>
                <TableColumn>LAST SENT</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredSenders.map((sender) => (
                  <TableRow key={sender.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar 
                          src={sender.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name)}&background=random`} 
                          className="w-8 h-8"
                          showFallback
                          name={sender.name}
                        />
                        {sender.name}
                      </div>
                    </TableCell>
                    <TableCell>{sender.email}</TableCell>
                    <TableCell>{sender.title || "-"}</TableCell>
                    <TableCell>{sender.emails_sent || 0}</TableCell>
                    <TableCell>{sender.daily_quota || 100}</TableCell>
                    <TableCell>
                      {sender.last_sent_at ? new Date(sender.last_sent_at).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        color={sender.oauth_token ? "success" : "danger"}
                        variant="flat"
                        size="sm"
                      >
                        {sender.oauth_token ? "Authorized" : "Unauthorized"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly variant="light" size="sm">
                            <DotsIcon />
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
