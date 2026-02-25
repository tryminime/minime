"""
Comprehensive test suite for Module 5: Personal Analytics

Tests:
- CareerDevelopmentService (trajectory, role readiness, skill gaps, velocity, milestones)
- WellnessMetricsService (balance, burnout, energy, stress, rest, report)
- GoalTrackingService (CRUD, progress, status, analytics, auto-progress, streaks)
- get_time_allocation_by_project (project/category breakdown)
- get_comparative_analytics (week/month comparisons, trends, rankings)
"""

import pytest
from datetime import datetime, timedelta

from backend.services.career_development_service import CareerDevelopmentService, CAREER_PATHS
from backend.services.wellness_metrics_service import WellnessMetricsService
from backend.services.goal_tracking_service import GoalTrackingService, GoalStatus
from backend.services.productivity_metrics_service import (
    get_time_allocation_by_project,
    get_comparative_analytics,
)


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def career_service():
    return CareerDevelopmentService()


@pytest.fixture
def wellness_service():
    return WellnessMetricsService()


@pytest.fixture
def goal_service():
    return GoalTrackingService()


@pytest.fixture
def skill_history():
    return [
        {'skill': 'python', 'hours': 120, 'growth_rate': 8},
        {'skill': 'javascript', 'hours': 80, 'growth_rate': 5},
        {'skill': 'react', 'hours': 40, 'growth_rate': 12},
        {'skill': 'sql', 'hours': 30, 'growth_rate': 3},
        {'skill': 'docker', 'hours': 20, 'growth_rate': -2},
    ]


@pytest.fixture
def user_skills():
    return {
        'python': 120,
        'javascript': 80,
        'react': 40,
        'sql': 30,
        'git': 50,
        'docker': 20,
        'html': 15,
        'css': 15,
    }


@pytest.fixture
def daily_wellness_data():
    return [
        {'date': '2026-02-07', 'total_hours': 8.0, 'start_hour': 9, 'end_hour': 17, 'break_count': 3, 'is_weekend': False},
        {'date': '2026-02-08', 'total_hours': 9.5, 'start_hour': 8, 'end_hour': 19, 'break_count': 2, 'is_weekend': False},
        {'date': '2026-02-09', 'total_hours': 7.0, 'start_hour': 9, 'end_hour': 16, 'break_count': 4, 'is_weekend': False},
        {'date': '2026-02-10', 'total_hours': 8.5, 'start_hour': 9, 'end_hour': 18, 'break_count': 3, 'is_weekend': False},
        {'date': '2026-02-11', 'total_hours': 10.0, 'start_hour': 8, 'end_hour': 20, 'break_count': 2, 'is_weekend': False},
        {'date': '2026-02-12', 'total_hours': 3.0, 'start_hour': 10, 'end_hour': 13, 'break_count': 1, 'is_weekend': True},
        {'date': '2026-02-13', 'total_hours': 0, 'start_hour': 0, 'end_hour': 0, 'break_count': 0, 'is_weekend': True},
    ]


# ============================================================================
# TEST CAREER DEVELOPMENT SERVICE
# ============================================================================

