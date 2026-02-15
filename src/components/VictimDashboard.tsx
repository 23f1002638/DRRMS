import { useState, useEffect } from 'react';
import { User } from './AuthSystem';
import { api } from '../lib/api';
import { getCurrentLocation, calculateDistance, Coordinates } from '../lib/geolocation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  MapPin,
  Phone,
  MessageSquare,
  Heart,
  Loader2,
  Navigation
} from 'lucide-react';

interface VictimDashboardProps {
  user: User;
  onViewChange: (view: string) => void;
}

interface ResourceWithDistance {
  id: string;
  name: string;
  type: string;
  location_address: string;
  location_lat?: number;
  location_lng?: number;
  contact_phone?: string;
  status: string;
  distance?: number;
}

export function VictimDashboard({ user, onViewChange }: VictimDashboardProps) {
  const [aidRequests, setAidRequests] = useState<any[]>([]);
  const [nearbyResources, setNearbyResources] = useState<ResourceWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Aid Requests
        const requestsData = await api.requests.getAll(user.id);
        setAidRequests(requestsData || []);

        // Fetch Resources and Calculation Distances
        const resourcesData = await api.resources.getAll();

        try {
          const userLocation = await getCurrentLocation();

          const resourcesWithDistance = resourcesData.map((resource: any) => {
            let distance = undefined;
            if (resource.location_lat && resource.location_lng) {
              distance = calculateDistance(userLocation, {
                lat: resource.location_lat,
                lng: resource.location_lng
              });
            }
            return { ...resource, distance };
          });

          // Sort by distance (nearest first)
          const sortedResources = resourcesWithDistance.sort((a: any, b: any) => {
            if (a.distance === undefined) return 1;
            if (b.distance === undefined) return -1;
            return a.distance - b.distance;
          });

          setNearbyResources(sortedResources.slice(0, 4));
        } catch (locError) {
          console.warn('Could not get user location:', locError);
          setLocationError('Location access denied. Showing all resources.');
          // Fallback: just show the first 4 if location fails
          setNearbyResources(resourcesData.slice(0, 4));
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'limited': return 'secondary';
      case 'closed': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">
          Access emergency assistance and track your aid requests
        </p>
      </div>

      {/* Emergency Actions */}
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button className="h-16 bg-red-600 hover:bg-red-700" onClick={() => window.open('tel:911')}>
              <div className="flex flex-col items-center">
                <Phone className="h-5 w-5 mb-1" />
                <span>Emergency Call 911</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-16 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950/50"
              onClick={() => onViewChange('request')}
            >
              <div className="flex flex-col items-center">
                <AlertTriangle className="h-5 w-5 mb-1" />
                <span>Request Immediate Aid</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Requests Status */}
      <Card>
        <CardHeader>
          <CardTitle>Your Aid Requests</CardTitle>
          <CardDescription>Current status of your assistance requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aidRequests.slice(0, 3).map((request, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {request.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-orange-600" />
                  )}
                  <div>
                    <p className="font-medium">{request.aid_type || 'General Aid'} Request</p>
                    <p className="text-sm text-muted-foreground">
                      {request.people_count || 1} people • {request.priority || 'medium'} priority
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                    {request.status || 'pending'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}

            {aidRequests.length === 0 && (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No aid requests yet</p>
              </div>
            )}

            <Button variant="link" className="w-full text-blue-600" onClick={() => onViewChange('status')}>
              View All Requests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewChange('request')}>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium">Request Supplies</h3>
              <p className="text-sm text-muted-foreground">Food, water, medical supplies</p>
              <Button size="sm" className="w-full">
                Request Aid
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewChange('resources')}>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium">Find Resources</h3>
              <p className="text-sm text-muted-foreground">Shelters, distribution centers</p>
              <Button size="sm" variant="outline" className="w-full">
                View Resources
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium">Support Groups</h3>
              <p className="text-sm text-muted-foreground">Community assistance</p>
              <Button size="sm" variant="outline" className="w-full" onClick={() => onViewChange('support')}>
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Nearby Emergency Resources</CardTitle>
          <CardDescription>
            {locationError ? 'Showing all resources' : 'Resources near your location'}
            {locationError && <span className="text-xs text-yellow-600 ml-2">({locationError})</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyResources.map((resource) => (
              <div key={resource.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{resource.name}</h4>
                    <p className="text-sm text-muted-foreground">{resource.location_address}</p>
                    {resource.distance !== undefined && (
                      <p className="text-xs font-semibold text-blue-600 mt-0.5">
                        {resource.distance} km away
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusColor(resource.status)}>{resource.status}</Badge>
                </div>
                <div className="flex space-x-2">
                  {resource.location_lat && resource.location_lng && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${resource.location_lat},${resource.location_lng}`, '_blank')}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Directions
                    </Button>
                  )}
                  {resource.contact_phone && (
                    <Button size="sm" variant="outline" onClick={() => window.open(`tel:${resource.contact_phone}`)}>
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {nearbyResources.length === 0 && (
              <div className="col-span-full py-6 text-center text-muted-foreground">
                No resources available nearby.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}