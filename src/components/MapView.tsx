import { useState, useEffect } from 'react';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import {
  Navigation,
  Search,
  Layers,
  Users,
  Package,
  AlertTriangle,
  Zap,
  Loader2,
  MapPin
} from 'lucide-react';
import { useMapData, MapLocation } from '../hooks/useDisasterData';
import { toast } from 'sonner';

interface MapViewProps {
  user: User;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  urgent: 'bg-red-500',
  operational: 'bg-blue-500',
  completed: 'bg-gray-500',
  closed: 'bg-gray-400',
  pending: 'bg-yellow-500',
};

const typeIcons = {
  volunteer: Users,
  request: AlertTriangle,
  resource: Package,
  task: Zap,
};

export function MapView({ user }: MapViewProps) {
  const { locations, loading, error, refetch } = useMapData();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  useEffect(() => {
    // Request user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Location access denied');
          toast.error('Location access denied. Using default view.');
        }
      );
    }
  }, []);

  const filteredLocations = locations.filter(location => {
    const matchesFilter = filter === 'all' || location.type === filter || location.status === filter;
    const matchesSearch = location.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading operations map...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">Error loading map data: {error}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Map Overview</h1>
          <p className="text-muted-foreground">
            Real-time locations and operational status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => {
            if (userLocation) {
              toast.success('Centering on your location');
            } else {
              toast.error('Location not available');
            }
          }}>
            <Navigation className="h-4 w-4 mr-2" />
            My Location
          </Button>
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" />
            Layers
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Interactive Map</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="volunteer">Volunteers</SelectItem>
                    <SelectItem value="request">Requests</SelectItem>
                    <SelectItem value="resource">Resources</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Map Interface */}
            <div className="h-96 bg-slate-100 rounded-lg relative overflow-hidden border">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
                {/* Mock map grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={`h-${i}`} className="border-b border-gray-400" style={{ height: '5%' }} />
                  ))}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={`v-${i}`} className="absolute border-r border-gray-400 h-full" style={{ left: `${i * 5}%`, width: '1px' }} />
                  ))}
                </div>

                {/* Location markers */}
                {filteredLocations.map((location, index) => {
                  const Icon = typeIcons[location.type as keyof typeof typeIcons] || MapPin;
                  // distinct positioning hash based on lat/lng to avoid overlap in mock view if lat/lng are close
                  // In real map lib (Leaflet/Google Maps), we would use actual lat/lng.
                  // Here we project lat/lng to % for demo purposes if they are in a specific range, 
                  // or just random scatter if we can't map them easily without a proper projection library.
                  // For this demo, let's use a simple hash to place them deterministically on the "map"
                  const left = Math.abs((location.lng * 1000) % 90) + 5;
                  const top = Math.abs((location.lat * 1000) % 80) + 10;

                  return (
                    <div
                      key={location.id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${selectedLocation?.id === location.id ? 'z-50 scale-125' : 'z-10 hover:scale-110'
                        } transition-transform duration-200`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`
                      }}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className={`w-8 h-8 rounded-full ${statusColors[location.status] || 'bg-gray-500'} flex items-center justify-center shadow-lg border-2 border-white`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      {location.status === 'urgent' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />
                      )}
                    </div>
                  );
                })}

                {/* User location marker */}
                {userLocation && (
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40"
                    style={{ left: '50%', top: '50%' }}
                  >
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div className="w-12 h-12 border-2 border-blue-600 rounded-full absolute -top-3 -left-3 animate-ping opacity-30" />
                  </div>
                )}
              </div>

              {/* Map controls */}
              <div className="absolute top-4 right-4 space-y-2">
                <Button size="sm" variant="secondary" className="w-8 h-8 p-0" onClick={() => toast.info('Zoom In')}>+</Button>
                <Button size="sm" variant="secondary" className="w-8 h-8 p-0" onClick={() => toast.info('Zoom Out')}>-</Button>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border text-xs">
                <h4 className="font-semibold mb-2">Legend</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    <span>Active Team</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    <span>Urgent Request</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    <span>Resource Center</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <div className="space-y-4">
          {selectedLocation ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedLocation.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Updated {new Date(selectedLocation.updated_at).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <Badge className={`${statusColors[selectedLocation.status] || 'bg-gray-500'} capitalize`}>
                    {selectedLocation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-md text-sm">
                    {selectedLocation.description}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Lat: {selectedLocation.lat.toFixed(4)}</div>
                    <div>Lng: {selectedLocation.lng.toFixed(4)}</div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" className="flex-1" onClick={() => toast.success('Navigation started')}>
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Details
                    </Button>
                  </div>

                  {user.role === 'admin' && selectedLocation.type === 'request' && (
                    <Button size="sm" variant="default" className="w-full bg-orange-600 hover:bg-orange-700">
                      <Zap className="h-4 w-4 mr-1" />
                      Expedite Response
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-40 flex flex-col justify-center items-center text-center p-6">
              <MapPin className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
              <CardTitle className="text-lg mb-1">Select a Location</CardTitle>
              <CardDescription>
                Click on any marker on the map to view real-time details and available actions.
              </CardDescription>
            </Card>
          )}

          {/* Recent Locations List */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg">Nearby Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {filteredLocations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4 text-sm">No locations found.</div>
                ) : (
                  filteredLocations.map((location) => {
                    const Icon = typeIcons[location.type as keyof typeof typeIcons] || MapPin;
                    return (
                      <div
                        key={location.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedLocation?.id === location.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-accent/50'
                          }`}
                        onClick={() => setSelectedLocation(location)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`mt-0.5 w-7 h-7 rounded-full ${statusColors[location.status] || 'bg-gray-500'} flex items-center justify-center`}>
                            <Icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-medium truncate pr-2">{location.title}</p>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {new Date(location.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{location.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}