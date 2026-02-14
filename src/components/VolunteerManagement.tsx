import { useState } from 'react';
import { User } from './AuthSystem';
import { useVolunteers } from '../hooks/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  UserPlus,
  MessageSquare,
  Phone,
  Loader2,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  available: 'bg-blue-100 text-blue-800',
  offline: 'bg-gray-100 text-gray-800',
  busy: 'bg-yellow-100 text-yellow-800',
};

interface VolunteerManagementProps {
  user: User;
}

export function VolunteerManagement({ }: VolunteerManagementProps) {
  const { volunteers, loading, error } = useVolunteers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || volunteer.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats from real data
  const totalVolunteers = volunteers.length;
  const activeToday = volunteers.filter(v => v.status === 'active').length;
  // This metric would require aggregation of all tasks duration, simplified for now
  const activeTasks = volunteers.reduce((sum, v) => sum + v.assigned_tasks, 0);
  const availableVolunteers = volunteers.filter(v => v.status === 'available').length;

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading volunteer data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">Error loading volunteers: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Volunteer Management</h1>
          <p className="text-muted-foreground">
            Manage volunteer assignments and track performance
          </p>
        </div>
        <Button onClick={() => toast.info('Invite functionality coming soon')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Volunteer
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalVolunteers}</p>
                <p className="text-sm text-muted-foreground">Total Volunteers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activeToday}</p>
                <p className="text-sm text-muted-foreground">Active Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{activeTasks}</p>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{availableVolunteers}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volunteer List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Volunteers</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredVolunteers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No volunteers found matching your criteria
                </div>
              ) : (
                filteredVolunteers.map((volunteer) => (
                  <div
                    key={volunteer.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedVolunteer?.id === volunteer.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20' : 'hover:bg-accent/50'
                      }`}
                    onClick={() => setSelectedVolunteer(volunteer)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {volunteer.name ? volunteer.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'V'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{volunteer.name}</h3>
                            <Badge className={statusColors[volunteer.status as keyof typeof statusColors]}>
                              {volunteer.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            {/* Location would be real in future */}
                            <span className="text-xs text-muted-foreground flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              Unknown Location
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Joined {new Date(volunteer.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{volunteer.assigned_tasks} active tasks</p>
                        <p className="text-xs text-muted-foreground">Last active: {volunteer.last_active}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Volunteer Details */}
        <div className="space-y-4">
          {selectedVolunteer ? (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {selectedVolunteer.name ? selectedVolunteer.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedVolunteer.name}</CardTitle>
                    <CardDescription>Volunteer since {new Date(selectedVolunteer.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {selectedVolunteer.email}
                    </div>
                    {/* Placeholder for Phone */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Phone className="h-4 w-4" />
                      (555) 123-4567
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedVolunteer.completed_tasks}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Completed</p>
                      </div>
                      <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{selectedVolunteer.assigned_tasks}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Assigned</p>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section - Placeholder for now until we have skills in DB */}
                  <div>
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {['General Relief', 'Logistics'].map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" size="sm" onClick={() => toast.info('Task assignment UI coming soon')}>
                      Assign Task
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.location.href = `mailto:${selectedVolunteer.email}`}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Select a Volunteer</CardTitle>
                <CardDescription>Click on any volunteer to view details and manage assignments</CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full text-left justify-start" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Assignment
                </Button>
                <Button variant="outline" className="w-full text-left justify-start" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Broadcast
                </Button>
                <Button variant="outline" className="w-full text-left justify-start" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Shifts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}