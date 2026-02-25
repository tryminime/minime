"""
Comprehensive test suite for Module 6: Dashboards & Visualization

Tests DashboardService:
- Dashboard overview (KPIs, quick actions)
- Productivity summary (time allocation, comparisons)
- Collaboration summary
- Skills summary (mastery, growth)
- Career summary (trajectory, recommendations)
- Wellness summary (balance, burnout)
- Weekly digest (highlights, suggestions)
- Export (JSON, CSV)
"""

import pytest
from datetime import datetime, timedelta

from backend.services.dashboard_service import DashboardService


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def service():
    return DashboardService()


@pytest.fixture
def sample_activities():
    now = datetime.now()
    return [
        {
            'application_name': 'VS Code',
            'window_title': 'project.py',
            'duration_seconds': 7200,
            'category': 'coding',
            'project': 'MiniMe',
            'occurred_at': (now - timedelta(hours=6)).isoformat(),
        },
        {
            'application_name': 'Chrome',
            'window_title': 'Docs',
            'duration_seconds': 3600,
            'category': 'productive',
            'project': 'MiniMe',
            'occurred_at': (now - timedelta(hours=4)).isoformat(),
        },
        {
            'application_name': 'Zoom',
            'window_title': 'Standup',
            'duration_seconds': 1800,
            'category': 'meetings',
            'project': 'Team',
            'occurred_at': (now - timedelta(hours=3)).isoformat(),
        },
        {
            'application_name': 'Slack',
            'window_title': 'General',
            'duration_seconds': 900,
            'category': 'communication',
            'project': 'Team',
            'occurred_at': (now - timedelta(hours=2)).isoformat(),
        },
        {
            'application_name': 'VS Code',
            'window_title': 'api.py',
            'duration_seconds': 5400,
            'category': 'development',
            'project': 'Backend',
            'occurred_at': (now - timedelta(hours=1)).isoformat(),
        },
    ]


@pytest.fixture
def sample_daily_data():
    return [
        {'date': '2026-02-07', 'total_hours': 8.0, 'start_hour': 9, 'end_hour': 17, 'break_count': 3, 'is_weekend': False},
        {'date': '2026-02-08', 'total_hours': 9.0, 'start_hour': 8, 'end_hour': 18, 'break_count': 2, 'is_weekend': False},
        {'date': '2026-02-09', 'total_hours': 7.5, 'start_hour': 9, 'end_hour': 17, 'break_count': 4, 'is_weekend': False},
        {'date': '2026-02-10', 'total_hours': 8.5, 'start_hour': 9, 'end_hour': 18, 'break_count': 3, 'is_weekend': False},
        {'date': '2026-02-11', 'total_hours': 8.0, 'start_hour': 9, 'end_hour': 17, 'break_count': 3, 'is_weekend': False},
    ]


@pytest.fixture
def sample_user_skills():
    return {
        'python': 120,
        'javascript': 80,
        'react': 40,
        'sql': 30,
        'docker': 20,
        'git': 50,
    }


@pytest.fixture
def sample_skill_history():
    return [
        {'skill': 'python', 'hours': 120, 'growth_rate': 8},
        {'skill': 'javascript', 'hours': 80, 'growth_rate': 5},
        {'skill': 'react', 'hours': 40, 'growth_rate': 12},
    ]


# ============================================================================
# TEST DASHBOARD OVERVIEW
# ============================================================================

