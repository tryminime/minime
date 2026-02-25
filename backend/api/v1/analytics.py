"""
Analytics API endpoints — REAL DATA from activities table.
Computes productivity, focus, and overview metrics from actual user activities.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date, timezone
from sqlalchemy import select, func, cast, String, case
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
import uuid as uuid_lib

from backend.database.postgres import get_db
from backend.models import Activity
from backend.auth.jwt_handler import decode_token, verify_token_type

logger = structlog.get_logger()
router = APIRouter()
security = HTTPBearer()


# =====================================================
# HELPERS
# =====================================================

def _get_user_id(credentials) -> str:
    """Extract user_id from JWT token."""
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or not verify_token_type(payload, "access"):
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


def _format_duration(seconds: float) -> str:
    """Format seconds into human-readable duration."""
    if seconds < 60:
        return f"{int(seconds)}s"
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def _time_ago(dt: datetime) -> str:
    """Convert datetime to relative time string."""
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return "just now"
    minutes = int(seconds / 60)
    if minutes < 60:
        return f"{minutes}m ago"
    hours = int(minutes / 60)
    if hours < 24:
        return f"{hours}h ago"
    days = int(hours / 24)
    return f"{days}d ago"


# =====================================================
# RESPONSE MODELS
# =====================================================

class DashboardOverview(BaseModel):
    total_activities: int = 0
    total_hours: float = 0.0
    focus_score: float = 0.0
    deep_work_hours: float = 0.0
    meetings_count: int = 0
    breaks_count: int = 0
    top_apps: List[Dict[str, Any]] = []
    recent_activities: List[Dict[str, Any]] = []
    activity_types: Dict[str, int] = {}


class ProductivityDaily(BaseModel):
    date: str = ""
    total_seconds: int = 0
    focus_score: float = 0.0
    productivity_score: float = 0.0
    deep_work_sessions: int = 0
    meeting_load_hours: float = 0.0
    context_switches: int = 0
    activity_count: int = 0


class ProductivityWeekly(BaseModel):
    week_start: str = ""
    week_end: str = ""
    avg_focus_score: float = 0.0
    avg_productivity_score: float = 0.0
    total_deep_work_hours: float = 0.0
    total_meeting_hours: float = 0.0
    total_activities: int = 0
    daily_metrics: List[ProductivityDaily] = []


class ProductivityMetrics(BaseModel):
    total_hours: float = 0.0
    productive_hours: float = 0.0
    productivity_ratio: float = 0.0
    deep_work_hours: float = 0.0
    context_switches: int = 0
    focus_score: float = 0.0
    top_apps: List[Dict[str, Any]] = []
    time_allocation: Dict[str, Any] = {}
    comparison: Dict[str, Any] = {}


class CollaborationMetrics(BaseModel):
    collaboration_score: float = 0.0
    unique_collaborators: int = 0
    meetings_count: int = 0
    communication_volume: int = 0
    network_size: int = 0
    top_collaborators: List[Dict[str, Any]] = []
    network_diversity: Dict[str, Any] = {}
    meeting_patterns: Dict[str, Any] = {}


class SkillItem(BaseModel):
    name: str
    category: str
    mastery: float = 0.0
    time_invested_hours: float = 0.0
    last_used: str = ""
    growth_rate: float = 0.0


class SkillRecommendation(BaseModel):
    name: str
    reason: str
    estimated_time_hours: float = 10.0
    difficulty: str = "intermediate"


class SkillGrowthEntry(BaseModel):
    date: str
    skill_name: str
    mastery: float


class SkillMetrics(BaseModel):
    total_skills: int = 0
    advanced_skills: int = 0
    skill_diversity: float = 0.0
    learning_velocity: float = 0.0
    top_skills: List[SkillItem] = []
    recommended_skills: List[SkillRecommendation] = []
    growth_history: List[SkillGrowthEntry] = []


class CareerInsights(BaseModel):
    growth_trajectory: str = ""
    career_phase: str = ""
    skill_gaps: List[Any] = []
    recommended_next_steps: List[str] = []
    best_fit_role: Dict[str, Any] = {}
    milestone: Dict[str, Any] = {}


class WellnessMetrics(BaseModel):
    overall_score: float = 0.0
    work_life_balance: Dict[str, Any] = {}
    burnout_risk: Dict[str, Any] = {}
    rest_recovery: Dict[str, Any] = {}
    energy_levels: Dict[str, Any] = {}


class Goal(BaseModel):
    id: str
    title: str
    category: str  # focus | productivity | learning | wellness | custom
    target_value: float
    current_value: float = 0.0
    unit: str  # hours | sessions | points | %
    deadline: Optional[str] = None
    status: str = "active"  # active | completed | paused
    streak_count: int = 0
    created_at: str = ""


class GoalCreate(BaseModel):
    title: str
    category: str
    target_value: float
    unit: str
    deadline: Optional[str] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    status: Optional[str] = None


# In-memory goals store: {user_id: {goal_id: Goal}}
_goals_store: Dict[str, Dict[str, Goal]] = {}



class SummaryStats(BaseModel):
    total_activities: int = 0
    focus_score: float = 0.0
    productivity_score: float = 0.0
    collaboration_index: float = 0.0
    top_skills: List[str] = []
    key_achievements: List[str] = []


class WeeklySummary(BaseModel):
    week_start: str = ""
    week_end: str = ""
    html_content: str = ""
    summary_stats: SummaryStats = SummaryStats()


# =====================================================
# REAL DATA COMPUTATION
# =====================================================

async def _compute_daily_metrics(
    db: AsyncSession, user_id: str, target_date: date
) -> ProductivityDaily:
    """Compute real productivity metrics for a given date from activities table."""
    start_dt = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_dt = start_dt + timedelta(days=1)

    result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= start_dt,
            Activity.occurred_at < end_dt,
        )
    )
    activities = result.scalars().all()

    if not activities:
        return ProductivityDaily(date=target_date.isoformat())

    total_count = len(activities)
    total_seconds = sum(a.duration_seconds or 0 for a in activities)

    # Deep work: window_focus or app_focus sessions >= 25 minutes
    deep_work_activities = [
        a for a in activities
        if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 1500
    ]
    deep_work_sessions = len(deep_work_activities)
    deep_work_seconds = sum(a.duration_seconds or 0 for a in deep_work_activities)

    # Focus score: ratio of focused time (>= 10 min sessions) to total
    focused_activities = [
        a for a in activities
        if a.type in ("window_focus", "app_focus", "page_view") and (a.duration_seconds or 0) >= 600
    ]
    focused_seconds = sum(a.duration_seconds or 0 for a in focused_activities)
    focus_score = min(100.0, (focused_seconds / max(total_seconds, 1)) * 100)

    # Productivity score: productive types / total
    productive_types = {"window_focus", "app_focus", "page_view"}
    productive_seconds = sum(
        a.duration_seconds or 0 for a in activities if a.type in productive_types
    )
    productivity_score = min(100.0, (productive_seconds / max(total_seconds, 1)) * 100)

    # Meeting load
    meeting_activities = [a for a in activities if a.type == "meeting"]
    meeting_hours = sum(a.duration_seconds or 0 for a in meeting_activities) / 3600.0

    # Context switches: count of distinct app changes (unique apps - 1)
    apps = [a.app for a in activities if a.app]
    unique_apps = set(apps)
    context_switches = max(0, len(apps) - 1)  # Each transition is a switch

    return ProductivityDaily(
        date=target_date.isoformat(),
        total_seconds=total_seconds,
        focus_score=round(focus_score, 1),
        productivity_score=round(productivity_score, 1),
        deep_work_sessions=deep_work_sessions,
        meeting_load_hours=round(meeting_hours, 1),
        context_switches=context_switches,
        activity_count=total_count,
    )


# =====================================================
# ENDPOINTS
# =====================================================

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Real dashboard overview computed from activities in the database.
    """
    user_id = _get_user_id(credentials)

    # Get all activities for this user (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= thirty_days_ago,
        ).order_by(Activity.occurred_at.desc()).limit(200)
    )
    activities = result.scalars().all()

    if not activities:
        return DashboardOverview()

    # Total hours
    total_seconds = sum(a.duration_seconds or 0 for a in activities)
    total_hours = total_seconds / 3600.0

    # Focus score
    focused = [a for a in activities if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 600]
    focused_seconds = sum(a.duration_seconds or 0 for a in focused)
    focus_score = min(100.0, (focused_seconds / max(total_seconds, 1)) * 100)

    # Deep work hours (sessions >= 25 min)
    deep_work = [a for a in activities if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 1500]
    deep_work_hours = sum(a.duration_seconds or 0 for a in deep_work) / 3600.0

    # Meetings
    meetings = [a for a in activities if a.type == "meeting"]
    meetings_count = len(meetings)

    # Breaks
    breaks = [a for a in activities if a.type == "break"]
    breaks_count = len(breaks)

    # Top apps
    app_time: Dict[str, float] = {}
    for a in activities:
        if a.app:
            app_time[a.app] = app_time.get(a.app, 0) + (a.duration_seconds or 0)
    top_apps = sorted(
        [{"app": k, "hours": round(v / 3600.0, 1), "duration": _format_duration(v)} for k, v in app_time.items()],
        key=lambda x: x["hours"],
        reverse=True,
    )[:5]

    # Recent activities
    recent = []
    for a in activities[:10]:
        title = a.title or a.app or a.type
        recent.append({
            "type": a.type,
            "title": title,
            "app": a.app or "",
            "duration": _format_duration(a.duration_seconds or 0),
            "duration_seconds": a.duration_seconds or 0,
            "time_ago": _time_ago(a.occurred_at) if a.occurred_at else "",
            "occurred_at": a.occurred_at.isoformat() if a.occurred_at else "",
            "domain": a.domain or "",
        })

    # Activity types distribution
    type_counts: Dict[str, int] = {}
    for a in activities:
        type_counts[a.type] = type_counts.get(a.type, 0) + 1

    return DashboardOverview(
        total_activities=len(activities),
        total_hours=round(total_hours, 1),
        focus_score=round(focus_score, 1),
        deep_work_hours=round(deep_work_hours, 1),
        meetings_count=meetings_count,
        breaks_count=breaks_count,
        top_apps=top_apps,
        recent_activities=recent,
        activity_types=type_counts,
    )


