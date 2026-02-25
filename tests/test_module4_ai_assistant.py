"""
Comprehensive test suite for Module 4: AI Assistant

Tests:
- ConversationService (CRUD, messaging, memory, stats)
- RAGService (retrieval, augmentation, citations, search)
- ProactiveInsightsService (generation, retrieval, analysis)
- ConversationExportService (markdown, json, txt, pdf, bulk)
- RecommendationService (tools, workflows, collaboration, learning, time)
"""

import pytest
from datetime import datetime, timedelta

# Import services
from backend.services.conversation_service import ConversationService
from backend.services.rag_service import RAGService, Citation
from backend.services.proactive_insights_service import ProactiveInsightsService, Insight
from backend.services.conversation_export_service import ConversationExportService
from backend.services.recommendation_service import RecommendationService


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def conv_service():
    return ConversationService()


@pytest.fixture
def rag_service():
    store = {
        'activities': [
            {
                'id': 'act-1',
                'title': 'Python development session',
                'content': 'Worked on MiniMe backend API with FastAPI and SQLAlchemy',
                'type': 'activity',
                'timestamp': datetime.now(tz=None).isoformat(),
                'embedding': [0.1, 0.2, 0.3, 0.4],
            },
            {
                'id': 'act-2',
                'title': 'Machine learning research',
                'content': 'Reading papers on transformer architectures and attention mechanisms',
                'type': 'activity',
                'timestamp': datetime.now(tz=None).isoformat(),
                'embedding': [0.5, 0.6, 0.7, 0.8],
            },
            {
                'id': 'act-3',
                'title': 'Team meeting discussion',
                'content': 'Sprint planning for next week project milestones',
                'type': 'meeting',
                'timestamp': datetime.now(tz=None).isoformat(),
            },
        ],
        'notes': [
            {
                'id': 'note-1',
                'title': 'API Design Notes',
                'content': 'REST API design principles for MiniMe backend endpoints',
                'type': 'note',
                'timestamp': datetime.now(tz=None).isoformat(),
                'embedding': [0.15, 0.25, 0.35, 0.45],
            },
        ],
    }
    return RAGService(knowledge_store=store)


@pytest.fixture
def insights_service():
    return ProactiveInsightsService()


@pytest.fixture
def export_service():
    return ConversationExportService()


@pytest.fixture
def rec_service():
    return RecommendationService()


@pytest.fixture
def sample_conversation():
    return {
        'id': 'conv-123',
        'title': 'Productivity Discussion',
        'user_id': 'user-1',
        'created_at': '2026-02-13T12:00:00',
        'messages': [
            {
                'role': 'user',
                'content': 'What is my focus score?',
                'created_at': '2026-02-13T12:00:00',
            },
            {
                'role': 'assistant',
                'content': 'Your focus score is 8.2/10! Great job.',
                'created_at': '2026-02-13T12:00:05',
                'model': 'demo',
                'citations': [
                    {'title': 'Today Focus Data', 'snippet': 'Focus score: 8.2'},
                ],
            },
        ],
    }


@pytest.fixture
def daily_metrics():
    return {
        'focus_score': 8.5,
        'total_hours': 9.2,
        'deep_work_hours': 4.5,
        'meeting_hours': 2.0,
        'meeting_count': 3,
        'late_night_hours': 0,
        'skills_used_today': 6,
        'total_career_hours': 500,
    }


@pytest.fixture
def historical_metrics():
    return [
        {'focus_score': 7.0, 'total_hours': 8.0, 'deep_work_hours': 3.0},
        {'focus_score': 7.5, 'total_hours': 7.5, 'deep_work_hours': 3.5},
        {'focus_score': 6.8, 'total_hours': 9.0, 'deep_work_hours': 2.5},
        {'focus_score': 7.2, 'total_hours': 8.5, 'deep_work_hours': 3.2},
        {'focus_score': 7.8, 'total_hours': 8.0, 'deep_work_hours': 3.8},
        {'focus_score': 7.4, 'total_hours': 8.2, 'deep_work_hours': 3.4},
        {'focus_score': 7.6, 'total_hours': 8.3, 'deep_work_hours': 3.6},
    ]


# ============================================================================
# TEST CONVERSATION SERVICE
# ============================================================================

