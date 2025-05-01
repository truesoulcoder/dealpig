'use server';

import { supabase } from '@/lib/supabase';
import { LoginFormType, RegisterFormType, Profile } from '@/helpers/types';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Authenticate a user with email and password
 */
export async function loginUser(formData: LoginFormType) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    // Store session in cookies
    const cookieStore = await cookies();
    const { session } = data;
    
    if (session) {
      cookieStore.set({
        name: 'sb-access-token',
        value: session.access_token,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      cookieStore.set({ name: 'sb-refresh-token', value: session.refresh_token, maxAge: 60 * 60 * 24 * 7, path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      // Set user ID in a non-HTTP-only cookie for client-side access
      cookieStore.set({ name: 'user-id', value: session.user.id, maxAge: 60 * 60 * 24 * 7, path: '/', httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      // Ensure profile exists in the profiles table
      await ensureProfile(session.user.id, {
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name,
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred during login.',
    };
  }
}

/**
 * Register a new user with email and password
 */
export async function registerUser(formData: RegisterFormType) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
        },
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    // Store session in cookies if auto-sign-in is enabled
    const { session, user } = data;
    
    if (session) {
      const cookieStore = await cookies();
      
      cookieStore.set({ name: 'sb-access-token', value: session.access_token, maxAge: 60 * 60 * 24 * 7, path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      cookieStore.set({ name: 'sb-refresh-token', value: session.refresh_token, maxAge: 60 * 60 * 24 * 7, path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      // Set user ID in a non-HTTP-only cookie for client-side access
      cookieStore.set({ name: 'user-id', value: session.user.id, maxAge: 60 * 60 * 24 * 7, path: '/', httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      // Create profile in the profiles table
      await createProfile(session.user.id, {
        email: formData.email,
        full_name: formData.full_name,
      });

      return {
        success: true,
        requiresEmailVerification: false,
      };
    } else if (user) {
      // Email confirmation is required before signing in
      return {
        success: true,
        requiresEmailVerification: true,
        message: 'Registration successful! Please check your email to verify your account.',
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred during registration.',
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred during registration.',
    };
  }
}

/**
 * Sign out the current user
 */
export async function logoutUser() {
  try {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();
    
    // Clear cookies with consistent options
    const cookieStore = await cookies();
    cookieStore.delete({ name: 'sb-access-token', path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    cookieStore.delete({ name: 'sb-refresh-token', path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    cookieStore.delete({ name: 'user-id', path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    
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
export async function loginWithGoogle() {
  console.log('🔍 Starting loginWithGoogle action...');
  
  try {
    console.log('🔑 Initiating Supabase OAuth sign-in with Google...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true',
          scope: 'email profile',
          display: 'popup',
          response_type: 'code',
        },
      },
    });

    console.log('📥 Received response from Supabase:', {
      hasData: !!data,
      hasError: !!error,
      url: data?.url,
    });

    if (error) {
      console.error('❌ Supabase OAuth error:', error);
      return {
        error: error.message,
      };
    }

    if (!data?.url) {
      console.error('❌ No redirect URL received from Supabase');
      return {
        error: 'Failed to get authentication URL',
      };
    }

    console.log('✅ Successfully got redirect URL:', data.url);
    return {
      redirectUrl: data.url,
    };
  } catch (error) {
    console.error('❌ Unexpected error in loginWithGoogle:', error);
    return {
      error: 'Failed to initiate Google login',
    };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;
    
    if (!accessToken || !refreshToken) {
      return null;
    }
    
    // Set session manually from cookies
    const { data: { user }, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Handle OAuth callback
 */
export async function handleAuthCallback(code: string) {
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      return {
        error: error.message,
      };
    }
    
    // Store session in cookies
    const { session } = data;
    
    if (session) {
      const cookieStore = await cookies();
      
      cookieStore.set({ name: 'sb-access-token', value: session.access_token, maxAge: 60 * 60 * 24 * 7, path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      cookieStore.set({ name: 'sb-refresh-token', value: session.refresh_token, maxAge: 60 * 60 * 24 * 7, path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      // Set user ID in a non-HTTP-only cookie for client-side access
      cookieStore.set({ name: 'user-id', value: session.user.id, maxAge: 60 * 60 * 24 * 7, path: '/', httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      // Ensure profile exists in the profiles table for OAuth users
      await ensureProfile(session.user.id, {
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Auth callback error:', error);
    return {
      error: 'Failed to process authentication',
    };
  }
}

/**
 * Request a password reset email
 * For security, this always returns success regardless of whether the email exists
 */
export async function requestPasswordReset(email: string) {
  try {
    // Security: Always return success even if email doesn't exist
    // This prevents email enumeration attacks
    const normalizedEmail = email.trim().toLowerCase();
    
    // First check if the email actually exists - but don't reveal this to the user
    const { data: userExists } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();
    
    // Only send an email if the user actually exists
    if (userExists) {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      });
      
      if (error) {
        console.error('Password reset request error:', error);
        // Still return success to prevent email enumeration
      }
    } else {
      // Log attempt for security monitoring, but don't reveal to user
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
    }

    // Always return success to prevent email enumeration attacks
    return {
      success: true,
      message: 'If your email exists in our system, you will receive password reset instructions shortly.',
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    // Still return success for security reasons
    return {
      success: true,
      message: 'If your email exists in our system, you will receive password reset instructions shortly.',
    };
  }
}

/**
 * Update a user's password after they've clicked the reset link in their email
 */
export async function resetPassword(password: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        success: false,
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
 * This function can be called from client components to handle logout
 */
export async function deleteAuthCookie() {
  try {
    // Get the cookie store - need to await this in Next.js server actions
    const cookieStore = await cookies();
    
    // Clear the Supabase session cookies
    cookieStore.delete({ name: 'sb-access-token', path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    
    cookieStore.delete({ name: 'sb-refresh-token', path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    
    cookieStore.delete({ name: 'user-id', path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    
    // Also sign out from Supabase Auth to invalidate tokens on the server side
    await supabase.auth.signOut();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting auth cookies:', error);
    return { success: false };
  }
}

// Helper function to create a profile in the profiles table
async function createProfile(userId: string, profileData: { email: string; full_name?: string }) {
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
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
      console.error('Error fetching profile:', fetchError);
      return;
    }
    
    if (!existingProfile) {
      // Create new profile
      await createProfile(userId, { 
        email: profileData.email || '',
        full_name: profileData.full_name
      });
    } else {
      // Update existing profile with latest data from auth if needed
      const updates: Partial<Profile> = { updated_at: new Date().toISOString() };
      
      // Only update fields that are provided and different from existing data
      if (profileData.full_name && profileData.full_name !== existingProfile.full_name) {
        updates.full_name = profileData.full_name;
      }
      
      if (profileData.email && profileData.email !== existingProfile.email) {
        updates.email = profileData.email;
      }
      
      if (Object.keys(updates).length > 1) { // More than just updated_at
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