@router.get("/productivity/daily", response_model=ProductivityDaily)
async def get_productivity_daily(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
):
    """
    Real daily productivity metrics computed from activity data.
    """
    user_id = _get_user_id(credentials)
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        target_date = datetime.now(timezone.utc).date()

    return await _compute_daily_metrics(db, user_id, target_date)


@router.get("/productivity/daily-range")
async def get_productivity_daily_range(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, description="Number of days to return"),
):
    """Return daily metrics for a range of days (for heatmap)."""
    user_id = _get_user_id(credentials)
    today = datetime.now(timezone.utc).date()
    metrics = []
    for i in range(days):
        day = today - timedelta(days=days - 1 - i)
        m = await _compute_daily_metrics(db, user_id, day)
        metrics.append(m)
    return {"metrics": metrics}


@router.get("/productivity/weekly", response_model=ProductivityWeekly)
async def get_productivity_weekly(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Real weekly productivity metrics — aggregates 7 days of daily metrics.
    """
    user_id = _get_user_id(credentials)
    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=today.weekday())  # Monday
    week_end = week_start + timedelta(days=6)

    daily_metrics = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        if day <= today:
            m = await _compute_daily_metrics(db, user_id, day)
            daily_metrics.append(m)

    # Aggregate
    days_with_data = [m for m in daily_metrics if m.activity_count > 0]
    count = len(days_with_data) or 1

    avg_focus = sum(m.focus_score for m in days_with_data) / count if days_with_data else 0
    avg_prod = sum(m.productivity_score for m in days_with_data) / count if days_with_data else 0
    total_deep = sum(m.deep_work_sessions * 0.75 for m in daily_metrics)  # ~45min per session
    total_meet = sum(m.meeting_load_hours for m in daily_metrics)
    total_acts = sum(m.activity_count for m in daily_metrics)

    return ProductivityWeekly(
        week_start=week_start.isoformat(),
        week_end=week_end.isoformat(),
        avg_focus_score=round(avg_focus, 1),
        avg_productivity_score=round(avg_prod, 1),
        total_deep_work_hours=round(total_deep, 1),
        total_meeting_hours=round(total_meet, 1),
        total_activities=total_acts,
        daily_metrics=daily_metrics,
    )


@router.get("/productivity", response_model=ProductivityMetrics)
async def get_productivity_metrics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """Real productivity metrics from activity data."""
    user_id = _get_user_id(credentials)

    # Default to last 7 days
    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - timedelta(days=7)

    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
        except ValueError:
            pass

    result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= start_dt,
            Activity.occurred_at < end_dt,
        )
    )
    activities = result.scalars().all()

    if not activities:
        return ProductivityMetrics()

    total_seconds = sum(a.duration_seconds or 0 for a in activities)
    total_hours = total_seconds / 3600.0

    productive_types = {"window_focus", "app_focus", "page_view"}
    productive_seconds = sum(a.duration_seconds or 0 for a in activities if a.type in productive_types)
    productive_hours = productive_seconds / 3600.0

    deep_work = [a for a in activities if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 1500]
    deep_work_hours = sum(a.duration_seconds or 0 for a in deep_work) / 3600.0

    focused = [a for a in activities if a.type in productive_types and (a.duration_seconds or 0) >= 600]
    focused_seconds = sum(a.duration_seconds or 0 for a in focused)
    focus_score = min(100.0, (focused_seconds / max(total_seconds, 1)) * 100)

    apps = [a.app for a in activities if a.app]
    context_switches = max(0, len(apps) - 1)

    # Top apps
    app_time: Dict[str, float] = {}
    for a in activities:
        if a.app:
            app_time[a.app] = app_time.get(a.app, 0) + (a.duration_seconds or 0)
    top_apps = sorted(
        [{"app": k, "hours": round(v / 3600, 2)} for k, v in app_time.items()],
        key=lambda x: x["hours"], reverse=True,
    )[:10]

    # Time allocation by type
    type_time: Dict[str, float] = {}
    for a in activities:
        type_time[a.type] = type_time.get(a.type, 0) + (a.duration_seconds or 0)
    time_allocation = {k: round(v / 3600, 2) for k, v in type_time.items()}

    # --- Week-over-week comparison (previous 7-day window) ---
    prev_start_dt = start_dt - timedelta(days=7)
    prev_end_dt = start_dt
    prev_result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= prev_start_dt,
            Activity.occurred_at < prev_end_dt,
        )
    )
    prev_activities = prev_result.scalars().all()

    comparison: Dict[str, float] = {}
    if prev_activities:
        prev_total_s = sum(a.duration_seconds or 0 for a in prev_activities)
        prev_total_h = prev_total_s / 3600

        prev_deep = [a for a in prev_activities if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 1500]
        prev_deep_h = sum(a.duration_seconds or 0 for a in prev_deep) / 3600

        prev_focused = [a for a in prev_activities if a.type in productive_types and (a.duration_seconds or 0) >= 600]
        prev_focused_s = sum(a.duration_seconds or 0 for a in prev_focused)
        prev_focus_score = min(100.0, (prev_focused_s / max(prev_total_s, 1)) * 100)

        prev_apps = [a.app for a in prev_activities if a.app]
        prev_ctx_switches = max(0, len(prev_apps) - 1)

        comparison = {
            "total_hours": round(total_hours - prev_total_h, 1),
            "deep_work_hours": round(deep_work_hours - prev_deep_h, 1),
            "focus_score": round(focus_score - prev_focus_score, 1),
            "context_switches": context_switches - prev_ctx_switches,
        }

    return ProductivityMetrics(
        total_hours=round(total_hours, 1),
        productive_hours=round(productive_hours, 1),
        productivity_ratio=round(productive_hours / max(total_hours, 0.01), 2),
        deep_work_hours=round(deep_work_hours, 1),
        context_switches=context_switches,
        focus_score=round(focus_score, 1),
        top_apps=top_apps,
        time_allocation=time_allocation,
        comparison=comparison,
    )


@router.get("/collaboration", response_model=CollaborationMetrics)
async def get_collaboration_metrics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """Collaboration metrics from meeting/communication activities."""
    user_id = _get_user_id(credentials)

    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - timedelta(days=7)

    result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= start_dt,
            Activity.occurred_at < end_dt,
        )
    )
    activities = result.scalars().all()

    meetings = [a for a in activities if a.type == "meeting"]
    # Widen the communication signal: include Chrome/Firefox on communication domains,
    # Slack, Teams, Discord, Zoom, Google Meet, and any app that contains comm keywords
    comm_apps = {"Slack", "Teams", "Discord", "Zoom", "Google Meet", "Google Chat", "Outlook", "Mail"}
    comm_domains = {"slack.com", "teams.microsoft.com", "discord.com", "zoom.us", "meet.google.com",
                    "gmail.com", "mail.google.com", "outlook.com", "calendar.google.com"}
    communication = [
        a for a in activities
        if a.app in comm_apps
        or (a.domain and any(d in (a.domain or "") for d in comm_domains))
        or a.type == "meeting"
        or (a.app and any(kw in (a.app or "").lower() for kw in ["slack", "teams", "discord", "zoom", "meet", "mail"]))
    ]

    # Build top_collaborators from named persons in activity data
    collab_counts: Dict[str, int] = {}
    for a in meetings:
        meta = a.data or {}
        participants = meta.get("participants", [])
        for p in participants:
            name = p if isinstance(p, str) else p.get("name", "")
            if name:
                collab_counts[name] = collab_counts.get(name, 0) + 1
        organizer = meta.get("organizer", "")
        if organizer and organizer not in collab_counts:
            collab_counts[organizer] = collab_counts.get(organizer, 0) + 1

    top_collaborators = [
        {"name": name, "interaction_count": count, "email": None}
        for name, count in sorted(collab_counts.items(), key=lambda x: -x[1])[:10]
    ]

    # Score: communication volume drives the index — even 1 comm event = non-zero score
    total_collab = len(meetings) + len(communication)
    collab_score = min(100.0, max(10.0, total_collab * 4.0)) if total_collab > 0 else 0.0
    net_size = max(len(collab_counts), len(set(a.app for a in communication if a.app)), len(meetings))


    return CollaborationMetrics(
        collaboration_score=round(collab_score, 1),
        meetings_count=len(meetings),
        communication_volume=len(communication),
        unique_collaborators=max(len(collab_counts), len(meetings), net_size),
        network_size=max(net_size, len(collab_counts)),
        top_collaborators=top_collaborators,
        network_diversity={"apps": len(set(a.app for a in communication if a.app))},
        meeting_patterns={"total_hours": round(sum(a.duration_seconds or 0 for a in meetings) / 3600, 1)},
    )


@router.get("/skills", response_model=SkillMetrics)
async def get_skill_metrics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Skill metrics derived from app usage patterns."""
    user_id = _get_user_id(credentials)

    result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
        ).limit(500)
    )
    activities = result.scalars().all()

    # Derive skills from app usage
    app_time: Dict[str, float] = {}
    app_last_used: Dict[str, str] = {}
    for a in activities:
        if a.app:
            app_time[a.app] = app_time.get(a.app, 0) + (a.duration_seconds or 0)
            ts = a.occurred_at.isoformat() if a.occurred_at else ""
            if ts > app_last_used.get(a.app, ""):
                app_last_used[a.app] = ts

    skill_map = {
        "VS Code": ("Programming", "Development"),
        "Terminal": ("DevOps", "Development"),
        "Chrome": ("Research", "Knowledge"),
        "Figma": ("Design", "Creative"),
        "Slack": ("Communication", "Collaboration"),
        "Notion": ("Documentation", "Knowledge"),
        "Zoom": ("Meetings", "Collaboration"),
        "Google Meet": ("Meetings", "Collaboration"),
    }

    skill_usage: Dict[str, Dict] = {}
    categories = set()
    for app, seconds in app_time.items():
        skill_name, category = skill_map.get(app, (app, "Other"))
        categories.add(category)
        hours = seconds / 3600.0
        if skill_name not in skill_usage:
            skill_usage[skill_name] = {
                "hours": 0, "category": category,
                "last_used": app_last_used.get(app, ""),
            }
        skill_usage[skill_name]["hours"] += hours
        if app_last_used.get(app, "") > skill_usage[skill_name]["last_used"]:
            skill_usage[skill_name]["last_used"] = app_last_used.get(app, "")

    # Build top skills with mastery score based on hours
    total_hours = sum(s["hours"] for s in skill_usage.values()) or 1
    top_skills = []
    for name, info in sorted(skill_usage.items(), key=lambda x: -x[1]["hours"]):
        mastery = min(100, (info["hours"] / total_hours) * 100 * 2)  # Scale up
        top_skills.append(SkillItem(
            name=name,
            category=info["category"],
            mastery=round(mastery, 1),
            time_invested_hours=round(info["hours"], 1),
            last_used=info["last_used"],
            growth_rate=round(info["hours"] / 7, 1),  # hours per day as proxy
        ))

    advanced = sum(1 for s in top_skills if s.mastery > 70)
    diversity = min(100.0, (len(categories) / max(len(skill_usage), 1)) * 100)
    velocity = len(skill_usage) / 4.0  # skills per month approximation

    # Recommendations: only suggest if user actually has data
    recommendations = []
    if activities:  # Only recommend when there's real data
        existing_categories = categories
        rec_map = {
            "Testing": ("Quality Assurance", "Add testing skills to improve code quality"),
            "Data Analysis": ("Analytics", "Learn data skills to derive insights"),
            "Cloud Infrastructure": ("DevOps", "Scale your deployment knowledge"),
        }
        recommendations = [
            SkillRecommendation(name=name, reason=reason, estimated_time_hours=15.0, difficulty="intermediate")
            for name, (cat, reason) in rec_map.items()
            if cat not in existing_categories  # Only recommend skills user doesn't already have
        ][:3]

    # Growth history: real per-day activity counts for top skills
    today = datetime.now(timezone.utc).date()
    growth_history = []
    for skill in top_skills[:3]:
        # Get day-by-day activity count for apps mapped to this skill (last 14 days)
        inv_skill_map = {v[0]: k for k, v in skill_map.items()}
        app_name = inv_skill_map.get(skill.name, skill.name)
        for d in range(13, -1, -1):
            day = today - timedelta(days=d)
            day_start = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            day_acts = [
                a for a in activities
                if a.app == app_name
                and a.occurred_at
                and day_start <= a.occurred_at < day_end
            ]
            day_hours = sum(a.duration_seconds or 0 for a in day_acts) / 3600
            # Mastery on this day = proportion of total skill hours earned by this day
            day_mastery = min(100, (day_hours / max(skill.time_invested_hours, 0.01)) * skill.mastery * 2)
            growth_history.append(SkillGrowthEntry(
                date=day.isoformat(),
                skill_name=skill.name,
                mastery=round(day_mastery, 1),
            ))

    return SkillMetrics(
        total_skills=len(skill_usage),
        advanced_skills=advanced,
        skill_diversity=round(diversity, 1),
        learning_velocity=round(velocity, 1),
        top_skills=top_skills,
        recommended_skills=recommendations,
        growth_history=growth_history,
    )


