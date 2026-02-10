import { useState } from 'react';
import { supabase } from '../lib/supabase';
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

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('You must be logged in to make a donation');
            }

            // Insert donation
            const { data: newDonation, error: insertError } = await supabase
                .from('donations')
                .insert({
                    donor_id: user.id,
                    donation_type: data.donation_type,
                    category: data.category,
                    amount: data.amount,
                    description: data.description,
                    status: 'pending'
                })
                .select()
                .maybeSingle();

            if (insertError) throw insertError;

            toast.success('Donation submitted successfully! 💝', {
                description: 'Thank you for your generous contribution.'
            });

            return { success: true, data: newDonation };
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

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setDonations([]);
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('donations')
                .select('*')
                .eq('donor_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setDonations(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch donations';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }

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

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setStats(null);
                setLoading(false);
                return;
            }

            // Fetch all donations for this donor
            const { data: donations, error: fetchError } = await supabase
                .from('donations')
                .select('*')
                .eq('donor_id', user.id);

            if (fetchError) throw fetchError;

            // Calculate stats
            const totalAmount = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
            const totalDonations = donations?.length || 0;
            const processedDonations = donations?.filter(d => d.status === 'processed').length || 0;
            const pendingDonations = donations?.filter(d => d.status === 'pending').length || 0;

            // Estimate people helped (rough calculation: $50 helps 1 person)
            const peopleHelped = Math.floor(totalAmount / 50) + (donations?.filter(d => d.donation_type === 'supplies').length || 0) * 5;

            const statsData = {
                totalAmount,
                totalDonations,
                processedDonations,
                pendingDonations,
                peopleHelped,
                byCategory: {
                    food: donations?.filter(d => d.category === 'food').length || 0,
                    medical: donations?.filter(d => d.category === 'medical').length || 0,
                    shelter: donations?.filter(d => d.category === 'shelter').length || 0,
                    general: donations?.filter(d => d.category === 'general').length || 0,
                },
                byType: {
                    money: donations?.filter(d => d.donation_type === 'money').length || 0,
                    supplies: donations?.filter(d => d.donation_type === 'supplies').length || 0,
                    services: donations?.filter(d => d.donation_type === 'services').length || 0,
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

    return { stats, loading, error, fetchStats, refetch: fetchStats };
}
