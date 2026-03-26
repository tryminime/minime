import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ detail: 'Invalid email address.' }, { status: 400 });
        }

        // In production, add to email provider (e.g. Resend, Mailchimp, Loops)
        // For now, log to console and return success so the form works end-to-end
        console.log('[Waitlist] New signup:', email);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch {
        return NextResponse.json({ detail: 'Server error. Please try again.' }, { status: 500 });
    }
}
