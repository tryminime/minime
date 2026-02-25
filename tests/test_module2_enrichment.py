"""
Module 2: Data Enrichment / NER — Comprehensive Test Suite.

Tests all 7 Module 2 features:
1. Enhanced NER (custom EntityRuler patterns)
2. Auto-Tagging (domain/app/title classification)
3. Spelling Correction (tech-aware)
4. Temporal Enrichment (time context)
5. Cross-Activity Entity Resolution
6. Context Enrichment (URL, Git, document type)
7. Enrichment Pipeline (full orchestration)

Run with: python -m pytest tests/test_module2_enrichment.py -v -o "addopts="
"""

import pytest
import sys
import os
from datetime import datetime, time, timedelta
from uuid import UUID

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ============================================================================
# 1. ENHANCED NER TESTS
# ============================================================================

class TestEnhancedNER:
    """Test enhanced NER with custom EntityRuler patterns."""

    def setup_method(self):
        """Create fresh NLPService for each test."""
        from backend.services.nlp_service import NLPService
        # Reset singleton for testing
        NLPService._instance = None
        NLPService._nlp = None
        NLPService._model_name = None
        NLPService._ruler_added = False
        self.service = NLPService()

    def test_basic_entity_extraction(self):
        """Test standard spaCy NER still works."""
        entities = self.service.extract_entities("John Smith works at Google in San Francisco")
        labels = {e['label'] for e in entities}
        # Should find at least PERSON and ORG
        assert len(entities) >= 2
        assert any(e['text'] == 'John Smith' or 'John' in e['text'] for e in entities)

    def test_empty_text_returns_empty(self):
        """Test empty input handling."""
        assert self.service.extract_entities("") == []
        assert self.service.extract_entities("   ") == []
        assert self.service.extract_entities(None) == []

    def test_confidence_scoring(self):
        """Test confidence scores are in valid range."""
        entities = self.service.extract_entities("Apple Inc. is based in Cupertino, California")
        for e in entities:
            assert 0 < e['confidence'] <= 1.0
            assert isinstance(e['confidence'], float)

    def test_entity_structure(self):
        """Test extracted entity dict structure."""
        entities = self.service.extract_entities("Microsoft released Windows 11")
        if entities:
            e = entities[0]
            assert 'text' in e
            assert 'label' in e
            assert 'start' in e
            assert 'end' in e
            assert 'confidence' in e

    def test_long_text_truncation(self):
        """Test that very long text is handled gracefully."""
        long_text = "Google " * 5000
        entities = self.service.extract_entities(long_text)
        # Should not crash, may or may not find entities
        assert isinstance(entities, list)

    def test_extract_entities_enhanced_basic(self):
        """Test enhanced extraction with context."""
        entities = self.service.extract_entities_enhanced(
            "Working on the project with FastAPI",
            context={'app_name': 'Visual Studio Code'}
        )
        # Should have entities from both text and context
        assert len(entities) >= 1
        # Check that source field is present
        for e in entities:
            assert 'source' in e

    def test_extract_entities_enhanced_github_url(self):
        """Test enhanced extraction detects GitHub repos from URL."""
        entities = self.service.extract_entities_enhanced(
            "Reviewing code changes",
            context={'url': 'https://github.com/openai/whisper/pull/42'}
        )
        project_entities = [e for e in entities if e['label'] == 'PROJECT']
        assert len(project_entities) >= 1
        assert 'openai/whisper' in project_entities[0]['text']

    def test_extract_entities_enhanced_deduplication(self):
        """Test that enhanced extraction deduplicates entities."""
        entities = self.service.extract_entities_enhanced(
            "Using Python for Python development",
            context={}
        )
        # Should not have duplicate Python entries with same label
        text_label_pairs = [(e['text'].lower(), e['label']) for e in entities]
        assert len(text_label_pairs) == len(set(text_label_pairs))

    def test_extract_entities_batch(self):
        """Test batch entity extraction."""
        texts = [
            "John works at Google",
            "Microsoft released Azure",
            "Python is a programming language",
        ]
        results = self.service.extract_entities_batch(texts)
        assert len(results) == 3
        assert all(isinstance(r, list) for r in results)

    def test_extract_entities_batch_empty(self):
        """Test batch with empty input."""
        assert self.service.extract_entities_batch([]) == []

    def test_model_name_tracking(self):
        """Test that model name is tracked."""
        self.service.load_model("en_core_web_sm")
        assert self.service.get_model_name() == "en_core_web_sm"

    def test_model_reuse(self):
        """Test model is not reloaded if already loaded."""
        self.service.load_model("en_core_web_sm")
        model1 = self.service.get_model()
        self.service.load_model("en_core_web_sm")
        model2 = self.service.get_model()
        assert model1 is model2


