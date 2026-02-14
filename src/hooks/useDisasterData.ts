import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ReliefRequest, InventoryItem, Assignment, Profile } from '../types';
import { toast } from 'sonner';

// =====================================================
// LIVE REQUESTS HOOK
// =====================================================

export function useLiveRequests() {
    const [requests, setRequests] = useState<ReliefRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initial fetch
        fetchRequests();

        // Polling for real-time updates (Local Backend)
        const interval = setInterval(fetchRequests, 5000);

        return () => clearInterval(interval);
    }, []);

    async function fetchRequests() {
        try {
            // Don't set loading on poll updates to avoid flickering
            if (requests.length === 0) setLoading(true);
            setError(null);

            const data = await api.requests.getAll();
            setRequests(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch requests';
            console.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return { requests, loading, error, refetch: fetchRequests };
}

// =====================================================
// INVENTORY HOOK
// =====================================================

export function useInventory() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInventory();
        const interval = setInterval(fetchInventory, 5000);
        return () => clearInterval(interval);
    }, []);

    async function fetchInventory() {
        try {
            if (inventory.length === 0) setLoading(true);
            setError(null);

            const data = await api.inventory.getAll();
            setInventory(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
            console.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return { inventory, loading, error, refetch: fetchInventory };
}

// =====================================================
// SUBMIT REQUEST HOOK
// =====================================================

interface SubmitRequestData {
    category: 'food' | 'medical' | 'shelter' | 'emergency';
    title: string;
    description?: string;
    urgency: number;
    lat: number;
    lng: number;
    location_address?: string;
    people_count?: number;
    required_items?: any[];
    special_needs?: string;
}

export function useSubmitRequest() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submitRequest(data: SubmitRequestData) {
        try {
            setSubmitting(true);
            setError(null);

            const session = await api.auth.getSession();
            if (!session?.user) {
                throw new Error('You must be logged in to submit a request');
            }

            const result = await api.requests.create(data);

            toast.success('Request submitted successfully!');
            return { success: true, data: result };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit request';
            setError(errorMessage);
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setSubmitting(false);
        }
    }

    return { submitRequest, submitting, error };
}

// =====================================================
// VOLUNTEER ASSIGNMENTS HOOK
// =====================================================

export function useAssignments() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAssignments();
        const interval = setInterval(fetchAssignments, 5000);
        return () => clearInterval(interval);
    }, []);

    async function fetchAssignments() {
        try {
            if (assignments.length === 0) setLoading(true);
            setError(null);

            const session = await api.auth.getSession();
            if (!session?.user) {
                setAssignments([]);
                setLoading(false);
                return;
            }

            const data = await api.assignments.getMy();
            setAssignments(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
            console.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return { assignments, loading, error, refetch: fetchAssignments };
}

// =====================================================
// CLAIM TASK HOOK
// =====================================================

export function useClaimTask() {
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function claimTask(requestId: string) {
        try {
            setClaiming(true);
            setError(null);

            const session = await api.auth.getSession();
            if (!session?.user) {
                throw new Error('You must be logged in to claim a task');
            }

            await api.assignments.claim(requestId);

            toast.success('Mission Accepted. Rerouting map...', {
                duration: 3000,
                icon: '🎯',
            });
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to claim task';
            setError(errorMessage);
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setClaiming(false);
        }
    }

    return { claimTask, claiming, error };
}

// =====================================================
// USER PROFILE HOOK
// =====================================================

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            setLoading(true);
            setError(null);

            const session = await api.auth.getSession();
            if (!session?.user) {
                setProfile(null);
                setLoading(false);
                return;
            }

            const data = await api.profiles.get(session.user.id);
            setProfile(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
            console.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return { profile, loading, error, refetch: fetchProfile };
}

// =====================================================
// ANALYTICS HOOK
// =====================================================

export function useAnalytics() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 10000);
        return () => clearInterval(interval);
    }, []);

    async function fetchAnalytics() {
        try {
            setLoading(true);
            setError(null);

            const [requests, inventory, _] = await Promise.all([
                api.requests.getAll(),
                api.inventory.getAll(),
                api.volunteers.getAll()
            ]);

            // Calculate analytics
            const analyticsData = {
                totalRequests: requests.length,
                pendingRequests: requests.filter((r) => r.status === 'pending').length,
                inProgressRequests: requests.filter((r) => r.status === 'in_progress').length,
                resolvedRequests: requests.filter((r) => r.status === 'resolved').length,
                totalInventoryItems: inventory.length,
                lowStockItems: inventory.filter((i) => i.status === 'low_stock').length,
                outOfStockItems: inventory.filter((i) => i.status === 'out_of_stock').length,
                totalAssignments: 0, // Need assignments endpoint for global stats
                activeAssignments: 0,
                requestsByCategory: {
                    food: requests.filter((r) => r.category === 'food').length,
                    medical: requests.filter((r) => r.category === 'medical').length,
                    shelter: requests.filter((r) => r.category === 'shelter').length,
                    emergency: requests.filter((r) => r.category === 'emergency').length,
                },
                requestsByUrgency: {
                    critical: requests.filter((r) => r.urgency === 5).length,
                    high: requests.filter((r) => r.urgency === 4).length,
                    medium: requests.filter((r) => r.urgency === 3).length,
                    low: requests.filter((r) => r.urgency <= 2).length,
                },
            };

            setAnalytics(analyticsData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return { analytics, loading, error, refetch: fetchAnalytics };
}

// =====================================================
// MAP DATA HOOK
// =====================================================

export interface MapLocation {
    id: string;
    type: 'request' | 'resource' | 'volunteer' | 'task';
    lat: number;
    lng: number;
    title: string;
    description: string;
    status: string;
    updated_at: string;
}

export function useMapData() {
    const [locations, setLocations] = useState<MapLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchMapData() {
        try {
            setLoading(true);
            setError(null);

            const [requests, resources] = await Promise.all([
                api.requests.getAll(),
                api.resources.getAll()
            ]);

            const mapLocations: MapLocation[] = [];

            // Process Requests
            requests.forEach((req: any) => {
                if (req.location_lat && req.location_lng) {
                    mapLocations.push({
                        id: req.id,
                        type: 'request',
                        lat: req.location_lat,
                        lng: req.location_lng,
                        title: req.category.charAt(0).toUpperCase() + req.category.slice(1) + ' Request',
                        description: req.description || 'No description',
                        status: req.status === 'pending' ? 'urgent' : 'active',
                        updated_at: req.created_at
                    });
                } else if (req.location && req.location.lat) { // Legacy support
                    mapLocations.push({
                        id: req.id,
                        type: 'request',
                        lat: req.location.lat,
                        lng: req.location.lng,
                        title: req.aid_type ? req.aid_type.toUpperCase() : 'Request',
                        description: req.description || 'No description',
                        status: req.status,
                        updated_at: req.created_at
                    });
                }
            });

            // Process Resources
            resources.forEach((res: any) => {
                if (res.location_lat && res.location_lng) {
                    mapLocations.push({
                        id: res.id,
                        type: 'resource',
                        lat: res.location_lat,
                        lng: res.location_lng,
                        title: res.name,
                        description: `${res.type} - Capacity: ${res.capacity || 'N/A'}`,
                        status: res.status === 'open' ? 'operational' : 'closed',
                        updated_at: res.created_at
                    });
                }
            });

            setLocations(mapLocations);

        } catch (err: any) {
            console.error('Error fetching map data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMapData();
        const interval = setInterval(fetchMapData, 5000);
        return () => clearInterval(interval);
    }, []);

    return { locations, loading, error, refetch: fetchMapData };
}
