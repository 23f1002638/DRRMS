import { useState, useEffect } from 'react';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Users,
    MessageCircle,
    Calendar,
    MapPin,
    Heart,
    Phone
} from 'lucide-react';

interface SupportGroupsViewProps {
    user: User;
}

interface SupportGroup {
    id: string;
    name: string;
    type: 'grief' | 'trauma' | 'family' | 'rebuilding' | 'general';
    description: string;
    meeting_time: string;
    location: string;
    contact: string;
    facilitator: string;
    status: 'open' | 'full' | 'online';
}

const mockGroups: SupportGroup[] = [
    {
        id: '1',
        name: 'Community Healing Circle',
        type: 'general',
        description: 'A safe space for community members to share and support each other during recovery.',
        meeting_time: 'Every Tuesday, 6:00 PM',
        location: 'Community Center, Room B',
        contact: '(555) 123-4567',
        facilitator: 'Dr. Sarah Smith',
        status: 'open'
    },
    {
        id: '2',
        name: 'Rebuilding Together',
        type: 'rebuilding',
        description: 'Support for families navigating the process of rebuilding their homes and lives.',
        meeting_time: 'Thursdays, 7:00 PM',
        location: 'Online (Zoom)',
        contact: 'housing@relief.org',
        facilitator: 'Housing Advocate Mark Jones',
        status: 'online'
    },
    {
        id: '3',
        name: 'Family Support Network',
        type: 'family',
        description: 'Resources and emotional support for families with children affected by the disaster.',
        meeting_time: 'Saturdays, 10:00 AM',
        location: 'Public Library, Kids Section',
        contact: '(555) 987-6543',
        facilitator: 'Child Specialist Elena Rodriguez',
        status: 'open'
    },
    {
        id: '4',
        name: 'Trauma Recovery Group',
        type: 'trauma',
        description: 'Professional-led group therapy for those experiencing PTSD or severe stress.',
        meeting_time: 'Wednesdays, 5:30 PM',
        location: 'Medical Center, Suite 101',
        contact: '(555) 555-0123',
        facilitator: 'Dr. Emily Chen, PsyD',
        status: 'full'
    }
];

export function SupportGroupsView({ user: _user }: SupportGroupsViewProps) {
    const [groups, setGroups] = useState<SupportGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        setTimeout(() => {
            setGroups(mockGroups);
            setLoading(false);
        }, 800);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'online': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'full': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'trauma': return <Heart className="h-4 w-4" />;
            case 'family': return <Users className="h-4 w-4" />;
            case 'rebuilding': return <MapPin className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-48 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-semibold mb-2">Support Groups</h1>
                <p className="text-muted-foreground">
                    Connect with your community and find specialized support
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map((group) => (
                    <Card key={group.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        {getTypeIcon(group.type)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{group.name}</CardTitle>
                                        <CardDescription className="capitalize">{group.type} Support</CardDescription>
                                    </div>
                                </div>
                                <Badge className={getStatusColor(group.status)} variant="outline">
                                    {group.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <p className="text-sm text-foreground/80">{group.description}</p>

                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{group.meeting_time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{group.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>Facilitator: {group.facilitator}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-2 mt-auto">
                                <Button className="flex-1">
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Join Group
                                </Button>
                                <Button variant="outline" onClick={() => window.open(`tel:${group.contact.replace(/\D/g, '')}`)}>
                                    <Phone className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg">Need Immediate Help?</h3>
                        <p className="text-sm text-muted-foreground">
                            Professional counselors are available 24/7 for crisis support.
                        </p>
                    </div>
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Crisis Hotline
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
