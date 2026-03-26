'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brain, CheckCircle, Mail, User, Briefcase } from 'lucide-react';

export default function WaitlistPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        role: '',
        useCase: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/waitlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to join waitlist');
            }

            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Something went wrong');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        You're on the list!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Thanks for joining the MiniMe beta waitlist. We'll send you an invite code soon to {formData.email}.
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        In the meantime, check your inbox for a confirmation email and follow us for updates.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="block w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            Back to Home
                        </Link>
                        <Link
                            href="/about"
                            className="block w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                            Learn More About MiniMe
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
            {/* Header */}
            <nav className="border-b bg-white/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <Brain className="h-8 w-8 text-indigo-600" />
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                                MiniMe
                            </span>
                        </Link>
                        <Link href="/" className="text-gray-600 hover:text-gray-900">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center space-x-2 bg-indigo-100 px-4 py-2 rounded-full mb-6">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                        </span>
                        <span className="text-sm font-medium text-indigo-700">Limited Beta Access</span>
                    </div>

                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        Join the Beta Waitlist
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Be among the first to experience MiniMe's AI-powered work intelligence platform.
                        We're accepting a limited number of beta users.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Form */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Early Access</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="John"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Work Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="john@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                                    Company
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        id="company"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Acme Inc."
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Select your role</option>
                                    <option value="Individual Contributor">Individual Contributor</option>
                                    <option value="Team Lead">Team Lead</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Executive">Executive</option>
                                    <option value="Founder">Founder</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-2">
                                    What's your primary use case?
                                </label>
                                <textarea
                                    id="useCase"
                                    name="useCase"
                                    value={formData.useCase}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., Track my productivity, manage team workload, etc."
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                            >
                                {status === 'loading' ? 'Joining...' : 'Join Beta Waitlist'}
                            </button>

                            <p className="text-sm text-gray-500 text-center">
                                By joining, you agree to our{' '}
                                <Link href="/legal/privacy" className="text-indigo-600 hover:text-indigo-700">
                                    Privacy Policy
                                </Link>{' '}
                                and{' '}
                                <Link href="/legal/terms" className="text-indigo-600 hover:text-indigo-700">
                                    Terms of Service
                                </Link>
                            </p>
                        </form>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h3 className="font-semibold text-gray-900 mb-4">What You'll Get</h3>
                            <ul className="space-y-3">
                                {[
                                    'Early access to all Pro features',
                                    'Priority support during beta',
                                    '50% off first 3 months after launch',
                                    'Direct input on feature development',
                                    'Beta community access',
                                ].map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                        <span className="text-gray-600">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-indigo-50 rounded-xl p-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Beta Timeline</h3>
                            <div className="space-y-4 mt-4">
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Join Waitlist</p>
                                        <p className="text-sm text-gray-600">Submit your information today</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Receive Invite</p>
                                        <p className="text-sm text-gray-600">We'll send you a beta invite code within 1-2 weeks</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Start Using MiniMe</p>
                                        <p className="text-sm text-gray-600">Begin tracking and gaining insights</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Limited Spots Available</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                We're limiting our beta to 1,000 users to ensure quality feedback and support.
                            </p>
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block text-purple-600">
                                            732 / 1000 spots filled
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-purple-600">
                                            73%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 text-xs flex rounded bg-purple-200">
                                    <div style={{ width: '73%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-16">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">When will I get access?</h4>
                            <p className="text-gray-600">
                                We're rolling out invites in batches. You should receive your invite code within 1-2 weeks of joining the waitlist.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Is the beta free?</h4>
                            <p className="text-gray-600">
                                Yes! Beta access is completely free, and you'll also get 50% off for 3 months after we launch.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">What platforms are supported?</h4>
                            <p className="text-gray-600">
                                Desktop (Windows, Mac, Linux), browser extensions (Chrome, Firefox, Edge), and mobile (iOS, Android coming soon).
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Is my data secure?</h4>
                            <p className="text-gray-600">
                                Absolutely. All data is end-to-end encrypted, and we're SOC2 compliant. You have full control over your data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
