"use server";

import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, BorderStyle, Header } from 'docx';
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
  companyLogoPath?: string; // Optional path to company logo
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
    companyLogoPath,
  } = params;

  // Default to the standard logo if no custom logo is provided
  const logoPath = companyLogoPath || path.join(process.cwd(), 'public', 'logo.png');
  
  // Check if logo exists
  let logoBuffer;
  try {
    logoBuffer = fs.readFileSync(logoPath);
  } catch (error) {
    console.warn(`Logo not found at ${logoPath}. Proceeding without logo.`);
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "normal",
          name: "Normal",
          run: {
            size: 24,
            font: "Arial",
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15x line spacing
            },
          },
        },
        {
          id: "heading",
          name: "Heading",
          run: {
            size: 36,
            bold: true,
            font: "Arial",
          },
          paragraph: {
            spacing: {
              after: 240,
            },
          },
        }
      ]
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: logoBuffer ? [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: {
                      width: 100,
                      height: 100,
                    },
                    type: "png", // Specify the type explicitly
                  }),
                ],
              }),
            ] : [],
          }),
        },
        children: [
          new Paragraph({
            style: "heading",
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Letter of Intent`, bold: true, size: 36 }),
            ],
          }),
          new Paragraph({
            style: "normal",
            children: [
              new TextRun({ text: `Date: ${new Date().toLocaleDateString()}`, bold: true }),
            ],
          }),
          new Paragraph({
            style: "normal",
            spacing: {
              before: 200,
            },
            children: [
              new TextRun({ text: `Dear ${recipientName},`, bold: true }),
            ],
          }),
          new Paragraph({
            style: "normal",
            spacing: {
              before: 200,
            },
            children: [
              new TextRun(
                "Please accept this letter as a formal expression of interest to purchase the property located at:"
              ),
            ],
          }),
          new Paragraph({
            style: "normal",
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 200,
              after: 200,
            },
            children: [
              new TextRun({
                text: `${propertyAddress}, ${propertyCity}, ${propertyState} ${propertyZip}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            style: "normal",
            children: [
              new TextRun("I am pleased to offer the following terms:"),
            ],
          }),
          new Paragraph({
            style: "normal",
            spacing: {
              before: 200,
            },
            children: [
              new TextRun({ text: `Purchase Price: `, bold: true }),
              new TextRun(`$${offerPrice.toLocaleString()}`),
            ],
          }),
          new Paragraph({
            style: "normal",
            children: [
              new TextRun({ text: `Earnest Money Deposit: `, bold: true }),
              new TextRun(`$${earnestMoney.toLocaleString()}`),
            ],
          }),
          new Paragraph({
            style: "normal",
            children: [
              new TextRun({ text: `Closing Date: `, bold: true }),
              new TextRun(`${closingDate}`),
            ],
          }),
          new Paragraph({
            style: "normal",
            spacing: {
              before: 400,
            },
            children: [
              new TextRun(
                "This Letter of Intent is non-binding and subject to the execution of a definitive Purchase Agreement. I look forward to your favorable response."
              ),
            ],
          }),
          new Paragraph({
            style: "normal",
            spacing: {
              before: 400,
            },
            children: [
              new TextRun("Sincerely,"),
            ],
          }),
          new Paragraph({
            style: "normal",
            spacing: {
              before: 600,
            },
            children: [
              new TextRun("_______________________________"),
            ],
          }),
        ],
      },
    ],
  });

  // Create a unique filename using timestamp
  const timestamp = Date.now();
  const filename = `generated-loi-${timestamp}.docx`;
  const outputPath = path.join(process.cwd(), 'public', filename);
  
  // Save the file
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  // Return a public URL path that can be used to download the file
  return `/generated-loi-${timestamp}.docx`;
}