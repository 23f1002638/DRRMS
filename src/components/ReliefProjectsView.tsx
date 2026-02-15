import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
    MapPin,
    Users,
    Clock,
    Target,
    Heart,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface ReliefProject {
    id: string;
    title: string;
    description: string;
    category: string;
    urgency: number;
    location_address: string;
    people_count: number;
    created_at: string;
    status: string;
}

export function ReliefProjectsView() {
    const [projects, setProjects] = useState<ReliefProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    async function fetchProjects() {
        try {
            setLoading(true);
            const data = await api.requests.getAll();
            // Filter only pending requests as "active projects" and ensure types match
            const activeProjects = (data || [])
                .filter((r: any) => r.status === 'pending')
                .map((r: any) => ({
                    ...r,
                    description: r.description || ''
                }));
            setProjects(activeProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('Failed to load relief projects');
        } finally {
            setLoading(false);
        }
    }

    const getUrgencyBadge = (urgency: number) => {
        if (urgency >= 5) return <Badge variant="destructive">Critical</Badge>;
        if (urgency >= 4) return <Badge className="bg-orange-500 hover:bg-orange-600">High Priority</Badge>;
        return <Badge variant="secondary">Active</Badge>;
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold mb-2">Relief Projects</h1>
                <p className="text-muted-foreground">
                    Support ongoing relief operations in your area
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Active Projects</h3>
                        <p className="text-muted-foreground">
                            There are currently no open relief requests requiring funding.
                        </p>
                    </div>
                ) : (
                    projects.map((project) => (
                        <Card key={project.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="capitalize">
                                        {project.category}
                                    </Badge>
                                    {getUrgencyBadge(project.urgency)}
                                </div>
                                <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(project.created_at).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {project.description}
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <span className="truncate">{project.location_address || 'Location Hidden'}</span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <Users className="h-4 w-4 mr-2" />
                                        <span>{project.people_count || 'Unknown'} people affected</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-green-600 hover:bg-green-700">
                                    <Heart className="h-4 w-4 mr-2" />
                                    Donate to Project
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
