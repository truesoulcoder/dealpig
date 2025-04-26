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
import FontFamily from '@tiptap/extension-font-family';
import { 
  Button, Card, CardBody, CardHeader, 
  Select, SelectItem, Tabs, Tab, Spinner, 
  Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  RadioGroup, Radio, Popover, PopoverTrigger, PopoverContent
} from '@heroui/react';
import { 
  FaBold, FaItalic, FaUnderline, FaAlignLeft, 
  FaAlignCenter, FaAlignRight, FaAlignJustify, 
  FaLink, FaImage, FaListUl, FaListOl, 
  FaFont, FaHeading, FaParagraph
} from 'react-icons/fa';
import { MdFormatColorText, MdFormatSize } from 'react-icons/md';
import { getTemplates, Template } from '@/lib/database';
import { loadDefaultTemplate } from '@/actions/loadDefaultTemplate.action';

// Color palette for text formatting
const COLORS = [
  '#000000', '#343a40', '#495057', '#868e96', '#adb5bd', 
  '#1971c2', '#4dabf7', '#3b5bdb', '#748ffc', '#f03e3e', 
  '#ff8787', '#d9480f', '#fd7e14', '#e67700', '#fcc419', 
  '#2b8a3e', '#51cf66', '#087f5b', '#20c997', '#6741d9'
];

// Font sizes for formatting
const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '16px' },
  { label: 'Medium', value: '20px' },
  { label: 'Large', value: '24px' },
  { label: 'X-Large', value: '32px' },
];

