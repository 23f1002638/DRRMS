import React, { useState, useEffect } from 'react';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Package,
  Heart,
  Shield,
  Clock,
  MapPin,
  Phone,
  Settings
} from 'lucide-react';
import { mockDataService } from '../services/mockDataService';
import { toast } from 'sonner@2.0.3';

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [aidRequests, setAidRequests] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsData, requestsData, volunteersData] = await Promise.all([
          mockDataService.getAnalytics().catch(() => null),
          mockDataService.getAidRequests().catch(() => []),
          mockDataService.getVolunteers().catch(() => [])
        ]);

        setAnalytics(analyticsData);
        setAidRequests(requestsData || []);
        setVolunteers(volunteersData || []);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Get pending requests
  const pendingRequests = aidRequests.filter(req => req.status === 'pending');
  const completedRequests = aidRequests.filter(req => req.status === 'fulfilled');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and management controls
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Requests</p>
                <p className="text-2xl font-semibold">{analytics?.totalRequests || aidRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Volunteers</p>
                <p className="text-2xl font-semibold">{analytics?.availableVolunteers || volunteers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Donations</p>
                <p className="text-2xl font-semibold">{analytics?.totalDonations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inventory Items</p>
                <p className="text-2xl font-semibold">{analytics?.totalInventoryItems || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Aid Requests</CardTitle>
            <CardDescription>Requests requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((request, index) => (
                <div key={request.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 bg-red-100 dark:bg-red-900 rounded">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium">{request.type || request.title || 'General Aid'}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.requestedBy || 'Unknown'} • {request.location || 'Location pending'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={request.priority === 'critical' ? 'destructive' : 'secondary'}>
                    {request.priority || 'medium'}
                  </Badge>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending requests</p>
                  <p className="text-sm">All requests have been processed</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current operational status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Response Team Coverage</span>
              <span className="text-sm text-muted-foreground">
                {volunteers.length > 0 ? Math.min(100, (volunteers.length / 10) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <Progress value={volunteers.length > 0 ? Math.min(100, (volunteers.length / 10) * 100) : 0} />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Request Resolution Rate</span>
              <span className="text-sm text-muted-foreground">
                {aidRequests.length > 0 ? Math.round((completedRequests.length / aidRequests.length) * 100) : 100}%
              </span>
            </div>
            <Progress value={aidRequests.length > 0 ? (completedRequests.length / aidRequests.length) * 100 : 100} />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Health</span>
              <span className="text-sm text-muted-foreground">98%</span>
            </div>
            <Progress value={98} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Administrative controls and emergency management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button className="h-16 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              <div className="flex flex-col items-center">
                <AlertTriangle className="h-5 w-5 mb-1" />
                <span className="text-xs">Emergency Alert</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16">
              <div className="flex flex-col items-center">
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs">Manage Teams</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16">
              <div className="flex flex-col items-center">
                <Package className="h-5 w-5 mb-1" />
                <span className="text-xs">Inventory Control</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16">
              <div className="flex flex-col items-center">
                <Settings className="h-5 w-5 mb-1" />
                <span className="text-xs">System Settings</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}