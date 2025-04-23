"use client";

import { useState, useEffect } from 'react';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Button } from '@nextui-org/button';
import { Card, CardBody } from '@nextui-org/card';

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
  };
  onApprove: (htmlContent: string) => void;
}

export default function DocumentPreview({ documentData, onApprove }: DocumentPreviewProps) {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Generate the initial HTML template based on document data
    const initialHtml = generateLoiTemplate(documentData);
    
    // Convert HTML to Draft.js ContentState
    const contentBlock = htmlToDraft(initialHtml);
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, [documentData]);

  const generateLoiTemplate = (data: DocumentPreviewProps['documentData']) => {
    const currentDate = new Date().toLocaleDateString();
    return `
      <h1 style="font-size: 24px; font-weight: bold;">Letter of Intent</h1>
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
      <p>[Your Name]<br>
      [Your Company]<br>
      [Your Contact Information]</p>
    `;
  };

  const handleApprove = () => {
    setIsLoading(true);
    try {
      // Convert editor content to HTML
      const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
      onApprove(htmlContent);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Document Preview</h2>
          <p className="text-sm text-gray-600 mb-4">
            You can edit the document below before generating the final version.
          </p>
          
          <div className="border border-gray-300 rounded-md min-h-[500px] mb-4">
            <Editor
              editorState={editorState}
              onEditorStateChange={setEditorState}
              wrapperClassName="w-full"
              editorClassName="px-4 py-2 min-h-[450px]"
              toolbar={{
                options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'history'],
                inline: { inDropdown: false },
                list: { inDropdown: true },
                textAlign: { inDropdown: true },
              }}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              color="primary"
              onClick={handleApprove}
              isLoading={isLoading}
            >
              {isLoading ? 'Generating...' : 'Approve & Generate Document'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}