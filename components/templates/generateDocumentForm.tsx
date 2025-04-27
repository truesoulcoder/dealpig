"use client";

import { useState } from 'react';
import { generateLoi } from '@/actions/generateLoi.action';
import { Button, Card, CardBody } from '@heroui/react';
import DocumentPreview from './documentPreview';
import dynamic from 'next/dynamic';
import html2canvas from 'html2canvas';
import { PDFDocument, StandardFonts } from 'pdf-lib';

// Dynamically import DocumentPreview to avoid SSR issues with the editor
const DynamicDocumentPreview = dynamic(() => import('./documentPreview'), { ssr: false });

export default function GenerateDocumentForm() {
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyState, setPropertyState] = useState('');
  const [propertyZip, setPropertyZip] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [earnestMoney, setEarnestMoney] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [message, setMessage] = useState('');
  const [documentPath, setDocumentPath] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show document preview instead of generating right away
    if (validateForm()) {
      setShowPreview(true);
    }
  };
  
  const validateForm = () => {
    // Simple validation
    if (!propertyAddress || !propertyCity || !propertyState || !propertyZip || 
        !recipientName || !offerPrice || !earnestMoney || !closingDate) {
      setMessage('Please fill out all required fields');
      return false;
    }
    
    if (parseFloat(offerPrice) <= 0 || parseFloat(earnestMoney) <= 0) {
      setMessage('Offer price and earnest money must be positive numbers');
      return false;
    }
    
    setMessage('');
    return true;
  };

  const handleGenerateDocument = async (htmlContent: string) => {
    setIsLoading(true);
    setMessage('Generating document...');
    setDocumentPath(null);

    try {
      // Option 1: Call the server action to generate a DOCX (as before)
      const filePath = await generateLoi({
        propertyAddress,
        propertyCity,
        propertyState,
        propertyZip,
        recipientName,
        offerPrice: parseFloat(offerPrice),
        earnestMoney: parseFloat(earnestMoney),
        closingDate,
      });
      
      setDocumentPath(filePath);
      setMessage('Document generated successfully!');
      
      // Option 2: Generate PDF from HTML (client-side)
      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);
      
      try {
        // Convert the HTML to a canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2, // Higher resolution
          useCORS: true,
          logging: false,
        });
        
        // Convert the canvas to a PDF using pdf-lib
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([canvas.width / 2, canvas.height / 2]);
        
        // Add the image to the PDF
        const imgData = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');
        const img = await pdfDoc.embedPng(Buffer.from(imgData, 'base64'));
        const { width, height } = page.getSize();
        
        page.drawImage(img, {
          x: 0,
          y: 0,
          width,
          height,
        });
        
        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `LOI-${propertyAddress.replace(/[^a-z0-9]/gi, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
      }
      
      // Clean up the temporary div
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('Error generating document:', error);
      setMessage('Failed to generate document.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        {!showPreview ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Property Address</label>
                <input
                  type="text"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">City</label>
                <input
                  type="text"
                  value={propertyCity}
                  onChange={(e) => setPropertyCity(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">State</label>
                <input
                  type="text"
                  value={propertyState}
                  onChange={(e) => setPropertyState(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Zip</label>
                <input
                  type="text"
                  value={propertyZip}
                  onChange={(e) => setPropertyZip(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Recipient Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Offer Price</label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Earnest Money</label>
                <input
                  type="number"
                  value={earnestMoney}
                  onChange={(e) => setEarnestMoney(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Closing Date</label>
                <input
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                type="submit"
                color="primary"
              >
                Preview Document
              </Button>
            </div>
            
            {message && (
              <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded">
                {message}
              </div>
            )}
          </form>
        ) : (
          <>
            <Button 
              onPress={() => setShowPreview(false)}
              variant="light"
              className="mb-4"
            >
              ← Back to Form
            </Button>
            
            <DynamicDocumentPreview
              documentData={{
                propertyAddress,
                propertyCity,
                propertyState,
                propertyZip,
                recipientName,
                offerPrice: parseFloat(offerPrice),
                earnestMoney: parseFloat(earnestMoney),
                closingDate,
              }}
              onApprove={handleGenerateDocument}
            />
            
            {documentPath && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <h3 className="font-medium text-green-800">Document Generated!</h3>
                <p className="text-sm text-green-700 mb-2">
                  Your document has been generated successfully. You can download it using the link below:
                </p>
                <a 
                  href={documentPath}
                  download
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-block text-sm"
                >
                  Download Letter of Intent (DOCX)
                </a>
              </div>
            )}
            
            {isLoading && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  Generating document, please wait...
                </p>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}