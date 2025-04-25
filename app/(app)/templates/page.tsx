"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Card, CardHeader, CardBody, Button, Input, Tabs, Tab, 
  Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem 
} from "@heroui/react";
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
  
  // Template editor states
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
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
    setIsEditing(true);
  };
  
  // Open modal to edit an existing template
  const handleEdit = (template: Template) => {
    setCurrentTemplate({...template});
    setModalMode("edit");
    setIsEditing(true);
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
        setIsEditing(false);
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

  // Handle template type change
  const handleTemplateTypeChange = (type: string) => {
    // Only update if the type is actually different
    if (type !== currentTemplate.type) {
      // Keep existing content if switching between types
      setCurrentTemplate(prev => ({
        ...prev,
        type
      }));
      
      // Reset preview mode when switching types
      setIsPreviewMode(false);
    }
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

      {/* Template Editor */}
      {isEditing && (
        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {modalMode === "create" ? "Create New Template" : "Edit Template"}
            </h2>
            <div className="flex gap-2">
              <Button variant="flat" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button color="primary" onClick={handleSubmit}>
                {modalMode === "create" ? "Create Template" : "Save Changes"}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="mb-4 grid grid-cols-2 gap-4">
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
                onChange={(e) => handleTemplateTypeChange(e.target.value)}
                isRequired
              >
                <SelectItem key="email">Email Template</SelectItem>
                <SelectItem key="document">LOI Template</SelectItem>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {/* Left Column - Editor */}
              <div className="border rounded-lg w-full">
                {currentTemplate.type === 'email' && (
                  <div className="w-full h-full">
                    <div className="border-b border-gray-200 p-2 flex justify-between items-center">
                      <h3 className="font-medium">Email Editor</h3>
                      <div className="flex gap-1">
                        {emailVariables.map((variable, index) => index < 3 && (
                          <Button
                            key={variable.name}
                            size="sm"
                            variant="flat"
                            onClick={() => insertVariable(variable.value)}
                          >
                            {variable.display}
                          </Button>
                        ))}
                        <Dropdown>
                          <DropdownTrigger>
                            <Button size="sm" variant="flat">More Variables</Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            {emailVariables.map((variable, index) => index >= 3 && (
                              <DropdownItem 
                                key={variable.name}
                                onClick={() => insertVariable(variable.value)}
                              >
                                {variable.display}
                              </DropdownItem>
                            ))}
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                    <EmailEditor 
                      initialContent={currentTemplate.content || ''} 
                      onChange={handleContentChange}
                      placeholder="Write your email template here..."
                      onEditorReady={handleEditorReady}
                    />
                  </div>
                )}
                
                {currentTemplate.type === 'document' && (
                  <div className="w-full h-full">
                    <div className="border-b border-gray-200 p-2">
                      <h3 className="font-medium">Document Editor</h3>
                    </div>
                    <DynamicDocumentPreview 
                      documentData={sampleDocumentData}
                      onApprove={(htmlContent) => {
                        handleContentChange(htmlContent);
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Right Column - Preview */}
              <div className="border rounded-lg w-full">
                <div className="border-b border-gray-200 p-2 flex justify-between items-center">
                  <h3 className="font-medium">Preview</h3>
                  {currentTemplate.type === 'email' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant={isPreviewMode ? "ghost" : "solid"}
                        color={isPreviewMode ? "default" : "primary"}
                        onClick={() => setIsPreviewMode(false)}
                      >
                        Raw
                      </Button>
                      <Button 
                        size="sm" 
                        variant={isPreviewMode ? "solid" : "ghost"}
                        color={isPreviewMode ? "primary" : "default"}
                        onClick={() => setIsPreviewMode(true)}
                      >
                        Rendered
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white min-h-[500px] overflow-y-auto">
                  {currentTemplate.type === 'email' && (
                    <div 
                      className="prose max-w-none text-black"
                      dangerouslySetInnerHTML={{ 
                        __html: isPreviewMode ? 
                          currentTemplate.content
                            ?.replace(/{{recipient_name}}/g, "John Doe")
                            .replace(/{{property_address}}/g, "123 Main St")
                            .replace(/{{property_city}}/g, "Austin")
                            .replace(/{{property_state}}/g, "TX")
                            .replace(/{{property_zip}}/g, "78701")
                            .replace(/{{offer_price}}/g, "$250,000")
                            .replace(/{{earnest_money}}/g, "$2,500")
                            .replace(/{{closing_date}}/g, "05/30/2025")
                            .replace(/{{company_name}}/g, "Real Estate Investments LLC")
                            .replace(/{{sender_name}}/g, "Jane Smith")
                            .replace(/{{sender_title}}/g, "Acquisitions Manager")
                            .replace(/{{sender_contact}}/g, "jane@example.com")
                            .replace(/{{date}}/g, new Date().toLocaleDateString()) || 
                            '<p class="text-black">Your preview will appear here as you type...</p>' :
                          currentTemplate.content || '<p class="text-black">Your raw template will appear here as you type...</p>'
                      }}
                    />
                  )}
                  
                  {currentTemplate.type === 'document' && (
                    <div 
                      className="prose max-w-none text-black"
                      dangerouslySetInnerHTML={{ __html: currentTemplate.content || '<p class="text-black">Your document preview will appear here...</p>' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}