# ============================================================================
# 2. AUTO-TAGGING TESTS
# ============================================================================

class TestAutoTagger:
    """Test auto-tagging system."""

    def setup_method(self):
        from backend.services.auto_tagger import AutoTagger
        self.tagger = AutoTagger()

    def test_tag_from_github_domain(self):
        """Test GitHub domain is tagged as development."""
        result = self.tagger.auto_tag_activity({
            'domain': 'github.com',
            'url': 'https://github.com/user/repo',
            'title': 'Repository'
        })
        assert 'development' in result['tags']
        assert result['primary_category'] == 'development'
        assert result['confidence'] > 0

    def test_tag_from_slack_domain(self):
        """Test Slack domain is tagged as communication."""
        result = self.tagger.auto_tag_activity({
            'domain': 'app.slack.com',
            'title': 'General channel'
        })
        assert 'communication' in result['tags']

    def test_tag_from_app_name_vscode(self):
        """Test VSCode app name is tagged as development."""
        result = self.tagger.auto_tag_activity({
            'app_name': 'Visual Studio Code',
            'title': 'file.py'
        })
        assert 'development' in result['tags']

    def test_tag_from_app_name_figma(self):
        """Test Figma app is tagged as design."""
        result = self.tagger.auto_tag_activity({
            'app_name': 'Figma',
            'title': 'Design mockup'
        })
        assert 'design' in result['tags']

    def test_tag_from_title_pull_request(self):
        """Test PR title pattern detection."""
        result = self.tagger.auto_tag_activity({
            'title': 'Pull request #42: Fix login bug',
        })
        # Should detect code_review from title pattern
        assert any(c['subtag'] == 'code_review' for c in result['categories'] if c.get('subtag'))

    def test_tag_from_title_standup(self):
        """Test meeting title pattern detection."""
        result = self.tagger.auto_tag_activity({
            'title': 'Daily standup meeting',
        })
        assert 'meeting' in result['tags']

    def test_tag_from_entities(self):
        """Test entity-based tagging."""
        result = self.tagger.auto_tag_activity({
            'title': 'Working on code',
            'entities': [{'label': 'TOOL', 'text': 'Python'}]
        })
        assert 'development' in result['tags']

    def test_empty_activity(self):
        """Test empty activity handling."""
        result = self.tagger.auto_tag_activity({})
        assert result['primary_category'] == 'uncategorized'
        assert result['confidence'] == 0.0

    def test_tag_hierarchy(self):
        """Test tag hierarchy retrieval."""
        hierarchy = self.tagger.get_tag_hierarchy()
        assert 'development' in hierarchy
        assert 'ide' in hierarchy['development']

    def test_parent_tag_lookup(self):
        """Test parent tag lookup for subtags."""
        parent = self.tagger.get_parent_tag('ide')
        assert parent == 'development'

    def test_all_tags(self):
        """Test getting all tags."""
        tags = self.tagger.get_all_tags()
        assert len(tags) > 20
        assert 'development' in tags
        assert 'ide' in tags

    def test_context_nested_url(self):
        """Test tagging when URL is nested in context dict."""
        result = self.tagger.auto_tag_activity({
            'context': {'url': 'https://figma.com/design', 'domain': 'figma.com'}
        })
        assert 'design' in result['tags']

    def test_subdomain_matching(self):
        """Test subdomain matching (e.g., mail.google.com)."""
        result = self.tagger.auto_tag_activity({
            'domain': 'mail.google.com',
        })
        assert 'communication' in result['tags']