class TestCareerDevelopment:

    def test_analyze_trajectory(self, career_service, skill_history):
        result = career_service.analyze_career_trajectory(skill_history, total_hours=290)
        assert result['phase'] in ('focusing', 'generalist')  # depends on domain count
        assert result['skill_count'] == 5
        assert result['trajectory'] in ('growing', 'accelerating')
        assert len(result['top_skills']) <= 5

    def test_trajectory_empty(self, career_service):
        result = career_service.analyze_career_trajectory([])
        assert result['phase'] == 'exploration'
        assert result['skill_count'] == 0

    def test_trajectory_high_hours(self, career_service):
        skills = [{'skill': 'python', 'hours': 2000, 'growth_rate': 5}]
        result = career_service.analyze_career_trajectory(skills, total_hours=2000)
        assert result['phase'] == 'mastering'

    def test_trajectory_leading(self, career_service):
        skills = [{'skill': 'python', 'hours': 4000}]
        result = career_service.analyze_career_trajectory(skills, total_hours=4000)
        assert result['phase'] == 'leading'

    def test_trajectory_declining(self, career_service):
        skills = [{'skill': 'python', 'hours': 100, 'growth_rate': -10}]
        result = career_service.analyze_career_trajectory(skills, total_hours=100)
        assert result['trajectory'] == 'declining'

    def test_role_readiness_fullstack(self, career_service, user_skills):
        result = career_service.assess_role_readiness(user_skills, 'fullstack_developer')
        assert 'readiness_score' in result
        assert result['required_skills_covered'] > 0
        assert len(result['skill_gaps']) > 0

    def test_role_readiness_unknown_role(self, career_service, user_skills):
        result = career_service.assess_role_readiness(user_skills, 'astronaut')
        assert 'error' in result
        assert 'available_roles' in result

    def test_role_readiness_high(self, career_service):
        skills = {s: 100 for s in CAREER_PATHS['fullstack_developer']['required_skills']}
        skills.update({s: 50 for s in CAREER_PATHS['fullstack_developer']['nice_to_have']})
        result = career_service.assess_role_readiness(skills, 'fullstack_developer')
        assert result['readiness_level'] == 'ready'
        assert result['readiness_score'] >= 85

    def test_role_readiness_early(self, career_service):
        result = career_service.assess_role_readiness({'html': 5}, 'ml_engineer')
        assert result['readiness_level'] == 'early'

    def test_skill_gaps_analysis(self, career_service, user_skills):
        result = career_service.analyze_skill_gaps(user_skills)
        assert result['roles_analyzed'] == len(CAREER_PATHS)
        assert len(result['prioritized_gaps']) > 0
        assert len(result['most_versatile_skills']) <= 5

    def test_skill_gaps_specific_roles(self, career_service, user_skills):
        result = career_service.analyze_skill_gaps(user_skills, ['fullstack_developer', 'devops_engineer'])
        assert result['roles_analyzed'] == 2

    def test_growth_velocity(self, career_service):
        weekly_data = [
            {'week': i, 'hours': 20 + i * 2, 'skills_used': 3, 'new_skills': 1 if i % 3 == 0 else 0}
            for i in range(8)
        ]
        result = career_service.calculate_growth_velocity(weekly_data)
        assert result['weeks_tracked'] == 8
        assert result['current_velocity'] > 0
        assert result['trend'] in ('accelerating', 'steady', 'decelerating', 'starting')

    def test_growth_velocity_empty(self, career_service):
        result = career_service.calculate_growth_velocity([])
        assert result['current_velocity'] == 0
        assert result['trend'] == 'neutral'

    def test_growth_velocity_short(self, career_service):
        result = career_service.calculate_growth_velocity([{'hours': 10, 'skills_used': 2}])
        assert result['trend'] == 'insufficient_data'

    def test_detect_milestones(self, career_service):
        result = career_service.detect_milestones(total_hours=105, previous_hours=95)
        assert len(result) == 1
        assert result[0]['name'] == 'Practitioner'

    def test_detect_milestones_none(self, career_service):
        result = career_service.detect_milestones(total_hours=45, previous_hours=40)
        assert len(result) == 0

    def test_detect_milestones_multiple(self, career_service):
        result = career_service.detect_milestones(total_hours=55, previous_hours=5)
        assert len(result) == 2  # Getting Started (10) + Apprentice (50)

    def test_get_current_milestone(self, career_service):
        result = career_service.get_current_milestone(150)
        assert result['current']['name'] == 'Practitioner'
        assert result['next']['name'] == 'Skilled'
        assert 0 <= result['progress_to_next'] <= 100

    def test_get_current_milestone_max(self, career_service):
        result = career_service.get_current_milestone(6000)
        assert result['current']['name'] == 'Grandmaster'
        assert result['next'] is None

    def test_career_report(self, career_service, user_skills, skill_history):
        report = career_service.generate_career_report(
            user_skills=user_skills,
            skill_history=skill_history,
            weekly_data=[{'hours': 20, 'skills_used': 3, 'new_skills': 0}] * 4,
            target_roles=['fullstack_developer'],
        )
        assert 'trajectory' in report
        assert 'growth_velocity' in report
        assert 'skill_gaps' in report
        assert 'milestone' in report
        assert 'best_fit_role' in report
        assert report['total_skills'] == len(user_skills)

    def test_group_by_domain(self, career_service, skill_history):
        domains = career_service._group_by_domain(skill_history)
        assert 'backend' in domains  # python
        assert 'frontend' in domains  # javascript, react


