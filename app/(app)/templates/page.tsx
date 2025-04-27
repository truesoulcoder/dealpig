"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Tabs,
  Tab,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { supabase } from "@/lib/supabase";
import { FaPlus, FaUpload, FaEdit, FaTrash, FaEllipsisV, FaSave } from "react-icons/fa";
import dynamic from "next/dynamic";
import mammoth from "mammoth";
import { createTemplate, updateTemplate, deleteTemplate } from "@/lib/database";

// Dynamically import the editor to avoid SSR issues
const EmailEditor = dynamic(() => import("@/components/templates/emailEditor"), {
  ssr: false,
  loading: () => <div className="min-h-[400px] flex items-center justify-center"><Spinner size="lg" /></div>,
});

// Types
interface Template {
  id: string;
  name: string;
  type: "email" | "document";
  subject?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_EMAIL_TEMPLATE = `
<h2>Hello {{contact_name}},</h2>
<p>I hope this email finds you well. I'm reaching out regarding the property at <strong>{{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}</strong>.</p>
<p>We specialize in purchasing properties in your area and would like to make a cash offer on your property. This would be an as-is purchase with no repairs or renovations needed.</p>
<p>If you're interested in discussing this opportunity further, please reply to this email or call me directly.</p>
<p>Best regards,</p>
<p><strong>{{sender_name}}</strong><br>{{sender_title}}<br>{{sender_email}}<br>{{company_name}}</p>
`;

const DEFAULT_DOCUMENT_TEMPLATE = `
<h1 style="text-align: center;">Letter of Intent to Purchase Property</h1>
<p style="text-align: right;">Date: {{date}}</p>
<p>Dear {{contact_name}},</p>
<p>This letter expresses our interest in purchasing the property located at:</p>
<p><strong>{{property_address}}<br>{{property_city}}, {{property_state}} {{property_zip}}</strong></p>
<p>We are prepared to offer <strong>${'$'}{{market_value}}</strong> for the property, subject to the following terms:</p>
<ul>
  <li>Earnest money deposit: <strong>${'$'}5,000</strong></li>
  <li>Closing date: within 30 days of offer acceptance</li>
  <li>Purchase will be in "as-is" condition</li>
  <li>Standard closing costs to be split between buyer and seller</li>
</ul>
<p>This letter of intent is non-binding and subject to a formal purchase agreement.</p>
<p>Sincerely,</p>
<p>
  <strong>{{sender_name}}</strong><br>
  {{sender_title}}<br>
  {{company_name}}
</p>
`;

export default function TemplatesPage() {
  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"email" | "document">("email");
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [templateName, setTemplateName] = useState<string>("");
  const [templateSubject, setTemplateSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Filter templates based on active tab and search query
  const filteredTemplates = templates.filter(template => {
    const matchesType = template.type === activeTab;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Fetch templates from Supabase
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  // Create new template
  const createNewTemplate = () => {
    const newTemplate: Partial<Template> = {
      name: `New ${activeTab === "email" ? "Email" : "Document"} Template`,
      type: activeTab,
      subject: activeTab === "email" ? "Subject Line" : undefined,
      content: activeTab === "email" ? DEFAULT_EMAIL_TEMPLATE : DEFAULT_DOCUMENT_TEMPLATE,
    };
    
    setTemplateName(newTemplate.name || "");
    setTemplateSubject(newTemplate.subject || "");
    setEditorContent(newTemplate.content || "");
    setActiveTemplate(null); // Indicates we're creating a new template
  };

  // Select a template for editing
  const selectTemplate = (template: Template) => {
    setActiveTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject || "");
    setEditorContent(template.content);
  };

  // Save template
  const saveTemplate = async () => {
    if (!templateName) {
      setError("Template name is required");
      return;
    }

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      const templateData = {
        name: templateName,
        type: activeTab,
        subject: activeTab === "email" ? templateSubject : undefined,
        content: editorContent,
      };

      let templateId;

      if (activeTemplate?.id) {
        // Update existing template
        await updateTemplate(activeTemplate.id, templateData);
        templateId = activeTemplate.id;
      } else {
        // Create new template
        templateId = await createTemplate(templateData);
      }

      // Refresh templates list
      await fetchTemplates();

      // Update active template
      if (!activeTemplate) {
        const updatedTemplate = templates.find(t => t.id === templateId);
        if (updatedTemplate) {
          setActiveTemplate(updatedTemplate);
        }
      }

      setSaveSuccess(true);
    } catch (err) {
      console.error("Error saving template:", err);
      setError("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle file upload for document templates
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);

      // Check file type
      if (!file.name.endsWith('.docx')) {
        setError("Please upload a DOCX file");
        return;
      }

      // Read file content
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert to HTML using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      // Store the converted HTML in the editor
      setEditorContent(result.value);
      
      // Create a new template with the file name
      setTemplateName(file.name.replace('.docx', ''));
      setActiveTemplate(null); // Indicates we're creating a new template

      // Upload original file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(`docx/${file.name}`, file);

      if (uploadError) {
        console.error("Error uploading original file:", uploadError);
        // Continue anyway since we have the HTML content
      }

    } catch (err) {
      console.error("Error processing document:", err);
      setError("Failed to process the document");
    } finally {
      setIsLoading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  // Handle template deletion
  const handleDeleteTemplate = async () => {
    if (!pendingDeleteTemplate) return;
    
    try {
      setIsLoading(true);
      await deleteTemplate(pendingDeleteTemplate);
      
      // If the deleted template was the active one, reset the editor
      if (activeTemplate?.id === pendingDeleteTemplate) {
        setActiveTemplate(null);
        setTemplateName("");
        setTemplateSubject("");
        setEditorContent(activeTab === "email" ? DEFAULT_EMAIL_TEMPLATE : DEFAULT_DOCUMENT_TEMPLATE);
      }
      
      await fetchTemplates();
      onClose();
    } catch (err) {
      console.error("Error deleting template:", err);
      setError("Failed to delete template");
    } finally {
      setIsLoading(false);
      setPendingDeleteTemplate(null);
    }
  };

  // Confirmation dialog for template deletion
  const confirmDelete = (templateId: string) => {
    setPendingDeleteTemplate(templateId);
    onOpen();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Template Manager</h1>
      
      {/* Template Type Selector */}
      <div className="mb-6">
        <Tabs 
          selectedKey={activeTab} 
          onSelectionChange={(key) => {
            setActiveTab(key as "email" | "document");
            setActiveTemplate(null);
            setTemplateName("");
            setTemplateSubject("");
            setEditorContent(key === "email" ? DEFAULT_EMAIL_TEMPLATE : DEFAULT_DOCUMENT_TEMPLATE);
          }}
          color="primary"
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList: "gap-6",
            tab: "text-lg",
          }}
        >
          <Tab key="email" title="Email Templates" />
          <Tab key="document" title="Document Templates" />
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Explorer */}
        <div className="col-span-1 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Templates</h2>
            <div className="flex gap-2">
              <Button
                color="primary"
                size="sm"
                startContent={<FaPlus size={14} />}
                onPress={createNewTemplate}
              >
                New
              </Button>
              
              {activeTab === "document" && (
                <>
                  <Button
                    color="secondary"
                    size="sm"
                    startContent={<FaUpload size={14} />}
                    onPress={() => fileInputRef.current?.click()}
                  >
                    Upload
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </>
              )}
            </div>
          </div>

          {/* Search Input */}
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
            className="mb-4"
          />
          
          {/* Templates List */}
          <div className="border rounded-md overflow-hidden max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {searchQuery ? "No templates found" : `No ${activeTab} templates yet`}
              </div>
            ) : (
              <ul className="divide-y">
                {filteredTemplates.map((template) => (
                  <li 
                    key={template.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      activeTemplate?.id === template.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 truncate">
                        <p className="font-medium truncate">{template.name}</p>
                        {template.type === "email" && template.subject && (
                          <p className="text-xs text-gray-500 truncate">{template.subject}</p>
                        )}
                      </div>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaEllipsisV size={14} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Template actions">
                          <DropdownItem
                            key="edit"
                            startContent={<FaEdit size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectTemplate(template);
                            }}
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<FaTrash size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(template.id);
                            }}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Editor and Preview Panels */}
        <div className="col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <Card className="col-span-1">
            <CardBody className="p-0">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold mb-4">
                  {activeTemplate ? `Edit ${activeTemplate.name}` : `New ${activeTab === "email" ? "Email" : "Document"} Template`}
                </h3>
                
                <div className="space-y-4">
                  <Input
                    label="Template Name"
                    placeholder="Enter template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                  
                  {activeTab === "email" && (
                    <Input
                      label="Subject Line"
                      placeholder="Enter email subject"
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                    />
                  )}
                </div>
              </div>
              
              <EmailEditor
                initialContent={editorContent}
                onChange={setEditorContent}
                placeholder={`Write your ${activeTab} content here...`}
              />
              
              <div className="p-4 border-t flex justify-between items-center">
                <div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                  {saveSuccess && (
                    <p className="text-sm text-green-600">Template saved successfully!</p>
                  )}
                </div>
                <Button
                  color="primary"
                  isLoading={isSaving}
                  startContent={<FaSave size={14} />}
                  onPress={saveTemplate}
                >
                  Save Template
                </Button>
              </div>
            </CardBody>
          </Card>
          
          {/* Preview Panel */}
          <Card className="col-span-1">
            <CardBody className="p-0">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm">HTML</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!showHtmlPreview}
                      onChange={() => setShowHtmlPreview(!showHtmlPreview)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                  <span className="text-sm">Rendered</span>
                </div>
              </div>
              
              <div className="p-4 min-h-[400px] max-h-[650px] overflow-y-auto">
                {showHtmlPreview ? (
                  <pre className="whitespace-pre-wrap text-xs font-mono bg-gray-50 p-4 rounded border">
                    {editorContent}
                  </pre>
                ) : (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: editorContent }}
                  />
                )}
              </div>
              
              <div className="p-4 border-t text-sm text-gray-500">
                <p>
                  Available template variables:
                  {activeTab === "email" ? (
                    <span className="font-mono">
                      {" "}{"{{"}<span>contact_name</span>{"}},"} {"{{"}<span>owner_name</span>{"}},"} {"{{"}<span>property_address</span>{"}},"} {"{{"}<span>property_city</span>{"}},"} 
                      {"{{"}<span>property_state</span>{"}},"} {"{{"}<span>property_zip</span>{"}},"} {"{{"}<span>sender_name</span>{"}},"} 
                      {"{{"}<span>sender_title</span>{"}},"} {"{{"}<span>sender_email</span>{"}},"} {"{{"}<span>company_name</span>{"}}"}
                    </span>
                  ) : (
                    <span className="font-mono">
                      {" "}{"{{"}<span>contact_name</span>{"}},"} {"{{"}<span>owner_name</span>{"}},"} {"{{"}<span>property_address</span>{"}},"} {"{{"}<span>property_city</span>{"}},"} 
                      {"{{"}<span>property_state</span>{"}},"} {"{{"}<span>property_zip</span>{"}},"} {"{{"}<span>wholesale_value</span>{"}},"} 
                      {"{{"}<span>market_value</span>{"}},"} {"{{"}<span>days_on_market</span>{"}},"} {"{{"}<span>date</span>{"}},"} {"{{"}<span>sender_name</span>{"}},"} 
                      {"{{"}<span>sender_title</span>{"}},"} {"{{"}<span>company_name</span>{"}}"}
                    </span>
                  )}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete this template? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteTemplate}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}