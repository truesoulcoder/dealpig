"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardBody, Button, Input, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@heroui/react";
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { getTemplates, saveTemplate } from '@/lib/database';
import EmailEditor from '@/components/home/emailEditor';
import dynamic from 'next/dynamic';

// Import the Template type from database.ts, not helpers/types
import { Template } from '@/lib/database';

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

  // Editor reference for inserting variables
  const [emailEditorRef, setEmailEditorRef] = useState<any>(null);

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
  
  // Variable sets for templates
  const emailVariables = [
    { name: "recipientName", display: "Recipient Name", value: "{{recipient_name}}" },
    { name: "propertyAddress", display: "Property Address", value: "{{property_address}}" },
    { name: "propertyCity", display: "Property City", value: "{{property_city}}" },
    { name: "propertyState", display: "Property State", value: "{{property_state}}" },
    { name: "propertyZip", display: "Property ZIP", value: "{{property_zip}}" },
    { name: "offerPrice", display: "Offer Price", value: "{{offer_price}}" },
    { name: "earnestMoney", display: "Earnest Money", value: "{{earnest_money}}" },
    { name: "closingDate", display: "Closing Date", value: "{{closing_date}}" },
    { name: "companyName", display: "Company Name", value: "{{company_name}}" },
    { name: "senderName", display: "Sender Name", value: "{{sender_name}}" },
    { name: "senderTitle", display: "Sender Title", value: "{{sender_title}}" },
    { name: "senderContact", display: "Sender Contact", value: "{{sender_contact}}" },
    { name: "date", display: "Current Date", value: "{{date}}" },
  ];

  const documentVariables = [
    { name: "propertyAddress", display: "Property Address", value: "{{property_address}}" },
    { name: "propertyCity", display: "Property City", value: "{{property_city}}" },
    { name: "propertyState", display: "Property State", value: "{{property_state}}" },
    { name: "propertyZip", display: "Property ZIP", value: "{{property_zip}}" },
    { name: "recipientName", display: "Recipient Name", value: "{{recipient_name}}" },
    { name: "offerPrice", display: "Offer Price", value: "{{offer_price}}" },
    { name: "earnestMoney", display: "Earnest Money", value: "{{earnest_money}}" },
    { name: "closingDate", display: "Closing Date", value: "{{closing_date}}" },
    { name: "date", display: "Current Date", value: "{{date}}" },
    { name: "companyName", display: "Company Name", value: "{{company_name}}" },
    { name: "senderName", display: "Sender Name", value: "{{sender_name}}" },
    { name: "senderTitle", display: "Sender Title", value: "{{sender_title}}" },
    { name: "senderContact", display: "Sender Contact", value: "{{sender_contact}}" },
  ];
  
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
      setFilteredTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Insert variable at cursor position in the editor
  const insertVariable = (variable: string) => {
    if (currentTemplate.type === 'email' && emailEditorRef) {
      emailEditorRef.commands.insertContent(variable);
      emailEditorRef.commands.focus();
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
    setCurrentTemplate((prev: any) => ({
      ...prev,
      content: html
    }));
  };

  // Store email editor reference
  const handleEditorReady = (editor: any) => {
    setEmailEditorRef(editor);
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
                      Last updated: {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'Never'}
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
                value={currentTemplate.name || ''}
                onChange={(e) => setCurrentTemplate((prev: any) => ({ ...prev, name: e.target.value }))}
                isRequired
              />
              
              <Select
                label="Template Type"
                value={currentTemplate.type || 'email'}
                onChange={(e) => setCurrentTemplate((prev: any) => ({ ...prev, type: e.target.value }))}
                isRequired
              >
                <SelectItem key="email">Email Template</SelectItem>
                <SelectItem key="document">LOI Template</SelectItem>
              </Select>
              
              {currentTemplate.type === 'email' ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-default-600">Email Content</p>
                  <EmailEditor 
                    initialContent={currentTemplate.content || ''} 
                    onChange={handleContentChange}
                    placeholder="Write your email template here..."
                    onEditorReady={handleEditorReady}
                  />
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-default-600">Available Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {emailVariables.map((variable) => (
                        <Button
                          key={variable.name}
                          size="sm"
                          variant="flat"
                          onClick={() => insertVariable(variable.value)}
                        >
                          {variable.display}
                        </Button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-default-400">
                      Click a variable button to insert it at the cursor position
                    </p>
                  </div>
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
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-default-600">Available Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {documentVariables.map((variable) => (
                        <Button
                          key={variable.name}
                          size="sm"
                          variant="flat"
                          onClick={() => {
                            // For document templates, we'll show which variable to use
                            alert(`Use ${variable.value} in your document template to insert the ${variable.display}`);
                          }}
                        >
                          {variable.display}
                        </Button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-default-400">
                      Use these variables in your template by typing them exactly as shown
                    </p>
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