# ============================================================================
# TEST WELLNESS METRICS SERVICE
# ============================================================================

class TestWellnessMetrics:

    def test_work_life_balance(self, wellness_service, daily_wellness_data):
        result = wellness_service.calculate_work_life_balance(daily_wellness_data)
        assert 0 <= result['score'] <= 100
        assert result['level'] in ('excellent', 'good', 'fair', 'poor')
        assert result['days_analyzed'] == 7
        assert 'work_hours' in result['factors']

    def test_work_life_balance_empty(self, wellness_service):
        result = wellness_service.calculate_work_life_balance([])
        assert result['score'] == 50
        assert result['days_analyzed'] == 0

    def test_work_life_balance_excellent(self, wellness_service):
        data = [
            {'total_hours': 7.5, 'start_hour': 9, 'end_hour': 17, 'break_count': 4, 'is_weekend': False}
            for _ in range(5)
        ]
        result = wellness_service.calculate_work_life_balance(data)
        assert result['level'] in ('excellent', 'good')

    def test_work_life_balance_poor(self, wellness_service):
        data = [
            {'total_hours': 14, 'start_hour': 6, 'end_hour': 23, 'break_count': 0, 'is_weekend': False}
            for _ in range(5)
        ] + [
            {'total_hours': 8, 'start_hour': 10, 'end_hour': 18, 'break_count': 0, 'is_weekend': True}
            for _ in range(2)
        ]
        result = wellness_service.calculate_work_life_balance(data)
        assert result['level'] in ('poor', 'fair')

    def test_burnout_risk_low(self, wellness_service):
        data = [
            {'total_hours': 7.5, 'break_count': 3, 'end_hour': 17, 'meeting_pct': 20}
            for _ in range(14)
        ]
        result = wellness_service.assess_burnout_risk(data)
        assert result['risk_level'] == 'low'
        assert len(result['indicators']) == 0

    def test_burnout_risk_high(self, wellness_service):
        data = [
            {'total_hours': 12, 'break_count': 0, 'end_hour': 23, 'meeting_pct': 50}
            for _ in range(14)
        ]
        result = wellness_service.assess_burnout_risk(data)
        assert result['risk_level'] in ('high', 'critical')
        assert len(result['indicators']) > 0
        assert len(result['recommendations']) > 0

    def test_burnout_overwork_streak(self, wellness_service):
        data = [{'total_hours': 11, 'break_count': 2, 'end_hour': 20, 'meeting_pct': 20} for _ in range(5)]
        result = wellness_service.assess_burnout_risk(data)
        streak_indicator = [i for i in result['indicators'] if 'Overwork' in i['name']]
        assert len(streak_indicator) > 0

    def test_burnout_empty(self, wellness_service):
        result = wellness_service.assess_burnout_risk([])
        assert result['risk_level'] == 'low'

    def test_burnout_increasing_workload(self, wellness_service):
        daily = [{'total_hours': 8, 'break_count': 3, 'end_hour': 17, 'meeting_pct': 20} for _ in range(7)]
        weekly = [
            {'total_hours': 35},
            {'total_hours': 38},
            {'total_hours': 55},  # Big jump
        ]
        result = wellness_service.assess_burnout_risk(daily, weekly)
        workload = [i for i in result['indicators'] if 'Workload' in i['name']]
        assert len(workload) > 0

    def test_energy_levels(self, wellness_service):
        hourly = [
            {'hour': h, 'activity_count': 10, 'deep_work_mins': 30 if 9 <= h <= 11 else 10, 'context_switches': 2}
            for h in range(8, 18)
        ]
        result = wellness_service.estimate_energy_levels(hourly)
        assert len(result['peak_hours']) > 0
        assert result['avg_energy'] > 0

    def test_energy_levels_empty(self, wellness_service):
        result = wellness_service.estimate_energy_levels([])
        assert result['avg_energy'] == 50

    def test_energy_inactive_hours(self, wellness_service):
        hourly = [{'hour': h, 'activity_count': 0, 'deep_work_mins': 0, 'context_switches': 0} for h in range(24)]
        result = wellness_service.estimate_energy_levels(hourly)
        assert result['avg_energy'] == 0

    def test_stress_index_low(self, wellness_service):
        result = wellness_service.calculate_stress_index({
            'total_hours': 7.5, 'meeting_hours': 1, 'context_switches': 5,
            'break_count': 4, 'late_work': False, 'messages_sent': 10,
        })
        assert result['level'] == 'low'
        assert result['stress_index'] < 25

    def test_stress_index_high(self, wellness_service):
        result = wellness_service.calculate_stress_index({
            'total_hours': 12, 'meeting_hours': 5, 'context_switches': 25,
            'break_count': 0, 'late_work': True, 'messages_sent': 60,
        })
        assert result['level'] in ('high', 'very_high')
        assert result['stress_index'] > 50
        assert result['dominant_factor'] is not None

    def test_rest_patterns(self, wellness_service, daily_wellness_data):
        result = wellness_service.analyze_rest_patterns(daily_wellness_data)
        assert 0 <= result['recovery_score'] <= 100
        assert result['avg_rest_hours'] > 0

    def test_rest_patterns_empty(self, wellness_service):
        result = wellness_service.analyze_rest_patterns([])
        assert result['recovery_score'] == 50

    def test_rest_no_days_off(self, wellness_service):
        data = [{'start_hour': 8, 'end_hour': 20, 'total_hours': 10, 'is_weekend': False} for _ in range(10)]
        result = wellness_service.analyze_rest_patterns(data)
        assert any('rest day' in r.lower() for r in result['recommendations'])

    def test_wellness_report(self, wellness_service, daily_wellness_data):
        hourly = [
            {'hour': h, 'activity_count': 5, 'deep_work_mins': 20, 'context_switches': 3}
            for h in range(9, 17)
        ]
        result = wellness_service.generate_wellness_report(
            daily_wellness_data,
            weekly_data=[{'total_hours': 40}],
            hourly_data=hourly,
        )
        assert 0 <= result['overall_score'] <= 100
        assert 'work_life_balance' in result
        assert 'burnout_risk' in result
        assert 'rest_recovery' in result
        assert 'energy_levels' in result


