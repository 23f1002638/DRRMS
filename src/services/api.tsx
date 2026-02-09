import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Initialize Supabase client for frontend use
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Base API URL
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2c635a46`;

// Helper function to get the current access token
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    throw new Error('No valid session found. Please sign in again.');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Aid Requests API
export const aidRequestsApi = {
  async create(requestData: any) {
    return apiCall('/aid-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  async getAll() {
    return apiCall('/aid-requests');
  },

  async update(id: string, updateData: any) {
    return apiCall(`/aid-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },
};

// Volunteer Assignments API
export const volunteerApi = {
  async createAssignment(assignmentData: any) {
    return apiCall('/volunteer-assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },

  async getAssignments() {
    return apiCall('/volunteer-assignments');
  },
};

// Inventory API
export const inventoryApi = {
  async create(inventoryData: any) {
    return apiCall('/inventory', {
      method: 'POST',
      body: JSON.stringify(inventoryData),
    });
  },

  async getAll() {
    return apiCall('/inventory');
  },

  async update(id: string, updateData: any) {
    return apiCall(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },
};

// Analytics API
export const analyticsApi = {
  async get() {
    return apiCall('/analytics');
  },
};

// File Upload API
export const filesApi = {
  async upload(bucket: string, file: File) {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      throw new Error('No valid session found. Please sign in again.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/${bucket}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    return response.json();
  },
};

// User Profile API
export const userApi = {
  async getProfile() {
    return apiCall('/user/profile');
  },
};

// Authentication helpers
export const authApi = {
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(`Session fetch failed: ${error.message}`);
    }
    return session;
  },
};

// Health check
export const healthApi = {
  async check() {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },
};