# ============================================================================
# 3. SPELLING CORRECTION TESTS
# ============================================================================

class TestSpellingCorrection:
    """Test tech-aware spelling correction."""

    def setup_method(self):
        from backend.services.spelling_correction import SpellingCorrector
        self.corrector = SpellingCorrector()

    def test_correct_known_misspelling(self):
        """Test correction of known entity misspellings."""
        result = self.corrector.correct_entity_name("Gogle")
        assert result['was_corrected'] is True
        assert result['corrected'] == 'Google'

    def test_correct_microsoft_misspelling(self):
        """Test correction of Microsoft misspelling."""
        result = self.corrector.correct_entity_name("Mircosoft")
        assert result['was_corrected'] is True
        assert result['corrected'] == 'Microsoft'

    def test_preserve_tech_term_kubectl(self):
        """Test that kubectl is not corrected."""
        assert self.corrector.is_tech_term("kubectl") is True

    def test_preserve_tech_term_npm(self):
        """Test that npm is not corrected."""
        assert self.corrector.is_tech_term("npm") is True

    def test_preserve_tech_term_fastapi(self):
        """Test that fastapi is not corrected."""
        assert self.corrector.is_tech_term("fastapi") is True

    def test_fix_casing_javascript(self):
        """Test casing correction for JavaScript."""
        result = self.corrector.correct_entity_name("javascript")
        assert result['was_corrected'] is True
        assert result['corrected'] == 'JavaScript'

    def test_fix_casing_postgresql(self):
        """Test casing correction for PostgreSQL."""
        result = self.corrector.correct_entity_name("postgresql")
        assert result['was_corrected'] is True
        assert result['corrected'] == 'PostgreSQL'

    def test_no_change_for_correct_name(self):
        """Test that correctly spelled names are unchanged."""
        result = self.corrector.correct_entity_name("Google")
        assert result['was_corrected'] is False
        assert result['corrected'] == 'Google'

    def test_clean_artifacts_trailing_dots(self):
        """Test removal of trailing punctuation."""
        result = self.corrector.correct_entity_name("Google.")
        assert result['corrected'] == 'Google'

    def test_clean_artifacts_quotes(self):
        """Test removal of enclosing quotes."""
        result = self.corrector.correct_entity_name('"Google"')
        assert result['corrected'] == 'Google'

    def test_correct_text_preserves_tech(self):
        """Test text correction preserves tech terms."""
        result = self.corrector.correct_text("Using kubectl with Gogle Cloud")
        assert result['corrected'] == 'Using kubectl with Google Cloud'

    def test_empty_input(self):
        """Test empty input handling."""
        result = self.corrector.correct_entity_name("")
        assert result['was_corrected'] is False

    def test_add_to_whitelist(self):
        """Test adding custom term to whitelist."""
        self.corrector.add_to_whitelist("myCustomTool")
        assert self.corrector.is_tech_term("myCustomTool") is True
        assert self.corrector.is_tech_term("mycustomtool") is True

    def test_add_correction(self):
        """Test adding custom correction rule."""
        self.corrector.add_correction("Aplle", "Apple")
        result = self.corrector.correct_entity_name("Aplle")
        assert result['corrected'] == 'Apple'


# ============================================================================
# 4. TEMPORAL ENRICHMENT TESTS
# ============================================================================

