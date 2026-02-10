import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import {
    CheckCircle,
    Clock,
    MapPin,
    Navigation,
    Loader2,
    Package,
    PlayCircle
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

interface MyTasksViewProps {
    user: User;
}

const priorityConfig = {
    low: { label: 'Low', color: 'bg-blue-100 text-blue-800', order: 1 },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', order: 2 },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800', order: 3 },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800', order: 4 }
};

const statusConfig = {
    claimed: { label: 'Claimed', color: 'bg-blue-100 text-blue-800', icon: Clock },
    in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: PlayCircle },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle }
};

const taskTypeConfig = {
    food: { label: 'Food Delivery', icon: '🍽️' },
    medical: { label: 'Medical Aid', icon: '🏥' },
    shelter: { label: 'Shelter Setup', icon: '🏠' },
    emergency: { label: 'Emergency Response', icon: '🚨' }
};

export function MyTasksView({ user }: MyTasksViewProps) {
    const [tasks, setTasks] = useState<VolunteerTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
    const [completionNotes, setCompletionNotes] = useState('');

    useEffect(() => {
        fetchMyTasks();

        // Set up real-time subscription
        const subscription = supabase
            .channel('my_tasks_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'volunteer_tasks',
                    filter: `volunteer_id=eq.${user.id}`
                },
                () => {
                    fetchMyTasks();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user.id]);

    async function fetchMyTasks() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('volunteer_tasks')
                .select('*')
                .eq('volunteer_id', user.id)
                .in('status', ['claimed', 'in_progress', 'completed'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching my tasks:', error);
            toast.error('Failed to load your tasks');
        } finally {
            setLoading(false);
        }
    }

    async function startTask(taskId: string) {
        try {
            setUpdating(taskId);

            const { error } = await supabase
                .from('volunteer_tasks')
                .update({
                    status: 'in_progress'
                })
                .eq('id', taskId)
                .eq('volunteer_id', user.id);

            if (error) throw error;

            toast.success('Task started! 🚀', {
                description: 'Good luck with your mission!'
            });

            fetchMyTasks();
        } catch (error) {
            console.error('Error starting task:', error);
            toast.error('Failed to start task');
        } finally {
            setUpdating(null);
        }
    }

    async function completeTask(taskId: string) {
        try {
            setUpdating(taskId);

            const { error } = await supabase
                .from('volunteer_tasks')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .eq('volunteer_id', user.id);

            if (error) throw error;

            // Also update the related aid request status
            const task = tasks.find(t => t.id === taskId);
            if (task?.aid_request_id) {
                await supabase
                    .from('aid_requests')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', task.aid_request_id);
            }

            toast.success('Task completed! 🎉', {
                description: 'Thank you for helping those in need!'
            });

            setSelectedTask(null);
            setCompletionNotes('');
            fetchMyTasks();
        } catch (error) {
            console.error('Error completing task:', error);
            toast.error('Failed to complete task');
        } finally {
            setUpdating(null);
        }
    }

    async function unclaimTask(taskId: string) {
        try {
            setUpdating(taskId);

            const { error } = await supabase
                .from('volunteer_tasks')
                .update({
                    volunteer_id: null,
                    status: 'available',
                    claimed_at: null
                })
                .eq('id', taskId)
                .eq('volunteer_id', user.id)
                .eq('status', 'claimed'); // Only unclaim if not started

            if (error) throw error;

            toast.success('Task released', {
                description: 'The task is now available for other volunteers'
            });

            fetchMyTasks();
        } catch (error) {
            console.error('Error unclaiming task:', error);
            toast.error('Failed to release task');
        } finally {
            setUpdating(null);
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

    const activeTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading your tasks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold mb-2">My Tasks</h1>
                <p className="text-muted-foreground">
                    Manage your claimed tasks and track your progress
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                                <p className="text-2xl font-semibold">{activeTasks.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                <p className="text-2xl font-semibold">{completedTasks.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                                <p className="text-2xl font-semibold">{tasks.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Tasks */}
            {activeTasks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Active Tasks</CardTitle>
                        <CardDescription>Tasks you're currently working on</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeTasks.map((task) => {
                                const priorityInfo = priorityConfig[task.priority as keyof typeof priorityConfig];
                                const statusInfo = statusConfig[task.status as keyof typeof statusConfig];
                                const taskTypeInfo = taskTypeConfig[task.task_type as keyof typeof taskTypeConfig];
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div key={task.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">{taskTypeInfo?.icon || '📦'}</span>
                                                    <h3 className="font-medium text-lg">
                                                        {taskTypeInfo?.label || task.task_type}
                                                    </h3>
                                                    <Badge className={priorityInfo.color}>
                                                        {priorityInfo.label}
                                                    </Badge>
                                                    <Badge className={statusInfo.color}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {statusInfo.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {task.description || 'No description provided'}
                                                </p>
                                                {task.location?.address && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{task.location.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 flex-wrap">
                                            {task.status === 'claimed' && (
                                                <>
                                                    <Button
                                                        onClick={() => startTask(task.id)}
                                                        disabled={updating === task.id}
                                                        size="sm"
                                                    >
                                                        {updating === task.id ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Starting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PlayCircle className="h-4 w-4 mr-2" />
                                                                Start Task
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => unclaimTask(task.id)}
                                                        disabled={updating === task.id}
                                                        size="sm"
                                                    >
                                                        Release Task
                                                    </Button>
                                                </>
                                            )}
                                            {task.status === 'in_progress' && (
                                                <Button
                                                    onClick={() => {
                                                        setSelectedTask(task);
                                                    }}
                                                    disabled={updating === task.id}
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Mark Complete
                                                </Button>
                                            )}
                                            {task.location && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => getDirections(task)}
                                                    size="sm"
                                                >
                                                    <Navigation className="h-4 w-4 mr-2" />
                                                    Directions
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Completed Tasks</CardTitle>
                        <CardDescription>Your recent accomplishments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {completedTasks.slice(0, 5).map((task) => {
                                const taskTypeInfo = taskTypeConfig[task.task_type as keyof typeof taskTypeConfig];

                                return (
                                    <div key={task.id} className="p-3 border rounded-lg bg-muted/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                <span className="text-xl">{taskTypeInfo?.icon || '📦'}</span>
                                                <div>
                                                    <p className="font-medium">{taskTypeInfo?.label || task.task_type}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Completed {new Date(task.completed_at!).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-green-100 text-green-800">
                                                Completed
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {tasks.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Tasks Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            You haven't claimed any tasks yet. Visit "Available Tasks" to get started!
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Completion Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle>Complete Task</CardTitle>
                            <CardDescription>
                                Confirm task completion and add any notes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-medium mb-2">
                                    {taskTypeConfig[selectedTask.task_type as keyof typeof taskTypeConfig]?.label || selectedTask.task_type}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedTask.description}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Completion Notes (Optional)
                                </label>
                                <Textarea
                                    placeholder="Add any notes about the task completion..."
                                    value={completionNotes}
                                    onChange={(e) => setCompletionNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => completeTask(selectedTask.id)}
                                    disabled={updating === selectedTask.id}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {updating === selectedTask.id ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Completing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Confirm Completion
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedTask(null);
                                        setCompletionNotes('');
                                    }}
                                    disabled={updating === selectedTask.id}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
