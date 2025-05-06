import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function requireSuperAdmin(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized: User not authenticated');
  }
  const allowedEmails = ['chrisphillips@truesoulpartners.com', 'egoluxinvicta@gmail.com'];
  if (!allowedEmails.includes(user.email!)) {
    throw new Error('Forbidden: Not a super admin');
  }
  return user;
}
