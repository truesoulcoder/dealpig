import { z } from 'zod';
import { router, protectedProcedure } from '../router';
import { getTemplates, saveTemplate } from '@/lib/database';

// Schema for document data
const documentDataSchema = z.object({
  propertyAddress: z.string(),
  propertyCity: z.string(),
  propertyState: z.string(),
  propertyZip: z.string(),
  recipientName: z.string(),
  offerPrice: z.number(),
  earnestMoney: z.number(),
  closingDate: z.string(),
  companyName: z.string().optional(),
  senderName: z.string().optional(),
  senderContact: z.string().optional(),
});

// Schema for template data
const templateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  type: z.enum(['document', 'email']),
  content: z.string().min(1, 'Template content is required'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const documentsRouter = router({
  // Get all templates of a specific type
  getTemplates: protectedProcedure
    .input(z.enum(['document', 'email']).optional())
    .query(async ({ ctx, input }) => {
      const templates = await getTemplates(input);
      return templates;
    }),

  // Get a single template by ID
  getTemplate: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const templates = await getTemplates(undefined, id);
      return templates[0] || null;
    }),

  // Save a template (create or update)
  saveTemplate: protectedProcedure
    .input(templateSchema)
    .mutation(async ({ ctx, input }) => {
      const savedTemplate = await saveTemplate(input);
      return savedTemplate;
    }),

  // Generate a document from data and template
  generateDocument: protectedProcedure
    .input(z.object({
      documentData: documentDataSchema,
      templateId: z.string(),
      htmlContent: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // This would typically call your generateLoi action or similar
      // For now, we're just returning a success response
      return {
        success: true,
        documentUrl: `/generated/document_${Date.now()}.pdf`,
        message: 'Document generated successfully',
      };
    }),
});