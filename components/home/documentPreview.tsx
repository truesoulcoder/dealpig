"use client";

import { useState, useEffect } from 'react';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Button } from '@nextui-org/button';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Select, SelectItem } from '@nextui-org/select';
import { Tabs, Tab } from '@nextui-org/tabs';
import { Spinner } from '@nextui-org/spinner';
import { getTemplates, Template } from '@/lib/database';

// Import the editor styles
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

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
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

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
          const contentBlock = htmlToDraft(initialHtml);
          if (contentBlock) {
            const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
            setEditorState(EditorState.createWithContent(contentState));
          }
        } else {
          // No templates found, load the default template
          setSelectedTemplate('default');
          const defaultTemplate = generateDefaultLoiTemplate(documentData);
          const contentBlock = htmlToDraft(defaultTemplate);
          if (contentBlock) {
            const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
            setEditorState(EditorState.createWithContent(contentState));
          }
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        // Load default template on error
        setSelectedTemplate('default');
        const defaultTemplate = generateDefaultLoiTemplate(documentData);
        const contentBlock = htmlToDraft(defaultTemplate);
        if (contentBlock) {
          const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
          setEditorState(EditorState.createWithContent(contentState));
        }
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
    
    const contentBlock = htmlToDraft(templateContent);
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
      setEditorState(EditorState.createWithContent(contentState));
    }
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
      // Convert editor content to HTML
      const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
      onApprove(htmlContent, selectedTemplate);
    } finally {
      setIsLoading(false);
    }
  };

  // Get HTML preview content
  const getPreviewContent = () => {
    return draftToHtml(convertToRaw(editorState.getCurrentContent()));
  };

  if (loadingTemplates) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" label="Loading templates..." />
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
              onChange={(e) => handleTemplateChange(e.target.value)}
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
              selectedKey={viewMode} 
              onSelectionChange={(key) => setViewMode(key as "edit" | "preview")}
              className="w-full"
            >
              <Tab key="edit" title="Edit" />
              <Tab key="preview" title="Preview" />
            </Tabs>
          </div>
        </div>
      </CardHeader>
      
      <CardBody>
        {viewMode === "edit" ? (
          <div className="border border-gray-300 rounded-md min-h-[500px] mb-4">
            <Editor
              editorState={editorState}
              onEditorStateChange={setEditorState}
              wrapperClassName="w-full"
              editorClassName="px-4 py-2 min-h-[450px]"
              toolbar={{
                options: [
                  'inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker',
                  'link', 'emoji', 'image', 'remove', 'history'
                ],
                inline: { 
                  options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'],
                },
                blockType: {
                  inDropdown: true,
                  options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
                },
                fontSize: {
                  options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48],
                },
                list: { inDropdown: true },
                textAlign: { inDropdown: true },
              }}
            />
          </div>
        ) : (
          <div className="border border-gray-300 rounded-md min-h-[500px] mb-4 p-6">
            <div 
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
            />
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button
            color="primary"
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