import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBilling } from '@/lib/hooks/useBilling';

// Test component wrapper
function TestComponent() {
    const { subscription, usage, isLoading } = useBilling();

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div data-testid="plan">{subscription?.plan}</div>
            <div data-testid="usage">{usage?.activitiesTracked}</div>
        </div>
    );
}

describe('useBilling Hook', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        // Mock fetch
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('fetches subscription data successfully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                plan: 'pro',
                status: 'active',
            }),
        });

        render(
            <QueryClientProvider client={queryClient}>
                <TestComponent />
            </QueryClientProvider>
        );

        // Should show loading initially
        expect(screen.getByText('Loading...')).toBeInTheDocument();

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByTestId('plan')).toHaveTextContent('pro');
        });
    });

    it('fetches usage data successfully', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ // subscription
                ok: true,
                json: async () => ({ plan: 'pro', status: 'active' }),
            })
            .mockResolvedValueOnce({ // usage
                ok: true,
                json: async () => ({ activitiesTracked: 1234 }),
            });

        render(
            <QueryClientProvider client={queryClient}>
                <TestComponent />
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('usage')).toHaveTextContent('1234');
        });
    });

    it('handles fetch errors gracefully', async () => {
        (global.fetch as jest.Mock).mockRej ectedValueOnce(new Error('Network error'));

        render(
            <QueryClientProvider client={queryClient}>
                <TestComponent />
            </QueryClientProvider>
        );

        // Should eventually stop loading even on error
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
    });
});
