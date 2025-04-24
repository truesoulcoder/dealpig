"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardBody, Button, Input, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@heroui/react";
import { FaPlus, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { getTemplates, saveTemplate } from '@/lib/database';
import { Template } from '@/helpers/types';
import EmailEditor from '@/components/home/emailEditor';
import dynamic from 'next/dynamic';

// Dynamically import the document preview to avoid SSR issues
const DynamicDocumentPreview = dynamic(() => import('@/components/home/documentPreview'), { 
  ssr: false,
  loading: () => <div className="min-h-[300px] flex items-center justify-center">Loading editor...</div>
});

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({
    name: "",
    type: "email",
    content: "",
  });

  // Document preview props for LOI templates
  const sampleDocumentData = {
    propertyAddress: "123 Main St",
    propertyCity: "Austin",
    propertyState: "TX",
    propertyZip: "78701",
    recipientName: "John Doe",
    offerPrice: 250000,
    earnestMoney: 2500,
    closingDate: "05/30/2025",
    companyName: "Real Estate Investments LLC",
    senderName: "Jane Smith",
    senderTitle: "Acquisitions Manager",
    senderContact: "jane@example.com"
  };
  
  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  // Filter templates based on selected tab and search query
  const filterTemplates = useCallback(() => {
    let filtered = [...templates];
    
    // Filter by type
    if (selectedTab !== "all") {
      filtered = filtered.filter(template => template.type === selectedTab);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredTemplates(filtered);
  }, [templates, selectedTab, searchQuery]);
  
  // Filter templates when tab or search changes
  useEffect(() => {
    filterTemplates();
  }, [filterTemplates]);
  
  // Fetch all templates from the database
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open modal to create a new template
  const handleCreate = () => {
    setCurrentTemplate({
      name: "",
      type: "email",
      content: "",
    });
    setModalMode("create");
    setShowModal(true);
  };
  
  // Open modal to edit an existing template
  const handleEdit = (template: Template) => {
    setCurrentTemplate({...template});
    setModalMode("edit");
    setShowModal(true);
  };
  
  // Handle template delete
  const handleDelete = async (template: Template) => {
    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      try {
        // Mark template as deleted and save
        const deletedTemplate = {
          ...template,
          deleted: true
        };
        await saveTemplate(deletedTemplate as Template);
        // Refresh templates
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!currentTemplate.name) {
      alert('Please enter a template name');
      return;
    }
    
    try {
      const savedTemplate = await saveTemplate(currentTemplate as Template);
      if (savedTemplate) {
        setShowModal(false);
        fetchTemplates();
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };
  
  // Handle content change in the editor
  const handleContentChange = (html: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      content: html
    }));
  };

  // Handle modal close (clear the current template)
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="p-4 max-w-[1200px] mx-auto">
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Template Management</h1>
            <p className="text-default-500">Create and manage your email and document templates</p>
          </div>
          <Button 
            color="primary" 
            onClick={handleCreate}
            startContent={<FaPlus />}
          >
            New Template
          </Button>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col sm:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <Tabs 
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              aria-label="Template Types"
              variant="underlined"
            >
              <Tab key="all" title="All Templates" />
              <Tab key="email" title="Email Templates" />
              <Tab key="document" title="LOI Templates" />
            </Tabs>
            
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64"
              isClearable
              onClear={() => setSearchQuery("")}
            />
          </div>
          
          {isLoading ? (
            <div className="py-12 text-center">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-default-500 mb-4">No templates found</p>
              <Button color="primary" onClick={handleCreate}>Create Template</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="border border-gray-200">
                  <CardBody>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{template.name}</h3>
                        <p className="text-default-500 capitalize">{template.type}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          isIconOnly 
                          variant="light" 
                          size="sm" 
                          onClick={() => handleEdit(template)}
                          aria-label="Edit template"
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          isIconOnly 
                          variant="light" 
                          size="sm" 
                          color="danger" 
                          onClick={() => handleDelete(template)}
                          aria-label="Delete template"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 truncate text-default-500">
                      {template.content ? (
                        <div className="h-16 overflow-hidden text-ellipsis">
                          {template.content.substring(0, 100)}...
                        </div>
                      ) : (
                        <div className="italic text-default-400">No content</div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-default-400">
                      Last updated: {new Date(template.updated_at).toLocaleDateString()}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Template Editor Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        size="3xl"
        scrollBehavior="outside"
      >
        <ModalContent>
          <ModalHeader>
            {modalMode === "create" ? "Create New Template" : "Edit Template"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Template Name"
                placeholder="Enter template name"
                value={currentTemplate.name}
                onChange={(e) => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                isRequired
              />
              
              <Select
                label="Template Type"
                value={currentTemplate.type}
                onChange={(e) => setCurrentTemplate(prev => ({ ...prev, type: e.target.value }))}
                isRequired
              >
                <SelectItem key="email" value="email">Email Template</SelectItem>
                <SelectItem key="document" value="document">LOI Template</SelectItem>
              </Select>
              
              {currentTemplate.type === 'email' ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-default-600">Email Content</p>
                  <EmailEditor 
                    initialContent={currentTemplate.content || ''} 
                    onChange={handleContentChange}
                    placeholder="Write your email template here..."
                  />
                </div>
              ) : (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-default-600">Document Content</p>
                  <DynamicDocumentPreview 
                    documentData={sampleDocumentData}
                    onApprove={(htmlContent) => {
                      handleContentChange(htmlContent);
                    }}
                  />
                  <div className="mt-2 text-xs text-default-400">
                    <p>Available variables:</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>{{property_address}} - Property Address</li>
                      <li>{{property_city}} - City</li>
                      <li>{{property_state}} - State</li>
                      <li>{{property_zip}} - ZIP Code</li>
                      <li>{{recipient_name}} - Recipient Name</li>
                      <li>{{offer_price}} - Offer Price</li>
                      <li>{{earnest_money}} - Earnest Money</li>
                      <li>{{closing_date}} - Closing Date</li>
                      <li>{{date}} - Current Date</li>
                      <li>{{company_name}} - Company Name</li>
                      <li>{{sender_name}} - Sender Name</li>
                      <li>{{sender_title}} - Sender Title</li>
                      <li>{{sender_contact}} - Sender Contact</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleSubmit}>
              {modalMode === "create" ? "Create Template" : "Save Changes"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}