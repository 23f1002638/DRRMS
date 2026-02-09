import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    Package,
    MapPin,
    Clock,
    CheckCircle,
    AlertTriangle,
    Filter,
    Search,
    Loader2,
    Target,
    Navigation
} from 'lucide-react';
import { toast } from 'sonner';

interface VolunteerTask {
    id: string;
    aid_request_id: string | null;
    task_type: string;
    description: string | null;
    status: string;
    priority: string;
    location: any;
    created_at: string;
    claimed_at: string | null;
    completed_at: string | null;
}

interface AvailableTasksViewProps {
    user: User;
}

const priorityConfig = {
    low: { label: 'Low', color: 'bg-blue-100 text-blue-800', order: 1 },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', order: 2 },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800', order: 3 },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800', order: 4 }
};

const taskTypeConfig = {
    food: { label: 'Food Delivery', icon: '🍽️' },
    medical: { label: 'Medical Aid', icon: '🏥' },
    shelter: { label: 'Shelter Setup', icon: '🏠' },
    emergency: { label: 'Emergency Response', icon: '🚨' }
};

export function AvailableTasksView({ user }: AvailableTasksViewProps) {
    const [tasks, setTasks] = useState<VolunteerTask[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<VolunteerTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('all');

    useEffect(() => {
        fetchTasks();

        // Set up real-time subscription
        const subscription = supabase
            .channel('volunteer_tasks_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'volunteer_tasks'
                },
                () => {
                    fetchTasks();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        filterTasks();
    }, [tasks, searchTerm, filterPriority]);

    async function fetchTasks() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('volunteer_tasks')
                .select('*')
                .eq('status', 'available')
                .order('priority', { ascending: false })
                .order('created_at', { ascending: true });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to load available tasks');
        } finally {
            setLoading(false);
        }
    }

    function filterTasks() {
        let filtered = tasks;

        // Filter by priority
        if (filterPriority !== 'all') {
            filtered = filtered.filter(t => t.priority === filterPriority);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.task_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort by priority
        filtered.sort((a, b) => {
            const priorityA = priorityConfig[a.priority as keyof typeof priorityConfig]?.order || 0;
            const priorityB = priorityConfig[b.priority as keyof typeof priorityConfig]?.order || 0;
            return priorityB - priorityA;
        });

        setFilteredTasks(filtered);
    }

    async function claimTask(taskId: string) {
        try {
            setClaiming(taskId);

            const { error } = await supabase
                .from('volunteer_tasks')
                .update({
                    volunteer_id: user.id,
                    status: 'claimed',
                    claimed_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .eq('status', 'available'); // Prevent double-claiming

            if (error) throw error;

            toast.success('Task claimed successfully! 🎯', {
                description: 'Check "My Tasks" to see your active assignments'
            });

            fetchTasks();
        } catch (error) {
            console.error('Error claiming task:', error);
            toast.error('Failed to claim task. It may have been claimed by another volunteer.');
        } finally {
            setClaiming(null);
        }
    }

    function getDirections(task: VolunteerTask) {
        if (task.location?.lat && task.location?.lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${task.location.lat},${task.location.lng}`;
            window.open(url, '_blank');
        } else {
            toast.error('Location coordinates not available');
        }
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading available tasks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold mb-2">Available Tasks</h1>
                <p className="text-muted-foreground">
                    Claim tasks to help people in need. Higher priority tasks are shown first.
                </p>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={filterPriority === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterPriority('all')}
                            >
                                <Filter className="h-4 w-4 mr-1" />
                                All
                            </Button>
                            {Object.entries(priorityConfig).map(([priority, config]) => (
                                <Button
                                    key={priority}
                                    variant={filterPriority === priority ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterPriority(priority)}
                                >
                                    {config.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tasks Grid */}
            {filteredTasks.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Available Tasks</h3>
                        <p className="text-muted-foreground">
                            {searchTerm || filterPriority !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'All tasks have been claimed. Check back later for new assignments.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredTasks.map((task) => {
                        const priorityInfo = priorityConfig[task.priority as keyof typeof priorityConfig];
                        const taskTypeInfo = taskTypeConfig[task.task_type as keyof typeof taskTypeConfig];

                        return (
                            <Card key={task.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">{taskTypeInfo?.icon || '📦'}</span>
                                                <CardTitle className="text-xl">
                                                    {taskTypeInfo?.label || task.task_type}
                                                </CardTitle>
                                                <Badge className={priorityInfo.color}>
                                                    {priorityInfo.label} Priority
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                {task.description || 'No description provided'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Posted:</span>
                                            <span className="font-medium">
                                                {new Date(task.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {task.location?.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground truncate">
                                                    {task.location.address}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            onClick={() => claimTask(task.id)}
                                            disabled={claiming === task.id}
                                            className="flex-1 md:flex-none"
                                        >
                                            {claiming === task.id ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Claiming...
                                                </>
                                            ) : (
                                                <>
                                                    <Target className="h-4 w-4 mr-2" />
                                                    Claim Task
                                                </>
                                            )}
                                        </Button>
                                        {task.location && (
                                            <Button
                                                variant="outline"
                                                onClick={() => getDirections(task)}
                                                className="flex-1 md:flex-none"
                                            >
                                                <Navigation className="h-4 w-4 mr-2" />
                                                Directions
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
