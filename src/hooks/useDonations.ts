import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';

// =====================================================
// DONATION HOOKS
// =====================================================

interface SubmitDonationData {
    donation_type: 'money' | 'supplies' | 'services';
    category: 'food' | 'medical' | 'shelter' | 'general';
    amount?: number;
    description?: string;
}

export function useSubmitDonation() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submitDonation(data: SubmitDonationData) {
        try {
            setSubmitting(true);
            setError(null);

            const session = await api.auth.getSession();
            if (!session?.user) {
                throw new Error('You must be logged in to make a donation');
            }

            await api.donations.create(data);

            toast.success('Donation submitted successfully! 💝', {
                description: 'Thank you for your generous contribution.'
            });

            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit donation';
            setError(errorMessage);
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setSubmitting(false);
        }
    }

    return { submitDonation, submitting, error };
}

export function useDonations() {
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchDonations() {
        try {
            setLoading(true);
            setError(null);

            const session = await api.auth.getSession();
            if (!session?.user) {
                setDonations([]);
                setLoading(false);
                return;
            }

            // API endpoint usually returns all for user if auth is used, or all for admin
            // Current /api/donations implementation returns only user's donations
            const data = await api.donations.getAll();
            setDonations(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch donations';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDonations();
    }, []);

    return { donations, loading, error, fetchDonations, refetch: fetchDonations };
}

export function useDonationStats() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchStats() {
        try {
            setLoading(true);
            setError(null);

            const session = await api.auth.getSession();
            if (!session?.user) {
                setStats(null);
                setLoading(false);
                return;
            }

            // We can fetch all donations for user and calculate stats client-side same as before
            const donations = await api.donations.getAll();

            // Calculate stats
            const totalAmount = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
            const totalDonations = donations?.length || 0;
            // 'processed' is not in DonationStatus, using 'confirmed' or 'delivered' as completed states
            const processedDonations = donations?.filter(d => d.status === 'confirmed' || d.status === 'delivered').length || 0;
            const pendingDonations = donations?.filter(d => d.status === 'pending').length || 0;

            // Estimate people helped (rough calculation: $50 helps 1 person)
            const peopleHelped = Math.floor(totalAmount / 50) + (donations?.filter(d => (d as any).donation_type === 'supplies').length || 0) * 5;

            const statsData = {
                totalAmount,
                totalDonations,
                processedDonations,
                pendingDonations,
                peopleHelped,
                byCategory: {
                    food: donations?.filter(d => (d as any).category === 'food').length || 0,
                    medical: donations?.filter(d => (d as any).category === 'medical').length || 0,
                    shelter: donations?.filter(d => (d as any).category === 'shelter').length || 0,
                    general: donations?.filter(d => (d as any).category === 'general').length || 0,
                },
                byType: {
                    money: donations?.filter(d => (d as any).donation_type === 'money').length || 0,
                    supplies: donations?.filter(d => (d as any).donation_type === 'supplies').length || 0,
                    services: donations?.filter(d => (d as any).donation_type === 'services').length || 0,
                }
            };

            setStats(statsData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch donation stats';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStats();
    }, []);

    return { stats, loading, error, fetchStats, refetch: fetchStats };
}