class TestConversationService:

    def test_create_conversation(self, conv_service):
        result = conv_service.create_conversation('user-1', title='Test Chat')
        assert result['user_id'] == 'user-1'
        assert result['title'] == 'Test Chat'
        assert result['message_count'] == 0
        assert 'id' in result

    def test_create_conversation_default_title(self, conv_service):
        result = conv_service.create_conversation('user-1')
        assert result['title'] == 'New Conversation'

    def test_get_conversation(self, conv_service):
        created = conv_service.create_conversation('user-1', title='Test')
        result = conv_service.get_conversation('user-1', created['id'])
        assert result is not None
        assert result['title'] == 'Test'

    def test_get_conversation_not_found(self, conv_service):
        result = conv_service.get_conversation('user-1', 'nonexistent')
        assert result is None

    def test_list_conversations(self, conv_service):
        conv_service.create_conversation('user-1', title='Chat 1')
        conv_service.create_conversation('user-1', title='Chat 2')
        result = conv_service.list_conversations('user-1')
        assert result['total'] == 2
        assert len(result['conversations']) == 2

    def test_list_conversations_excludes_archived(self, conv_service):
        conv_service.create_conversation('user-1', title='Active')
        created = conv_service.create_conversation('user-1', title='Archived')
        conv_service.archive_conversation('user-1', created['id'])
        result = conv_service.list_conversations('user-1', include_archived=False)
        assert result['total'] == 1

    def test_archive_conversation(self, conv_service):
        created = conv_service.create_conversation('user-1')
        result = conv_service.archive_conversation('user-1', created['id'])
        assert result['archived'] is True

    def test_delete_conversation(self, conv_service):
        created = conv_service.create_conversation('user-1')
        assert conv_service.delete_conversation('user-1', created['id']) is True
        assert conv_service.get_conversation('user-1', created['id']) is None

    def test_delete_nonexistent(self, conv_service):
        assert conv_service.delete_conversation('user-1', 'nope') is False

    def test_update_conversation(self, conv_service):
        created = conv_service.create_conversation('user-1')
        result = conv_service.update_conversation('user-1', created['id'], title='Updated')
        assert result['title'] == 'Updated'

    def test_add_message(self, conv_service):
        created = conv_service.create_conversation('user-1')
        msg = conv_service.add_message('user-1', created['id'], 'user', 'Hello!')
        assert msg['role'] == 'user'
        assert msg['content'] == 'Hello!'

    def test_auto_title_from_first_message(self, conv_service):
        created = conv_service.create_conversation('user-1')
        conv_service.add_message('user-1', created['id'], 'user', 'What is my focus score today?')
        conv = conv_service.get_conversation('user-1', created['id'])
        assert conv['title'] == 'What is my focus score today?'

    def test_auto_create_conversation_on_message(self, conv_service):
        msg = conv_service.add_message('user-2', 'new-conv', 'user', 'Hello')
        assert msg is not None
        conv = conv_service.get_conversation('user-2', 'new-conv')
        assert conv is not None

    def test_get_messages(self, conv_service):
        created = conv_service.create_conversation('user-1')
        conv_service.add_message('user-1', created['id'], 'user', 'Q1')
        conv_service.add_message('user-1', created['id'], 'assistant', 'A1')
        msgs = conv_service.get_messages('user-1', created['id'])
        assert len(msgs) == 2
        assert msgs[0]['role'] == 'user'
        assert msgs[1]['role'] == 'assistant'

    def test_get_memory_context(self, conv_service):
        created = conv_service.create_conversation('user-1')
        for i in range(5):
            conv_service.add_message('user-1', created['id'], 'user', f'Q{i}')
            conv_service.add_message('user-1', created['id'], 'assistant', f'A{i}')
        memory = conv_service.get_memory_context('user-1', created['id'], window_size=4)
        assert memory['total_messages'] == 10
        assert len(memory['messages']) == 4
        assert memory['has_summary'] is True
        assert memory['summary'] != ''

    def test_get_memory_context_no_summary_needed(self, conv_service):
        created = conv_service.create_conversation('user-1')
        conv_service.add_message('user-1', created['id'], 'user', 'Hi')
        memory = conv_service.get_memory_context('user-1', created['id'])
        assert memory['has_summary'] is False

    def test_build_llm_messages(self, conv_service):
        created = conv_service.create_conversation('user-1')
        conv_service.add_message('user-1', created['id'], 'user', 'Previous question')
        conv_service.add_message('user-1', created['id'], 'assistant', 'Previous answer')
        messages = conv_service.build_llm_messages(
            'user-1', created['id'], 'You are helpful.', 'New question?'
        )
        assert messages[0]['role'] == 'system'
        assert messages[-1]['content'] == 'New question?'
        assert len(messages) >= 4  # system + 2 history + current

    def test_conversation_stats(self, conv_service):
        conv_service.create_conversation('user-1')
        created2 = conv_service.create_conversation('user-1')
        conv_service.add_message('user-1', created2['id'], 'user', 'Test')
        conv_service.archive_conversation('user-1', created2['id'])
        stats = conv_service.get_conversation_stats('user-1')
        assert stats['total_conversations'] == 2
        assert stats['archived_conversations'] == 1
        assert stats['active_conversations'] == 1

    def test_generate_title_long(self, conv_service):
        title = conv_service._generate_title('A' * 200)
        assert len(title) <= conv_service.MAX_TITLE_LENGTH

    def test_generate_title_sentence(self, conv_service):
        title = conv_service._generate_title('What is my focus score? I need to know.')
        assert title == 'What is my focus score?'

    def test_message_to_llm_format(self):
        from backend.services.conversation_service import Message
        msg = Message(conversation_id='c1', role='user', content='Hello')
        llm = msg.to_llm_message()
        assert llm == {'role': 'user', 'content': 'Hello'}


