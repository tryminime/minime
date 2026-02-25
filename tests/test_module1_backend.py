"""
Module 1: Activity Capture — Backend Service Tests

Tests Features 8b, 9c, 13b, 14b, 15:
  8b. Screenshot API (screenshots.py)
  9c. Focus Period Service (focus_period_service.py)
  13b. Social Media Service (social_media_service.py)
  14b. Meeting Service (meeting_service.py)
  15. Wearable Integration (wearables.py + wearable_service.py)

Run: source backend/venv/bin/activate && python -m pytest tests/test_module1_backend.py -v -o "addopts="
"""

import pytest
from datetime import datetime, timedelta


# ========================================
# Feature 13b: Social Media Service
# ========================================
class TestSocialMediaService:
    """Tests for backend/services/social_media_service.py"""

    def test_import(self):
        from backend.services.social_media_service import SocialMediaService
        service = SocialMediaService()
        assert service is not None

    def test_constructor_no_db(self):
        from backend.services.social_media_service import SocialMediaService
        svc = SocialMediaService(db_session=None)
        assert svc.db is None

    def test_empty_summary_structure(self):
        from backend.services.social_media_service import SocialMediaService
        svc = SocialMediaService()
        summary = svc._empty_summary()
        assert summary["total_social_minutes"] == 0
        assert summary["total_social_hours"] == 0
        assert summary["daily_average_minutes"] == 0
        assert summary["total_visits"] == 0
        assert summary["platform_count"] == 0
        assert summary["platforms"] == []

    def test_platform_categories_exist(self):
        from backend.services.social_media_service import PLATFORM_CATEGORIES
        assert "social_network" in PLATFORM_CATEGORIES
        assert "messaging" in PLATFORM_CATEGORIES
        assert "video" in PLATFORM_CATEGORIES
        assert "forum" in PLATFORM_CATEGORIES
        assert "blogging" in PLATFORM_CATEGORIES
        assert "professional" in PLATFORM_CATEGORIES

    def test_platform_categories_populated(self):
        from backend.services.social_media_service import PLATFORM_CATEGORIES
        total_platforms = sum(len(v) for v in PLATFORM_CATEGORIES.values())
        assert total_platforms >= 15, f"Expected >= 15 total platforms, got {total_platforms}"

    def test_known_platforms_in_categories(self):
        from backend.services.social_media_service import PLATFORM_CATEGORIES
        all_platforms = []
        for platforms in PLATFORM_CATEGORIES.values():
            all_platforms.extend(platforms)
        assert "Twitter/X" in all_platforms
        assert "Facebook" in all_platforms
        assert "Instagram" in all_platforms
        assert "Reddit" in all_platforms
        assert "YouTube" in all_platforms
        assert "Discord" in all_platforms

    def test_has_async_get_usage_summary(self):
        from backend.services.social_media_service import SocialMediaService
        import asyncio
        svc = SocialMediaService()
        assert hasattr(svc, 'get_usage_summary')
        assert asyncio.iscoroutinefunction(svc.get_usage_summary)

    def test_has_async_get_daily_breakdown(self):
        from backend.services.social_media_service import SocialMediaService
        import asyncio
        svc = SocialMediaService()
        assert hasattr(svc, 'get_daily_breakdown')
        assert asyncio.iscoroutinefunction(svc.get_daily_breakdown)

    def test_has_async_get_peak_hours(self):
        from backend.services.social_media_service import SocialMediaService
        import asyncio
        svc = SocialMediaService()
        assert hasattr(svc, 'get_peak_hours')
        assert asyncio.iscoroutinefunction(svc.get_peak_hours)

    def test_build_summary_empty(self):
        from backend.services.social_media_service import SocialMediaService
        svc = SocialMediaService()
        summary = svc._build_summary([], days=7)
        assert summary["period_days"] == 7
        assert summary["total_social_minutes"] == 0
        assert summary["platforms"] == []


