"""
Comprehensive test suite for Module 7: Privacy & Settings

Tests three services:
- NotificationPreferencesService (preferences, DND, scheduling, digest, history)
- IntegrationManagementService (registry, connections, sync, data flow, health)
- PrivacySettingsService (settings, retention, PII detection, export, audit)
"""

import pytest
from datetime import datetime, timedelta

from backend.services.notification_preferences_service import (
    NotificationPreferencesService,
    NotificationChannel,
    NotificationType,
    NotificationPriority,
)
from backend.services.integration_management_service import (
    IntegrationManagementService,
    IntegrationStatus,
    SyncFrequency,
)
from backend.services.privacy_settings_service import (
    PrivacySettingsService,
    EncryptionLevel,
    RetentionPolicy,
)


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def notif_service():
    return NotificationPreferencesService()


@pytest.fixture
def integ_service():
    return IntegrationManagementService()


@pytest.fixture
def privacy_service():
    return PrivacySettingsService()


# ============================================================================
# TEST NOTIFICATION PREFERENCES
# ============================================================================

class TestNotificationPreferences:

    def test_get_defaults(self, notif_service):
        prefs = notif_service.get_preferences('user-1')
        assert prefs['channels'][NotificationChannel.IN_APP.value] is True
        assert prefs['channels'][NotificationChannel.EMAIL.value] is False
        assert prefs['dnd']['enabled'] is False

    def test_update_channels(self, notif_service):
        notif_service.update_preferences('user-1', {
            'channels': {NotificationChannel.EMAIL.value: True},
        })
        prefs = notif_service.get_preferences('user-1')
        assert prefs['channels'][NotificationChannel.EMAIL.value] is True
        assert prefs['channels'][NotificationChannel.IN_APP.value] is True  # unchanged

    def test_update_types(self, notif_service):
        notif_service.update_preferences('user-1', {
            'types': {NotificationType.AI_INSIGHT.value: False},
        })
        prefs = notif_service.get_preferences('user-1')
        assert prefs['types'][NotificationType.AI_INSIGHT.value] is False

    def test_set_channel(self, notif_service):
        notif_service.set_channel('user-1', 'browser_push', True)
        prefs = notif_service.get_preferences('user-1')
        assert prefs['channels']['browser_push'] is True

    def test_set_type(self, notif_service):
        notif_service.set_type('user-1', 'daily_summary', False)
        prefs = notif_service.get_preferences('user-1')
        assert prefs['types']['daily_summary'] is False

    def test_reset_to_defaults(self, notif_service):
        notif_service.update_preferences('user-1', {
            'channels': {NotificationChannel.EMAIL.value: True},
        })
        notif_service.reset_to_defaults('user-1')
        prefs = notif_service.get_preferences('user-1')
        assert prefs['channels'][NotificationChannel.EMAIL.value] is False

    def test_frequency_caps(self, notif_service):
        notif_service.update_preferences('user-1', {
            'frequency_caps': {'max_per_hour': 5},
        })
        prefs = notif_service.get_preferences('user-1')
        assert prefs['frequency_caps']['max_per_hour'] == 5


class TestDND:

    def test_set_dnd(self, notif_service):
        result = notif_service.set_dnd('user-1', True, start_hour=22, end_hour=8)
        assert result['enabled'] is True
        assert result['start_hour'] == 22
        assert result['end_hour'] == 8

    def test_dnd_not_active_when_disabled(self, notif_service):
        assert notif_service.is_dnd_active('user-1') is False

    def test_dnd_active_overnight(self, notif_service):
        notif_service.set_dnd('user-1', True, start_hour=22, end_hour=8)
        # At 23:00 should be active
        late_night = datetime(2026, 2, 15, 23, 0)
        assert notif_service.is_dnd_active('user-1', late_night) is True

    def test_dnd_inactive_during_day(self, notif_service):
        notif_service.set_dnd('user-1', True, start_hour=22, end_hour=8)
        # At 14:00 should not be active
        afternoon = datetime(2026, 2, 15, 14, 0)
        assert notif_service.is_dnd_active('user-1', afternoon) is False

    def test_dnd_active_early_morning(self, notif_service):
        notif_service.set_dnd('user-1', True, start_hour=22, end_hour=8)
        early = datetime(2026, 2, 15, 5, 0)
        assert notif_service.is_dnd_active('user-1', early) is True

    def test_dnd_override_critical(self, notif_service):
        notif_service.set_dnd('user-1', True, start_hour=22, end_hour=8, override_critical=True)
        prefs = notif_service.get_preferences('user-1')
        assert prefs['dnd']['override_critical'] is True