# ============================================================================
# TEST GOAL TRACKING SERVICE
# ============================================================================

class TestGoalTracking:

    def test_create_goal(self, goal_service):
        result = goal_service.create_goal('user-1', 'Learn Rust', category='skill', target_value=50, unit='hours')
        assert result['title'] == 'Learn Rust'
        assert result['category'] == 'skill'
        assert result['category_icon'] == '📚'
        assert result['progress_pct'] == 0
        assert result['status'] == 'active'

    def test_get_goal(self, goal_service):
        created = goal_service.create_goal('user-1', 'Daily Focus')
        result = goal_service.get_goal('user-1', created['id'])
        assert result is not None
        assert result['title'] == 'Daily Focus'

    def test_get_goal_not_found(self, goal_service):
        assert goal_service.get_goal('user-1', 'nope') is None

    def test_list_goals(self, goal_service):
        goal_service.create_goal('user-1', 'Goal A', category='productivity')
        goal_service.create_goal('user-1', 'Goal B', category='skill')
        result = goal_service.list_goals('user-1')
        assert result['total'] == 2

    def test_list_goals_filter_category(self, goal_service):
        goal_service.create_goal('user-1', 'Goal A', category='productivity')
        goal_service.create_goal('user-1', 'Goal B', category='skill')
        result = goal_service.list_goals('user-1', category='skill')
        assert result['total'] == 1
        assert result['goals'][0]['category'] == 'skill'

    def test_list_goals_exclude_archived(self, goal_service):
        goal_service.create_goal('user-1', 'Active')
        g2 = goal_service.create_goal('user-1', 'Archived')
        goal_service.archive_goal('user-1', g2['id'])
        result = goal_service.list_goals('user-1', include_archived=False)
        assert result['total'] == 1

    def test_update_goal(self, goal_service):
        created = goal_service.create_goal('user-1', 'Test')
        result = goal_service.update_goal('user-1', created['id'], title='Updated Title', target_value=200)
        assert result['title'] == 'Updated Title'
        assert result['target_value'] == 200

    def test_update_goal_not_found(self, goal_service):
        assert goal_service.update_goal('user-1', 'nope', title='X') is None

    def test_delete_goal(self, goal_service):
        created = goal_service.create_goal('user-1', 'Delete Me')
        assert goal_service.delete_goal('user-1', created['id']) is True
        assert goal_service.get_goal('user-1', created['id']) is None

    def test_delete_not_found(self, goal_service):
        assert goal_service.delete_goal('user-x', 'nope') is False

    def test_update_progress(self, goal_service):
        created = goal_service.create_goal('user-1', 'Learn Vim', target_value=100, unit='percent')
        result = goal_service.update_progress('user-1', created['id'], 45, note='Good session')
        assert result['current_value'] == 45
        assert result['progress_pct'] == 45.0

    def test_update_progress_autocomplete(self, goal_service):
        created = goal_service.create_goal('user-1', 'Finish Book', target_value=300, unit='pages')
        result = goal_service.update_progress('user-1', created['id'], 300)
        assert result['status'] == 'completed'
        assert result['completed_at'] is not None

    def test_add_progress_increment(self, goal_service):
        created = goal_service.create_goal('user-1', 'Code Hours', target_value=50, unit='hours')
        goal_service.update_progress('user-1', created['id'], 10)
        result = goal_service.add_progress_increment('user-1', created['id'], 5)
        assert result['current_value'] == 15

    def test_milestone_detection(self, goal_service):
        milestones = [
            {'name': 'Quarter', 'value': 25},
            {'name': 'Half', 'value': 50},
            {'name': 'Done', 'value': 100},
        ]
        created = goal_service.create_goal('user-1', 'With Milestones', target_value=100, milestones=milestones)
        result = goal_service.update_progress('user-1', created['id'], 60)
        # Should cross Quarter (25) and Half (50) milestones
        assert len(result['milestones_reached']) == 2

    def test_complete_goal(self, goal_service):
        created = goal_service.create_goal('user-1', 'Manual Complete')
        result = goal_service.complete_goal('user-1', created['id'])
        assert result['status'] == 'completed'

    def test_pause_resume_goal(self, goal_service):
        created = goal_service.create_goal('user-1', 'Pausable')
        paused = goal_service.pause_goal('user-1', created['id'])
        assert paused['status'] == 'paused'
        resumed = goal_service.resume_goal('user-1', created['id'])
        assert resumed['status'] == 'active'

    def test_archive_goal(self, goal_service):
        created = goal_service.create_goal('user-1', 'Archive Me')
        result = goal_service.archive_goal('user-1', created['id'])
        assert result['status'] == 'archived'

    def test_goal_stats(self, goal_service):
        goal_service.create_goal('user-1', 'Active')
        g2 = goal_service.create_goal('user-1', 'Complete')
        goal_service.complete_goal('user-1', g2['id'])
        g3 = goal_service.create_goal('user-1', 'Archived')
        goal_service.archive_goal('user-1', g3['id'])
        stats = goal_service.get_goal_stats('user-1')
        assert stats['total_goals'] == 3
        assert stats['active'] == 1
        assert stats['completed'] == 1
        assert stats['archived'] == 1
        assert stats['completion_rate'] > 0

    def test_goal_stats_empty(self, goal_service):
        stats = goal_service.get_goal_stats('no-user')
        assert stats['total_goals'] == 0

    def test_completion_streaks(self, goal_service):
        g1 = goal_service.create_goal('user-1', 'G1')
        goal_service.complete_goal('user-1', g1['id'])
        g2 = goal_service.create_goal('user-1', 'G2')
        goal_service.complete_goal('user-1', g2['id'])
        result = goal_service.get_completion_streaks('user-1')
        assert result['total_completed'] == 2
        assert result['current_streak'] >= 1

    def test_completion_streaks_empty(self, goal_service):
        result = goal_service.get_completion_streaks('no-user')
        assert result['total_completed'] == 0

    def test_overdue_detection(self, goal_service):
        past = (datetime.now() - timedelta(days=1)).isoformat()
        created = goal_service.create_goal('user-1', 'Overdue Task', deadline=past)
        result = goal_service.get_goal('user-1', created['id'])
        assert result['is_overdue'] is True
        assert result['status'] == 'overdue'

    def test_upcoming_deadlines(self, goal_service):
        future = (datetime.now() + timedelta(days=5)).isoformat()
        goal_service.create_goal('user-1', 'Soon', deadline=future)
        result = goal_service.get_upcoming_deadlines('user-1', days_ahead=7)
        assert len(result) == 1
        assert result[0]['urgency'] == 'upcoming'

    def test_auto_update_productivity(self, goal_service):
        goal_service.create_goal('user-1', 'Work 40 hours', category='productivity', target_value=40, unit='hours')
        results = goal_service.auto_update_from_activity('user-1', {
            'hours_worked': 8,
            'deep_work_hours': 4,
            'skills_practiced': [],
            'focus_score': 7,
        })
        assert len(results) == 1
        assert results[0]['current_value'] == 8

    def test_auto_update_skill(self, goal_service):
        goal_service.create_goal('user-1', 'Learn Python', category='skill', target_value=100, unit='hours')
        results = goal_service.auto_update_from_activity('user-1', {
            'hours_worked': 8,
            'deep_work_hours': 3,
            'skills_practiced': ['python', 'sql'],
            'focus_score': 7,
        })
        assert len(results) == 1

    def test_auto_update_no_match(self, goal_service):
        goal_service.create_goal('user-1', 'Exercise Daily', category='wellness', target_value=30, unit='days')
        results = goal_service.auto_update_from_activity('user-1', {
            'hours_worked': 8,
            'deep_work_hours': 4,
            'skills_practiced': [],
            'focus_score': 4,  # Below 7, no wellness update
        })
        assert len(results) == 0


