import { redirect } from 'next/navigation';

// The canonical privacy page is /privacy
// This route preserves backwards-compatible links from external sites and old email templates
export default function LegalPrivacyRedirect() {
    redirect('/privacy');
}