// Font families
const FONT_FAMILIES = [
  { label: 'Sans-serif', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif', value: 'Georgia, Times New Roman, serif' },
  { label: 'Monospace', value: 'Courier New, Courier, monospace' },
  { label: 'Cursive', value: 'Comic Sans MS, cursive' },
];

// EditorToolbar component for text formatting options with enhanced features
const EditorToolbar = ({ editor }: { editor: TiptapEditor | null }) => {
  if (!editor) {
    return null;
  }

  // Handles link insertion with improved UI
  const handleLinkInsert = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 items-center bg-gray-50 dark:bg-gray-800 overflow-x-auto sticky top-0 z-10">
      {/* Text Style Dropdown */}
      <Dropdown>
        <DropdownTrigger>
          <Button
            size="sm"
            variant="flat"
            className="px-3 min-w-[80px] justify-between mr-2"
          >
            {editor.isActive('heading', { level: 1 }) ? 'H1' :
             editor.isActive('heading', { level: 2 }) ? 'H2' :
             editor.isActive('heading', { level: 3 }) ? 'H3' :
             'Normal'}
            <span className="ml-2">▼</span>
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Text styles">
          <DropdownItem onPress={() => editor.chain().focus().setParagraph().run()}>
            Normal text
          </DropdownItem>
          <DropdownItem onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            Heading 1
          </DropdownItem>
          <DropdownItem onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            Heading 2
          </DropdownItem>
          <DropdownItem onPress={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            Heading 3
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {/* Font Family Dropdown */}
      <Dropdown>
        <DropdownTrigger>
          <Button
            size="sm"
            variant="flat"
            className="px-3 gap-1"
            startContent={<FaFont size={14} />}
          >
            Font
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Font families">
          {FONT_FAMILIES.map((font) => (
            <DropdownItem 
              key={font.value}
              onPress={() => editor.chain().focus().setFontFamily(font.value).run()}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <div className="border-r border-gray-300 h-6 mx-2" />

      {/* Font Size Dropdown */}
      <Dropdown>
        <DropdownTrigger>
          <Button
            size="sm"
            variant="flat"
            className="px-3 gap-1"
            startContent={<MdFormatSize size={16} />}
          >
            Size
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Font sizes">
          {FONT_SIZES.map((size) => (
            <DropdownItem 
              key={size.value}
              onPress={() => editor.chain().focus().setStyle({ fontSize: size.value }).run()}
            >
              <span style={{ fontSize: size.value }}>{size.label}</span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <div className="border-r border-gray-300 h-6 mx-2" />

      {/* Text Color */}
      <Popover placement="bottom">
        <PopoverTrigger>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="min-w-8 h-8 relative"
            title="Text Color"
          >
            <MdFormatColorText size={16} />
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="p-2">
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Format Group */}
      <div className="flex gap-1 mx-2">
        <Tooltip content="Bold" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('bold') ? "solid" : "flat"}
            onPress={() => editor.chain().focus().toggleBold().run()}
            className="min-w-8 h-8"
            aria-label="Bold text"
          >
            <FaBold size={14} />
          </Button>
        </Tooltip>
        <Tooltip content="Italic" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('italic') ? "solid" : "flat"}
            onPress={() => editor.chain().focus().toggleItalic().run()}
            className="min-w-8 h-8"
            aria-label="Italic text"
          >
            <FaItalic size={14} />
          </Button>
        </Tooltip>
        <Tooltip content="Underline" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('underline') ? "solid" : "flat"}
            onPress={() => editor.chain().focus().toggleUnderline().run()}
            className="min-w-8 h-8"
            aria-label="Underline text"
          >
            <FaUnderline size={14} />
          </Button>
        </Tooltip>
      </div>

      <div className="border-r border-gray-300 h-6 mx-1" />

      {/* Lists */}
      <div className="flex gap-1 mr-2">
        <Tooltip content="Bullet List" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('bulletList') ? "solid" : "flat"}
            onPress={() => editor.chain().focus().toggleBulletList().run()}
            className="min-w-8 h-8"
            aria-label="Bullet list"
          >
            <FaListUl size={14} />
          </Button>
        </Tooltip>
        <Tooltip content="Numbered List" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('orderedList') ? "solid" : "flat"}
            onPress={() => editor.chain().focus().toggleOrderedList().run()}
            className="min-w-8 h-8"
            aria-label="Numbered list"
          >
            <FaListOl size={14} />
          </Button>
        </Tooltip>
      </div>

      <div className="border-r border-gray-300 h-6 mx-1" />

      {/* Alignment Group */}
      <div className="flex gap-1 mr-2">
        <Tooltip content="Align Left" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive({ textAlign: 'left' }) ? "solid" : "flat"}
            onPress={() => editor.chain().focus().setTextAlign('left').run()}
            className="min-w-8 h-8"
            aria-label="Align text left"
          >
            <FaAlignLeft size={14} />
          </Button>
        </Tooltip>
        <Tooltip content="Align Center" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive({ textAlign: 'center' }) ? "solid" : "flat"}
            onPress={() => editor.chain().focus().setTextAlign('center').run()}
            className="min-w-8 h-8"
            aria-label="Align text center"
          >
            <FaAlignCenter size={14} />
          </Button>
        </Tooltip>
        <Tooltip content="Align Right" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive({ textAlign: 'right' }) ? "solid" : "flat"}
            onPress={() => editor.chain().focus().setTextAlign('right').run()}
            className="min-w-8 h-8"
            aria-label="Align text right"
          >
            <FaAlignRight size={14} />
          </Button>
        </Tooltip>
        <Tooltip content="Justify" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive({ textAlign: 'justify' }) ? "solid" : "flat"}
            onPress={() => editor.chain().focus().setTextAlign('justify').run()}
            className="min-w-8 h-8"
            aria-label="Justify text"
          >
            <FaAlignJustify size={14} />
          </Button>
        </Tooltip>
      </div>

      <div className="border-r border-gray-300 h-6 mx-1" />

      {/* Link Button */}
      <Tooltip content="Insert Link" placement="top">
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive('link') ? "solid" : "flat"}
          onPress={handleLinkInsert}
          className="min-w-8 h-8"
          aria-label="Insert link"
        >
          <FaLink size={14} />
        </Button>
      </Tooltip>
      
      <Tooltip content="Insert Image" placement="top">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          onPress={() => {
            const url = window.prompt('Image URL');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className="min-w-8 h-8 ml-1"
          aria-label="Insert image"
        >
          <FaImage size={14} />
        </Button>
      </Tooltip>
    </div>
  );
};

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
  onApprove: (htmlContent: string, templateName?: string, outputFormat?: string) => void;
}

