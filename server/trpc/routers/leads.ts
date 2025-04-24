import { z } from 'zod';
import { router, protectedProcedure } from '../router';
import { getLeads, insertLead, updateLead, deleteLead } from '@/lib/database';

// Schema for validating lead data
const leadSchema = z.object({
  id: z.string().optional(),
  property_address: z.string().min(1, 'Property address is required'),
  property_city: z.string().min(1, 'City is required'),
  property_state: z.string().min(1, 'State is required'),
  property_zip: z.string().min(5, 'Zip code is required'),
  owner_name: z.string().min(1, 'Owner name is required'),
  owner_email: z.string().email('Valid email is required'),
  owner_phone: z.string().optional(),
  status: z.enum(['new', 'contacted', 'negotiating', 'closed', 'dead']).optional(),
  email_status: z.enum(['not_sent', 'sent', 'opened', 'clicked', 'replied']).optional(),
  offer_price: z.number().nonnegative(),
  earnest_money: z.number().nonnegative(),
  closing_date: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  notes: z.string().optional()
});

export const leadsRouter = router({
  // Get all leads with optional filtering
  getLeads: protectedProcedure
    .input(
      z.object({
        status: z.enum(['new', 'contacted', 'negotiating', 'closed', 'dead']).optional(),
        emailStatus: z.enum(['not_sent', 'sent', 'opened', 'clicked', 'replied']).optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional()
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      // Call your existing getLeads function with the filters
      const leads = await getLeads(
        input?.status, 
        input?.emailStatus,
        input?.limit || 100,
        input?.offset || 0
      );
      return leads;
    }),

  // Get a single lead by ID
  getLead: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const leads = await getLeads(undefined, undefined, 1, 0, id);
      return leads[0] || null;
    }),

  // Create a new lead
  createLead: protectedProcedure
    .input(leadSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      // Convert from camelCase to snake_case if needed
      const newLead = await insertLead(input);
      return newLead;
    }),

  // Update an existing lead
  updateLead: protectedProcedure
    .input(leadSchema)
    .mutation(async ({ ctx, input }) => {
      if (!input.id) {
        throw new Error('Lead ID is required for updating');
      }
      const updatedLead = await updateLead(input.id, input);
      return updatedLead;
    }),

  // Delete a lead
  deleteLead: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      await deleteLead(id);
      return { success: true, id };
    })
});