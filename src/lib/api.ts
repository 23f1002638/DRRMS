import { ReliefRequest, InventoryItem, Donation } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    auth: {
        signup: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Signup failed');
            }
            const { user, token } = await res.json();
            localStorage.setItem('auth_token', token);
            return user;
        },
        login: async (email: string, password: string) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Login failed');
            }
            const { user, token } = await res.json();
            localStorage.setItem('auth_token', token);
            return user;
        },
        logout: async () => {
            localStorage.removeItem('auth_token');
            return true;
        },
        getSession: async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) return null;

            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const { user } = await res.json();
                    return { user };
                }
                localStorage.removeItem('auth_token');
                return null;
            } catch (e) {
                localStorage.removeItem('auth_token');
                return null;
            }
        },
        getUser: async () => {
            // Wrapper to match supabase.auth.getUser() signature roughly
            const session = await api.auth.getSession();
            return { data: { user: session?.user || null } };
        }
    },
    requests: {
        getAll: async (userId?: string) => {
            const query = userId ? `?userId=${userId}` : '';
            const res = await fetch(`${API_URL}/requests${query}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch requests');
            return await res.json() as ReliefRequest[];
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/requests`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create request');
            return await res.json();
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/requests/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update request');
            return await res.json();
        }
    },
    inventory: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/inventory`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch inventory');
            return await res.json() as InventoryItem[];
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/inventory`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create inventory item');
            return await res.json();
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/inventory/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update inventory item');
            return await res.json();
        }
    },
    resources: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/resources`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch resources');
            return await res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/resources`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create resource');
            return await res.json();
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/resources/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update resource');
            return await res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/resources/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete resource');
            return await res.json();
        }
    },
    volunteers: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/volunteers`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch volunteers');
            return await res.json();
        }
    },
    donations: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/donations`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch donations');
            return await res.json() as Donation[];
        },
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/donations`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create donation');
            return await res.json();
        }
    },
    assignments: {
        getMy: async () => {
            const res = await fetch(`${API_URL}/assignments`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch assignments');
            return await res.json();
        },
        claim: async (requestId: string) => {
            const res = await fetch(`${API_URL}/tasks/claim`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ task_id: requestId })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to claim task');
            }
            return await res.json();
        }
    },
    tasks: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/tasks`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch tasks');
            return await res.json();
        },
        update: async (id: string, updates: any) => {
            const res = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error('Failed to update task');
            return await res.json();
        },
        unclaim: async (id: string) => {
            const res = await fetch(`${API_URL}/tasks/${id}/unclaim`, {
                method: 'POST',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to unclaim task');
            return await res.json();
        }
    },
    profiles: {
        get: async (id: string) => {
            const res = await fetch(`${API_URL}/profiles/${id}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch profile');
            return await res.json();
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/profiles/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update profile');
            return await res.json();
        }
    },
    notifications: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/notifications`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch notifications');
            return await res.json();
        },
        markAsRead: async (id: string) => {
            const res = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to mark notification as read');
            return await res.json();
        },
        markAllAsRead: async () => {
            const res = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to mark all as read');
            return await res.json();
        }
    }
};
