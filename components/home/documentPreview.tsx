"use client";

import { useState, useEffect } from 'react';
import { useEditor, EditorContent, Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Select, SelectItem } from '@heroui/select';
import { Tabs, Tab } from '@heroui/tabs';
import { Spinner } from '@heroui/spinner';
import { getTemplates, Template } from '@/lib/database';

// EditorToolbar component for text formatting options
const EditorToolbar = ({ editor }: { editor: TiptapEditor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 items-center">
      <div className="flex gap-1 mr-2">
        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 1 }) ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 3 }) ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('paragraph') ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          P
        </Button>
      </div>

      <div className="border-r border-gray-300 h-6 mx-2" />

      <div className="flex gap-1 mr-2">
        <Button
          size="sm"
          variant={editor.isActive('bold') ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('italic') ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('underline') ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </Button>
      </div>

      <div className="border-r border-gray-300 h-6 mx-2" />

      <div className="flex gap-1 mr-2">
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: 'left' }) ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          Left
        </Button>
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: 'center' }) ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          Center
        </Button>
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: 'right' }) ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          Right
        </Button>
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: 'justify' }) ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          Justify
        </Button>
      </div>

      <div className="border-r border-gray-300 h-6 mx-2" />

      <div className="flex gap-1">
        <Button
          size="sm"
          variant={editor.isActive('link') ? "secondary" : "ghost"}
          onClick={() => {
            const url = window.prompt('URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
        >
          Link
        </Button>
        {editor.isActive('link') && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            Unlink
          </Button>
        )}
      </div>
    </div>
  );
};

// No need for editor styles import as TipTap handles this differently

interface DocumentPreviewProps {
  documentData: {
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyZip: string;
    recipientName: string;
    offerPrice: number;
    earnestMoney: number;
    closingDate: string;
    companyName?: string;
    senderName?: string;
    senderTitle?: string;
    senderContact?: string;
  };
  onApprove: (htmlContent: string, templateName: string) => void;
}

export default function DocumentPreview({ documentData, onApprove }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: [ 'heading', 'paragraph' ] }),
      Link,
      Image,
      Color,
      TextStyle,
    ],
    content: '<p>Hello World!</p>',
  });

  // Fetch available templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoadingTemplates(true);
        const templateData = await getTemplates('document');
        setTemplates(templateData);
        
        if (templateData.length > 0) {
          setSelectedTemplate(templateData[0].id || 'default');
          
          // Load the first template
          const initialHtml = processTemplate(templateData[0].content, documentData);
          editor?.commands.setContent(initialHtml);
        } else {
          // No templates found, load the default template
          setSelectedTemplate('default');
          const defaultTemplate = generateDefaultLoiTemplate(documentData);
          editor?.commands.setContent(defaultTemplate);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        // Load default template on error
        setSelectedTemplate('default');
        const defaultTemplate = generateDefaultLoiTemplate(documentData);
        editor?.commands.setContent(defaultTemplate);
      } finally {
        setLoadingTemplates(false);
      }
    }

    loadTemplates();
  }, [documentData]);

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    let templateContent = '';
    
    if (templateId === 'default') {
      templateContent = generateDefaultLoiTemplate(documentData);
    } else {
      const selectedTemplateData = templates.find(t => t.id === templateId);
      if (selectedTemplateData) {
        templateContent = processTemplate(selectedTemplateData.content, documentData);
      } else {
        templateContent = generateDefaultLoiTemplate(documentData);
      }
    }
    
    editor?.commands.setContent(templateContent);
  };

  // Process template with variable replacement
  const processTemplate = (templateContent: string, data: DocumentPreviewProps['documentData']) => {
    let processed = templateContent;
    
    // Replace all template variables with actual values
    processed = processed
      .replace(/{{property_address}}/g, data.propertyAddress)
      .replace(/{{property_city}}/g, data.propertyCity)
      .replace(/{{property_state}}/g, data.propertyState)
      .replace(/{{property_zip}}/g, data.propertyZip)
      .replace(/{{recipient_name}}/g, data.recipientName)
      .replace(/{{offer_price}}/g, data.offerPrice.toLocaleString())
      .replace(/{{earnest_money}}/g, data.earnestMoney.toLocaleString())
      .replace(/{{closing_date}}/g, data.closingDate)
      .replace(/{{date}}/g, new Date().toLocaleDateString())
      .replace(/{{company_name}}/g, data.companyName || 'Our Company')
      .replace(/{{sender_name}}/g, data.senderName || 'Your Name')
      .replace(/{{sender_title}}/g, data.senderTitle || 'Your Title')
      .replace(/{{sender_contact}}/g, data.senderContact || 'Your Contact Information');
      
    return processed;
  };

  // Generate default template
  const generateDefaultLoiTemplate = (data: DocumentPreviewProps['documentData']) => {
    const currentDate = new Date().toLocaleDateString();
    return `
      <h1 style="font-size: 24px; font-weight: bold; text-align: center;">Letter of Intent</h1>
      <p><strong>Date:</strong> ${currentDate}</p>
      <p><strong>Recipient:</strong> ${data.recipientName}</p>
      <p><strong>Re:</strong> Property Purchase Intent - ${data.propertyAddress}, ${data.propertyCity}, ${data.propertyState} ${data.propertyZip}</p>
      
      <p>Dear ${data.recipientName},</p>
      
      <p>I am writing to express my formal intent to purchase the property located at ${data.propertyAddress}, ${data.propertyCity}, ${data.propertyState} ${data.propertyZip}.</p>
      
      <p><strong>Purchase Price:</strong> $${data.offerPrice.toLocaleString()}</p>
      <p><strong>Earnest Money Deposit:</strong> $${data.earnestMoney.toLocaleString()}</p>
      <p><strong>Proposed Closing Date:</strong> ${data.closingDate}</p>
      
      <p>This letter of intent is not legally binding and is subject to the execution of a formal purchase agreement. I look forward to moving forward with this transaction.</p>
      
      <p>Sincerely,</p>
      <p>${data.senderName || '[Your Name]'}<br>
      ${data.senderTitle || '[Your Title]'}<br>
      ${data.companyName || '[Your Company]'}<br>
      ${data.senderContact || '[Your Contact Information]'}</p>
    `;
  };

  // Handle approve action
  const handleApprove = () => {
    setIsLoading(true);
    try {
      // Get editor content as HTML
      const htmlContent = editor?.getHTML() || '';
      onApprove(htmlContent, selectedTemplate);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingTemplates) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" aria-label="Loading templates" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Document Preview</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="w-full sm:w-2/3">
            <Select
              label="Template"
              placeholder="Select a template"
              value={selectedTemplate}
              onChange={(value) => handleTemplateChange(value)}
              className="w-full"
            >
              <SelectItem key="default" value="default">Default Template</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id || ''}>
                  {template.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-1/3">
            <Tabs 
              value={viewMode} 
              onValueChange={(value) => setViewMode(value as "edit" | "preview")}
              className="w-full"
            >
              <Tab value="edit" title="Edit" />
              <Tab value="preview" title="Preview" />
            </Tabs>
          </div>
        </div>
      </CardHeader>
      
      <CardBody>
        {viewMode === "edit" ? (
          <div className="border border-gray-300 rounded-md min-h-[500px] mb-4">
            <EditorToolbar editor={editor} />
            <div className="p-4">
              <EditorContent editor={editor} />
            </div>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-md min-h-[500px] mb-4 p-6">
            <div 
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }}
            />
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button
            variant="primary"
            onClick={handleApprove}
            isLoading={isLoading}
          >
            {isLoading ? 'Generating...' : 'Approve & Generate Document'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}