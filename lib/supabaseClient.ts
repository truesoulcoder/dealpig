/**
 * Re-export supabase client for backward compatibility.
 * This file ensures components using the old import path continue to work.
 * 
 * For future development, import directly from '@/lib/supabase' instead.
 */

export { supabase, createAdminClient } from './supabase';