@router.get("/career", response_model=CareerInsights)
async def get_career_insights(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Career insights computed from real activity patterns."""
    user_id = _get_user_id(credentials)

    now = datetime.now(timezone.utc)
    # Current week activities (last 7 days)
    curr_start = now - timedelta(days=7)
    # Previous week activities (7-14 days ago)
    prev_start = now - timedelta(days=14)

    curr_result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= curr_start,
        )
    )
    curr_acts = curr_result.scalars().all()

    prev_result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= prev_start,
            Activity.occurred_at < curr_start,
        )
    )
    prev_acts = prev_result.scalars().all()

    # --- Career phase from activity volume + diversity ---
    curr_hours = sum(a.duration_seconds or 0 for a in curr_acts) / 3600
    deep_work = [a for a in curr_acts if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 1500]
    deep_hours = sum(a.duration_seconds or 0 for a in deep_work) / 3600
    unique_apps = len({a.app for a in curr_acts if a.app})
    meetings = [a for a in curr_acts if a.type == "meeting"]

    if unique_apps >= 8 and deep_hours >= 20:
        career_phase = "senior"
    elif unique_apps >= 6 and deep_hours >= 10:
        career_phase = "growth"
    elif len(meetings) >= 5 and deep_hours < 5:
        career_phase = "lead"
    elif curr_hours < 5:
        career_phase = "exploring"
    else:
        career_phase = "growth"

    # --- Growth trajectory from week-over-week activity delta ---
    curr_total = sum(a.duration_seconds or 0 for a in curr_acts)
    prev_total = sum(a.duration_seconds or 0 for a in prev_acts)
    if prev_total == 0:
        growth_trajectory = "steady"
    else:
        delta_pct = (curr_total - prev_total) / prev_total
        if delta_pct >= 0.15:
            growth_trajectory = "accelerating"
        elif delta_pct <= -0.15:
            growth_trajectory = "declining"
        elif -0.05 <= delta_pct <= 0.05:
            growth_trajectory = "steady"
        else:
            growth_trajectory = "plateau"

    # --- Skill gaps: apps used < 1h/week get flagged as weak ---
    app_time: Dict[str, float] = {}
    for a in curr_acts:
        if a.app:
            app_time[a.app] = app_time.get(a.app, 0) + (a.duration_seconds or 0) / 3600

    skill_map_short = {
        "VS Code": "Programming", "Terminal": "DevOps", "Chrome": "Research",
        "Figma": "Design", "Slack": "Communication", "Notion": "Documentation",
        "Zoom": "Meetings", "Google Meet": "Meetings",
    }
    skill_hours = {skill_map_short.get(app, app): hrs for app, hrs in app_time.items()}
    skill_gaps = [name for name, hrs in sorted(skill_hours.items(), key=lambda x: x[1]) if hrs < 1.0][:3]

    # --- Recommended next steps based on actual low-usage areas ---
    step_map = {
        "Research": "Spend 30 min/day reading docs or articles in your domain",
        "Documentation": "Write a short README or decision log for your current project",
        "Communication": "Schedule a sync with a collaborator you haven't spoken to this week",
        "Design": "Review UI patterns for 20 min to improve product intuition",
        "DevOps": "Automate one manual step in your dev workflow this week",
        "Testing": "Add tests for the last feature you shipped",
        "Meetings": "Block focus time to counterbalance your meeting load",
        "Programming": "Pick one algorithmic problem to solve this week for sharpness",
    }
    # Prioritise steps for weakest skills first, then add generic growth steps
    recommended = [step_map[g] for g in skill_gaps if g in step_map]
    if career_phase == "growth" and len(recommended) < 3:
        recommended.append("Deepen one core skill to advanced mastery (>70%) this month")
    if growth_trajectory in ("plateau", "declining") and len(recommended) < 4:
        recommended.append("Review your weekly time allocation and cut low-value activities")
    if len(recommended) < 2:
        recommended.append("Track your work daily — more data means better insights")

    return CareerInsights(
        growth_trajectory=growth_trajectory if curr_acts else "",
        career_phase=career_phase if curr_acts else "",
        skill_gaps=skill_gaps if curr_acts else [],
        recommended_next_steps=recommended[:4] if curr_acts else [],
    )


@router.get("/wellness", response_model=WellnessMetrics)
async def get_wellness_metrics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Wellness metrics computed from work patterns, session balance, and variety."""
    user_id = _get_user_id(credentials)

    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - timedelta(days=7)

    result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= start_dt,
        )
    )
    activities = result.scalars().all()

    # No activities = return zero state
    if not activities:
        return WellnessMetrics(
            overall_score=0,
            work_life_balance={},
            burnout_risk={"level": "unknown", "long_sessions": 0},
            rest_recovery={"break_count": 0, "total_break_minutes": 0},
        )

    total_seconds = sum(a.duration_seconds or 0 for a in activities)
    total_hours = total_seconds / 3600.0
    breaks = [a for a in activities if a.type in ("break", "idle")]
    break_seconds = sum(a.duration_seconds or 0 for a in breaks)

    # Compute wellness from multiple signals:
    # 1) Session balance: penalize very long sessions (>2h), reward moderate ones
    long_sessions = [a for a in activities if (a.duration_seconds or 0) > 7200]
    moderate_sessions = [a for a in activities if 600 <= (a.duration_seconds or 0) <= 5400]  # 10min-90min
    session_balance = min(100, (len(moderate_sessions) / max(len(activities), 1)) * 120)

    # 2) Variety score: how many different apps/types used
    unique_apps = len(set(a.app for a in activities if a.app))
    unique_types = len(set(a.type for a in activities))
    variety_score = min(100, (unique_apps + unique_types) * 10)

    # 3) Hours balance: 4-8h/day is ideal, penalize >10h/day
    days_active = max(1, len(set(
        a.occurred_at.date() for a in activities if a.occurred_at
    )))
    avg_daily_hours = total_hours / days_active
    hours_score = 100 if 4 <= avg_daily_hours <= 8 else max(0, 100 - abs(avg_daily_hours - 6) * 15)

    # 4) Break ratio (if any breaks exist)
    break_ratio = break_seconds / max(total_seconds, 1)
    break_score = min(100, break_ratio * 500) if breaks else max(40, hours_score * 0.6)

    # Overall: weighted average
    overall = (session_balance * 0.3 + variety_score * 0.2 + hours_score * 0.3 + break_score * 0.2)
    overall = min(100, max(0, overall))

    balance_combined = (hours_score * 0.5 + session_balance * 0.3 + break_score * 0.2)
    burnout_level = "low" if len(long_sessions) < 3 else "medium" if len(long_sessions) < 6 else "high"

    # Rest: count natural gaps between sessions as implicit breaks
    implicit_breaks = 0
    implicit_break_minutes = 0
    if len(breaks) == 0 and len(activities) > 1:
        sorted_acts = sorted([a for a in activities if a.occurred_at], key=lambda a: a.occurred_at)
        for i in range(1, len(sorted_acts)):
            gap_sec = (sorted_acts[i].occurred_at - sorted_acts[i-1].occurred_at).total_seconds() - (sorted_acts[i-1].duration_seconds or 0)
            if 120 <= gap_sec <= 3600:  # 2min - 1h gaps count as breaks
                implicit_breaks += 1
                implicit_break_minutes += gap_sec / 60

    total_breaks = len(breaks) + implicit_breaks
    total_break_min = (break_seconds / 60) + implicit_break_minutes

    return WellnessMetrics(
        overall_score=round(overall, 1),
        work_life_balance={"score": round(balance_combined, 1), "break_ratio": round(break_ratio + (implicit_break_minutes * 60 / max(total_seconds, 1)), 2)},
        burnout_risk={"level": burnout_level, "long_sessions": len(long_sessions)},
        rest_recovery={"break_count": total_breaks, "total_break_minutes": round(total_break_min, 1)},
    )