class TestNotificationScheduling:

    def test_should_send_basic(self, notif_service):
        result = notif_service.should_send('user-1', 'daily_summary', 'in_app')
        assert result['send'] is True

    def test_should_not_send_disabled_channel(self, notif_service):
        result = notif_service.should_send('user-1', 'daily_summary', 'email')
        assert result['send'] is False
        assert 'disabled' in result['reason']

    def test_should_not_send_disabled_type(self, notif_service):
        notif_service.set_type('user-1', 'ai_insight', False)
        result = notif_service.should_send('user-1', 'ai_insight', 'in_app')
        assert result['send'] is False

    def test_should_not_send_during_dnd(self, notif_service):
        notif_service.set_dnd('user-1', True, start_hour=22, end_hour=8)
        late = datetime(2026, 2, 15, 23, 0)
        result = notif_service.should_send('user-1', 'daily_summary', 'in_app', check_time=late)
        assert result['send'] is False
        assert result['reason'] == 'dnd_active'

    def test_critical_overrides_dnd(self, notif_service):
        notif_service.set_dnd('user-1', True, start_hour=22, end_hour=8, override_critical=True)
        late = datetime(2026, 2, 15, 23, 0)
        result = notif_service.should_send('user-1', 'system', 'in_app', priority='critical', check_time=late)
        assert result['send'] is True

    def test_hourly_cap(self, notif_service):
        notif_service.update_preferences('user-1', {
            'frequency_caps': {'max_per_hour': 2},
        })
        now = datetime(2026, 2, 15, 10, 0)
        notif_service.record_send('user-1', now)
        notif_service.record_send('user-1', now)
        result = notif_service.should_send('user-1', 'daily_summary', 'in_app', check_time=now)
        assert result['send'] is False
        assert result['reason'] == 'hourly_cap_reached'

    def test_digest_mode(self, notif_service):
        notif_service.update_preferences('user-1', {
            'frequency_caps': {'digest_mode': True},
        })
        result = notif_service.should_send('user-1', 'daily_summary', 'in_app')
        assert result['send'] is False
        assert result['reason'] == 'digest_mode_active'


class TestNotificationHistory:

    def test_add_notification(self, notif_service):
        n = notif_service.add_notification('user-1', 'daily_summary', 'Daily Report', 'Here is your report')
        assert n['id']
        assert n['read'] is False

    def test_get_notifications(self, notif_service):
        notif_service.add_notification('user-1', 'daily_summary', 'Report 1', 'msg')
        notif_service.add_notification('user-1', 'ai_insight', 'Insight', 'msg')
        result = notif_service.get_notifications('user-1')
        assert len(result) == 2

    def test_get_unread_only(self, notif_service):
        n = notif_service.add_notification('user-1', 'daily_summary', 'Report', 'msg')
        notif_service.add_notification('user-1', 'ai_insight', 'Insight', 'msg')
        notif_service.mark_read('user-1', n['id'])
        result = notif_service.get_notifications('user-1', unread_only=True)
        assert len(result) == 1

    def test_mark_all_read(self, notif_service):
        notif_service.add_notification('user-1', 'a', 'A', 'msg')
        notif_service.add_notification('user-1', 'b', 'B', 'msg')
        count = notif_service.mark_all_read('user-1')
        assert count == 2
        assert notif_service.get_unread_count('user-1') == 0

    def test_delete_notification(self, notif_service):
        n = notif_service.add_notification('user-1', 'a', 'A', 'msg')
        assert notif_service.delete_notification('user-1', n['id']) is True
        assert len(notif_service.get_notifications('user-1')) == 0

    def test_clear_all(self, notif_service):
        notif_service.add_notification('user-1', 'a', 'A', 'msg')
        notif_service.add_notification('user-1', 'b', 'B', 'msg')
        count = notif_service.clear_all('user-1')
        assert count == 2

    def test_generate_digest(self, notif_service):
        notif_service.add_notification('user-1', 'daily_summary', 'Report', 'msg')
        notif_service.add_notification('user-1', 'ai_insight', 'Insight', 'msg')
        digest = notif_service.generate_digest('user-1', 'daily')
        assert digest['total_count'] == 2
        assert digest['unread_count'] == 2
        assert 'daily_summary' in digest['by_type']