# ============================================================================
# TEST RAG SERVICE
# ============================================================================

class TestRAGService:

    def test_retrieve_keyword(self, rag_service):
        results = rag_service.retrieve('Python API development')
        assert len(results) > 0
        assert results[0]['relevance_score'] > 0

    def test_retrieve_with_collections(self, rag_service):
        results = rag_service.retrieve('API design', collections=['notes'])
        assert len(results) > 0
        assert results[0]['collection'] == 'notes'

    def test_retrieve_no_results(self, rag_service):
        results = rag_service.retrieve('quantum physics superconductor')
        assert len(results) == 0

    def test_retrieve_with_filters(self, rag_service):
        results = rag_service.retrieve(
            'Python', filters={'type': 'activity'}
        )
        for r in results:
            assert r['document']['type'] == 'activity'

    def test_semantic_search(self, rag_service):
        results = rag_service.semantic_search(
            query_embedding=[0.12, 0.22, 0.32, 0.42],
            top_k=3,
        )
        assert len(results) > 0
        assert all(r['relevance_score'] > 0 for r in results)

    def test_semantic_search_no_embeddings(self, rag_service):
        # Only activities collection has some without embeddings
        results = rag_service.semantic_search(
            query_embedding=[0.1, 0.2, 0.3, 0.4],
            collections=['notes'],
        )
        assert len(results) > 0

    def test_build_augmented_prompt(self, rag_service):
        results = rag_service.retrieve('Python API', top_k=3)
        augmented = rag_service.build_augmented_prompt('What Python work did I do?', results)
        assert 'augmented_prompt' in augmented
        assert 'citations' in augmented
        assert augmented['num_sources'] > 0
        assert 'context_text' in augmented

    def test_format_response_with_citations(self, rag_service):
        citations = [
            {'title': 'Python Session', 'timestamp': '2026-02-13T10:00:00', 'snippet': 'FastAPI work'},
        ]
        result = rag_service.format_response_with_citations(
            'You worked on Python [1].', citations
        )
        assert '**Sources:**' in result['response']
        assert result['has_citations'] is True

    def test_format_response_no_citations(self, rag_service):
        result = rag_service.format_response_with_citations('No sources.', [])
        assert result['has_citations'] is False

    def test_smart_search(self, rag_service):
        result = rag_service.smart_search('Python backend')
        assert 'results' in result
        assert 'query' in result
        assert result['total_results'] > 0

    def test_smart_search_no_results(self, rag_service):
        result = rag_service.smart_search('quaternion rotation matrices')
        assert result['total_results'] == 0

    def test_add_documents(self, rag_service):
        added = rag_service.add_documents('new_collection', [
            {'title': 'Test Doc', 'content': 'Test content'},
        ])
        assert added == 1
        assert 'new_collection' in rag_service.get_collections()

    def test_get_collections(self, rag_service):
        collections = rag_service.get_collections()
        assert 'activities' in collections
        assert 'notes' in collections

    def test_collection_stats(self, rag_service):
        stats = rag_service.get_collection_stats('activities')
        assert stats['document_count'] == 3
        assert stats['has_embeddings'] is True

    def test_citation_model(self):
        citation = Citation(
            source_type='activity',
            source_id='act-1',
            title='Python Session',
            snippet='FastAPI development',
            relevance_score=0.85,
        )
        d = citation.to_dict()
        assert d['source_type'] == 'activity'
        assert d['relevance_score'] == 0.85
        assert citation.format_inline(1) == '[1]'
        assert 'Python Session' in citation.format_footnote(1)

    def test_cosine_similarity(self, rag_service):
        sim = rag_service._cosine_similarity([1, 0, 0], [1, 0, 0])
        assert abs(sim - 1.0) < 0.001
        sim = rag_service._cosine_similarity([1, 0], [0, 1])
        assert abs(sim) < 0.001

    def test_extract_best_snippet(self, rag_service):
        content = "This is the beginning. " * 20 + "Python API development is important."
        snippet = rag_service._extract_best_snippet('Python API', content)
        assert len(snippet) > 0


