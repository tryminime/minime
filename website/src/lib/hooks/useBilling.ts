'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '../api';
import { toast } from 'sonner';

export interface Subscription {
    id: number;
    user_id: number;
    plan_type: 'free' | 'pro' | 'enterprise';
    status: string;
    current_period_start?: string;
    current_period_end?: string;
    cancel_at_period_end: boolean;
    stripe_subscription_id?: string;
    plan_details?: {
        name: string;
        price: number;
        features: string[];
        limits: Record<string, number>;
    };
}

export interface UsageMetrics {
    month: string;
    plan_type: string;
    usage: {
        activities_count: number;
        api_calls_count: number;
        graph_nodes_count: number;
        storage_bytes: number;
    };
    limits: {
        activities_per_month: number;
        graph_nodes: number;
        api_calls_per_day: number;
    };
    warnings: Record<string, {
        exceeded: boolean;
        warning: boolean;
        percent_used: number;
        current: number;
        limit: number;
        remaining: number;
    }>;
}

export interface Invoice {
    id: string;
    amount_paid: number;
    currency: string;
    status: string;
    created: string;
    invoice_pdf?: string;
}

export interface PricingPlan {
    name: string;
    price: number;
    stripe_price_id?: string;
    limits: Record<string, number>;
    features: string[];
}

// Hooks
export function useSubscription() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['billing', 'subscription'],
        queryFn: () => api.get<Subscription>('/api/v1/billing/subscription'),
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });
}

export function useUsageMetrics() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['billing', 'usage'],
        queryFn: () => api.get<UsageMetrics>('/api/v1/billing/usage'),
        staleTime: 1 * 60 * 1000, // 1 minute
        retry: 2,
    });
}

export function useInvoices() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['billing', 'invoices'],
        queryFn: () => api.get<{ invoices: Invoice[] }>('/api/v1/billing/invoices'),
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
    });
}

export function usePricingPlans() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['billing', 'plans'],
        queryFn: () => api.get<{ plans: Record<string, PricingPlan> }>('/api/v1/billing/plans'),
        staleTime: 60 * 60 * 1000, // 1 hour (plans don't change often)
        retry: 2,
    });
}

// Mutations
export function useCreateCheckout() {
    const api = getAPIClient();

    return useMutation({
        mutationFn: async (params: {
            plan_type: string;
            success_url: string;
            cancel_url: string;
        }) => {
            return api.post<{ checkout_url: string; session_id: string }>(
                '/api/v1/billing/checkout',
                params
            );
        },
        onSuccess: (data) => {
            // Redirect to Stripe Checkout
            window.location.href = data.checkout_url;
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create checkout session');
        },
    });
}

export function useCancelSubscription() {
    const api = getAPIClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (atPeriodEnd: boolean = true) => {
            return api.post('/api/v1/billing/subscription/cancel', { at_period_end: atPeriodEnd });
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] });
            toast.success(data.message || 'Subscription canceled');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to cancel subscription');
        },
    });
}

export function useUpdateSubscription() {
    const api = getAPIClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newPlanType: string) => {
            return api.post('/api/v1/billing/subscription/update', { new_plan_type: newPlanType });
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] });
            queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
            toast.success(data.message || 'Subscription updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update subscription');
        },
    });
}

export function useCustomerPortal() {
    const api = getAPIClient();

    return useMutation({
        mutationFn: async (returnUrl: string) => {
            return api.post<{ portal_url: string }>('/api/v1/billing/portal', { return_url: returnUrl });
        },
        onSuccess: (data) => {
            // Redirect to Stripe Customer Portal
            window.location.href = data.portal_url;
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to open customer portal');
        },
    });
}