# ============================================================================
# TEST TIME ALLOCATION
# ============================================================================

class TestTimeAllocation:

    def test_basic_allocation(self):
        activities = [
            {'application_name': 'VS Code', 'window_title': 'Project A', 'duration_seconds': 3600, 'project': 'MiniMe'},
            {'application_name': 'Chrome', 'window_title': 'Research', 'duration_seconds': 1800, 'project': 'MiniMe'},
            {'application_name': 'Slack', 'window_title': 'Chat', 'duration_seconds': 900, 'project': 'Team'},
        ]
        result = get_time_allocation_by_project(activities)
        assert result['total_hours'] > 0
        assert len(result['by_project']) >= 2
        assert result['project_count'] == 2

    def test_allocation_empty(self):
        result = get_time_allocation_by_project([])
        assert result['total_hours'] == 0
        assert result['by_project'] == []

    def test_allocation_percentages(self):
        activities = [
            {'application_name': 'App', 'window_title': 'Work', 'duration_seconds': 7200, 'project': 'Alpha'},
            {'application_name': 'App', 'window_title': 'Work', 'duration_seconds': 3600, 'project': 'Beta'},
        ]
        result = get_time_allocation_by_project(activities)
        # Alpha should be ~66.7%, Beta ~33.3%
        alpha = next(p for p in result['by_project'] if p['name'] == 'Alpha')
        assert 65 <= alpha['percentage'] <= 68

    def test_allocation_by_category(self):
        activities = [
            {'application_name': 'VS Code', 'duration_seconds': 3600, 'category': 'coding'},
            {'application_name': 'Chrome', 'duration_seconds': 1800, 'category': 'browsing'},
        ]
        result = get_time_allocation_by_project(activities)
        assert len(result['by_category']) == 2


