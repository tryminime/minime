# Desktop Dashboard - API Integration Guide

## 🔌 Backend Integration Ready

All React Query hooks are set up and ready to connect to Tauri backend commands.

---

## 📋 Required Tauri Commands

The following commands need to be implemented in `src-tauri/src/main.rs`:

### Dashboard Summary
```rust
#[tauri::command]
async fn get_dashboard_summary() -> Result<DashboardSummary, String> {
    // Return: { activeTime, focusScore, entitiesExtracted, papersDone, trends }
}
```

### Activity Timeline
```rust
#[tauri::command]
async fn get_activity_timeline(period: String) -> Result<Vec<ActivityDay>, String> {
    // Return: Array of { date, deepWork, meetings, admin, learning, focusScore }
}
```

### Knowledge Graph
```rust
#[tauri::command]
async fn get_knowledge_graph() -> Result<GraphData, String> {
    // Return: { nodes: Array<Node>, edges: Array<Edge> }
}
```

### Projects
```rust
#[tauri::command]
async fn get_projects() -> Result<Vec<Project>, String> {
    // Return: Array of projects with tasks
}
```

### Today's Schedule
```rust
#[tauri::command]
async fn get_today_schedule() -> Result<Vec<TimeBlock>, String> {
    // Return: Array of time blocks
}
```

### Wellness Metrics
```rust
#[tauri::command]
async fn get_wellness_metrics() -> Result<WellnessData, String> {
    // Return: { overallScore, metrics, alerts }
}
```

### AI Insights
```rust
#[tauri::command]
async fn get_insights() -> Result<Vec<Insight>, String> {
    // Return: Array of AI-generated insights
}
```

### Papers
```rust
#[tauri::command]
async fn get_papers() -> Result<Vec<Paper>, String> {
    // Return: Array of papers/documents
}
```

### Actions
```rust
#[tauri::command]
async fn toggle_tracking() -> Result<TrackingStatus, String> {
    // Toggle activity tracking on/off
}

#[tauri::command]
async fn sync_now() -> Result<SyncStatus, String> {
    // Trigger immediate sync
}
```

---

## 🔄 Usage in Components

### Example: Using Dashboard Summary
```typescript
import { useDashboardSummary } from '@/lib/hooks/useApi'

function MyComponent() {
  const { data, isLoading, error } = useDashboardSummary()
  
  if (isLoading) return <LoadingSkeleton />
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <h1>Active Time: {data.activeTime}</h1>
      <h2>Focus Score: {data.focusScore}</h2>
    </div>
  )
}
```

### Example: Using Mutations
```typescript
import { useToggleTracking } from '@/lib/hooks/useApi'

function TrackingButton() {
  const toggleTracking = useToggleTracking()
  
  return (
    <button
      onClick={() => toggleTracking.mutate()}
      disabled={toggleTracking.isPending}
    >
      {toggleTracking.isPending ? 'Toggling...' : 'Toggle Tracking'}
    </button>
  )
}
```

---

## ✅ What's Ready

1. ✅ All React Query hooks created
2. ✅ Auto-refresh intervals configured
3. ✅ Cache invalidation on mutations
4. ✅ Loading states handled
5. ✅ Error boundaries in place
6. ✅ TypeScript types ready (need to define)

## 🔨 Next Steps

1. Implement Tauri commands in Rust
2. Define TypeScript interfaces for API responses
3. Replace mock data in components with hooks
4. Test error handling
5. Optimize cache strategies

---

## 📝 Type Definitions Needed

Create `src/types/api.types.ts`:

```typescript
export interface DashboardSummary {
  activeTime: number
  focusScore: number
  entitiesExtracted: number
  papersDone: number
  trends: {
    activeTime: number
    focusScore: number
    entities: number
    papers: number
  }
}

export interface ActivityDay {
  date: string
  deepWork: number
  meetings: number
  administrative: number
  learning: number
  focusScore: number
}

// ... more types
```
