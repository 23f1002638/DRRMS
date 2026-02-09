import { useState, useEffect } from 'react';
import { supabase, ReliefRequest, InventoryItem, Assignment, Profile } from '../lib/supabase';
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

        // Set up real-time subscription
        const subscription = supabase
            .channel('relief_requests_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'relief_requests',
                },
                (payload) => {
                    console.log('Relief request change:', payload);
                    // Refetch data on any change
                    fetchRequests();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function fetchRequests() {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('relief_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setRequests(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch requests';
            setError(errorMessage);
            toast.error(errorMessage);
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

        // Set up real-time subscription
        const subscription = supabase
            .channel('inventory_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inventory',
                },
                () => {
                    fetchInventory();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function fetchInventory() {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('inventory')
                .select('*')
                .order('item_name', { ascending: true });

            if (fetchError) throw fetchError;

            setInventory(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
            setError(errorMessage);
            toast.error(errorMessage);
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

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('You must be logged in to submit a request');
            }

            // Insert request
            const { data: newRequest, error: insertError } = await supabase
                .from('relief_requests')
                .insert({
                    requester_id: user.id,
                    ...data,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            toast.success('Request submitted successfully!');
            return { success: true, data: newRequest };
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

        // Set up real-time subscription
        const subscription = supabase
            .channel('assignments_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignments',
                },
                () => {
                    fetchAssignments();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function fetchAssignments() {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setAssignments([]);
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('assignments')
                .select(`
          *,
          relief_requests (*)
        `)
                .eq('volunteer_id', user.id)
                .order('accepted_at', { ascending: false });

            if (fetchError) throw fetchError;

            setAssignments(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
            setError(errorMessage);
            toast.error(errorMessage);
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

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('You must be logged in to claim a task');
            }

            // Call the database function
            const { data, error: claimError } = await supabase
                .rpc('claim_task', { task_id: requestId });

            if (claimError) throw claimError;

            // Check the result
            if (data && typeof data === 'object' && 'success' in data) {
                if (data.success) {
                    toast.success('Mission Accepted. Rerouting map...', {
                        duration: 3000,
                        icon: '🎯',
                    });
                    return { success: true };
                } else {
                    throw new Error(data.error || 'Failed to claim task');
                }
            }

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

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setProfile(null);
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (fetchError) throw fetchError;

            setProfile(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
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
    }, []);

    async function fetchAnalytics() {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [requestsRes, inventoryRes, assignmentsRes] = await Promise.all([
                supabase.from('relief_requests').select('*'),
                supabase.from('inventory').select('*'),
                supabase.from('assignments').select('*'),
            ]);

            if (requestsRes.error) throw requestsRes.error;
            if (inventoryRes.error) throw inventoryRes.error;
            if (assignmentsRes.error) throw assignmentsRes.error;

            const requests = requestsRes.data || [];
            const inventory = inventoryRes.data || [];
            const assignments = assignmentsRes.data || [];

            // Calculate analytics
            const analyticsData = {
                totalRequests: requests.length,
                pendingRequests: requests.filter((r) => r.status === 'pending').length,
                inProgressRequests: requests.filter((r) => r.status === 'in_progress').length,
                resolvedRequests: requests.filter((r) => r.status === 'resolved').length,
                totalInventoryItems: inventory.length,
                lowStockItems: inventory.filter((i) => i.status === 'low_stock').length,
                outOfStockItems: inventory.filter((i) => i.status === 'out_of_stock').length,
                totalAssignments: assignments.length,
                activeAssignments: assignments.filter((a) => !a.completed_at).length,
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