# ============================================================================
# TEST INTEGRATION MANAGEMENT
# ============================================================================

class TestIntegrationRegistry:

    def test_list_available(self, integ_service):
        available = integ_service.list_available()
        assert len(available) >= 5
        providers = [a['provider'] for a in available]
        assert 'github' in providers
        assert 'google_calendar' in providers
        assert 'notion' in providers

    def test_get_integration_info(self, integ_service):
        info = integ_service.get_integration_info('github')
        assert info['name'] == 'GitHub'
        assert 'commits' in info['capabilities']

    def test_unknown_integration(self, integ_service):
        assert integ_service.get_integration_info('unknown') is None


class TestConnectionManagement:

    def test_connect(self, integ_service):
        conn = integ_service.connect('user-1', 'github', username='testuser')
        assert conn['status'] == IntegrationStatus.CONNECTED.value
        assert conn['username'] == 'testuser'

    def test_connect_unknown_raises(self, integ_service):
        with pytest.raises(ValueError):
            integ_service.connect('user-1', 'unknown_service')

    def test_disconnect(self, integ_service):
        integ_service.connect('user-1', 'github')
        assert integ_service.disconnect('user-1', 'github') is True
        conn = integ_service.get_connection('user-1', 'github')
        assert conn['status'] == IntegrationStatus.DISCONNECTED.value

    def test_reconnect(self, integ_service):
        integ_service.connect('user-1', 'github')
        integ_service.disconnect('user-1', 'github')
        conn = integ_service.reconnect('user-1', 'github')
        assert conn['status'] == IntegrationStatus.CONNECTED.value

    def test_get_all_connections(self, integ_service):
        integ_service.connect('user-1', 'github')
        connections = integ_service.get_all_connections('user-1')
        assert len(connections) >= 5  # All registered providers
        github = next(c for c in connections if c['provider'] == 'github')
        assert github['status'] == IntegrationStatus.CONNECTED.value


class TestSyncManagement:

    def test_record_sync_success(self, integ_service):
        integ_service.connect('user-1', 'github')
        record = integ_service.record_sync('user-1', 'github', True, items_synced=42)
        assert record['success'] is True
        assert record['items_synced'] == 42

    def test_record_sync_failure(self, integ_service):
        integ_service.connect('user-1', 'github')
        integ_service.record_sync('user-1', 'github', False, error_message='timeout')
        conn = integ_service.get_connection('user-1', 'github')
        assert conn['sync_errors'] == 1

    def test_error_state_after_failures(self, integ_service):
        integ_service.connect('user-1', 'github')
        for _ in range(3):
            integ_service.record_sync('user-1', 'github', False)
        conn = integ_service.get_connection('user-1', 'github')
        assert conn['status'] == IntegrationStatus.ERROR.value

    def test_sync_history(self, integ_service):
        integ_service.connect('user-1', 'github')
        integ_service.record_sync('user-1', 'github', True, items_synced=10)
        integ_service.record_sync('user-1', 'github', True, items_synced=20)
        history = integ_service.get_sync_history('user-1', 'github')
        assert len(history) == 2

    def test_set_sync_frequency(self, integ_service):
        integ_service.connect('user-1', 'github')
        integ_service.set_sync_frequency('user-1', 'github', SyncFrequency.DAILY.value)
        conn = integ_service.get_connection('user-1', 'github')
        assert conn['sync_frequency'] == SyncFrequency.DAILY.value

    def test_needs_sync_no_history(self, integ_service):
        integ_service.connect('user-1', 'github')
        assert integ_service.needs_sync('user-1', 'github') is True

    def test_needs_sync_manual(self, integ_service):
        integ_service.connect('user-1', 'github')
        integ_service.set_sync_frequency('user-1', 'github', SyncFrequency.MANUAL.value)
        assert integ_service.needs_sync('user-1', 'github') is False


