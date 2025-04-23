/**
 * Test Email Flow Script
 * 
 * This script tests the complete email flow including:
 * 1. Loading OAuth tokens
 * 2. Generating a test LOI document
 * 3. Sending a test email with the LOI attached
 * 
 * Usage: npx ts-node src/scripts/testEmailFlow.ts [sender_email]
 */

import { GmailService } from '../lib/gmail';
import { loadTokensForEmail } from '../utils/tokenLoader';
import { generateLOI } from '../services/loiGenerator';

// Mock lead data for testing
const testLead = {
  id: 'test-lead-id',
  property_address: '123 Test Street',
  property_city: 'Charlotte',
  property_state: 'NC',
  property_zip: '28202',
  wholesale_value: 250000,
  market_value: 320000,
  days_on_market: 45,
  mls_status: 'Active',
  mls_list_date: '2025-03-01',
  mls_list_price: 320000,
  status: 'NEW'
};

// Mock sender data for testing
const createTestSender = (email: string, name: string) => ({
  id: 'test-sender-id',
  name,
  email,
  title: 'Real Estate Acquisition Specialist'
});

async function testEmailFlow(senderEmail: string) {
  console.log('=== DealPig Email Flow Test ===\n');
  
  try {
    // Step 1: Parse sender email or use default
    const email = senderEmail || 'test@example.com';
    const name = email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
    const sender = createTestSender(email, name);
    
    console.log(`Testing email flow for: ${sender.name} <${sender.email}>`);
    
    // Step 2: Load OAuth tokens
    console.log('\n1. Loading OAuth tokens...');
    const tokens = await loadTokensForEmail(sender.email);
    
    if (!tokens) {
      throw new Error(`No OAuth tokens found for ${sender.email}. Please authorize this sender first.`);
    }
    console.log('✅ OAuth tokens loaded successfully');
    
    // Step 3: Initialize Gmail service
    console.log('\n2. Initializing Gmail service...');
    const gmailService = new GmailService(sender.email, sender.name);
    await gmailService.initialize();
    console.log('✅ Gmail service initialized successfully');
    
    // Step 4: Generate test LOI
    console.log('\n3. Generating test LOI document...');
    const { buffer, filename } = await generateLOI(testLead, sender);
    console.log(`✅ LOI generated successfully: ${filename} (${buffer.length} bytes)`);
    
    // Step 5: Send test email
    console.log('\n4. Sending test email...');
    const testSubject = `Test Email - DealPig Dashboard (${new Date().toLocaleString()})`;
    const testBody = `
      <h2>DealPig Dashboard Email Test</h2>
      <p>This is a test email to verify that the email sending functionality is working correctly.</p>
      <p>Property: ${testLead.property_address}, ${testLead.property_city}, ${testLead.property_state} ${testLead.property_zip}</p>
      <p>Please find the attached Letter of Intent (LOI) document.</p>
      <p>If you received this email, the email flow is working correctly!</p>
      <p><strong>Next steps:</strong> Check that the attached PDF is formatted correctly and contains all the expected information.</p>
      <hr>
      <p><em>This is an automated test email from the DealPig Dashboard.</em></p>
    `;
    
    // Send email to the sender's own address for testing
    const { id: messageId } = await gmailService.sendEmail(
      [sender.email],  // Send to the sender's own email for testing
      testSubject,
      testBody,
      buffer,
      filename
    );
    
    console.log(`✅ Test email sent successfully! Message ID: ${messageId}`);
    console.log(`   Email sent to: ${sender.email}`);
    
    // Success message
    console.log('\n🎉 Email flow test completed successfully! 🎉');
    console.log(`Please check ${sender.email} to verify that the test email was received with the LOI attachment.`);
    
  } catch (error) {
    console.error('\n❌ Email flow test failed:');
    console.error(error instanceof Error ? error.message : error);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check that the sender email is correctly authorized in the application');
    console.error('2. Verify that OAuth tokens are valid and not expired');
    console.error('3. Ensure all required environment variables are set correctly');
    console.error('4. Check Gmail API quotas and limits');
    process.exit(1);
  }
}

// Get sender email from command line argument
const senderEmail = process.argv[2];
if (!senderEmail) {
  console.error('❌ Error: Please provide a sender email as a command line argument');
  console.error('Usage: npx ts-node src/scripts/testEmailFlow.ts [sender_email]');
  console.error('Example: npx ts-node src/scripts/testEmailFlow.ts matt.jenkins@truesoulpartners.com');
  process.exit(1);
}

// Run the test
testEmailFlow(senderEmail);