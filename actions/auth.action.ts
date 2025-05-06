'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { LoginFormType, Profile } from '@/helpers/types';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Helper function to create the Supabase client with cookie handling
const createSupabaseClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors if called from a context where setting cookies is not possible
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore errors if called from a context where removing cookies is not possible
          }
        },
      },
    }
  );
};

// Password login, registration, and password reset logic removed. Only Google OAuth login remains.


/**
 * Sign out the current user
 */
export async function logoutUser() {
  const supabase = await createSupabaseClient();
  const cookieStore = await cookies();
  try {
    await supabase.auth.signOut();

    cookieStore.delete({
      name: 'sb-access-token',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    cookieStore.delete({
      name: 'sb-refresh-token',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    cookieStore.delete({
      name: 'user-id',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    redirect('/login');
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred during logout.',
    };
  }
}

/**
 * Initiate Google OAuth login
 */
export async function loginWithGoogle(): Promise<{ url?: string; error?: string }> {
  console.log('[server action] 🔍 Starting loginWithGoogle action...');
  const supabase = await createSupabaseClient();

  try {
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
    console.log(`[server action] 🔧 Using redirect URL: ${redirectUrl}`);

    console.log('[server action] 🔑 Initiating Supabase OAuth sign-in with Google...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    console.log('[server action] 📥 Received response from Supabase:', {
      hasData: !!data,
      hasError: !!error,
      url: data?.url,
    });

    if (error) {
      console.error('[server action] ❌ Supabase OAuth error:', error);
      return {
        error: `Supabase OAuth Error: ${error.message}`,
      };
    }

    if (!data?.url) {
      console.error('[server action] ❌ No redirect URL received from Supabase');
      return {
        error: 'Failed to get authentication URL from Supabase',
      };
    }

    console.log('[server action] ✅ Successfully got redirect URL:', data.url);
    // Return the URL in a plain object for the client to handle
    return { url: data.url };

  } catch (error: any) {
    console.error('[server action] ❌ Unexpected error in loginWithGoogle:', error);
    return {
      error: `Server Action Error: ${error.message || 'Failed to initiate Google login'}`,
    };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseClient();
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('No user found or error getting user:', error?.message);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Your password has been successfully updated',
    };
  } catch (error) {
    console.error('Password update error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Delete authentication cookies
 */
export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  try {
    cookieStore.delete({
      name: 'sb-access-token',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    cookieStore.delete({
      name: 'sb-refresh-token',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    cookieStore.delete({
      name: 'user-id',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting auth cookies:', error);
    return { success: false };
  }
}

// Helper function to create a profile in the profiles table
async function createProfile(userId: string, profileData: { email: string; full_name?: string }) {
  const supabase = await createSupabaseClient();
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: profileData.email,
        full_name: profileData.full_name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating profile:', error);
    }
  } catch (error) {
    console.error('Profile creation error:', error);
  }
}

// Helper function to ensure a profile exists in the profiles table
async function ensureProfile(userId: string, profileData: { email?: string; full_name?: string }) {
  const supabase = await createSupabaseClient();
  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return;
    }

    if (!existingProfile) {
      await createProfile(userId, {
        email: profileData.email || '',
        full_name: profileData.full_name,
      });
    } else {
      const updates: Partial<Profile> = { updated_at: new Date().toISOString() };
      if (profileData.full_name && profileData.full_name !== existingProfile.full_name) {
        updates.full_name = profileData.full_name;
      }
      if (profileData.email && profileData.email !== existingProfile.email) {
        updates.email = profileData.email;
      }

      if (Object.keys(updates).length > 1) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      }
    }
  } catch (error) {
    console.error('Ensure profile error:', error);
  }
}