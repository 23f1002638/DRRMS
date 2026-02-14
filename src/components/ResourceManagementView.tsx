import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
    MapPin,
    Phone,
    Edit,
    Trash2,
    Plus,
    Loader2,
    Building2,
    Users,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
    id: string;
    name: string;
    type: string;
    address: string;
    location: any;
    contact_phone: string | null;
    status: string;
    capacity: number | null;
    current_occupancy: number | null;
    created_at: string;
    updated_at: string;
}

interface ResourceManagementProps {
    user: User;
}

const resourceTypeConfig = {
    shelter: { label: 'Shelter', icon: '🏠', color: 'bg-purple-100 text-purple-800' },
    food_distribution: { label: 'Food Distribution', icon: '🍽️', color: 'bg-green-100 text-green-800' },
    medical: { label: 'Medical Center', icon: '🏥', color: 'bg-red-100 text-red-800' },
    support_center: { label: 'Support Center', icon: '💝', color: 'bg-blue-100 text-blue-800' }
};

const statusConfig = {
    open: { label: 'Open', color: 'bg-green-100 text-green-800' },
    limited: { label: 'Limited', color: 'bg-yellow-100 text-yellow-800' },
    closed: { label: 'Closed', color: 'bg-red-100 text-red-800' }
};

export function ResourceManagementView({ user }: ResourceManagementProps) {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        address: '',
        contact_phone: '',
        status: 'open',
        capacity: '',
        current_occupancy: '0'
    });

    useEffect(() => {
        fetchResources();

        // Polling for updates
        const interval = setInterval(fetchResources, 15000);
        return () => clearInterval(interval);
    }, []);

    async function fetchResources() {
        try {
            setLoading(true);
            const data = await api.resources.getAll();
            setResources(data || []);
        } catch (error) {
            console.error('Error fetching resources:', error);
            toast.error('Failed to load resources');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        try {
            const resourceData = {
                name: formData.name,
                type: formData.type,
                address: formData.address,
                contact_phone: formData.contact_phone || null,
                status: formData.status,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                current_occupancy: formData.current_occupancy ? parseInt(formData.current_occupancy) : 0,
                location: null // Can be enhanced with geocoding later
            };

            if (editingResource) {
                // Update existing resource
                await api.resources.update(editingResource.id, resourceData);
                toast.success('Resource updated successfully! ✅');
            } else {
                // Create new resource
                await api.resources.create(resourceData);
                toast.success('Resource created successfully! 🎉');
            }

            resetForm();
            fetchResources();
        } catch (error) {
            console.error('Error saving resource:', error);
            toast.error('Failed to save resource');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this resource?')) return;

        try {
            await api.resources.delete(id);
            toast.success('Resource deleted successfully');
            fetchResources();
        } catch (error) {
            console.error('Error deleting resource:', error);
            toast.error('Failed to delete resource');
        }
    }

    function handleEdit(resource: Resource) {
        setEditingResource(resource);
        setFormData({
            name: resource.name,
            type: resource.type,
            address: resource.address,
            contact_phone: resource.contact_phone || '',
            status: resource.status,
            capacity: resource.capacity?.toString() || '',
            current_occupancy: resource.current_occupancy?.toString() || '0'
        });
        setShowForm(true);
    }

    function resetForm() {
        setFormData({
            name: '',
            type: '',
            address: '',
            contact_phone: '',
            status: 'open',
            capacity: '',
            current_occupancy: '0'
        });
        setEditingResource(null);
        setShowForm(false);
    }

    const getOccupancyPercentage = (current: number, capacity: number) => {
        if (!capacity) return 0;
        return Math.min((current / capacity) * 100, 100);
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading resources...</p>
                </div>
            </div>
        );
    }

    if (showForm) {
        return (
            <div className="p-6 space-y-6 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">
                        {editingResource ? 'Edit Resource' : 'Add New Resource'}
                    </h1>
                    <p className="text-muted-foreground">
                        {editingResource ? 'Update resource information' : 'Create a new emergency resource'}
                    </p>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Resource Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Central Emergency Shelter"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="shelter">🏠 Shelter</SelectItem>
                                            <SelectItem value="food_distribution">🍽️ Food Distribution</SelectItem>
                                            <SelectItem value="medical">🏥 Medical Center</SelectItem>
                                            <SelectItem value="support_center">💝 Support Center</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="limited">Limited</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Address *</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Full address"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="contact_phone">Contact Phone</Label>
                                <Input
                                    id="contact_phone"
                                    type="tel"
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                                    placeholder="e.g., +1 (555) 123-4567"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min="0"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                                        placeholder="Maximum capacity"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="current_occupancy">Current Occupancy</Label>
                                    <Input
                                        id="current_occupancy"
                                        type="number"
                                        min="0"
                                        value={formData.current_occupancy}
                                        onChange={(e) => setFormData(prev => ({ ...prev, current_occupancy: e.target.value }))}
                                        placeholder="Current occupancy"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={submitting} className="flex-1">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            {editingResource ? 'Update Resource' : 'Create Resource'}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">Resource Management</h1>
                    <p className="text-muted-foreground">
                        Manage emergency resources and facilities
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
                                <p className="text-2xl font-semibold">{resources.length}</p>
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
                                <p className="text-sm font-medium text-muted-foreground">Open</p>
                                <p className="text-2xl font-semibold">
                                    {resources.filter(r => r.status === 'open').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Limited</p>
                                <p className="text-2xl font-semibold">
                                    {resources.filter(r => r.status === 'limited').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Closed</p>
                                <p className="text-2xl font-semibold">
                                    {resources.filter(r => r.status === 'closed').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resources List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Resources</CardTitle>
                    <CardDescription>Manage and monitor emergency resources</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {resources.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-lg font-medium mb-2">No Resources Yet</p>
                                <p className="text-muted-foreground mb-4">
                                    Add your first emergency resource to get started
                                </p>
                                <Button onClick={() => setShowForm(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Resource
                                </Button>
                            </div>
                        ) : (
                            resources.map((resource) => {
                                const typeInfo = resourceTypeConfig[resource.type as keyof typeof resourceTypeConfig];
                                const statusInfo = statusConfig[resource.status as keyof typeof statusConfig];
                                const occupancyPercent = resource.capacity && resource.current_occupancy
                                    ? getOccupancyPercentage(resource.current_occupancy, resource.capacity)
                                    : 0;

                                return (
                                    <div key={resource.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">{typeInfo?.icon || '🏢'}</span>
                                                    <h3 className="font-medium text-lg">{resource.name}</h3>
                                                    <Badge className={typeInfo?.color}>
                                                        {typeInfo?.label || resource.type}
                                                    </Badge>
                                                    <Badge className={statusInfo.color}>
                                                        {statusInfo.label}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{resource.address}</span>
                                                    </div>
                                                    {resource.contact_phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4" />
                                                            <span>{resource.contact_phone}</span>
                                                        </div>
                                                    )}
                                                    {resource.capacity && (
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            <span>
                                                                {resource.current_occupancy || 0} / {resource.capacity} ({occupancyPercent.toFixed(0)}% full)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(resource)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(resource.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
    );
}
