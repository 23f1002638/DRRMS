import { useState, useEffect } from 'react';
import { User } from './AuthSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
  Users,
  Gift,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { useSubmitDonation, useDonations, useDonationStats } from '../hooks/useDonations';
import { supabase } from '../lib/supabase';

interface DonorDashboardProps {
  user: User;
}

export function DonorDashboard({ user }: DonorDashboardProps) {
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationData, setDonationData] = useState({
    donation_type: '',
    amount: '',
    description: '',
    category: ''
  });

  const { submitDonation, submitting } = useSubmitDonation();
  const { donations, loading: donationsLoading, fetchDonations } = useDonations();
  const { stats, loading: statsLoading, fetchStats } = useDonationStats();

  useEffect(() => {
    fetchDonations();
    fetchStats();

    // Set up real-time subscription
    const subscription = supabase
      .channel('user_donations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donations',
          filter: `donor_id=eq.${user.id}`
        },
        () => {
          fetchDonations();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user.id]);

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await submitDonation({
      donation_type: donationData.donation_type as 'money' | 'supplies' | 'services',
      category: donationData.category as 'food' | 'medical' | 'shelter' | 'general',
      amount: donationData.amount ? parseFloat(donationData.amount) : undefined,
      description: donationData.description || undefined
    });

    if (result.success) {
      setShowDonationForm(false);
      setDonationData({ donation_type: '', amount: '', description: '', category: '' });
      fetchDonations();
      fetchStats();
    }
  };

  if (donationsLoading || statsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your donation history...</p>
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
                  <Label htmlFor="donation_type">Donation Type *</Label>
                  <Select
                    value={donationData.donation_type}
                    onValueChange={(value) => setDonationData(prev => ({ ...prev, donation_type: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select donation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="money">💵 Money</SelectItem>
                      <SelectItem value="supplies">📦 Supplies</SelectItem>
                      <SelectItem value="services">🤝 Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={donationData.category}
                    onValueChange={(value) => setDonationData(prev => ({ ...prev, category: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">🍽️ Food & Water</SelectItem>
                      <SelectItem value="medical">🏥 Medical Supplies</SelectItem>
                      <SelectItem value="shelter">🏠 Shelter Materials</SelectItem>
                      <SelectItem value="general">💝 General Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">
                  {donationData.donation_type === 'money' ? 'Amount ($)' : 'Quantity/Value'}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder={donationData.donation_type === 'money' ? 'e.g., 100.00' : 'e.g., 50 (units/value)'}
                  value={donationData.amount}
                  onChange={(e) => setDonationData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your donation (optional)..."
                  value={donationData.description}
                  onChange={(e) => setDonationData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit" disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Complete Donation
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDonationForm(false)}
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

  const donationTypeConfig = {
    money: { label: 'Money', icon: '💵' },
    supplies: { label: 'Supplies', icon: '📦' },
    services: { label: 'Services', icon: '🤝' }
  };

  const categoryConfig = {
    food: { label: 'Food & Water', icon: '🍽️' },
    medical: { label: 'Medical', icon: '🏥' },
    shelter: { label: 'Shelter', icon: '🏠' },
    general: { label: 'General', icon: '💝' }
  };

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    processed: { label: 'Processed', color: 'bg-green-100 text-green-800' },
    delivered: { label: 'Delivered', color: 'bg-blue-100 text-blue-800' }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Donated</p>
                <p className="text-2xl font-semibold">
                  ${stats?.totalAmount?.toLocaleString() || '0'}
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
                <p className="text-2xl font-semibold">{stats?.totalDonations || 0}</p>
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
                <p className="text-2xl font-semibold">{stats?.peopleHelped || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processed</p>
                <p className="text-2xl font-semibold">{stats?.processedDonations || 0}</p>
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
            {donations.slice(0, 10).map((donation) => {
              const typeInfo = donationTypeConfig[donation.donation_type as keyof typeof donationTypeConfig];
              const catInfo = categoryConfig[donation.category as keyof typeof categoryConfig];
              const statusInfo = statusConfig[donation.status as keyof typeof statusConfig];

              return (
                <div key={donation.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{typeInfo?.icon || '💝'}</div>
                    <div>
                      <p className="font-medium">
                        {typeInfo?.label || donation.donation_type} - {catInfo?.label || donation.category}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {donation.amount ? `$${donation.amount.toLocaleString()}` : 'No amount specified'} • {new Date(donation.created_at).toLocaleDateString()}
                      </p>
                      {donation.description && (
                        <p className="text-sm text-muted-foreground mt-1">{donation.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={statusInfo.color} variant="outline">
                    {statusInfo.label}
                  </Badge>
                </div>
              );
            })}
            {donations.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No donations yet</p>
                <p className="text-muted-foreground mb-4">Make your first donation to start helping those in need</p>
                <Button onClick={() => setShowDonationForm(true)} className="bg-green-600 hover:bg-green-700">
                  <Heart className="h-4 w-4 mr-2" />
                  Make your first donation
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Impact by Category */}
      {stats && stats.totalDonations > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Donations by Category</CardTitle>
              <CardDescription>Where your contributions are going</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.byCategory).map(([category, count]) => {
                const catInfo = categoryConfig[category as keyof typeof categoryConfig];
                const percentage = stats.totalDonations > 0 ? ((count as number) / stats.totalDonations) * 100 : 0;

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{catInfo?.icon}</span>
                        <span>{catInfo?.label}</span>
                      </span>
                      <span className="font-medium">{count as number} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Donations by Type</CardTitle>
              <CardDescription>How you're contributing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.byType).map(([type, count]) => {
                const typeInfo = donationTypeConfig[type as keyof typeof donationTypeConfig];
                const percentage = stats.totalDonations > 0 ? ((count as number) / stats.totalDonations) * 100 : 0;

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{typeInfo?.icon}</span>
                        <span>{typeInfo?.label}</span>
                      </span>
                      <span className="font-medium">{count as number} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Donation Options */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Donation Options</CardTitle>
          <CardDescription>Common donation types for emergency situations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={() => {
                setDonationData({ donation_type: 'supplies', category: 'food', amount: '', description: '' });
                setShowDonationForm(true);
              }}
            >
              <Package className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Food Supplies</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={() => {
                setDonationData({ donation_type: 'supplies', category: 'medical', amount: '', description: '' });
                setShowDonationForm(true);
              }}
            >
              <Heart className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Medical Aid</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={() => {
                setDonationData({ donation_type: 'money', category: 'general', amount: '', description: '' });
                setShowDonationForm(true);
              }}
            >
              <DollarSign className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Emergency Fund</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={() => {
                setDonationData({ donation_type: 'services', category: 'general', amount: '', description: '' });
                setShowDonationForm(true);
              }}
            >
              <Gift className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Volunteer Services</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}