# ============================================================================
# TEST PROACTIVE INSIGHTS SERVICE
# ============================================================================

class TestProactiveInsights:

    def test_generate_daily_insights(self, insights_service, daily_metrics, historical_metrics):
        results = insights_service.generate_daily_insights(
            'user-1', daily_metrics, historical_metrics
        )
        assert len(results) > 0
        assert all('category' in r for r in results)
        assert all('priority' in r for r in results)

    def test_generate_insights_no_history(self, insights_service, daily_metrics):
        results = insights_service.generate_daily_insights('user-1', daily_metrics)
        assert isinstance(results, list)

    def test_focus_above_average(self, insights_service):
        metrics = {'focus_score': 9.5, 'total_hours': 8}
        history = [{'focus_score': 6.0} for _ in range(7)]
        results = insights_service.generate_daily_insights('user-2', metrics, history)
        focus_insights = [r for r in results if r['category'] == 'focus']
        assert len(focus_insights) > 0

    def test_focus_streak_detection(self, insights_service):
        metrics = {'focus_score': 8.0, 'total_hours': 8}
        history = [{'focus_score': 7.5, 'total_hours': 8} for _ in range(5)]
        results = insights_service.generate_daily_insights('user-3', metrics, history)
        streak_insights = [r for r in results if 'streak' in r['title'].lower()]
        assert len(streak_insights) > 0

    def test_long_hours_anomaly(self, insights_service):
        metrics = {
            'focus_score': 7.0,
            'total_hours': 16.0,
            'deep_work_hours': 6.0,
        }
        history = [
            {'focus_score': 7.0, 'total_hours': 8.0, 'deep_work_hours': 3.0}
            for _ in range(7)
        ]
        results = insights_service.generate_daily_insights('user-4', metrics, history)
        # Should produce wellness (unusually long day) or productivity insights
        assert len(results) > 0

    def test_achievement_milestone(self, insights_service):
        metrics = {
            'focus_score': 7.0,
            'total_hours': 8.0,
            'deep_work_hours': 3.0,
            'total_career_hours': 500,
        }
        results = insights_service.generate_daily_insights('user-5', metrics)
        achievements = [r for r in results if r['category'] == 'achievement']
        assert len(achievements) > 0

    def test_diverse_skills_insight(self, insights_service):
        metrics = {
            'focus_score': 7.0,
            'total_hours': 8.0,
            'deep_work_hours': 3.0,
            'skills_used_today': 7,
        }
        results = insights_service.generate_daily_insights('user-6', metrics)
        learning = [r for r in results if r['category'] == 'learning']
        assert len(learning) > 0

    def test_meeting_heavy_day(self, insights_service):
        metrics = {
            'focus_score': 5.0,
            'total_hours': 8.0,
            'deep_work_hours': 1.0,
            'meeting_count': 6,
            'meeting_hours': 5.0,
        }
        results = insights_service.generate_daily_insights('user-7', metrics)
        collab = [r for r in results if r['category'] == 'collaboration']
        assert len(collab) > 0

    def test_generate_weekly_insights(self, insights_service):
        weekly = {
            'total_hours': 45,
            'deep_work_hours': 25,  # 56% deep work ratio → triggers "strong deep work" insight
            'meeting_hours': 16,    # >15h meetings → triggers heavy meeting insight
            'avg_focus_score': 7.5,
        }
        results = insights_service.generate_weekly_insights('user-8', weekly)
        assert isinstance(results, list)
        assert len(results) > 0

    def test_weekly_workload_increase(self, insights_service):
        weekly = {'total_hours': 50, 'deep_work_hours': 18, 'meeting_hours': 8}
        prev = [{'total_hours': 35, 'deep_work_hours': 15}]
        results = insights_service.generate_weekly_insights('user-9', weekly, prev)
        workload = [r for r in results if 'workload' in r['title'].lower() or 'increasing' in r['title'].lower()]
        assert len(workload) > 0

    def test_heavy_meeting_week(self, insights_service):
        weekly = {'total_hours': 40, 'deep_work_hours': 10, 'meeting_hours': 18}
        results = insights_service.generate_weekly_insights('user-10', weekly)
        meeting = [r for r in results if 'meeting' in r['title'].lower()]
        assert len(meeting) > 0

    def test_get_active_insights(self, insights_service, daily_metrics, historical_metrics):
        insights_service.generate_daily_insights('user-1', daily_metrics, historical_metrics)
        active = insights_service.get_active_insights('user-1')
        assert len(active) > 0

    def test_get_active_insights_filter_category(self, insights_service, daily_metrics, historical_metrics):
        insights_service.generate_daily_insights('user-1', daily_metrics, historical_metrics)
        # Get only focus insights
        active = insights_service.get_active_insights('user-1', category='focus')
        for insight in active:
            assert insight['category'] == 'focus'

    def test_dismiss_insight(self, insights_service, daily_metrics, historical_metrics):
        results = insights_service.generate_daily_insights('user-1', daily_metrics, historical_metrics)
        if results:
            insight_id = results[0]['id']
            assert insights_service.dismiss_insight('user-1', insight_id) is True

    def test_dismiss_nonexistent(self, insights_service):
        assert insights_service.dismiss_insight('user-1', 'fake-id') is False

    def test_insight_stats(self, insights_service, daily_metrics, historical_metrics):
        insights_service.generate_daily_insights('user-1', daily_metrics, historical_metrics)
        stats = insights_service.get_insight_stats('user-1')
        assert stats['total_generated'] > 0
        assert 'by_category' in stats

    def test_deduplication(self, insights_service, daily_metrics, historical_metrics):
        # Generate twice — second should produce fewer due to dedup
        first = insights_service.generate_daily_insights('user-11', daily_metrics, historical_metrics)
        second = insights_service.generate_daily_insights('user-11', daily_metrics, historical_metrics)
        assert len(second) <= len(first)

    def test_insight_priority_range(self, insights_service, daily_metrics, historical_metrics):
        results = insights_service.generate_daily_insights('user-12', daily_metrics, historical_metrics)
        for r in results:
            assert 0 <= r['priority'] <= 1

    def test_insight_model(self):
        insight = Insight(
            user_id='u1',
            category='focus',
            title='Test',
            description='Test desc',
            priority=0.75,
        )
        d = insight.to_dict()
        assert d['category'] == 'focus'
        assert d['priority'] == 0.75
        assert d['category_icon'] == '🎯'

    def test_wellness_extended_work(self, insights_service):
        metrics = {'focus_score': 6, 'total_hours': 7, 'deep_work_hours': 2}
        history = [{'focus_score': 6, 'total_hours': 11, 'deep_work_hours': 3} for _ in range(7)]
        results = insights_service.generate_daily_insights('user-13', metrics, history)
        wellness = [r for r in results if r['category'] == 'wellness']
        assert len(wellness) > 0