class TestDataFlowControls:

    def test_set_data_permissions(self, integ_service):
        integ_service.connect('user-1', 'github')
        perms = integ_service.set_data_permissions('user-1', 'github', {'commits': False})
        assert perms['commits'] is False
        assert perms['pull_requests'] is True  # unchanged

    def test_get_data_permissions(self, integ_service):
        integ_service.connect('user-1', 'github')
        perms = integ_service.get_data_permissions('user-1', 'github')
        assert all(v is True for v in perms.values())


class TestIntegrationHealth:

    def test_health_connected(self, integ_service):
        integ_service.connect('user-1', 'github')
        integ_service.record_sync('user-1', 'github', True)
        health = integ_service.get_health('user-1', 'github')
        assert health['healthy'] is True

    def test_health_not_connected(self, integ_service):
        health = integ_service.get_health('user-1', 'github')
        assert health['healthy'] is False

    def test_health_expired_token(self, integ_service):
        past = (datetime.now() - timedelta(hours=1)).isoformat()
        integ_service.connect('user-1', 'github', token_expires_at=past)
        health = integ_service.get_health('user-1', 'github')
        assert health['token_expired'] is True
        assert health['healthy'] is False

    def test_health_recommendations(self, integ_service):
        past = (datetime.now() - timedelta(hours=1)).isoformat()
        integ_service.connect('user-1', 'github', token_expires_at=past)
        health = integ_service.get_health('user-1', 'github')
        assert len(health['recommendations']) > 0

    def test_get_all_health(self, integ_service):
        integ_service.connect('user-1', 'github')
        integ_service.connect('user-1', 'notion')
        results = integ_service.get_all_health('user-1')
        assert len(results) == 2


# ============================================================================
# TEST PRIVACY SETTINGS
# ============================================================================

class TestPrivacyProfile:

    def test_get_defaults(self, privacy_service):
        settings = privacy_service.get_settings('user-1')
        assert settings['data_filtering']['filter_credit_cards'] is True
        assert settings['encryption']['level'] == EncryptionLevel.LOCAL.value
        assert settings['retention']['policy'] == RetentionPolicy.DAYS_90.value

    def test_update_filtering(self, privacy_service):
        privacy_service.update_settings('user-1', {
            'data_filtering': {'filter_emails': True},
        })
        settings = privacy_service.get_settings('user-1')
        assert settings['data_filtering']['filter_emails'] is True

    def test_update_encryption(self, privacy_service):
        privacy_service.update_settings('user-1', {
            'encryption': {'level': EncryptionLevel.E2E.value},
        })
        settings = privacy_service.get_settings('user-1')
        assert settings['encryption']['level'] == EncryptionLevel.E2E.value

    def test_update_retention(self, privacy_service):
        privacy_service.update_settings('user-1', {
            'retention': {'policy': RetentionPolicy.DAYS_30.value},
        })
        settings = privacy_service.get_settings('user-1')
        assert settings['retention']['policy'] == RetentionPolicy.DAYS_30.value
        assert settings['retention']['retention_days'] == 30

    def test_update_data_collection(self, privacy_service):
        privacy_service.update_settings('user-1', {
            'data_collection': {'track_screenshots': True},
        })
        settings = privacy_service.get_settings('user-1')
        assert settings['data_collection']['track_screenshots'] is True

    def test_reset_to_defaults(self, privacy_service):
        privacy_service.update_settings('user-1', {
            'encryption': {'level': EncryptionLevel.E2E.value},
        })
        privacy_service.reset_to_defaults('user-1')
        settings = privacy_service.get_settings('user-1')
        assert settings['encryption']['level'] == EncryptionLevel.LOCAL.value