class TestDashboardOverview:

    def test_overview_basic(self, service):
        result = service.get_dashboard_overview('user-1')
        assert result['user_id'] == 'user-1'
        assert 'kpis' in result
        assert 'quick_actions' in result
        assert 'generated_at' in result

    def test_overview_with_activities(self, service, sample_activities):
        result = service.get_dashboard_overview('user-1', activities=sample_activities)
        kpis = result['kpis']
        assert kpis['total_hours'] > 0
        assert kpis['context_switches'] >= 0
        assert kpis['meeting_hours'] >= 0

    def test_overview_with_daily_data(self, service, sample_daily_data):
        result = service.get_dashboard_overview('user-1', daily_data=sample_daily_data)
        kpis = result['kpis']
        assert 'wellness_score' in kpis
        assert kpis['wellness_score'] > 0

    def test_overview_goal_kpis(self, service):
        service.goal_service.create_goal('user-1', 'Test Goal')
        result = service.get_dashboard_overview('user-1')
        assert result['kpis']['active_goals'] >= 1

    def test_overview_quick_actions_no_goals(self, service):
        result = service.get_dashboard_overview('user-no-goals')
        actions = result['quick_actions']
        assert any('goal' in a.get('action', '').lower() for a in actions)

    def test_overview_quick_actions_overdue(self, service):
        past = (datetime.now() - timedelta(days=1)).isoformat()
        service.goal_service.create_goal('user-overdue', 'Late', deadline=past)
        # Trigger overdue detection
        service.goal_service.get_goal_stats('user-overdue')
        result = service.get_dashboard_overview('user-overdue')
        actions = result['quick_actions']
        assert any('overdue' in a.get('action', '').lower() for a in actions)


# ============================================================================
# TEST PRODUCTIVITY SUMMARY
# ============================================================================

class TestProductivitySummary:

    def test_productivity_empty(self, service):
        result = service.get_productivity_summary([])
        assert result['total_hours'] == 0
        assert result['productive_hours'] == 0

    def test_productivity_with_activities(self, service, sample_activities):
        result = service.get_productivity_summary(sample_activities)
        assert result['total_hours'] > 0
        assert 'time_allocation' in result
        assert len(result['time_allocation']['by_project']) > 0

    def test_productivity_with_comparison(self, service, sample_activities):
        current = {
            'focus_score': 8.0, 'deep_work_hours': 5.0, 'context_switches': 10,
            'meeting_load_pct': 20, 'distraction_index': 15, 'break_quality': 7.0, 'total_hours': 8.0,
        }
        previous = [
            {'focus_score': 6.0, 'deep_work_hours': 3.0, 'context_switches': 15,
             'meeting_load_pct': 30, 'distraction_index': 25, 'break_quality': 5.0, 'total_hours': 7.0},
        ]
        result = service.get_productivity_summary(sample_activities, current, previous)
        assert result['comparison']['periods_compared'] == 1
        assert 'focus_score' in result['comparison']['comparisons']

    def test_productivity_ratio(self, service, sample_activities):
        result = service.get_productivity_summary(sample_activities)
        assert 0 <= result['productivity_ratio'] <= 100

    def test_productivity_top_apps(self, service, sample_activities):
        result = service.get_productivity_summary(sample_activities)
        assert len(result['top_apps']) <= 5


# ============================================================================
# TEST COLLABORATION SUMMARY
# ============================================================================

class TestCollaborationSummary:

    def test_collaboration_empty(self, service):
        result = service.get_collaboration_summary()
        assert result['collaboration_score'] == 0
        assert result['unique_collaborators'] == 0

    def test_collaboration_with_data(self, service):
        data = {
            'collaboration_score': 75,
            'top_collaborators': [
                {'name': 'Alice', 'interactions': 20},
                {'name': 'Bob', 'interactions': 15},
            ],
            'network_diversity': {'cross_team': 0.6},
            'meeting_patterns': {'total_meetings': 8},
            'communication_volume': 45,
            'network_size': 12,
        }
        result = service.get_collaboration_summary(data)
        assert result['collaboration_score'] == 75
        assert result['unique_collaborators'] == 2
        assert result['meetings_count'] == 8
        assert len(result['top_collaborators']) == 2


# ============================================================================
# TEST SKILL SUMMARY
# ============================================================================