# ========================================
# Feature 14b: Meeting Service
# ========================================
class TestMeetingService:
    """Tests for backend/services/meeting_service.py"""

    def test_import(self):
        from backend.services.meeting_service import MeetingService
        service = MeetingService()
        assert service is not None

    def test_constructor_no_db(self):
        from backend.services.meeting_service import MeetingService
        svc = MeetingService(db_session=None)
        assert svc.db is None

    def test_empty_summary_structure(self):
        from backend.services.meeting_service import MeetingService
        svc = MeetingService()
        summary = svc._empty_summary()
        assert summary["total_meeting_minutes"] == 0
        assert summary["total_meeting_count"] == 0
        assert summary["platforms"] == []

    def test_meeting_platforms_constant(self):
        from backend.services.meeting_service import MEETING_PLATFORMS
        assert len(MEETING_PLATFORMS) >= 5
        expected = ["Zoom", "Google Meet", "Microsoft Teams"]
        for p in expected:
            assert p in MEETING_PLATFORMS, f"Missing platform: {p}"

    def test_has_async_get_meeting_summary(self):
        from backend.services.meeting_service import MeetingService
        import asyncio
        svc = MeetingService()
        assert hasattr(svc, 'get_meeting_summary')
        assert asyncio.iscoroutinefunction(svc.get_meeting_summary)

    def test_has_async_get_daily_breakdown(self):
        from backend.services.meeting_service import MeetingService
        import asyncio
        svc = MeetingService()
        assert hasattr(svc, 'get_daily_breakdown')
        assert asyncio.iscoroutinefunction(svc.get_daily_breakdown)

    def test_has_async_get_meeting_free_blocks(self):
        from backend.services.meeting_service import MeetingService
        import asyncio
        svc = MeetingService()
        assert hasattr(svc, 'get_meeting_free_blocks')
        assert asyncio.iscoroutinefunction(svc.get_meeting_free_blocks)

    def test_meeting_load_label(self):
        from backend.services.meeting_service import MeetingService
        assert MeetingService._meeting_load_label(0) == "low"
        assert MeetingService._meeting_load_label(20) in ["low", "moderate"]
        assert MeetingService._meeting_load_label(60) in ["high", "critical", "overloaded"]

    def test_build_summary_empty(self):
        from backend.services.meeting_service import MeetingService
        svc = MeetingService()
        summary = svc._build_summary([], days=7)
        assert summary["period_days"] == 7
        assert summary["total_meeting_count"] == 0


# ========================================
# Feature 9c: Focus Period Service
# ========================================
class TestFocusPeriodService:
    """Tests for backend/services/focus_period_service.py"""

    def test_import(self):
        from backend.services.focus_period_service import FocusPeriodService
        service = FocusPeriodService()
        assert service is not None

    def test_constructor_no_db(self):
        from backend.services.focus_period_service import FocusPeriodService
        svc = FocusPeriodService(db_session=None)
        assert svc.db is None

    def test_empty_summary_structure(self):
        from backend.services.focus_period_service import FocusPeriodService
        svc = FocusPeriodService()
        summary = svc._empty_summary(7)

        required_keys = [
            "period_days", "total_sessions", "deep_work_sessions",
            "focused_sessions", "total_focus_minutes", "deep_work_minutes",
            "focused_minutes", "shallow_minutes", "avg_session_minutes",
            "longest_session_minutes", "avg_focus_score", "focus_ratio",
            "daily_breakdown"
        ]
        for key in required_keys:
            assert key in summary, f"Missing key: {key}"

    def test_empty_summary_values(self):
        from backend.services.focus_period_service import FocusPeriodService
        svc = FocusPeriodService()
        summary = svc._empty_summary(30)

        assert summary["period_days"] == 30
        assert summary["total_sessions"] == 0
        assert summary["deep_work_sessions"] == 0
        assert summary["total_focus_minutes"] == 0
        assert summary["avg_focus_score"] == 0
        assert summary["focus_ratio"] == 0
        assert summary["daily_breakdown"] == []

    def test_has_async_get_focus_summary(self):
        from backend.services.focus_period_service import FocusPeriodService
        import asyncio
        svc = FocusPeriodService()
        assert hasattr(svc, 'get_focus_summary')
        assert asyncio.iscoroutinefunction(svc.get_focus_summary)

    def test_has_async_get_optimal_focus_times(self):
        from backend.services.focus_period_service import FocusPeriodService
        import asyncio
        svc = FocusPeriodService()
        assert hasattr(svc, 'get_optimal_focus_times')
        assert asyncio.iscoroutinefunction(svc.get_optimal_focus_times)

    def test_has_async_get_context_switch_analysis(self):
        from backend.services.focus_period_service import FocusPeriodService
        import asyncio
        svc = FocusPeriodService()
        assert hasattr(svc, 'get_context_switch_analysis')
        assert asyncio.iscoroutinefunction(svc.get_context_switch_analysis)

    def test_has_async_store_focus_sessions(self):
        from backend.services.focus_period_service import FocusPeriodService
        import asyncio
        svc = FocusPeriodService()
        assert hasattr(svc, 'store_focus_sessions')
        assert asyncio.iscoroutinefunction(svc.store_focus_sessions)


