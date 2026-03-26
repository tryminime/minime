'use client';

import { useState } from 'react';
import {
    Activity, Clock, Brain, MessageSquare, Video, Camera, Watch, BookOpen,
} from 'lucide-react';
import { ActivityTimeline } from '@/components/Dashboard/ActivityTimeline';
import { FocusSessions } from '@/components/Dashboard/FocusSessions';
import { SocialMediaTracker } from '@/components/Dashboard/SocialMediaTracker';
import { MeetingList } from '@/components/Dashboard/MeetingList';
import { ScreenshotGallery } from '@/components/Dashboard/ScreenshotGallery';
import { WearableStatus } from '@/components/Dashboard/WearableStatus';
import { ReadingTracker } from '@/components/Dashboard/ReadingTracker';

const TABS = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'focus', label: 'Focus', icon: Brain },
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'social', label: 'Social', icon: MessageSquare },
    { id: 'meetings', label: 'Meetings', icon: Video },
    { id: 'screenshots', label: 'Screenshots', icon: Camera },
    { id: 'wearables', label: 'Wearables', icon: Watch },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ActivitiesPage() {
    const [activeTab, setActiveTab] = useState<TabId>('timeline');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    Activity Capture
                </h1>
                <p className="text-gray-500 mt-1 ml-[52px]">
                    Track all your work activities, focus sessions, meetings, and more
                </p>
            </div>

            {/* Tab navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-1 -mb-px overflow-x-auto">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${isActive
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab content */}
            <div className="min-h-[400px]">
                {activeTab === 'timeline' && <ActivityTimeline />}
                {activeTab === 'focus' && <FocusSessions />}
                {activeTab === 'reading' && <ReadingTracker />}
                {activeTab === 'social' && <SocialMediaTracker />}
                {activeTab === 'meetings' && <MeetingList />}
                {activeTab === 'screenshots' && <ScreenshotGallery />}
                {activeTab === 'wearables' && <WearableStatus />}
            </div>
        </div>
    );
}