class TestSkillSummary:

    def test_skill_empty(self, service):
        result = service.get_skill_summary()
        assert result['total_skills'] == 0

    def test_skill_with_user_skills(self, service, sample_user_skills):
        result = service.get_skill_summary(user_skills=sample_user_skills)
        assert result['total_skills'] == 6
        dist = result['expertise_distribution']
        assert sum(dist.values()) == 6

    def test_skill_with_data(self, service):
        skill_data = {
            'total_skills': 5,
            'top_skills': [
                {'name': 'python', 'hours': 120},
                {'name': 'javascript', 'hours': 80},
            ],
            'learning_velocity': 2.5,
            'mastery_levels': {'python': 'expert'},
        }
        result = service.get_skill_summary(skill_data)
        assert result['total_skills'] == 5
        assert result['skill_usage']['python'] == 120

    def test_skill_expertise_distribution(self, service):
        skills = {'a': 5, 'b': 25, 'c': 60, 'd': 110, 'e': 210}
        result = service.get_skill_summary(user_skills=skills)
        dist = result['expertise_distribution']
        assert dist['beginner'] == 1
        assert dist['intermediate'] == 1
        assert dist['advanced'] == 1
        assert dist['expert'] == 1
        assert dist['master'] == 1


# ============================================================================
# TEST CAREER SUMMARY
# ============================================================================

class TestCareerSummary:

    def test_career_with_skills(self, service, sample_user_skills, sample_skill_history):
        result = service.get_career_summary(sample_user_skills, sample_skill_history)
        assert result['growth_trajectory'] in ('growing', 'accelerating', 'stable', 'declining')
        assert result['career_phase'] in ('exploration', 'focusing', 'generalist', 'mastering', 'leading')
        assert result['total_skills'] > 0

    def test_career_recommendations(self, service, sample_user_skills, sample_skill_history):
        result = service.get_career_summary(sample_user_skills, sample_skill_history, target_roles=['fullstack_developer'])
        assert len(result['recommended_next_steps']) > 0

    def test_career_empty_skills(self, service):
        result = service.get_career_summary({}, [])
        assert result['career_phase'] == 'exploration'

    def test_career_with_weekly_data(self, service, sample_user_skills, sample_skill_history):
        weekly = [{'hours': 20, 'skills_used': 3, 'new_skills': 0}] * 4
        result = service.get_career_summary(sample_user_skills, sample_skill_history, weekly_data=weekly)
        assert 'growth_velocity' in result


# ============================================================================
# TEST WELLNESS SUMMARY
# ============================================================================

class TestWellnessSummary:

    def test_wellness_with_data(self, service, sample_daily_data):
        result = service.get_wellness_summary(sample_daily_data)
        assert 0 <= result['overall_score'] <= 100
        assert 'work_life_balance' in result
        assert 'burnout_risk' in result
        assert result['burnout_risk']['level'] in ('low', 'moderate', 'high', 'critical')

    def test_wellness_empty(self, service):
        result = service.get_wellness_summary([])
        assert result['overall_score'] >= 0
        assert 'burnout_risk' in result

    def test_wellness_with_hourly(self, service, sample_daily_data):
        hourly = [{'hour': h, 'activity_count': 5, 'deep_work_mins': 20, 'context_switches': 3} for h in range(9, 17)]
        result = service.get_wellness_summary(sample_daily_data, hourly_data=hourly)
        assert 'energy_levels' in result
        assert len(result['energy_levels'].get('peak_hours', [])) > 0

    def test_wellness_burnout_details(self, service):
        # High burnout scenario
        data = [
            {'total_hours': 12, 'start_hour': 7, 'end_hour': 22, 'break_count': 0, 'is_weekend': False}
            for _ in range(10)
        ]
        result = service.get_wellness_summary(data)
        assert result['burnout_risk']['level'] in ('high', 'critical')
        assert len(result['burnout_risk']['recommendations']) > 0


# ============================================================================
# TEST WEEKLY DIGEST
# ============================================================================

