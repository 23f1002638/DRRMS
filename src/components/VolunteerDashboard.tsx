import { useState } from 'react';
import { User } from './AuthSystem';
import { useLiveRequests, useClaimTask } from '../hooks/useDisasterData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Package,
  Heart,
  Home,
  Loader2,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface VolunteerDashboardProps {
  user: User;
}

export function VolunteerDashboard({ user: _user }: VolunteerDashboardProps) {
  const { requests, loading, error } = useLiveRequests();
  const { claimTask, claiming } = useClaimTask();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  console.log('VolunteerDashboard Render:', { loading, error, requestsCount: requests.length });

  // Filter for pending requests (available tasks)
  const availableTasks = requests.filter(req => req.status === 'pending');
  const inProgressTasks = requests.filter(req => req.status === 'in_progress');
  const completedTasks = requests.filter(req => req.status === 'resolved');

  const handleClaimTask = async (requestId: string) => {
    setClaimingId(requestId);
    const result = await claimTask(requestId);

    if (result.success) {
      // Task will automatically disappear from available list due to real-time subscription
      toast.success('Mission Accepted! 🎯', {
        description: 'The task has been assigned to you. Check your assignments.',
        duration: 3000,
      });
    }
    setClaimingId(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return <Package className="h-4 w-4" />;
      case 'medical':
        return <Heart className="h-4 w-4" />;
      case 'shelter':
        return <Home className="h-4 w-4" />;
      case 'emergency':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getUrgencyBadge = (urgency: number) => {
    if (urgency >= 5) return <Badge variant="destructive">Critical</Badge>;
    if (urgency >= 4) return <Badge className="bg-orange-600 hover:bg-orange-700">High</Badge>;
    if (urgency >= 3) return <Badge className="bg-yellow-600 hover:bg-yellow-700">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Error Loading Tasks</p>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Volunteer Dashboard</h1>
        <p className="text-muted-foreground">
          Available relief tasks and your volunteer activities
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Tasks</p>
                <p className="text-2xl font-semibold">{availableTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-semibold">{inProgressTasks.length}</p>
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
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-semibold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Available Relief Tasks</CardTitle>
          <CardDescription>
            Claim tasks to help people in need. Tasks update in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availableTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground mb-2">All caught up! 🎉</p>
                <p className="text-sm text-muted-foreground">
                  No pending tasks at the moment. Check back soon for new relief requests.
                </p>
              </div>
            ) : (
              availableTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${task.urgency >= 4
                        ? 'bg-red-100 dark:bg-red-900'
                        : 'bg-blue-100 dark:bg-blue-900'
                        }`}>
                        {getCategoryIcon(task.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{task.title}</h3>
                          {getUrgencyBadge(task.urgency)}
                          <Badge variant="outline" className="capitalize">
                            {task.category}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {task.location_address || `${(task.location_lat || 0).toFixed(4)}, ${(task.location_lng || 0).toFixed(4)}`}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(task.created_at)}</span>
                          </div>
                          {task.people_count && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{task.people_count} people</span>
                            </div>
                          )}
                        </div>
                        {task.special_needs && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                            ⚠️ Special needs: {task.special_needs}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleClaimTask(task.id)}
                      disabled={claiming || claimingId === task.id}
                      className="ml-4 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                      {claimingId === task.id ? (
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
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks In Progress</CardTitle>
            <CardDescription>Relief operations currently being handled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      {getCategoryIcon(task.category)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {task.location_address || `${(task.location_lat || 0).toFixed(4)}, ${(task.location_lng || 0).toFixed(4)}`}
                      </p>
                    </div>
                    <Badge className="bg-orange-600 hover:bg-orange-700">In Progress</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}