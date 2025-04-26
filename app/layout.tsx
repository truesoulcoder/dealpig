import './globals.css'
import './heroui.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ensureStorageBuckets } from '@/lib/supabaseAdmin'

// Initialize storage buckets when app starts on server-side
ensureStorageBuckets().catch(error => {
  console.error('Failed to initialize storage buckets:', error);
});
