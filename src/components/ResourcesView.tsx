import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    MapPin,
    Phone,
    Mail,
    Home,
    Heart,
    Building,
    MessageSquare,
    Navigation,
    Search,
    Loader2,
    Users
} from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
    id: string;
    name: string;
    type: string;
    address: string;
    location: any;
    contact_phone: string | null;
    contact_email: string | null;
    status: string;
    capacity: number | null;
    current_occupancy: number;
    description: string | null;
}

interface ResourcesViewProps {
    user: User;
}

const resourceTypeConfig = {
    shelter: {
        label: 'Emergency Shelter',
        icon: Home,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    food_distribution: {
        label: 'Food Distribution',
        icon: Heart,
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    medical: {
        label: 'Medical Center',
        icon: Building,
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    },
    support_center: {
        label: 'Support Center',
        icon: MessageSquare,
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
};

const statusConfig = {
    open: { label: 'Open', color: 'bg-green-100 text-green-800' },
    limited: { label: 'Limited', color: 'bg-yellow-100 text-yellow-800' },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' }
};

export function ResourcesView(_props: ResourcesViewProps) {
    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        filterResources();
    }, [resources, searchTerm, filterType]);

    async function fetchResources() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setResources(data || []);
        } catch (error) {
            console.error('Error fetching resources:', error);
            toast.error('Failed to load resources');
        } finally {
            setLoading(false);
        }
    }

    function filterResources() {
        let filtered = resources;

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(r => r.type === filterType);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredResources(filtered);
    }

    function getDirections(resource: Resource) {
        if (resource.location?.lat && resource.location?.lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${resource.location.lat},${resource.location.lng}`;
            window.open(url, '_blank');
        } else {
            toast.error('Location coordinates not available');
        }
    }

    function callResource(phone: string) {
        window.location.href = `tel:${phone}`;
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading emergency resources...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold mb-2">Emergency Resources</h1>
                <p className="text-muted-foreground">
                    Find nearby shelters, food distribution centers, medical facilities, and support services
                </p>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, address, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={filterType === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterType('all')}
                            >
                                All
                            </Button>
                            {Object.entries(resourceTypeConfig).map(([type, config]) => (
                                <Button
                                    key={type}
                                    variant={filterType === type ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterType(type)}
                                >
                                    <config.icon className="h-4 w-4 mr-1" />
                                    {config.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resources Grid */}
            {filteredResources.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Resources Found</h3>
                        <p className="text-muted-foreground">
                            {searchTerm || filterType !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'No emergency resources available at this time'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredResources.map((resource) => {
                        const typeInfo = resourceTypeConfig[resource.type as keyof typeof resourceTypeConfig];
                        const statusInfo = statusConfig[resource.status as keyof typeof statusConfig];
                        const TypeIcon = typeInfo.icon;
                        const availableCapacity = resource.capacity ? resource.capacity - resource.current_occupancy : null;

                        return (
                            <Card key={resource.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TypeIcon className="h-5 w-5" />
                                                <CardTitle className="text-xl">{resource.name}</CardTitle>
                                                <Badge className={typeInfo.color}>
                                                    {typeInfo.label}
                                                </Badge>
                                            </div>
                                            <CardDescription>{resource.description || 'Emergency resource center'}</CardDescription>
                                        </div>
                                        <Badge className={statusInfo.color} variant="outline">
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="text-muted-foreground">Address:</span>
                                                <p className="font-medium">{resource.address}</p>
                                            </div>
                                        </div>
                                        {resource.contact_phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Phone:</span>
                                                <span className="font-medium">{resource.contact_phone}</span>
                                            </div>
                                        )}
                                        {resource.contact_email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Email:</span>
                                                <span className="font-medium">{resource.contact_email}</span>
                                            </div>
                                        )}
                                        {resource.capacity && (
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Capacity:</span>
                                                <span className="font-medium">
                                                    {availableCapacity !== null && availableCapacity >= 0
                                                        ? `${availableCapacity} / ${resource.capacity} available`
                                                        : `${resource.capacity} total`}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            size="sm"
                                            onClick={() => getDirections(resource)}
                                            className="flex-1 md:flex-none"
                                        >
                                            <Navigation className="h-4 w-4 mr-2" />
                                            Get Directions
                                        </Button>
                                        {resource.contact_phone && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => callResource(resource.contact_phone!)}
                                                className="flex-1 md:flex-none"
                                            >
                                                <Phone className="h-4 w-4 mr-2" />
                                                Call
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