class TestDataRetention:

    def test_get_retention_policy(self, privacy_service):
        policy = privacy_service.get_retention_policy('user-1')
        assert policy['retention_days'] == 90

    def test_compute_purge_cutoff(self, privacy_service):
        cutoff = privacy_service.compute_purge_cutoff('user-1')
        assert cutoff is not None
        assert cutoff < datetime.now()

    def test_purge_cutoff_forever(self, privacy_service):
        privacy_service.update_settings('user-1', {
            'retention': {'policy': RetentionPolicy.FOREVER.value},
        })
        assert privacy_service.compute_purge_cutoff('user-1') is None

    def test_identify_purgeable(self, privacy_service):
        now = datetime.now()
        data = [
            {'id': '1', 'created_at': (now - timedelta(days=100)).isoformat()},
            {'id': '2', 'created_at': (now - timedelta(days=50)).isoformat()},
            {'id': '3', 'created_at': (now - timedelta(days=10)).isoformat()},
        ]
        result = privacy_service.identify_purgeable_data('user-1', data)
        assert result['purge_count'] == 1  # 100 days > 90 day policy
        assert result['keep_count'] == 2

    def test_identify_purgeable_forever(self, privacy_service):
        privacy_service.update_settings('user-1', {
            'retention': {'policy': RetentionPolicy.FOREVER.value},
        })
        data = [{'id': '1', 'created_at': (datetime.now() - timedelta(days=1000)).isoformat()}]
        result = privacy_service.identify_purgeable_data('user-1', data)
        assert result['purge_count'] == 0


class TestPIIDetection:

    def test_detect_credit_card(self, privacy_service):
        result = privacy_service.detect_pii('My card is 4111111111111111')
        assert result['has_pii'] is True
        assert 'credit_card' in result['categories_found']

    def test_detect_ssn(self, privacy_service):
        result = privacy_service.detect_pii('SSN: 123-45-6789')
        assert result['has_pii'] is True
        assert 'ssn' in result['categories_found']

    def test_detect_email(self, privacy_service):
        result = privacy_service.detect_pii('Contact alice@example.com')
        assert result['has_pii'] is True
        assert 'email' in result['categories_found']

    def test_detect_no_pii(self, privacy_service):
        result = privacy_service.detect_pii('This is a normal sentence.')
        assert result['has_pii'] is False

    def test_detect_empty(self, privacy_service):
        result = privacy_service.detect_pii('')
        assert result['has_pii'] is False

    def test_filter_pii(self, privacy_service):
        result = privacy_service.filter_pii('user-1', 'Card: 4111111111111111 SSN: 123-45-6789')
        assert result['was_modified'] is True
        assert 'CREDIT_CARD_REDACTED' in result['sanitized_text']
        assert 'SSN_REDACTED' in result['sanitized_text']

    def test_filter_respects_settings(self, privacy_service):
        # Email filtering is off by default
        result = privacy_service.filter_pii('user-1', 'Email: alice@example.com')
        assert result['was_modified'] is False
        # Enable it
        privacy_service.update_settings('user-1', {
            'data_filtering': {'filter_emails': True},
        })
        result = privacy_service.filter_pii('user-1', 'Email: alice@example.com')
        assert result['was_modified'] is True


class TestGDPRExport:

    def test_generate_export_json(self, privacy_service):
        export = privacy_service.generate_data_export('user-1', {
            'profile': {'name': 'Alice'},
            'activities': [{'id': '1'}],
        })
        assert export['gdpr_compliant'] is True
        assert export['format'] == 'json'
        assert 'profile' in export['includes']

    def test_export_history(self, privacy_service):
        privacy_service.generate_data_export('user-1', {'data': []})
        history = privacy_service.get_export_history('user-1')
        assert len(history) == 1

    def test_export_creates_audit_entry(self, privacy_service):
        privacy_service.generate_data_export('user-1', {'data': []})
        log = privacy_service.get_audit_log('user-1', action='data_export')
        assert len(log) == 1


class TestAuditLog:

    def test_settings_update_logged(self, privacy_service):
        privacy_service.update_settings('user-1', {
            'encryption': {'level': EncryptionLevel.E2E.value},
        })
        log = privacy_service.get_audit_log('user-1')
        assert len(log) >= 1
        assert log[0]['action'] == 'settings_updated'

    def test_reset_logged(self, privacy_service):
        privacy_service.reset_to_defaults('user-1')
        log = privacy_service.get_audit_log('user-1', action='settings_reset')
        assert len(log) == 1

    def test_audit_summary(self, privacy_service):
        privacy_service.update_settings('user-1', {'encryption': {'level': 'e2e'}})
        privacy_service.update_settings('user-1', {'encryption': {'level': 'local'}})
        summary = privacy_service.get_audit_summary('user-1')
        assert summary['total_entries'] == 2
        assert summary['action_counts']['settings_updated'] == 2
