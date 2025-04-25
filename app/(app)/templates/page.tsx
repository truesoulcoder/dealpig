"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, CardHeader, CardBody, Button, Input, Tabs, Tab, 
  Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Switch, Tooltip
} from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaPlus, FaEdit, FaTrash, FaUpload, FaImage, FaAlignLeft, 
  FaAlignCenter, FaAlignRight, FaAlignJustify, FaBold, 
  FaItalic, FaUnderline, FaLink, FaParagraph, FaEnvelope, FaFile
} from 'react-icons/fa';
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
  
  // Template editor states - changed to true by default
  const [isEditing, setIsEditing] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({
    name: "",
    type: "email",
    content: "",
  });

  // File input ref for template upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Sample data for previewing templates with filled values
  const samplePreviewData = {
    recipient_name: "John Doe",
    property_address: "123 Main St",
    property_city: "Austin",
    property_state: "TX",
    property_zip: "78701",
    offer_price: "$250,000",
    earnest_money: "$2,500",
    closing_date: "05/30/2025",
    company_name: "Real Estate Investments LLC",
    sender_name: "Jane Smith",
    sender_title: "Acquisitions Manager",
    sender_contact: "jane@example.com",
    date: new Date().toLocaleDateString()
  };
  
  // Function to replace template variables with sample data
  const renderTemplateWithSampleData = (content: string) => {
    if (!content) return '<p class="text-black">Your preview will appear here as you type...</p>';
    
    let rendered = content;
    
    // Replace all variables with sample data
    Object.entries(samplePreviewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value);
    });
    
    return rendered;
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
  
  // Handle image insertion in the editor
  const handleImageUpload = () => {
    const url = prompt('Enter the URL of the image:');
    if (url && emailEditorRef) {
      emailEditorRef.commands.setImage({ src: url });
      emailEditorRef.commands.focus();
    }
  };

  // Handle inserting a logo image
  const handleLogoInsert = () => {
    const companyLogo = '/logo.png'; // Default logo path
    if (emailEditorRef) {
      emailEditorRef.commands.setImage({ src: companyLogo });
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
  
  // Initialize with a default template for better UX
  useEffect(() => {
    if (isEditing) {
      // For better UX, preload with a sample template when in create mode
      const defaultContent = currentTemplate.type === 'email' 
        ? `<p>Hi {{recipient_name}},</p>
           <p>I hope this email finds you well. I'm reaching out regarding your property at {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}.</p>
           <p>We're interested in making a cash offer of {{offer_price}} for your property.</p>
           <p>Looking forward to your response.</p>
           <p>Best regards,<br>{{sender_name}}<br>{{sender_title}}<br>{{company_name}}</p>`
        : '';
      
      setCurrentTemplate(prev => ({
        ...prev,
        content: prev.content || defaultContent
      }));
    }
  }, [isEditing, currentTemplate.type]);
  
  return (
    <div className="p-4 w-full max-w-none">
      <Card className="mb-6 w-full">
        <CardHeader className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Template Management</h1>
            <p className="text-default-500">Create and manage your email and document templates</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={!isEditing ? "solid" : "flat"}
              onClick={() => setIsEditing(false)}
            >
              Browse Templates
            </Button>
            <Button 
              color="primary" 
              onClick={handleCreate}
              startContent={<FaPlus />}
            >
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {!isEditing ? (
            <>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                      <CardBody>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold">{template.name}</h3>
                            <p className="text-default-500 capitalize">{template.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="light" 
                              size="sm" 
                              onClick={() => handleEdit(template)}
                              aria-label="Edit template"
                            >
                              <FaEdit className="mr-1" /> Edit
                            </Button>
                            <Button 
                              variant="light" 
                              size="sm" 
                              color="danger" 
                              onClick={() => handleDelete(template)}
                              aria-label="Delete template"
                            >
                              <FaTrash className="mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 text-default-500 border-t pt-2">
                          {template.content ? (
                            <div className="h-16 overflow-hidden text-ellipsis">
                              {template.content.substring(0, 100).replace(/<[^>]*>?/gm, '')}...
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
            </>
          ) : null}
        </CardBody>
      </Card>

      {/* Template Editor */}
      {isEditing && (
        <div className="transition-all duration-300 ease-in-out">
          <Card className="mb-6 w-full shadow-lg border-none overflow-hidden">
            <CardHeader className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
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
              <div className="mb-4 flex flex-col gap-3">
                <Input
                  label="Template Name"
                  placeholder="Enter template name"
                  value={currentTemplate.name || ''}
                  onChange={(e) => setCurrentTemplate((prev: any) => ({ ...prev, name: e.target.value }))}
                  isRequired
                  className="w-full"
                />
                
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Template Type:</span>
                  <div className="flex items-center bg-gray-100 rounded-full p-1">
                    <Button
                      size="sm"
                      className={`rounded-full min-w-[100px] transition-all duration-300 ${currentTemplate.type === 'email' ? 'bg-white shadow-md' : 'bg-transparent'}`}
                      onClick={() => handleTemplateTypeChange('email')}
                      startContent={<FaEnvelope className="text-gray-500" />}
                    >
                      Email
                    </Button>
                    <Button
                      size="sm"
                      className={`rounded-full min-w-[100px] transition-all duration-300 ${currentTemplate.type === 'document' ? 'bg-white shadow-md' : 'bg-transparent'}`}
                      onClick={() => handleTemplateTypeChange('document')}
                      startContent={<FaFile className="text-gray-500" />}
                    >
                      Document
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* Left Column - Editor */}
                <div className="border rounded-lg w-full shadow-sm bg-white overflow-hidden">
                  {currentTemplate.type === 'email' && (
                    <div className="w-full h-full">
                      <div className="border-b border-gray-200 p-2 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">Email Editor</h3>
                            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5">Rich Text</span>
                          </div>
                          <div className="flex gap-1">
                            <Tooltip content="Undo" placement="top">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-gray-600"
                                onClick={() => emailEditorRef?.chain().focus().undo().run()}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 7v6h6"></path>
                                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
                                </svg>
                              </Button>
                            </Tooltip>
                            <Tooltip content="Redo" placement="top">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-gray-600"
                                onClick={() => emailEditorRef?.chain().focus().redo().run()}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 7v6h-6"></path>
                                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
                                </svg>
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 items-center py-1 bg-gray-50 rounded-md px-2">
                          <Dropdown>
                            <DropdownTrigger>
                              <Button 
                                size="sm" 
                                variant="flat" 
                                className="bg-white shadow-sm border border-gray-200 text-xs px-3 flex gap-1 items-center"
                              >
                                Insert Variable
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              {emailVariables.map((variable) => (
                                <DropdownItem 
                                  key={variable.name}
                                  onClick={() => insertVariable(variable.value)}
                                  className="text-sm"
                                  description={variable.value}
                                >
                                  {variable.display}
                                </DropdownItem>
                              ))}
                            </DropdownMenu>
                          </Dropdown>
                          
                          <div className="h-5 border-r border-gray-300 mx-1"></div>
                          
                          <Tooltip content="Insert Image" placement="top">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onClick={handleImageUpload}
                              className="text-gray-600"
                            >
                              <FaImage size={14} />
                            </Button>
                          </Tooltip>
                          
                          <Tooltip content="Insert Logo" placement="top">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onClick={handleLogoInsert}
                              className="text-gray-600"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </Button>
                          </Tooltip>
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
                      <div className="border-b border-gray-200 p-2 flex justify-between items-center">
                        <h3 className="font-medium">Document Editor</h3>
                        <div className="flex gap-1">
                          {documentVariables.map((variable, index) => index < 3 && (
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
                              {documentVariables
                                .filter((_, index) => index >= 3)
                                .map((variable) => (
                                  <DropdownItem 
                                    key={variable.name}
                                    onClick={() => insertVariable(variable.value)}
                                  >
                                    {variable.display}
                                  </DropdownItem>
                                ))}
                            </DropdownMenu>
                          </Dropdown>
                          <Button
                            size="sm"
                            color="primary"
                            startContent={<FaUpload />}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Import DOCX
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".docx"
                            onChange={(e) => {
                              // File upload handling will be added
                              alert('DOCX import functionality will be implemented soon');
                            }}
                          />
                        </div>
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
                <div className="border rounded-lg w-full shadow-sm bg-gray-50 overflow-hidden">
                  <div className="bg-white border-b border-gray-200 p-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Preview</h3>
                      <div className="flex items-center gap-1 ml-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-xs text-gray-500">Live</span>
                      </div>
                    </div>
                    {currentTemplate.type === 'email' && (
                      <div className="flex gap-1">
                        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                          <Button 
                            size="sm" 
                            className={`rounded-md min-w-[70px] transition-all duration-200 ${!isPreviewMode ? 'bg-white shadow-sm' : 'bg-transparent'}`}
                            onClick={() => setIsPreviewMode(false)}
                          >
                            Code
                          </Button>
                          <Button 
                            size="sm" 
                            className={`rounded-md min-w-[70px] transition-all duration-200 ${isPreviewMode ? 'bg-white shadow-sm' : 'bg-transparent'}`}
                            onClick={() => setIsPreviewMode(true)}
                          >
                            Preview
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-white min-h-[500px] overflow-y-auto shadow-inner">
                    {currentTemplate.type === 'email' && (
                      <div 
                        className={`prose max-w-none text-black transition-all duration-300 ${isPreviewMode ? 'opacity-100' : 'opacity-100'}`}
                        dangerouslySetInnerHTML={{ 
                          __html: isPreviewMode ? 
                            renderTemplateWithSampleData(currentTemplate.content) :
                            '<pre class="p-4 bg-gray-50 font-mono text-sm rounded overflow-auto">' + 
                            (currentTemplate.content || '<p>Your template appears here as you type...</p>')
                              .replace(/</g, '&lt;')
                              .replace(/>/g, '&gt;') + 
                            '</pre>'
                        }}
                      />
                    )}
                    
                    {currentTemplate.type === 'document' && (
                      <div 
                        className={`prose max-w-none text-black transition-all duration-300 ${isPreviewMode ? 'opacity-100' : 'opacity-100'}`}
                        dangerouslySetInnerHTML={{ 
                          __html: isPreviewMode ? 
                            renderTemplateWithSampleData(currentTemplate.content) :
                            '<pre class="p-4 bg-gray-50 font-mono text-sm rounded overflow-auto">' + 
                            (currentTemplate.content || '<p>Your document appears here as you type...</p>')
                              .replace(/</g, '&lt;')
                              .replace(/>/g, '&gt;') + 
                            '</pre>'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}