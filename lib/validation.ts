import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, z } from 'zod';
import { sanitizeInput } from './security';

/**
 * Validates request body against a Zod schema and sanitizes input
 * @param schema The Zod schema to validate against
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (request: NextRequest): Promise<{ 
    data: T | null; 
    error: string | null;
    response: NextResponse | null;
  }> => {
    try {
      // Parse the request body
      const body = await request.json();
      
      // First sanitize the input to prevent injection attacks
      const sanitizedBody = sanitizeInput(body);
      
      // Then validate against the schema
      const validatedData = schema.parse(sanitizedBody);
      
      return {
        data: validatedData,
        error: null,
        response: null
      };
    } catch (error) {
      console.error('Validation error:', error);
      
      // If it's a Zod error, format it nicely
      if (error instanceof z.ZodError) {
        return {
          data: null,
          error: 'Validation failed',
          response: NextResponse.json(
            { 
              success: false, 
              message: 'Validation failed', 
              errors: error.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message
              }))
            },
            { status: 400 }
          )
        };
      }
      
      // Generic error
      return {
        data: null,
        error: 'Invalid request data',
        response: NextResponse.json(
          { success: false, message: 'Invalid request data' },
          { status: 400 }
        )
      };
    }
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  id: z.string().uuid('Invalid ID format'),
  name: z.string().min(1, 'Name is required').max(100),
  pagination: z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(10),
  }),
  // Add more common schemas as needed
};