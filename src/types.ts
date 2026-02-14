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
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
    people_count?: number;
    required_items?: any[];
    special_needs?: string;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
}

// Support legacy property names if needed, or mapped in api.ts
// DB uses location_lat, frontend might expect lat/lng. 
// We will align them in the API client or here.
// For now, let's keep them as mostly compatible.

export interface InventoryItem {
    id: string;
    item_name: string;
    category: RequestCategory;
    quantity: number;
    unit: string;
    min_threshold: number;
    status: InventoryStatus;
    location?: string;
    last_updated_by?: string;
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
    donation_type: 'money' | 'supplies' | 'services';
    category: 'food' | 'medical' | 'shelter' | 'general';
    amount?: number;
    description?: string;
    items?: any[];
    status: 'pending' | 'processed' | 'cancelled';
    notes?: string;
    created_at: string;
    updated_at: string;
}