# ========================================
# Feature 8b: Screenshot API
# ========================================
class TestScreenshotAPI:
    """Tests for backend/api/v1/screenshots.py"""

    def test_import(self):
        from backend.api.v1.screenshots import router
        assert router is not None

    def test_router_has_routes(self):
        from backend.api.v1.screenshots import router
        routes = [r.path for r in router.routes]
        assert len(routes) >= 2, f"Expected at least 2 routes, got {routes}"


# ========================================
# Feature 15: Wearable Integration
# ========================================
class TestWearableAPI:
    """Tests for backend/api/v1/wearables.py"""

    def test_import(self):
        from backend.api.v1.wearables import router
        assert router is not None

    def test_router_has_routes(self):
        from backend.api.v1.wearables import router
        routes = [r.path for r in router.routes]
        assert len(routes) >= 5, f"Expected at least 5 wearable routes, got {routes}"


class TestWearableService:
    """Tests for backend/services/wearable_service.py"""

    def test_import(self):
        from backend.services.wearable_service import WearableService
        service = WearableService()
        assert service is not None

    def test_constructor_no_db(self):
        from backend.services.wearable_service import WearableService
        svc = WearableService(db_session=None)
        assert svc.db is None

    def test_has_sync_fitbit(self):
        from backend.services.wearable_service import WearableService
        import asyncio
        svc = WearableService()
        assert hasattr(svc, 'sync_fitbit')
        assert asyncio.iscoroutinefunction(svc.sync_fitbit)

    def test_has_sync_oura(self):
        from backend.services.wearable_service import WearableService
        import asyncio
        svc = WearableService()
        assert hasattr(svc, 'sync_oura')
        assert asyncio.iscoroutinefunction(svc.sync_oura)

    def test_has_store_data_points(self):
        from backend.services.wearable_service import WearableService
        import asyncio
        svc = WearableService()
        assert hasattr(svc, 'store_data_points')
        assert asyncio.iscoroutinefunction(svc.store_data_points)

    def test_has_wellness_dashboard(self):
        from backend.services.wearable_service import WearableService
        import asyncio
        svc = WearableService()
        assert hasattr(svc, 'get_wellness_dashboard')
        assert asyncio.iscoroutinefunction(svc.get_wellness_dashboard)

    def test_metric_types_constant(self):
        from backend.services.wearable_service import METRIC_TYPES
        assert "steps" in METRIC_TYPES
        assert "heart_rate" in METRIC_TYPES
        assert "sleep_duration" in METRIC_TYPES
        assert len(METRIC_TYPES) >= 8, f"Expected >= 8 metric types, got {len(METRIC_TYPES)}"


class TestWearableSyncTask:
    """Tests for backend/tasks/wearable_sync.py"""

    def test_import(self):
        from backend.tasks.wearable_sync import sync_wearable_data
        assert sync_wearable_data is not None

    def test_helper_function_exists(self):
        from backend.tasks.wearable_sync import _sync_all_wearables
        import asyncio
        assert asyncio.iscoroutinefunction(_sync_all_wearables)


# ========================================
# Integration: Main app router registration
# ========================================
class TestRouterRegistration:
    """Verify all Module 1 routers are registered in main.py"""

    def test_screenshots_router_registered(self):
        with open("backend/main.py", "r") as f:
            content = f.read()
        assert "screenshots" in content
        assert "include_router" in content

    def test_wearables_router_registered(self):
        with open("backend/main.py", "r") as f:
            content = f.read()
        assert "wearables" in content

    def test_all_services_importable(self):
        services = [
            "backend.services.social_media_service",
            "backend.services.meeting_service",
            "backend.services.focus_period_service",
            "backend.services.wearable_service",
        ]
        for service_path in services:
            try:
                __import__(service_path)
            except ImportError as e:
                pytest.fail(f"Failed to import {service_path}: {e}")
