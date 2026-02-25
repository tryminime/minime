import { useState } from 'react'
import KPICards from '../components/dashboard/KPICards'
import ActivityChart from '../components/dashboard/ActivityChart'
import ProjectCards from '../components/dashboard/ProjectCards'
import ScheduleTimeline from '../components/dashboard/ScheduleTimeline'
import KnowledgeGraph from '../components/dashboard/KnowledgeGraph'
import InsightsPanel from '../components/dashboard/InsightsPanel'
import WellnessPanel from '../components/dashboard/WellnessPanel'
import DocumentList from '../components/dashboard/DocumentList'

export default function Dashboard() {
    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold text-charcoal dark:text-white">Dashboard</h1>
                <p className="text-sm text-soft-gray mt-1">Your activity intelligence overview</p>
            </div>

            {/* Section 1: KPI Cards */}
            <KPICards />

            {/* Section 2: Activity Timeline */}
            <ActivityChart />

            {/* Section 3: Knowledge Graph */}
            <KnowledgeGraph />

            {/* Section 4: Active Projects */}
            <ProjectCards />

            {/* Two Column Layout: Schedule & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 5: Today's Schedule */}
                <ScheduleTimeline />

                {/* Section 6: Wellness Metrics */}
                <WellnessPanel />
            </div>

            {/* Section 7: AI Insights */}
            <InsightsPanel />

            {/* Section 8: Documents & Papers */}
            <DocumentList />
        </div>
    )
}
