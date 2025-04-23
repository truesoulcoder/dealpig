// scripts/sendEmails.ts

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { generateLoi } from './generateLoi'; // your LOI .docx generator

// 1) Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 2) Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 3) Initialize Gmail API auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/gmail.send'],
});
const gmail = google.gmail({ version: 'v1', auth });

// 4) Sender info
const sender = process.env.GMAIL_USER!;
const fromNameMap = JSON.parse(process.env.FROM_NAME_MAP!);
const senderName = fromNameMap[sender] || sender;

async function sendEmails() {
  // A) Fetch up to 100 un‑worked leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select(`
      id,
      property_address,
      property_city,
      property_state,
      property_postal_code,
      wholesale_value,
      contact1_email,
      contact2_email,
      contact3_email
    `)
    .eq('worked', false)
    .limit(100);

  if (error) throw error;
  console.log(`🏃‍♂️ Preparing to send LOIs for ${leads!.length} properties…`);

  for (const lead of leads!) {
    // B) Collect all contact emails
    const recipients = [
      lead.contact1_email,
      lead.contact2_email,
      lead.contact3_email,
    ]
      .filter((e): e is string => !!e && e.includes('@'))
      .join(', ');
    if (!recipients) {
      console.warn('⚠️ No valid recipients for lead', lead.id);
      continue;
    }

    // C) Build address line
    const addressLine = `${lead.property_address}, ${lead.property_city}, ${lead.property_state} ${lead.property_postal_code}`;

    // D) Calculate pricing and dates
    const gross = lead.wholesale_value;
    const price = +(gross * 0.95).toFixed(2);
    const emd = +(price * 0.01).toFixed(2);
    const closingDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const closingDateStr = closingDate.toLocaleDateString('en-US');
    const priceStr = price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const emdStr = emd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    // E) Generate the LOI .docx just‑in‑time
    const docxPath = generateLoi({
      Address: lead.property_address,
      City: lead.property_city,
      State: lead.property_state,
      ZipCode: lead.property_postal_code,
      WholesaleValue: priceStr,
      EMD: emdStr,
      ClosingDate: closingDateStr,
    });

    const fileBuffer = fs.readFileSync(docxPath);
    const fileBase64 = fileBuffer.toString('base64');

    // F) Compose the HTML email body
    const htmlBody = `
<p>Greetings,</p>

<p>I am writing to express my interest in structuring an all‑cash offer on the property located at <strong>${addressLine}</strong>.</p>

<p>I propose a cash offer we’ve underwritten “as‑is” with limited information as to the property’s current condition. Please keep in mind you will pay <strong>no closing costs, commissions, or seller fees</strong> if you choose to accept the offer. You won’t even need to clean up or throw away any debris—we make it easy.</p>

<p>Based on current market conditions, comparable sales, and the property profile, I have outlined the specific terms in the attached Letter of Intent, including:</p>
<ul>
  <li>Price: ${priceStr}</li>
  <li>Earnest Money Deposit: ${emdStr}</li>
  <li>Option Period: 7 days (excluding weekends & federal holidays)</li>
  <li>Buyer’s Assignment Consideration: $10</li>
  <li>Closing Date: On or before ${closingDateStr}</li>
  <li>As‑Is Condition Acceptance</li>
  <li>Buyer Pays All Closing Costs</li>
  <li>Quick Close Available</li>
</ul>

<p><strong>Title Company:</strong> Kristin Blay at Ghrist Law – Patten Title</p>

<p>If you have any questions, simply hit <strong>Reply</strong> or call our office during business hours to speak with our Acquisitions Director, Chris Phillips, at 817‑500‑1404. The offer is valid for 48 hours from time sent.</p>

<p>Warm regards,<br/>
<strong>${senderName}  | True Soul Partners LLC</strong></p>

<p style="font-size:0.9em; color:#555;">
  This Letter of Intent to Purchase Real Estate outlines general intentions and is not legally binding.
  Terms are subject to further negotiation and approval. No party is obligated until a formal agreement is executed.
</p>
`;

    // G) Build the multipart MIME message with attachment
    const boundary = `===_${Date.now()}_===`;
    const rawParts = [
      `From: ${sender}`,
      `To: ${recipients}`,
      `Subject: Letter of Intent for your property at ${addressLine}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      ``,
      htmlBody,
      ``,
      `--${boundary}`,
      `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document; name="LOI-${lead.id}.docx"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="LOI-${lead.id}.docx"`,
      ``,
      fileBase64,
      ``,
      `--${boundary}--`,
    ];
    const raw = rawParts.join('\r\n');

    // H) Send and mark worked
    try {
      const encoded = Buffer.from(raw).toString('base64url');
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encoded },
      });
      console.log(`✅ Sent LOI for ${addressLine} to ${recipients}`);

      await supabase
        .from('leads')
        .update({ worked: true, sent_ts: new Date().toISOString() })
        .eq('id', lead.id);
    } catch (err: any) {
      console.error('❌ Failed to send LOI for', addressLine, err.message);
    }
  }

  console.log('🎉 All done!');
}

sendEmails().catch(err => {
  console.error('💥 Fatal error in sendEmails:', err);
  process.exit(1);
});
