import { useState, useEffect } from 'react';
import { api } from '../lib/api';

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

            // Fetch volunteers from API (already returns enriched stats)
            const data: any[] = await api.volunteers.getAll();

            // Store directly as api returns enriched data
            setVolunteers(data.map(v => ({
                id: v.id,
                name: v.full_name || v.name,
                email: v.email,
                role: v.role,
                created_at: v.created_at,
                assigned_tasks: v.assigned_tasks,
                completed_tasks: v.completed_tasks,
                status: v.status as 'active' | 'available' | 'offline',
                last_active: 'N/A' // Not tracked in local db yet
            })));
        } catch (err: any) {
            console.error('Error fetching volunteers:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchVolunteers();
        const interval = setInterval(fetchVolunteers, 10000);
        return () => clearInterval(interval);
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
                requests,
                donations,
                resources,
                volunteers,
                tasks
            ] = await Promise.all([
                api.requests.getAll(),
                api.donations.getAll(),
                api.resources.getAll(),
                api.volunteers.getAll(),
                api.tasks.getAll()
            ]);

            // Process requests
            const totalRequests = requests?.length || 0;
            // Use 'resolved' instead of 'completed' if that matches RequestStatus
            const completedRequests = requests?.filter(r => r.status === 'resolved').length || 0;
            const responseRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

            // Requests by category
            const requestsByCategory = (requests || []).reduce((acc: any, req) => {
                // Check if 'category' exists, fall back to 'type' or just use 'general'
                const cat = (req as any).category || (req as any).aid_type || 'general';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});

            const categoryData = Object.entries(requestsByCategory).map(([name, value]) => ({
                name,
                value,
                color: getColorForCategory(name)
            }));

            // Task Status Distribution
            const tasksByStatus = (tasks || []).reduce((acc: any, task: any) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {});

            const taskStatusData = Object.entries(tasksByStatus).map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value: value as number,
                color: getColorForTaskStatus(name)
            }));

            // Donations trends (group by month)
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
                donors: stats.count
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
            });

        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 15000);
        return () => clearInterval(interval);
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