class TestTemporalEnrichment:
    """Test temporal enrichment service."""

    def setup_method(self):
        from backend.services.temporal_enrichment import TemporalEnricher
        self.enricher = TemporalEnricher(timezone_offset=0)

    def test_morning_classification(self):
        """Test morning time-of-day classification."""
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 15, 9, 30, 0)
        })
        assert result['time_of_day'] == 'morning'

    def test_afternoon_classification(self):
        """Test afternoon time-of-day classification."""
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 15, 14, 0, 0)
        })
        assert result['time_of_day'] == 'afternoon'

    def test_evening_classification(self):
        """Test evening time-of-day classification."""
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 15, 19, 0, 0)
        })
        assert result['time_of_day'] == 'evening'

    def test_night_classification(self):
        """Test night time-of-day classification."""
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 15, 23, 0, 0)
        })
        assert result['time_of_day'] == 'night'

    def test_work_hours(self):
        """Test work hours detection (9 AM is work hours)."""
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 16, 10, 0, 0)  # Monday
        })
        assert result['is_work_hours'] is True
        assert result['is_weekend'] is False

    def test_non_work_hours(self):
        """Test non-work hours detection (7 AM is too early)."""
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 15, 7, 0, 0)
        })
        assert result['is_work_hours'] is False

    def test_weekend_detection(self):
        """Test weekend detection (Saturday)."""
        # June 14, 2025 is a Saturday
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 14, 10, 0, 0)
        })
        assert result['is_weekend'] is True

    def test_day_of_week(self):
        """Test day of week extraction."""
        # June 16, 2025 is a Monday
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 16, 10, 0, 0)
        })
        assert result['day_of_week'] == 'Monday'

    def test_duration_categorization(self):
        """Test duration categories."""
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 15, 10, 0, 0),
            'duration_seconds': 300
        })
        assert result['duration_category'] == 'short'  # 5 min = short

    def test_deep_duration(self):
        """Test deep work duration (2+ hours)."""
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 15, 10, 0, 0),
            'duration_seconds': 8000
        })
        assert result['duration_category'] == 'deep'

    def test_session_label(self):
        """Test session labeling."""
        result = self.enricher.enrich_temporal({
            'timestamp': datetime(2025, 6, 15, 10, 30, 0)
        })
        assert result['session_label'] == 'mid_morning'

    def test_no_timestamp(self):
        """Test handling of missing timestamp."""
        result = self.enricher.enrich_temporal({'title': 'No time'})
        assert result['time_of_day'] == 'unknown'

    def test_iso_string_timestamp(self):
        """Test handling of ISO string timestamp."""
        result = self.enricher.enrich_temporal({
            'timestamp': '2025-06-15T10:00:00'
        })
        assert result['time_of_day'] == 'morning'

    def test_temporal_patterns(self):
        """Test recurring pattern detection."""
        activities = [
            {'timestamp': datetime(2025, 6, 16, 9, 0, 0)},  # Monday 9am
            {'timestamp': datetime(2025, 6, 23, 9, 0, 0)},  # Monday 9am
            {'timestamp': datetime(2025, 6, 30, 9, 0, 0)},  # Monday 9am
        ]
        patterns = self.enricher.get_temporal_patterns(activities)
        assert patterns['total_activities'] == 3
        assert len(patterns['recurring_patterns']) >= 1
        assert patterns['recurring_patterns'][0]['day'] == 'Monday'

    def test_empty_patterns(self):
        """Test patterns with no activities."""
        patterns = self.enricher.get_temporal_patterns([])
        assert patterns['total_activities'] == 0
        assert patterns['peak_hours'] == []


# ============================================================================
# 5. CROSS-ACTIVITY ENTITY RESOLUTION TESTS
# ============================================================================