# ============================================================================
# TEST CONVERSATION EXPORT SERVICE
# ============================================================================

class TestConversationExport:

    def test_export_markdown(self, export_service, sample_conversation):
        result = export_service.export_conversation(sample_conversation, format='markdown')
        assert result['format'] == 'markdown'
        assert '# Productivity Discussion' in result['content']
        assert '🧑 You' in result['content']
        assert '🤖 MiniMe AI' in result['content']
        assert result['message_count'] == 2

    def test_export_json(self, export_service, sample_conversation):
        result = export_service.export_conversation(sample_conversation, format='json')
        assert result['format'] == 'json'
        import json
        parsed = json.loads(result['content'])
        assert parsed['title'] == 'Productivity Discussion'
        assert len(parsed['messages']) == 2

    def test_export_txt(self, export_service, sample_conversation):
        result = export_service.export_conversation(sample_conversation, format='txt')
        assert result['format'] == 'txt'
        assert 'You:' in result['content']
        assert 'MiniMe AI:' in result['content']

    def test_export_pdf_html(self, export_service, sample_conversation):
        result = export_service.export_conversation(sample_conversation, format='pdf')
        assert result['format'] == 'pdf'
        assert '<!DOCTYPE html>' in result['content']
        assert 'Productivity Discussion' in result['content']

    def test_export_unsupported(self, export_service, sample_conversation):
        result = export_service.export_conversation(sample_conversation, format='docx')
        assert 'error' in result

    def test_export_with_citations(self, export_service, sample_conversation):
        result = export_service.export_conversation(sample_conversation, format='markdown')
        assert 'Sources' in result['content'] or 'Today Focus Data' in result['content']

    def test_filename_generation(self, export_service, sample_conversation):
        result = export_service.export_conversation(sample_conversation, format='markdown')
        assert result['filename'].endswith('.md')
        assert 'Productivity' in result['filename']

    def test_export_all(self, export_service, sample_conversation):
        result = export_service.export_all([sample_conversation, sample_conversation])
        assert result['total'] == 2
        assert len(result['exports']) == 2

    def test_export_combined_markdown(self, export_service, sample_conversation):
        result = export_service.export_combined(
            [sample_conversation, sample_conversation], format='markdown'
        )
        assert result['conversation_count'] == 2
        assert '---' in result['content']

    def test_export_combined_json(self, export_service, sample_conversation):
        result = export_service.export_combined(
            [sample_conversation], format='json'
        )
        import json
        parsed = json.loads(result['content'])
        assert 'conversations' in parsed
        assert parsed['total_conversations'] == 1

    def test_export_stats(self, export_service, sample_conversation):
        stats = export_service.get_export_stats([sample_conversation])
        assert stats['total_conversations'] == 1
        assert stats['total_messages'] == 2
        assert stats['total_citations'] == 1

    def test_export_empty_conversation(self, export_service):
        empty = {'id': 'x', 'title': 'Empty', 'created_at': '2026-01-01', 'messages': []}
        result = export_service.export_conversation(empty, format='markdown')
        assert result['message_count'] == 0