@router.get("/summary/weekly", response_model=WeeklySummary)
async def get_weekly_summary(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
    week_offset: int = Query(0, ge=0, le=52, description="Weeks ago (0=current week)"),
):
    """Real weekly summary with html_content and summary_stats."""
    user_id = _get_user_id(credentials)

    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=today.weekday() + (week_offset * 7))
    week_end = week_start + timedelta(days=6)

    start_dt = datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_dt = datetime.combine(week_end + timedelta(days=1), datetime.min.time()).replace(tzinfo=timezone.utc)

    result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= start_dt,
            Activity.occurred_at < end_dt,
        ).order_by(Activity.occurred_at.desc())
    )
    activities = result.scalars().all()

    total_seconds = sum(a.duration_seconds or 0 for a in activities)
    total_hours = total_seconds / 3600.0

    # Top activities by time
    app_time: Dict[str, float] = {}
    for a in activities:
        key = a.app or a.type
        app_time[key] = app_time.get(key, 0) + (a.duration_seconds or 0)
    top_activities = sorted(
        [{"name": k, "hours": round(v / 3600, 1)} for k, v in app_time.items()],
        key=lambda x: x["hours"], reverse=True,
    )[:5]

    # Focus score
    focused = [a for a in activities if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 600]
    focused_seconds = sum(a.duration_seconds or 0 for a in focused)
    focus_score = min(100.0, (focused_seconds / max(total_seconds, 1)) * 100)

    # Productivity score
    productive_types = {"window_focus", "app_focus", "page_view"}
    productive_seconds = sum(a.duration_seconds or 0 for a in activities if a.type in productive_types)
    productivity_score = min(100.0, (productive_seconds / max(total_seconds, 1)) * 100)

    # Collaboration index
    meetings = [a for a in activities if a.type == "meeting"]
    comm_apps = {"Slack", "Teams", "Discord", "Zoom", "Google Meet"}
    communication = [a for a in activities if a.app in comm_apps]
    collaboration_index = min(10.0, (len(meetings) + len(communication)) / max(len(activities) * 0.1, 1))

    # Top skills (from apps)
    skill_map = {"VS Code": "Programming", "Terminal": "DevOps", "Chrome": "Research",
                 "Figma": "Design", "Slack": "Communication", "Notion": "Documentation"}
    top_skills_set = set()
    for a in top_activities[:5]:
        top_skills_set.add(skill_map.get(a["name"], a["name"]))
    top_skills = list(top_skills_set)[:5]

    # Key achievements
    key_achievements = []
    if activities:
        key_achievements.append(f"Tracked {len(activities)} activities")
        deep_work = [a for a in activities if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 1500]
        if deep_work:
            dw_hours = sum(a.duration_seconds or 0 for a in deep_work) / 3600
            key_achievements.append(f"Completed {len(deep_work)} deep work sessions ({dw_hours:.1f}h)")
        if meetings:
            key_achievements.append(f"Attended {len(meetings)} meetings")
        if top_activities:
            key_achievements.append(f"Most productive app: {top_activities[0]['name']} ({top_activities[0]['hours']}h)")

    # Generate HTML content
    html_parts = []
    html_parts.append(f"<h2>Week of {week_start.strftime('%B %d')} - {week_end.strftime('%B %d, %Y')}</h2>")
    html_parts.append(f"<p>You tracked <strong>{len(activities)} activities</strong> totaling <strong>{_format_duration(total_seconds)}</strong> this week.</p>")

    if top_activities:
        html_parts.append("<h3>🏆 Top Activities</h3><ul>")
        for ta in top_activities:
            html_parts.append(f"<li><strong>{ta['name']}</strong>: {ta['hours']}h</li>")
        html_parts.append("</ul>")

    html_parts.append(f"<h3>📊 Performance</h3>")
    html_parts.append(f"<p>Your focus score was <strong>{focus_score:.0f}</strong> and productivity score was <strong>{productivity_score:.0f}</strong>.</p>")

    if key_achievements:
        html_parts.append("<h3>✅ Achievements</h3><ul>")
        for ach in key_achievements:
            html_parts.append(f"<li>{ach}</li>")
        html_parts.append("</ul>")

    html_parts.append("<h3>💡 Suggestions</h3><ul>")
    html_parts.append("<li>Schedule focused blocks for your most productive apps</li>")
    html_parts.append("<li>Take regular breaks to maintain high performance</li>")
    html_parts.append("<li>Try to minimize context switches during deep work</li>")
    html_parts.append("</ul>")

    html_content = "\n".join(html_parts)

    return WeeklySummary(
        week_start=week_start.isoformat(),
        week_end=week_end.isoformat(),
        html_content=html_content,
        summary_stats=SummaryStats(
            total_activities=len(activities),
            focus_score=round(focus_score, 1),
            productivity_score=round(productivity_score, 1),
            collaboration_index=round(collaboration_index, 1),
            top_skills=top_skills,
            key_achievements=key_achievements,
        ),
    )


