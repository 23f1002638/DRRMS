import { useState } from 'react';
import { useDonations } from '../hooks/useDonations';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import {
    Heart,
    Search,
    Download,
    Loader2
} from 'lucide-react';

export function DonationsView() {
    const { donations, loading } = useDonations();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredDonations = donations.filter(donation => {
        const matchesSearch =
            donation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donation.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donation.donation_type?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || donation.donation_type === filterType;

        return matchesSearch && matchesType;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'processed':
            case 'delivered':
                return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
            default:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        }
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">My Donations</h1>
                    <p className="text-muted-foreground">
                        Track and manage your contributions to relief efforts
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export History
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search donations..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filterType === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilterType('all')}
                                size="sm"
                            >
                                All
                            </Button>
                            <Button
                                variant={filterType === 'money' ? 'default' : 'outline'}
                                onClick={() => setFilterType('money')}
                                size="sm"
                            >
                                Money
                            </Button>
                            <Button
                                variant={filterType === 'supplies' ? 'default' : 'outline'}
                                onClick={() => setFilterType('supplies')}
                                size="sm"
                            >
                                Supplies
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Amount/Value</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDonations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Heart className="h-8 w-8 opacity-20" />
                                                <p>No donations found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDonations.map((donation) => (
                                        <TableRow key={donation.id}>
                                            <TableCell>
                                                {new Date(donation.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {donation.donation_type}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {donation.category}
                                            </TableCell>
                                            <TableCell>
                                                {donation.donation_type === 'money'
                                                    ? `$${(donation.amount || 0).toLocaleString()}`
                                                    : donation.amount || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(donation.status)} variant="outline">
                                                    {donation.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {donation.description || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