class TestCrossActivityResolver:
    """Test cross-activity entity resolution."""

    def setup_method(self):
        from backend.services.cross_activity_resolver import CrossActivityResolver
        self.resolver = CrossActivityResolver()

    def test_exact_match(self):
        """Test exact name match resolution."""
        entity = {'text': 'John Smith', 'label': 'PERSON', 'platform': 'email'}
        existing = [
            {'text': 'John Smith', 'label': 'PERSON', 'platform': 'slack'},
        ]
        result = self.resolver.resolve_entity(entity, existing)
        assert result['resolved'] is True
        assert result['resolution_method'] == 'exact'
        assert result['cross_platform'] is True

    def test_exact_match_same_platform(self):
        """Test exact match on same platform (not cross-platform)."""
        entity = {'text': 'John Smith', 'label': 'PERSON', 'platform': 'email'}
        existing = [
            {'text': 'John Smith', 'label': 'PERSON', 'platform': 'email'},
        ]
        result = self.resolver.resolve_entity(entity, existing)
        assert result['resolved'] is True
        assert result['cross_platform'] is False

    def test_alias_matching_person(self):
        """Test alias matching for person names."""
        entity = {'text': 'J. Smith', 'label': 'PERSON', 'platform': 'email'}
        existing = [
            {'text': 'John Smith', 'label': 'PERSON', 'platform': 'slack'},
        ]
        result = self.resolver.resolve_entity(entity, existing)
        assert result['resolved'] is True
        assert result['resolution_method'] == 'alias'

    def test_alias_matching_org(self):
        """Test alias matching for organizations (stripping Inc.)."""
        entity = {'text': 'Google', 'label': 'ORG', 'platform': 'browser'}
        existing = [
            {'text': 'Google Inc.', 'label': 'ORG', 'platform': 'desktop'},
        ]
        result = self.resolver.resolve_entity(entity, existing)
        assert result['resolved'] is True

    def test_no_match(self):
        """Test no match returns unresolved."""
        entity = {'text': 'Alice', 'label': 'PERSON', 'platform': 'email'}
        existing = [
            {'text': 'Bob', 'label': 'PERSON', 'platform': 'slack'},
        ]
        result = self.resolver.resolve_entity(entity, existing)
        assert result['resolved'] is False
        assert result['resolution_method'] == 'none'

    def test_label_mismatch(self):
        """Test that different labels don't match (PERSON vs ORG)."""
        entity = {'text': 'Apple', 'label': 'ORG', 'platform': 'browser'}
        existing = [
            {'text': 'Apple', 'label': 'PRODUCT', 'platform': 'desktop'},
        ]
        result = self.resolver.resolve_entity(entity, existing)
        # Should either not resolve or use fuzzy matching
        # Exact match requires same label
        assert not (result['resolved'] and result['resolution_method'] == 'exact')

    def test_batch_resolve(self):
        """Test batch resolution with cluster detection."""
        entities = [
            {'text': 'John Smith', 'label': 'PERSON', 'platform': 'email'},
            {'text': 'John Smith', 'label': 'PERSON', 'platform': 'slack'},
            {'text': 'Jane Doe', 'label': 'PERSON', 'platform': 'email'},
        ]
        result = self.resolver.batch_resolve(entities)
        assert result['resolved_count'] >= 2  # John Smith cluster
        assert len(result['merge_suggestions']) >= 1

    def test_batch_empty(self):
        """Test batch with empty input."""
        result = self.resolver.batch_resolve([])
        assert result['resolved_count'] == 0
        assert result['clusters'] == []

    def test_fuzzy_match_person(self):
        """Test fuzzy matching for slightly different person names."""
        entity = {'text': 'John', 'label': 'PERSON', 'platform': 'email'}
        existing = [
            {'text': 'John Smith', 'label': 'PERSON', 'platform': 'slack'},
        ]
        result = self.resolver.resolve_entity(entity, existing)
        # Fuzzy match might catch this depending on threshold
        if result['resolved']:
            assert result['resolution_method'] in ('fuzzy', 'alias')

    def test_empty_entity(self):
        """Test empty entity handling."""
        result = self.resolver.resolve_entity({}, [])
        assert result['resolved'] is False


# ============================================================================
# 6. CONTEXT ENRICHMENT TESTS
# ============================================================================

