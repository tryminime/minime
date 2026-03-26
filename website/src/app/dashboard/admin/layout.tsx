'use client';

import { ReactNode } from 'react';

/**
 * Override the parent dashboard layout for admin routes.
 * The admin page renders its own full-page layout with a custom sidebar,
 * so we don't want the standard dashboard shell wrapping it.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