# ============================================================================
# TEST RECOMMENDATION SERVICE
# ============================================================================

class TestRecommendationService:

    def test_recommend_tools(self, rec_service):
        results = rec_service.recommend_tools(
            user_skills=['python', 'javascript'],
            current_tools=['ESLint'],
        )
        assert len(results) > 0
        # ESLint should be excluded
        assert all(r['name'] != 'ESLint' for r in results)

    def test_recommend_tools_with_activity(self, rec_service):
        results = rec_service.recommend_tools(
            user_skills=['python'],
            activity_categories={'python': 15},
        )
        # High python activity should boost relevance
        assert len(results) > 0
        assert results[0]['relevance'] >= 0.7

    def test_recommend_tools_unknown_skill(self, rec_service):
        results = rec_service.recommend_tools(user_skills=['quantum_computing'])
        assert len(results) == 0

    def test_recommend_workflows_low_focus(self, rec_service):
        results = rec_service.recommend_workflows({
            'avg_focus_score': 4,
            'context_switches': 5,
            'avg_session_length_min': 40,
            'meeting_hours': 2,
            'deep_work_hours': 3,
            'total_hours': 8,
        })
        assert len(results) > 0
        assert any('Pomodoro' in r['name'] for r in results)

    def test_recommend_workflows_high_context_switches(self, rec_service):
        results = rec_service.recommend_workflows({
            'avg_focus_score': 7,
            'context_switches': 25,
            'avg_session_length_min': 40,
            'meeting_hours': 2,
            'deep_work_hours': 4,
            'total_hours': 8,
        })
        assert any('Batching' in r['name'] for r in results)

    def test_recommend_workflows_short_sessions(self, rec_service):
        results = rec_service.recommend_workflows({
            'avg_focus_score': 7,
            'context_switches': 5,
            'avg_session_length_min': 15,
            'meeting_hours': 2,
            'deep_work_hours': 4,
            'total_hours': 8,
        })
        assert any('Time Blocking' in r['name'] for r in results)

    def test_recommend_collaborators(self, rec_service):
        results = rec_service.recommend_collaborators(
            user_skills={'python', 'ml'},
            team_profiles=[
                {'user_id': 't1', 'name': 'Alice', 'skills': ['rust', 'python', 'devops']},
                {'user_id': 't2', 'name': 'Bob', 'skills': ['ml', 'python']},
            ],
        )
        assert len(results) > 0
        # Alice should rank higher (more complementary skills)
        assert results[0]['name'] == 'Alice'

    def test_recommend_collaborators_exclude_existing(self, rec_service):
        results = rec_service.recommend_collaborators(
            user_skills={'python'},
            team_profiles=[
                {'user_id': 't1', 'name': 'Alice', 'skills': ['rust']},
            ],
            current_collaborators={'t1'},
        )
        assert len(results) == 0

    def test_recommend_learning_career_goals(self, rec_service):
        results = rec_service.recommend_learning(
            user_skills=['python'],
            career_goals=['kubernetes', 'terraform'],
        )
        assert len(results) >= 2
        assert any(r['skill'] == 'kubernetes' for r in results)

    def test_recommend_learning_low_proficiency(self, rec_service):
        results = rec_service.recommend_learning(
            user_skills=['docker', 'python'],
            skill_scores={'docker': 20, 'python': 90},
        )
        docker_recs = [r for r in results if r['skill'] == 'docker']
        assert len(docker_recs) > 0

    def test_recommend_learning_trending(self, rec_service):
        results = rec_service.recommend_learning(
            user_skills=['python'],
            trending_skills=['rust', 'wasm'],
        )
        assert any(r['skill'] == 'rust' for r in results)

    def test_recommend_time_management_no_breaks(self, rec_service):
        results = rec_service.recommend_time_management({
            'total_hours': 8,
            'break_count': 0,
            'longest_continuous_session_min': 60,
            'meeting_hours': 2,
        })
        assert any('break' in r['title'].lower() for r in results)

    def test_recommend_time_management_long_session(self, rec_service):
        results = rec_service.recommend_time_management({
            'total_hours': 8,
            'break_count': 3,
            'longest_continuous_session_min': 180,
            'meeting_hours': 1,
        })
        assert any('long sessions' in r['title'].lower() for r in results)

    def test_recommend_time_management_peak_hours(self, rec_service):
        results = rec_service.recommend_time_management({
            'total_hours': 8,
            'break_count': 3,
            'longest_continuous_session_min': 60,
            'meeting_hours': 1,
            'peak_hours': [9, 10, 14],
        })
        assert any('peak' in r['title'].lower() for r in results)

    def test_get_all_recommendations(self, rec_service):
        result = rec_service.get_all_recommendations(
            user_skills=['python', 'javascript'],
            productivity_data={
                'avg_focus_score': 5,
                'context_switches': 20,
                'avg_session_length_min': 20,
                'meeting_hours': 3,
                'deep_work_hours': 2,
                'total_hours': 8,
            },
            time_data={
                'total_hours': 8,
                'break_count': 0,
                'longest_continuous_session_min': 150,
                'meeting_hours': 3,
            },
            career_goals=['kubernetes'],
        )
        assert result['total'] > 0
        assert 'by_type' in result
        assert 'recommendations' in result

    def test_max_recommendations_limit(self, rec_service):
        result = rec_service.get_all_recommendations(
            user_skills=['python', 'javascript', 'typescript', 'devops', 'data_science', 'writing'],
            productivity_data={
                'avg_focus_score': 3,
                'context_switches': 30,
                'avg_session_length_min': 10,
                'meeting_hours': 6,
                'deep_work_hours': 1,
                'total_hours': 10,
                'morning_focus_score': 2,
            },
            time_data={
                'total_hours': 10,
                'break_count': 0,
                'longest_continuous_session_min': 200,
                'meeting_hours': 6,
                'peak_hours': [9, 10, 14],
            },
            career_goals=['go', 'rust'],
        )
        assert len(result['recommendations']) <= rec_service.MAX_RECOMMENDATIONS

    def test_workflow_low_deep_work_ratio(self, rec_service):
        results = rec_service.recommend_workflows({
            'avg_focus_score': 7,
            'context_switches': 5,
            'avg_session_length_min': 40,
            'meeting_hours': 6,
            'deep_work_hours': 1,
            'total_hours': 10,
        })
        assert any('Time Blocking' in r['name'] for r in results)
