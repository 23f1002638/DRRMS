import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Package,
    User as UserIcon,
    MapPin,
    Calendar,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface AidRequest {
    id: string;
    aid_type: string;
    priority: string;
    status: string;
    people_count: number;
    description: string;
    location: any;
    assigned_volunteer_id: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

interface AidStatusViewProps {
    user: User;
}

const statusConfig = {
    pending: {
        icon: Clock,
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        description: 'Your request is being reviewed'
    },
    assigned: {
        icon: UserIcon,
        label: 'Assigned',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        description: 'A volunteer has been assigned'
    },
    in_progress: {
        icon: Package,
        label: 'In Progress',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        description: 'Help is on the way'
    },
    completed: {
        icon: CheckCircle,
        label: 'Completed',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        description: 'Request fulfilled'
    },
    cancelled: {
        icon: XCircle,
        label: 'Cancelled',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        description: 'Request cancelled'
    }
};

const priorityConfig = {
    low: { label: 'Low', color: 'bg-blue-100 text-blue-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
};

const aidTypeConfig = {
    food: { label: 'Food & Water', icon: '🍽️' },
    medical: { label: 'Medical Aid', icon: '🏥' },
    shelter: { label: 'Shelter', icon: '🏠' },
    emergency: { label: 'Emergency', icon: '🚨' }
};

export function AidStatusView({ user }: AidStatusViewProps) {
    const [requests, setRequests] = useState<AidRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();

        // Set up real-time subscription
        const subscription = supabase
            .channel('user_aid_requests')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'aid_requests',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    fetchRequests();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user.id]);

    async function fetchRequests() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('aid_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load aid requests');
        } finally {
            setLoading(false);
        }
    }

    async function cancelRequest(requestId: string) {
        try {
            setCancelling(requestId);
            const { error } = await supabase
                .from('aid_requests')
                .update({ status: 'cancelled' })
                .eq('id', requestId)
                .eq('user_id', user.id)
                .in('status', ['pending', 'assigned']);

            if (error) throw error;

            toast.success('Request cancelled successfully');
            fetchRequests();
        } catch (error) {
            console.error('Error cancelling request:', error);
            toast.error('Failed to cancel request');
        } finally {
            setCancelling(null);
        }
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading your aid requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold mb-2">Aid Request Status</h1>
                <p className="text-muted-foreground">
                    Track the status of your aid requests and see when help is on the way
                </p>
            </div>

            {requests.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Aid Requests Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            You haven't submitted any aid requests. Click "Request Aid" to get started.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => {
                        const statusInfo = statusConfig[request.status as keyof typeof statusConfig];
                        const priorityInfo = priorityConfig[request.priority as keyof typeof priorityConfig];
                        const aidTypeInfo = aidTypeConfig[request.aid_type as keyof typeof aidTypeConfig];
                        const StatusIcon = statusInfo.icon;

                        return (
                            <Card key={request.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">{aidTypeInfo.icon}</span>
                                                <CardTitle className="text-xl">{aidTypeInfo.label}</CardTitle>
                                                <Badge className={priorityInfo.color}>
                                                    {priorityInfo.label} Priority
                                                </Badge>
                                            </div>
                                            <CardDescription>{request.description || 'No description provided'}</CardDescription>
                                        </div>
                                        <Badge className={statusInfo.color} variant="outline">
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">People:</span>
                                            <span className="font-medium">{request.people_count}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Submitted:</span>
                                            <span className="font-medium">
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {request.location?.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground truncate">
                                                    {request.location.address}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                        <StatusIcon className="h-4 w-4" />
                                        <span className="text-sm">{statusInfo.description}</span>
                                    </div>

                                    {(request.status === 'pending' || request.status === 'assigned') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => cancelRequest(request.id)}
                                            disabled={cancelling === request.id}
                                            className="w-full md:w-auto"
                                        >
                                            {cancelling === request.id ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Cancelling...
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Cancel Request
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
