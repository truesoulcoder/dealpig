import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateSession } from "@/lib/security";
import { sendEmail } from "@/actions/sendEmail.action";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate user session
    const session = await validateSession();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get campaign ID from params
    const { id: campaignId } = params;
    if (!campaignId) {
      return NextResponse.json(
        { message: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { senderId, recipientEmail } = body;

    if (!senderId || !recipientEmail) {
      return NextResponse.json(
        { message: "Sender ID and recipient email are required" },
        { status: 400 }
      );
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("campaigns")
      .select("name, email_template_id, loi_template_id")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Error fetching campaign:", campaignError);
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get sender details
    const { data: sender, error: senderError } = await supabaseAdmin
      .from("senders")
      .select("name, email")
      .eq("id", senderId)
      .single();

    if (senderError || !sender) {
      console.error("Error fetching sender:", senderError);
      return NextResponse.json(
        { message: "Sender not found" },
        { status: 404 }
      );
    }

    // Get email template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("templates")
      .select("content, subject")
      .eq("id", campaign.email_template_id)
      .single();

    if (templateError || !template) {
      console.error("Error fetching template:", templateError);
      return NextResponse.json(
        { message: "Email template not found" },
        { status: 404 }
      );
    }

    // Get LOI template if exists
    let loiTemplate = null;
    if (campaign.loi_template_id) {
      const { data, error } = await supabaseAdmin
        .from("templates")
        .select("content")
        .eq("id", campaign.loi_template_id)
        .single();
        
      if (!error && data) {
        loiTemplate = data;
      }
    }

    // Replace template variables with sample data for the test email
    const sampleData = {
      recipient_name: recipientEmail.split('@')[0],
      property_address: "123 Test St",
      property_city: "Test City",
      property_state: "TX",
      property_zip: "12345",
      offer_price: "$250,000",
      earnest_money: "$2,500",
      closing_date: "30 days from acceptance",
      company_name: "Your Company",
      sender_name: sender.name,
      sender_email: sender.email
    };

    let emailContent = template.content;
    let emailSubject = template.subject || `[TEST] ${campaign.name} - Campaign Verification`;
    
    // Replace variables in content and subject
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      emailContent = emailContent.replace(regex, value as string);
      emailSubject = emailSubject.replace(regex, value as string);
    });

    // Add test email prefix and notice
    emailContent = `
      <div style="background-color: #fff3cd; color: #856404; padding: 10px; border: 1px solid #ffeeba; border-radius: 4px; margin-bottom: 15px;">
        <strong>TEST EMAIL:</strong> This is a verification test for campaign "${campaign.name}". 
        No action is required. Sent from ${sender.name} (${sender.email}).
      </div>
      ${emailContent}
    `;

    // Generate test attachment if LOI template exists
    let testAttachment = null;
    if (loiTemplate) {
      // In a real implementation, this would generate a test document
      // For now, we'll simulate success without an actual attachment
      testAttachment = {
        filename: "test-letter-of-intent.pdf",
        content: "simulated content for test",
        contentType: "application/pdf"
      };
    }

    // Send the test email
    await sendEmail({
      to: recipientEmail,
      from: {
        email: sender.email,
        name: sender.name
      },
      subject: emailSubject,
      html: emailContent,
      attachment: testAttachment
    });

    // Update the database to record that the test email was sent
    await supabaseAdmin
      .from("campaign_senders")
      .update({ 
        test_sent: true,
        test_sent_at: new Date().toISOString()
      })
      .eq("campaign_id", campaignId)
      .eq("sender_id", senderId);

    return NextResponse.json(
      { success: true, message: "Test email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { message: "Failed to send test email", error: (error as Error).message },
      { status: 500 }
    );
  }
}