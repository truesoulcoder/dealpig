import { z } from 'zod';
import { router, protectedProcedure } from '../router';

// Email data schema
const emailDataSchema = z.object({
  to: z.string().email('Valid recipient email is required'),
  subject: z.string().min(1, 'Email subject is required'),
  html: z.string().min(1, 'Email content is required'),
  attachments: z.array(
    z.object({
      filename: z.string(),
      path: z.string().optional(),
      content: z.string().optional(),
      contentType: z.string().optional(),
    })
  ).optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  replyTo: z.string().email().optional(),
});

// Email status schema
const emailStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['queued', 'sent', 'delivered', 'opened', 'clicked', 'failed']),
  error: z.string().optional(),
  sentAt: z.string().optional(),
  openedAt: z.string().optional(),
  clickedAt: z.string().optional(),
});

export const emailsRouter = router({
  // Send an email
  sendEmail: protectedProcedure
    .input(emailDataSchema)
    .mutation(async ({ ctx, input }) => {
      // This would typically call your sendEmail action
      // For now, we're just returning a success response with a mock email ID
      const emailId = `email_${Date.now()}`;
      
      return {
        success: true,
        emailId,
        message: 'Email queued successfully',
      };
    }),

  // Send a Letter of Intent email with document attachment
  sendLoiEmail: protectedProcedure
    .input(
      z.object({
        to: z.string().email('Valid recipient email is required'),
        subject: z.string().min(1, 'Email subject is required'),
        html: z.string().min(1, 'Email content is required'),
        documentPath: z.string().min(1, 'Document path is required'),
        leadId: z.string().min(1, 'Lead ID is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would typically call your sendLoiEmail action
      // For now, we're just returning a success response
      return {
        success: true,
        emailId: `email_${Date.now()}`,
        message: 'LOI email sent successfully',
        leadId: input.leadId,
      };
    }),

  // Get email status
  getEmailStatus: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: emailId }) => {
      // This would typically fetch the email status from your database
      // For now, returning mock data
      return {
        id: emailId,
        status: 'sent',
        sentAt: new Date().toISOString(),
      };
    }),

  // Get email history for a lead
  getEmailHistory: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: leadId }) => {
      // This would typically fetch email history from your database
      // For now, returning mock data
      return [
        {
          id: `email_${Date.now() - 86400000}`,
          leadId,
          subject: 'Letter of Intent',
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'delivered',
        },
      ];
    }),
});