@router.get("/export")
async def export_analytics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
    format: str = Query("json", pattern="^(json|csv)$"),
):
    """Export real analytics data."""
    user_id = _get_user_id(credentials)

    result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
        ).order_by(Activity.occurred_at.desc()).limit(1000)
    )
    activities = result.scalars().all()

    data = [
        {
            "id": str(a.id),
            "type": a.type,
            "app": a.app or "",
            "title": a.title or "",
            "domain": a.domain or "",
            "duration_seconds": a.duration_seconds or 0,
            "occurred_at": a.occurred_at.isoformat() if a.occurred_at else "",
        }
        for a in activities
    ]

    return {"activities": data, "total": len(data), "format": format}


# =====================================================
# GOALS ENDPOINTS — persisted to PostgreSQL
# =====================================================

def _goal_to_pydantic(g, deep_work_hours: float = 0, meeting_hours: float = 0) -> Goal:
    """Convert a UserGoal DB row to the Goal Pydantic model, auto-computing progress."""
    current = g.current_value
    status = g.status

    if g.category == "focus" and g.unit == "hours":
        current = round(deep_work_hours, 1)
        if current >= g.target_value and status == "active":
            status = "completed"
    elif g.category == "productivity" and "meeting" in g.title.lower() and g.unit == "hours":
        current = round(meeting_hours, 1)
        if meeting_hours <= g.target_value and status == "active":
            current = g.target_value
            status = "completed"

    return Goal(
        id=str(g.id),
        title=g.title,
        category=g.category,
        target_value=g.target_value,
        current_value=current,
        unit=g.unit,
        deadline=g.deadline.isoformat() if g.deadline else None,
        status=status,
        streak_count=g.streak_count,
        created_at=g.created_at.isoformat() if g.created_at else "",
    )


