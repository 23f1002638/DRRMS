import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env file.'
    );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Database types (will be auto-generated later with Supabase CLI)
export type UserRole = 'admin' | 'volunteer' | 'victim' | 'donor';
export type RequestStatus = 'pending' | 'in_progress' | 'resolved' | 'cancelled';
export type RequestCategory = 'food' | 'medical' | 'shelter' | 'emergency';
export type InventoryStatus = 'available' | 'low_stock' | 'out_of_stock' | 'reserved';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    location?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface ReliefRequest {
    id: string;
    requester_id: string;
    category: RequestCategory;
    title: string;
    description?: string;
    urgency: number; // 1-5
    status: RequestStatus;
    lat: number;
    lng: number;
    location_address?: string;
    people_count?: number;
    required_items?: any[];
    special_needs?: string;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
}

export interface InventoryItem {
    id: string;
    item_name: string;
    category: RequestCategory;
    quantity: number;
    unit: string;
    threshold_limit: number;
    status: InventoryStatus;
    location?: string;
    supplier?: string;
    expiry_date?: string;
    created_at: string;
    updated_at: string;
}

export interface Assignment {
    id: string;
    volunteer_id: string;
    request_id: string;
    accepted_at: string;
    completed_at?: string;
    notes?: string;
}

export interface Donation {
    id: string;
    donor_id: string;
    donation_type: 'monetary' | 'supplies' | 'services';
    amount?: number;
    items?: any[];
    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
    notes?: string;
    created_at: string;
    updated_at: string;
}