class TestContextEnrichment:
    """Test context enrichment in NLPService."""

    def setup_method(self):
        from backend.services.nlp_service import NLPService
        NLPService._instance = None
        NLPService._nlp = None
        NLPService._model_name = None
        NLPService._ruler_added = False
        self.service = NLPService()

    def test_document_type_code(self):
        """Test document type classification for code."""
        result = self.service.enrich_context({
            'context': {'url': 'https://github.com/user/repo'}
        })
        assert result['document_type'] == 'code'

    def test_document_type_email(self):
        """Test document type classification for email."""
        result = self.service.enrich_context({
            'context': {'url': 'https://mail.google.com/mail/inbox'}
        })
        assert result['document_type'] == 'email'

    def test_document_type_chat(self):
        """Test document type classification for chat."""
        result = self.service.enrich_context({
            'context': {'url': 'https://app.slack.com/channel'}
        })
        assert result['document_type'] == 'chat'

    def test_document_type_meeting(self):
        """Test document type classification for meetings."""
        result = self.service.enrich_context({
            'context': {'url': 'https://zoom.us/j/12345'}
        })
        assert result['document_type'] == 'meeting'

    def test_url_parsing(self):
        """Test URL parsing into components."""
        result = self.service.enrich_context({
            'url': 'https://github.com/user/repo/pull/42'
        })
        assert 'url_components' in result
        assert result['url_components']['domain'] == 'github.com'

    def test_git_context_github(self):
        """Test Git context extraction from GitHub URL."""
        result = self.service.enrich_context({
            'url': 'https://github.com/openai/whisper/tree/main'
        })
        assert 'git_context' in result
        assert result['git_context']['platform'] == 'github'
        assert result['git_context']['owner'] == 'openai'
        assert result['git_context']['repo'] == 'whisper'

    def test_git_context_gitlab(self):
        """Test Git context extraction from GitLab URL."""
        result = self.service.enrich_context({
            'url': 'https://gitlab.com/org/project/blob/main/file.py'
        })
        assert 'git_context' in result
        assert result['git_context']['platform'] == 'gitlab'

    def test_urgency_high(self):
        """Test high urgency detection."""
        result = self.service.enrich_context({
            'title': 'URGENT: Production outage in payments service'
        })
        assert result['urgency'] == 'high'

    def test_urgency_medium(self):
        """Test medium urgency detection."""
        result = self.service.enrich_context({
            'title': 'Important: Review needed for API changes'
        })
        assert result['urgency'] == 'medium'

    def test_urgency_low(self):
        """Test low urgency (default)."""
        result = self.service.enrich_context({
            'title': 'Updated documentation'
        })
        assert result['urgency'] == 'low'

    def test_empty_activity(self):
        """Test with empty activity dict."""
        result = self.service.enrich_context({})
        assert result['document_type'] == 'other'
        assert result['urgency'] == 'low'


# ============================================================================
# 7. ENRICHMENT PIPELINE TESTS
# ============================================================================