@router.get("/goals", response_model=List[Goal])
async def list_goals(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """List all goals for the current user with auto-computed progress."""
    from backend.models import UserGoal

    user_id = _get_user_id(credentials)

    result = await db.execute(
        select(UserGoal).where(UserGoal.user_id == uuid_lib.UUID(user_id))
        .order_by(UserGoal.created_at.desc())
    )
    user_goals = result.scalars().all()

    if not user_goals:
        return []

    # Auto-compute progress from recent activities
    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - timedelta(days=7)
    acts_result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
            Activity.occurred_at >= start_dt,
        )
    )
    activities = acts_result.scalars().all()
    deep_work_hours = sum(
        (a.duration_seconds or 0) / 3600
        for a in activities
        if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 1500
    )
    meeting_hours = sum(
        (a.duration_seconds or 0) / 3600
        for a in activities if a.type == "meeting"
    )

    return [_goal_to_pydantic(g, deep_work_hours, meeting_hours) for g in user_goals]


@router.post("/goals", response_model=Goal, status_code=201)
async def create_goal(
    goal_data: GoalCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Create a new persistent goal."""
    from backend.models import UserGoal

    user_id = _get_user_id(credentials)

    deadline_dt = None
    if goal_data.deadline:
        try:
            deadline_dt = datetime.fromisoformat(goal_data.deadline.replace("Z", "+00:00"))
        except ValueError:
            pass

    new_goal = UserGoal(
        user_id=uuid_lib.UUID(user_id),
        title=goal_data.title,
        category=goal_data.category,
        target_value=goal_data.target_value,
        unit=goal_data.unit,
        deadline=deadline_dt,
    )
    db.add(new_goal)
    await db.commit()
    await db.refresh(new_goal)

    return _goal_to_pydantic(new_goal)


@router.put("/goals/{goal_id}", response_model=Goal)
async def update_goal(
    goal_id: str,
    update: GoalUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Update a goal."""
    from backend.models import UserGoal

    user_id = _get_user_id(credentials)
    result = await db.execute(
        select(UserGoal).where(
            UserGoal.id == uuid_lib.UUID(goal_id),
            UserGoal.user_id == uuid_lib.UUID(user_id),
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if update.title is not None:
        goal.title = update.title
    if update.target_value is not None:
        goal.target_value = update.target_value
    if update.current_value is not None:
        goal.current_value = update.current_value
    if update.status is not None:
        goal.status = update.status

    await db.commit()
    await db.refresh(goal)
    return _goal_to_pydantic(goal)


@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Delete a goal."""
    from backend.models import UserGoal
    from sqlalchemy import delete as sql_delete

    user_id = _get_user_id(credentials)
    result = await db.execute(
        sql_delete(UserGoal).where(
            UserGoal.id == uuid_lib.UUID(goal_id),
            UserGoal.user_id == uuid_lib.UUID(user_id),
        )
    )
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Goal not found")

    return {"deleted": True, "id": goal_id}


