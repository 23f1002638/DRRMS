import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface VolunteerStats {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    assigned_tasks: number;
    completed_tasks: number;
    status: 'active' | 'available' | 'offline';
    last_active?: string;
}

export function useVolunteers() {
    const [volunteers, setVolunteers] = useState<VolunteerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchVolunteers() {
        try {
            setLoading(true);

            // Fetch profiles with their tasks
            const { data, error } = await supabase
                .from('profiles')
                .select(`
          id,
          full_name,
          email,
          role,
          created_at,
          volunteer_tasks (
            id,
            status,
            updated_at
          )
        `)
                .eq('role', 'volunteer');

            if (error) throw error;

            // Process data to calculate stats
            const processedVolunteers: VolunteerStats[] = (data || []).map((profile: any) => {
                const tasks = profile.volunteer_tasks || [];
                const assigned = tasks.filter((t: any) => t.status === 'claimed' || t.status === 'in_progress').length;
                const completed = tasks.filter((t: any) => t.status === 'completed').length;

                // Determine status based on tasks
                let status: 'active' | 'available' | 'offline' = 'offline'; // Default

                // Logic for status can be improved with real presence or last_seen
                if (assigned > 0) {
                    status = 'active'; // Has active tasks
                } else {
                    status = 'available'; // No active tasks, assumed available
                }

                return {
                    id: profile.id,
                    name: profile.full_name,
                    email: profile.email,
                    role: profile.role,
                    created_at: profile.created_at,
                    assigned_tasks: assigned,
                    completed_tasks: completed,
                    status: status,
                    // last_active could be derived from latest task update or auth last_sign_in_at if we had access
                    last_active: tasks.length > 0
                        ? new Date(Math.max(...tasks.map((t: any) => new Date(t.updated_at).getTime()))).toLocaleDateString()
                        : 'N/A'
                };
            });

            setVolunteers(processedVolunteers);
        } catch (err: any) {
            console.error('Error fetching volunteers:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchVolunteers();

        // Subscribe to changes in profiles or volunteer_tasks?
        // Subscribing to profiles is enough for new volunteers
        // But for task changes updating volunteer stats, we probably want to re-fetch when volunteer_tasks change
        const channel = supabase
            .channel('admin_volunteers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchVolunteers())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_tasks' }, () => fetchVolunteers())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { volunteers, loading, error, refetch: fetchVolunteers };
}

export function useDetailedAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    async function fetchAnalytics() {
        try {
            setLoading(true);

            // Parallel fetch for efficiency
            const [
                { data: requests },
                { data: donations },
                { data: resources },
                { data: volunteers },
                { data: tasks }
            ] = await Promise.all([
                supabase.from('aid_requests').select('id, status, created_at, aid_type, completed_at'),
                supabase.from('donations').select('id, amount, created_at, category'),
                supabase.from('resources').select('id, type, status'),

                supabase.from('profiles').select('id, role').eq('role', 'volunteer'),
                supabase.from('volunteer_tasks').select('id, status')
            ]);

            // Process requests
            const totalRequests = requests?.length || 0;
            const completedRequests = requests?.filter(r => r.status === 'completed' || r.status === 'resolved').length || 0;
            const responseRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

            // Avg response time (mock calculation for now as we need good timestamps)
            // Real calc would be average(completed_at - created_at)

            // Requests by category
            const requestsByCategory = (requests || []).reduce((acc: any, req) => {
                acc[req.aid_type] = (acc[req.aid_type] || 0) + 1;
                return acc;
            }, {});

            const categoryData = Object.entries(requestsByCategory).map(([name, value]) => ({
                name,
                value,
                color: getColorForCategory(name)
            }));

            // Task Status Distribution
            const tasksByStatus = (tasks || []).reduce((acc: any, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {});

            const taskStatusData = Object.entries(tasksByStatus).map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value: value as number,
                color: getColorForTaskStatus(name)
            }));

            // Donations trends (group by month)
            // Simplified grouping
            const donationsByMonth = (donations || []).reduce((acc: any, don) => {
                const month = new Date(don.created_at).toLocaleString('default', { month: 'short' });
                if (!acc[month]) acc[month] = { amount: 0, count: 0 };
                acc[month].amount += (don.amount || 0);
                acc[month].count += 1;
                return acc;
            }, {});

            const donationTrendData = Object.entries(donationsByMonth).map(([month, stats]: [string, any]) => ({
                month,
                amount: stats.amount,
                donors: stats.count // simplified as donation count
            }));

            setData({
                keyMetrics: {
                    responseRate,
                    activeVolunteers: volunteers?.length || 0,
                    totalResources: resources?.length || 0,
                    totalDonations: (donations || []).reduce((sum, d) => sum + (d.amount || 0), 0)
                },
                resourceDistribution: categoryData,
                donationTrends: donationTrendData,
                taskStatusDistribution: taskStatusData
                // ... other derived stats
            });

        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAnalytics();
    }, []);

    return { data, loading, refetch: fetchAnalytics };
}

function getColorForCategory(category: string): string {
    switch (category) {
        case 'food': return '#10b981';
        case 'medical': return '#ef4444';
        case 'shelter': return '#f59e0b';
        case 'emergency': return '#ef4444';
        default: return '#3b82f6';
    }
}

function getColorForTaskStatus(status: string): string {
    switch (status) {
        case 'available': return '#3b82f6'; // blue
        case 'claimed': return '#f59e0b'; // amber
        case 'in_progress': return '#8b5cf6'; // violet
        case 'completed': return '#10b981'; // green
        default: return '#94a3b8'; // gray
    }
}
