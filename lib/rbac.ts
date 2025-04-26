import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';
import getLogger from './logger';

// Define role types
export type UserRole = 'admin' | 'manager' | 'user' | 'guest';

// Helper function to get logger
async function getLoggerInstance() {
  return await getLogger();
}

// Define permission types
export type Permission = 
  // User management
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete'
  // Campaign permissions
  | 'campaigns.view' | 'campaigns.create' | 'campaigns.edit' | 'campaigns.delete'
  // Lead permissions
  | 'leads.view' | 'leads.create' | 'leads.edit' | 'leads.delete'
  // Sender permissions
  | 'senders.view' | 'senders.create' | 'senders.edit' | 'senders.delete'
  // Analytics permissions
  | 'analytics.view' | 'analytics.export';

// Role-permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.delete',
    'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
    'senders.view', 'senders.create', 'senders.edit', 'senders.delete',
    'analytics.view', 'analytics.export'
  ],
  manager: [
    'users.view',
    'campaigns.view', 'campaigns.create', 'campaigns.edit',
    'leads.view', 'leads.create', 'leads.edit',
    'senders.view', 'senders.create', 'senders.edit',
    'analytics.view', 'analytics.export'
  ],
  user: [
    'campaigns.view', 'campaigns.create',
    'leads.view', 'leads.create',
    'senders.view',
    'analytics.view'
  ],
  guest: [
    'campaigns.view',
    'leads.view'
  ]
};

/**
 * Check if a user has the required permission
 */
export async function hasPermission(userId: string, requiredPermission: Permission): Promise<boolean> {
  try {
    // Get user profile with role
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error || !profile) {
      const logger = await getLoggerInstance();
      await logger.error(`Error fetching user role: ${error?.message || 'User not found'}`, 'rbac');
      return false;
    }
    
    // Default to 'user' role if not specified
    const userRole = (profile.role as UserRole) || 'user';
    
    // Check if the user's role has the required permission
    return rolePermissions[userRole].includes(requiredPermission);
  } catch (error) {
    const logger = await getLoggerInstance();
    await logger.error(`Permission check error: ${error instanceof Error ? error.message : String(error)}`, 'rbac');
    return false;
  }
}

/**
 * Middleware to check if the authenticated user has the required permission
 */
export function requirePermission(permission: Permission) {
  return async (request: NextRequest) => {
    try {
      // Extract user ID from authentication token (implementation depends on your auth system)
      const supabaseAdmin = await getSupabaseAdmin();
      const session = await supabaseAdmin.auth.getSession();
      const userId = session.data.session?.user.id;
      
      if (!userId) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Check if the user has the required permission
      const hasAccess = await hasPermission(userId, permission);
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      // User has permission, continue
      return null;
    } catch (error) {
      const logger = await getLoggerInstance();
      await logger.error(`Permission middleware error: ${error instanceof Error ? error.message : String(error)}`, 'rbac');
      return NextResponse.json(
        { success: false, message: 'Error checking permissions' },
        { status: 500 }
      );
    }
  };
}