class TestEnrichmentPipeline:
    """Test the full enrichment pipeline orchestration."""

    def setup_method(self):
        from backend.services.nlp_service import NLPService
        NLPService._instance = None
        NLPService._nlp = None
        NLPService._model_name = None
        NLPService._ruler_added = False

        from backend.services.enrichment_pipeline import EnrichmentPipeline
        self.pipeline = EnrichmentPipeline()

    def test_full_pipeline_github_activity(self):
        """Test full pipeline on a GitHub browsing activity."""
        result = self.pipeline.enrich_activity({
            'title': 'openai/whisper: Speech Recognition',
            'url': 'https://github.com/openai/whisper',
            'domain': 'github.com',
            'app_name': 'Chrome',
            'timestamp': datetime(2025, 6, 15, 10, 30, 0),
            'context': {
                'url': 'https://github.com/openai/whisper',
                'domain': 'github.com',
                'title': 'openai/whisper: Speech Recognition',
            }
        })

        # Pipeline structure
        assert 'entities' in result
        assert 'tags' in result
        assert 'temporal' in result
        assert 'context' in result
        assert 'pipeline_metadata' in result

        # Pipeline completed stages
        meta = result['pipeline_metadata']
        assert 'ner' in meta['stages_completed']
        assert 'temporal' in meta['stages_completed']
        assert 'auto_tag' in meta['stages_completed']
        assert 'context' in meta['stages_completed']
        assert meta['total_time_seconds'] > 0

    def test_full_pipeline_vscode_activity(self):
        """Test full pipeline on a VSCode coding activity."""
        result = self.pipeline.enrich_activity({
            'title': 'main.py - MiniMe - Visual Studio Code',
            'app_name': 'Visual Studio Code',
            'timestamp': datetime(2025, 6, 15, 14, 0, 0),
            'duration_seconds': 1800,
            'context': {
                'app_name': 'Visual Studio Code',
                'title': 'main.py - MiniMe - Visual Studio Code',
            }
        })

        # Should have temporal data
        assert result['temporal']['time_of_day'] == 'afternoon'
        assert result['temporal']['duration_category'] == 'long'

        # Should be tagged as development
        if result['tags'].get('tags'):
            assert 'development' in result['tags']['tags']

    def test_full_pipeline_meeting_activity(self):
        """Test full pipeline on a meeting activity."""
        result = self.pipeline.enrich_activity({
            'title': 'Daily standup with the team',
            'app_name': 'Zoom',
            'timestamp': datetime(2025, 6, 16, 9, 0, 0),  # Monday morning
            'duration_seconds': 900,
            'context': {
                'url': 'https://zoom.us/j/123456',
                'title': 'Daily standup with the team',
            }
        })

        assert result['temporal']['is_work_hours'] is True
        assert result['temporal']['day_of_week'] == 'Monday'
        assert result['context']['document_type'] == 'meeting'

    def test_pipeline_empty_activity(self):
        """Test pipeline handles empty activity gracefully."""
        result = self.pipeline.enrich_activity({})
        assert 'entities' in result
        assert 'pipeline_metadata' in result

    def test_pipeline_batch(self):
        """Test batch enrichment."""
        activities = [
            {'title': 'Working on React app', 'timestamp': datetime(2025, 6, 15, 10, 0, 0)},
            {'title': 'Slack conversation', 'timestamp': datetime(2025, 6, 15, 11, 0, 0)},
        ]
        results = self.pipeline.enrich_batch(activities)
        assert len(results) == 2

    def test_pipeline_stages_list(self):
        """Test pipeline stages listing."""
        stages = self.pipeline.get_pipeline_stages()
        assert 'ner' in stages
        assert 'spelling' in stages
        assert 'temporal' in stages
        assert 'auto_tag' in stages
        assert 'context' in stages

    def test_pipeline_metadata_timing(self):
        """Test pipeline metadata includes timing."""
        result = self.pipeline.enrich_activity({
            'title': 'Quick test',
            'timestamp': datetime(2025, 6, 15, 10, 0, 0)
        })
        meta = result['pipeline_metadata']
        assert 'total_time_seconds' in meta
        assert 'stage_timings' in meta
        assert 'started_at' in meta
        assert 'completed_at' in meta

    def test_pipeline_entity_count(self):
        """Test pipeline tracks entity count in metadata."""
        result = self.pipeline.enrich_activity({
            'title': 'John Smith from Google presented at the conference',
            'timestamp': datetime(2025, 6, 15, 10, 0, 0)
        })
        meta = result['pipeline_metadata']
        assert 'entity_count' in meta
        assert meta['entity_count'] >= 0


# ============================================================================
# 8. EVENT BUS ENRICHMENT EVENTS TESTS
# ============================================================================

class TestEventBusEnrichment:
    """Test enrichment-related event bus methods."""

    def test_event_bus_has_enriched_method(self):
        """Test EventBus has publish_activity_enriched method."""
        from backend.services.event_bus import EventBus
        assert hasattr(EventBus, 'publish_activity_enriched')

    def test_event_bus_has_failed_method(self):
        """Test EventBus has publish_enrichment_failed method."""
        from backend.services.event_bus import EventBus
        assert hasattr(EventBus, 'publish_enrichment_failed')


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-o", "addopts="])