# ============================================================================
# TEST COMPARATIVE ANALYTICS
# ============================================================================

class TestComparativeAnalytics:

    def test_basic_comparison(self):
        current = {
            'focus_score': 8.0, 'deep_work_hours': 5.0, 'context_switches': 10,
            'meeting_load_pct': 20, 'distraction_index': 15, 'break_quality': 7.0, 'total_hours': 8.0,
        }
        previous = [
            {
                'focus_score': 6.0, 'deep_work_hours': 3.0, 'context_switches': 15,
                'meeting_load_pct': 30, 'distraction_index': 25, 'break_quality': 5.0, 'total_hours': 7.0,
            },
            {
                'focus_score': 7.0, 'deep_work_hours': 4.0, 'context_switches': 12,
                'meeting_load_pct': 25, 'distraction_index': 20, 'break_quality': 6.0, 'total_hours': 7.5,
            },
        ]
        result = get_comparative_analytics(current, previous)
        assert result['periods_compared'] == 2
        assert result['overall_trend'] in ('improving', 'slightly_improving', 'stable', 'slightly_declining', 'declining')
        assert 'focus_score' in result['comparisons']
        assert result['comparisons']['focus_score']['direction'] == 'improved'

    def test_empty_previous(self):
        result = get_comparative_analytics({'focus_score': 8.0}, [])
        assert result['overall_trend'] == 'insufficient_data'
        assert result['periods_compared'] == 0

    def test_declining_trend(self):
        current = {
            'focus_score': 4.0, 'deep_work_hours': 1.5, 'context_switches': 30,
            'meeting_load_pct': 50, 'distraction_index': 40, 'break_quality': 3.0, 'total_hours': 10.0,
        }
        previous = [
            {
                'focus_score': 8.0, 'deep_work_hours': 5.0, 'context_switches': 8,
                'meeting_load_pct': 15, 'distraction_index': 10, 'break_quality': 8.0, 'total_hours': 7.5,
            },
        ]
        result = get_comparative_analytics(current, previous)
        assert result['overall_trend'] in ('declining', 'slightly_declining')
        assert result['regressions'] > result['improvements']

    def test_inverse_metrics(self):
        # Lower context_switches = improved
        current = {'context_switches': 5, 'focus_score': 7}
        previous = [{'context_switches': 20, 'focus_score': 7}]
        result = get_comparative_analytics(current, previous)
        assert result['comparisons']['context_switches']['direction'] == 'improved'

    def test_stable_trend(self):
        current = {'focus_score': 7.0, 'deep_work_hours': 4.0, 'total_hours': 8.0}
        previous = [{'focus_score': 7.0, 'deep_work_hours': 4.0, 'total_hours': 8.0}]
        result = get_comparative_analytics(current, previous)
        assert result['comparisons']['focus_score']['direction'] == 'stable'

    def test_ranking(self):
        current = {'focus_score': 9.0}
        previous = [{'focus_score': 6.0}, {'focus_score': 7.0}, {'focus_score': 8.0}]
        result = get_comparative_analytics(current, previous)
        assert result['comparisons']['focus_score']['rank'] == 1  # Best

    def test_month_period_type(self):
        current = {'focus_score': 7.0}
        previous = [{'focus_score': 6.0}]
        result = get_comparative_analytics(current, previous, period_type='month')
        assert result['period_type'] == 'month'
