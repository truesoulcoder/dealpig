import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { addDays, format } from 'date-fns';

const INPUT_CSV = path.resolve(process.cwd(), 'data', 'leads.csv');
const OUTPUT_DIR = path.resolve(process.cwd(), 'DOCX_output');
const DOM_THRESHOLD = 90;

// Helpers to parse and format currency
function formatCurrency(value: number): string {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseCurrency(value: string): number {
    try {
        return parseFloat(value.replace(/\$/g, '').replace(/,/g, '').trim());
    } catch {
        return 0.0;
    }
}

// Helper to build and save a DOCX file for a lead
async function generateDocxLoI(data: {
    FullName: string;
    Address: string;
    City: string;
    State: string;
    ZipCode: string;
    WholesaleValue: string;
    EMD: string;
    ClosingDate: string;
}, outputPath: string) {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({ text: `${data.Address}, ${data.City}, ${data.State} ${data.ZipCode}` }),
                    new Paragraph({ text: format(new Date(), 'MM/dd/yyyy') }),
                    new Paragraph({ text: `Dear ${data.FullName},` }),
                    new Paragraph({
                        text: `I am writing to express my interest in structuring an all-cash offer on the property located at ${data.Address}, ${data.City}, ${data.State} ${data.ZipCode}.`
                    }),
                    new Paragraph({
                        text: `Based on market conditions, comparable sales, and property profile, I would like to propose the following terms:`
                    }),
                    new Paragraph({ text: 'Offer Summary:' }),
                    new Paragraph({ text: `     - Price: ${data.WholesaleValue}` }),
                    new Paragraph({ text: '     - Option Period: 7 days (excluding weekends and federal holidays)' }),
                    new Paragraph({ text: `     - Earnest Money Deposit (EMD): ${data.EMD}` }),
                    new Paragraph({ text: '     - Buyer’s Assignment Consideration (BAC): $10' }),
                    new Paragraph({ text: `     - Closing Date: On or before ${data.ClosingDate}` }),
                    new Paragraph({ text: 'Offer Highlights:' }),
                    new Paragraph({ text: '     - As-Is Condition' }),
                    new Paragraph({ text: '     - Buyer Pays All Closing Costs' }),
                    new Paragraph({ text: '     - Quick Close Available' }),
                    new Paragraph({ text: 'Title Company: Kristin Blay at Ghrist Law – Patten Title' }),
                    new Paragraph({ text: 'I am only able to acquire a limited number of properties at a time. As such, offer is only valid for 48 hours after it is received.' }),
                    new Paragraph({ text: 'Warm regards,' }),
                    new Paragraph({ text: 'Chris Phillips' }),
                    new Paragraph({ text: 'True Soul Partners LLC' }),
                    new Paragraph({ text: '📞 817.500.1440' }),
                    new Paragraph({
                        text: 'This Letter of Intent to Purchase Real Estate outlines general intentions and is not legally binding. Terms are subject to further negotiation and approval. No party is obligated until a formal agreement is executed.'
                    })
                ],
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
}

// Main handler for the API endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Only allow GET (or change as needed)
    if (req.method !== 'GET') {
        res.status(405).end('Method Not Allowed');
        return;
    }

    try {
        if (!fs.existsSync(INPUT_CSV)) {
            res.status(500).json({ error: `CSV file not found: ${INPUT_CSV}` });
            return;
        }

        // Ensure the output directory exists
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const raw = fs.readFileSync(INPUT_CSV, 'utf8');
        const rows = parse(raw, {
            columns: true,
            skip_empty_lines: true,
            bom: true,
        }) as Record<string, string>[];

        // Filter rows: DOM >= threshold and at least one email field containing '@'
        const emailFields = ['Contact1Email_1', 'Contact1Email_2', 'Contact1Email_3'];
        const filteredRows = rows.filter(row => {
            const dom = parseFloat(row['MLS_Curr_DaysOnMarket'] || '0');
            if (isNaN(dom) || dom < DOM_THRESHOLD) return false;
            return emailFields.some(field => {
                const email = row[field]?.trim() || '';
                return email.includes('@');
            });
        });

        let count = 0;
        for (const row of filteredRows) {
            // Build a full name from possibly separate fields (if available)
            const fullName = `${(row['FirstName'] || '').trim()} ${(row['LastName'] || '').trim()}`.trim();

            // Calculate wholesale value and associated fields
            const wholesaleRaw = row['WholesaleValue'] || '0';
            const wholesaleVal = 0.95 * parseCurrency(wholesaleRaw);
            const closingDate = format(addDays(new Date(), 14), 'MM/dd/yyyy');
            const emd = wholesaleVal * 0.01;

            const data = {
                FullName: fullName,
                Address: (row['PropertyAddress'] || '').trim(),
                City: (row['PropertyCity'] || '').trim(),
                State: (row['PropertyState'] || '').trim(),
                ZipCode: (row['PropertyPostalCode'] || '').trim(),
                WholesaleValue: formatCurrency(wholesaleVal),
                EMD: formatCurrency(emd),
                ClosingDate: closingDate,
            };

            // Clean the filename to remove unwanted characters
            let filename = `${data.Address} - LETTER OF INTENT.docx`;
            filename = filename
                .split('')
                .filter(c => /[a-zA-Z0-9 _\-\.]/.test(c))
                .join('')
                .trim();

            const outputPath = path.join(OUTPUT_DIR, filename);
            await generateDocxLoI(data, outputPath);
            count++;
        }
        res.status(200).json({ message: `Generated ${count} LOIs based on DOM ≥ ${DOM_THRESHOLD} and valid email(s).` });
    } catch (error: any) {
        console.error('Error generating LOIs:', error);
        res.status(500).json({ error: error.message });
    }
}