import { createClient } from 'jsr:@supabase/supabase-js@2';

// Configuration constants
export const STORAGE_BUCKETS = [
  'make-2c635a46-documents',
  'make-2c635a46-emergency-images',
  'make-2c635a46-user-avatars'
];

export const MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'text/plain']
};

export const FILE_SIZE_LIMIT = 10485760; // 10MB

export const VALID_UPLOAD_BUCKETS = ['documents', 'emergency-images', 'user-avatars'];

// Initialize Supabase client
export const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// CORS configuration
export const corsConfig = {
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};