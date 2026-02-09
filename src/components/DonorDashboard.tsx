import React, { useState, useEffect } from 'react';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Heart, 
  DollarSign, 
  Package, 
  TrendingUp,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  Gift
} from 'lucide-react';
import { ApiClient } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface DonorDashboardProps {
  user: User;
}

export function DonorDashboard({ user }: DonorDashboardProps) {
  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationData, setDonationData] = useState({
    type: '',
    amount: '',
    description: '',
    category: ''
  });

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const response = await ApiClient.getDonations(user.accessToken);
        setDonations(response.donations || []);
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, [user.accessToken]);

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await ApiClient.recordDonation(user.accessToken, donationData);
      
      toast.success('Donation recorded successfully!', {
        description: 'Thank you for your generous contribution.'
      });
      
      setShowDonationForm(false);
      setDonationData({ type: '', amount: '', description: '', category: '' });
      
      // Refresh donations list
      const response = await ApiClient.getDonations(user.accessToken);
      setDonations(response.donations || []);
    } catch (error: any) {
      console.error('Error recording donation:', error);
      toast.error('Failed to record donation', {
        description: error.message || 'Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showDonationForm) {
    return (
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Make a Donation</h1>
          <p className="text-muted-foreground">Your contribution helps provide vital assistance to those in need</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleDonationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Donation Type</Label>
                  <Select value={donationData.type} onValueChange={(value) => setDonationData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select donation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monetary">Monetary</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={donationData.category} onValueChange={(value) => setDonationData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food & Water</SelectItem>
                      <SelectItem value="medical">Medical Supplies</SelectItem>
                      <SelectItem value="shelter">Shelter Materials</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="general">General Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Amount/Quantity</Label>
                <Input
                  id="amount"
                  placeholder="e.g., $500 or 100 units"
                  value={donationData.amount}
                  onChange={(e) => setDonationData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your donation..."
                  value={donationData.description}
                  onChange={(e) => setDonationData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Processing...' : 'Complete Donation'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDonationForm(false)}>
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
          <h1 className="text-2xl font-semibold mb-2">Donor Dashboard</h1>
          <p className="text-muted-foreground">Track your contributions and make new donations</p>
        </div>
        <Button onClick={() => setShowDonationForm(true)} className="bg-green-600 hover:bg-green-700">
          <Heart className="h-4 w-4 mr-2" />
          Make Donation
        </Button>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Donated</p>
                <p className="text-2xl font-semibold">
                  ${donations.reduce((sum, d) => sum + (parseFloat(d.amount?.replace(/[^0-9.]/g, '') || '0')), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Gift className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Donations Made</p>
                <p className="text-2xl font-semibold">{donations.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">People Helped</p>
                <p className="text-2xl font-semibold">{donations.length * 3}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Donations */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Donations</CardTitle>
          <CardDescription>Track the impact of your contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {donations.slice(0, 10).map((donation, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-green-100 dark:bg-green-900 rounded">
                    <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">{donation.type || 'General'} - {donation.category || 'Support'}</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: {donation.amount || 'N/A'} • {new Date(donation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={donation.status === 'completed' ? 'default' : 'secondary'}>
                  {donation.status || 'pending'}
                </Badge>
              </div>
            ))}
            {donations.length === 0 && (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No donations yet</p>
                <Button onClick={() => setShowDonationForm(true)}>
                  Make your first donation
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Donation Options */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Donation Options</CardTitle>
          <CardDescription>Common donation types for emergency situations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-20" onClick={() => setShowDonationForm(true)}>
              <div className="flex flex-col items-center">
                <Package className="h-6 w-6 mb-1" />
                <span className="text-sm">Food Supplies</span>
              </div>
            </Button>
            <Button variant="outline" className="h-20" onClick={() => setShowDonationForm(true)}>
              <div className="flex flex-col items-center">
                <Heart className="h-6 w-6 mb-1" />
                <span className="text-sm">Medical Aid</span>
              </div>
            </Button>
            <Button variant="outline" className="h-20" onClick={() => setShowDonationForm(true)}>
              <div className="flex flex-col items-center">
                <DollarSign className="h-6 w-6 mb-1" />
                <span className="text-sm">Emergency Fund</span>
              </div>
            </Button>
            <Button variant="outline" className="h-20" onClick={() => setShowDonationForm(true)}>
              <div className="flex flex-col items-center">
                <Gift className="h-6 w-6 mb-1" />
                <span className="text-sm">General Support</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}