export default function DocumentPreview({ documentData, onApprove }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [defaultTemplate, setDefaultTemplate] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('docx');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Color,
      TextStyle,
      FontFamily,
    ],
    content: '<p>Loading template...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none p-4 min-h-[300px]',
      },
    },
  });

  // Fetch available templates and default template
  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoadingTemplates(true);
        const [templateData, defaultTemplateHtml] = await Promise.all([
          getTemplates('document'),
          loadDefaultTemplate() // Load the default DOCX template
        ]);
        
        setTemplates(templateData);
        setDefaultTemplate(defaultTemplateHtml || generateDefaultLoiTemplate(documentData));
        
        if (templateData.length > 0) {
          setSelectedTemplate(templateData[0].id || 'default');
          
          // Load the first template
          const initialHtml = processTemplate(templateData[0].content, documentData);
          editor?.commands.setContent(initialHtml);
        } else {
          // No templates found, load the default template
          setSelectedTemplate('default');
          const processedDefaultTemplate = processTemplate(defaultTemplateHtml || generateDefaultLoiTemplate(documentData), documentData);
          editor?.commands.setContent(processedDefaultTemplate);
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
  }, [documentData, editor?.commands]);

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    let templateContent = '';
    
    if (templateId === 'default') {
      templateContent = defaultTemplate || generateDefaultLoiTemplate(documentData);
    } else {
      const selectedTemplateData = templates.find(t => t.id === templateId);
      if (selectedTemplateData) {
        templateContent = processTemplate(selectedTemplateData.content, documentData);
      } else {
        templateContent = processTemplate(defaultTemplate || generateDefaultLoiTemplate(documentData), documentData);
      }
    }
    
    editor?.commands.setContent(processTemplate(templateContent, documentData));
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
      onApprove(htmlContent, selectedTemplate, outputFormat);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingTemplates) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" color="blue-500" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm" data-testid="document-preview-card">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-xl font-semibold" data-testid="document-preview-title">Document Preview</h2>
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as "edit" | "preview")}
            className="w-auto"
            data-testid="view-mode-tabs"
            variant="solid"
            color="primary"
            size="sm"
            radius="full"
          >
            <Tab value="edit" title="Edit" data-testid="edit-tab" />
            <Tab value="preview" title="Preview" data-testid="preview-tab" />
          </Tabs>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="w-full sm:w-2/3">
            <Select
              label="Template"
              placeholder="Select a template"
              selectedKeys={[selectedTemplate]}
              onChange={(value) => handleTemplateChange(value.toString())}
              className="w-full"
              aria-label="Template selector"
              data-testid="template-selector"
            >
              <SelectItem key="default">Default Template</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id || ''}>
                  {template.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-1/3">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1">Output Format</label>
              <RadioGroup 
                orientation="horizontal" 
                value={outputFormat}
                onValueChange={setOutputFormat}
                className="gap-4"
              >
                <Radio value="docx">DOCX</Radio>
                <Radio value="pdf">PDF</Radio>
              </RadioGroup>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardBody>
        {viewMode === "edit" ? (
          <div className="border border-gray-300 rounded-md min-h-[500px] mb-4" data-testid="editor-container">
            <EditorToolbar editor={editor} />
            <div className="p-4 bg-white">
              <EditorContent editor={editor} className="min-h-[500px]" />
            </div>
          </div>
        ) : (
          <div 
            className="border border-gray-300 rounded-md min-h-[500px] mb-4 p-6 bg-white" 
            data-testid="preview-container"
            role="article"
          >
            <div 
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }}
            />
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button
            color="primary"
            onPress={handleApprove}
            isLoading={isLoading}
            data-testid="approve-button"
            aria-label={`Generate ${outputFormat.toUpperCase()} Document`}
          >
            {isLoading ? 'Generating...' : `Generate ${outputFormat.toUpperCase()} Document`}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}