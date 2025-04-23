import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';
import path from 'path';

interface GenerateLoiParams {
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  recipientName: string;
  offerPrice: number;
  earnestMoney: number;
  closingDate: string;
}

export async function generateLoi(params: GenerateLoiParams): Promise<string> {
  const {
    propertyAddress,
    propertyCity,
    propertyState,
    propertyZip,
    recipientName,
    offerPrice,
    earnestMoney,
    closingDate,
  } = params;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: `Letter of Intent`, bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            text: `Date: ${new Date().toLocaleDateString()}`,
          }),
          new Paragraph({
            text: `Recipient: ${recipientName}`,
          }),
          new Paragraph({
            text: `Property Address: ${propertyAddress}, ${propertyCity}, ${propertyState} ${propertyZip}`,
          }),
          new Paragraph({
            text: `Offer Price: $${offerPrice.toLocaleString()}`,
          }),
          new Paragraph({
            text: `Earnest Money: $${earnestMoney.toLocaleString()}`,
          }),
          new Paragraph({
            text: `Closing Date: ${closingDate}`,
          }),
        ],
      },
    ],
  });

  const outputPath = path.join(process.cwd(), 'public', 'generated-loi.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}