class TestWeeklyDigest:

    def test_digest_basic(self, service):
        result = service.get_weekly_digest('user-1')
        assert 'week_start' in result
        assert 'week_end' in result
        assert 'highlights' in result
        assert 'suggestions' in result

    def test_digest_with_activities(self, service, sample_activities):
        result = service.get_weekly_digest('user-1', activities=sample_activities)
        assert result['total_hours'] > 0
        assert len(result['top_activities']) > 0

    def test_digest_with_daily_data(self, service, sample_daily_data):
        result = service.get_weekly_digest('user-1', daily_data=sample_daily_data)
        assert result['wellness_score'] > 0

    def test_digest_with_goals(self, service):
        service.goal_service.create_goal('user-digest', 'Week Goal')
        result = service.get_weekly_digest('user-digest')
        assert result['goals_summary']['active'] >= 1

    def test_digest_week_offset(self, service):
        result = service.get_weekly_digest('user-1', week_offset=1)
        assert result['week_start'] < datetime.now().strftime('%Y-%m-%d')

    def test_digest_highlights_content(self, service, sample_activities, sample_daily_data):
        result = service.get_weekly_digest('user-1', activities=sample_activities, daily_data=sample_daily_data)
        assert len(result['highlights']) > 0
        assert any('hours' in h.lower() or 'tracked' in h.lower() for h in result['highlights'])


# ============================================================================
# TEST EXPORT
# ============================================================================

class TestExport:

    def test_export_json(self, service):
        result = service.export_analytics_data('user-1', format='json')
        assert result['format'] == 'json'
        assert 'content' in result
        assert result['content']['user_id'] == 'user-1'
        assert 'overview' in result['content']
        assert 'productivity' in result['content']
        assert 'goals' in result['content']

    def test_export_csv(self, service):
        result = service.export_analytics_data('user-1', format='csv')
        assert result['format'] == 'csv'
        assert 'content' in result
        assert isinstance(result['content'], str)
        assert 'Section' in result['content']  # CSV header

    def test_export_with_data(self, service, sample_activities, sample_daily_data, sample_user_skills, sample_skill_history):
        result = service.export_analytics_data(
            'user-1',
            format='json',
            activities=sample_activities,
            daily_data=sample_daily_data,
            user_skills=sample_user_skills,
            skill_history=sample_skill_history,
        )
        content = result['content']
        assert content['productivity']['total_hours'] > 0
        assert content['wellness']['overall_score'] > 0
        assert 'career' in content

    def test_export_filename_format(self, service):
        result = service.export_analytics_data('user-1', format='json')
        assert result['filename'].startswith('analytics_export_')
        assert result['filename'].endswith('.json')

    def test_export_csv_filename(self, service):
        result = service.export_analytics_data('user-1', format='csv')
        assert result['filename'].endswith('.csv')


# ============================================================================
# TEST INTERNAL HELPERS
# ============================================================================

class TestHelpers:

    def test_productivity_kpis_empty(self, service):
        result = service._extract_productivity_kpis([])
        assert result['focus_score'] == 0
        assert result['total_hours'] == 0

    def test_productivity_kpis_with_data(self, service, sample_activities):
        result = service._extract_productivity_kpis(sample_activities)
        assert result['total_hours'] > 0
        assert result['context_switches'] >= 0

    def test_quick_actions_default(self, service):
        actions = service._generate_quick_actions({}, {}, {'active': 1, 'overdue': 0})
        assert len(actions) > 0

    def test_quick_actions_burnout(self, service):
        actions = service._generate_quick_actions({}, {'burnout_risk': 'critical'}, {'active': 1, 'overdue': 0})
        assert any('burnout' in a['action'].lower() or 'break' in a['action'].lower() for a in actions)

    def test_career_recommendations(self, service):
        report = {
            'skill_gaps': {'prioritized_gaps': [{'skill': 'kubernetes', 'role_count': 3}]},
            'best_fit_role': {'role': 'devops_engineer', 'readiness_score': 80},
            'growth_velocity': {'trend': 'accelerating'},
        }
        recs = service._generate_career_recommendations(report)
        assert len(recs) >= 2

    def test_to_csv(self, service):
        data = {'overview': {'score': 85}, 'productivity': {'hours': 40}}
        csv_str = service._to_csv(data)
        assert 'Section' in csv_str
        assert 'score' in csv_str
        assert '85' in csv_str
