"""
Module 3: Knowledge Graph — Comprehensive Tests

Tests for all 5 new services:
- ExpertiseDiscoveryService
- LearningPathService
- LinkPredictionService
- GraphSchemaService
- SubgraphExtractionService
"""

import pytest
import math
from datetime import datetime, timedelta

from backend.services.expertise_discovery import ExpertiseDiscoveryService
from backend.services.learning_path_service import LearningPathService
from backend.services.link_prediction_service import LinkPredictionService
from backend.services.graph_schema_service import GraphSchemaService
from backend.services.subgraph_extraction_service import SubgraphExtractionService


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def expertise_service():
    return ExpertiseDiscoveryService()


@pytest.fixture
def learning_path_service():
    return LearningPathService()


@pytest.fixture
def link_prediction_service():
    return LinkPredictionService()


@pytest.fixture
def schema_service():
    return GraphSchemaService()


@pytest.fixture
def subgraph_service():
    return SubgraphExtractionService()


@pytest.fixture
def sample_entities():
    """Sample entity data for expertise tests."""
    return [
        {'text': 'Python', 'type': 'TOOL', 'frequency': 50, 'confidence': 0.95,
         'first_seen': '2026-01-01T00:00:00Z', 'last_seen': '2026-02-01T00:00:00Z'},
        {'text': 'FastAPI', 'type': 'FRAMEWORK', 'frequency': 30, 'confidence': 0.90,
         'first_seen': '2026-01-05T00:00:00Z', 'last_seen': '2026-02-01T00:00:00Z'},
        {'text': 'React', 'type': 'FRAMEWORK', 'frequency': 25, 'confidence': 0.88,
         'first_seen': '2026-01-10T00:00:00Z', 'last_seen': '2026-01-30T00:00:00Z'},
        {'text': 'PostgreSQL', 'type': 'TOOL', 'frequency': 20, 'confidence': 0.85,
         'first_seen': '2026-01-03T00:00:00Z', 'last_seen': '2026-02-01T00:00:00Z'},
        {'text': 'Docker', 'type': 'TOOL', 'frequency': 15, 'confidence': 0.80,
         'first_seen': '2026-01-08T00:00:00Z', 'last_seen': '2026-01-25T00:00:00Z'},
        {'text': 'PyTorch', 'type': 'TOOL', 'frequency': 10, 'confidence': 0.75,
         'first_seen': '2026-01-15T00:00:00Z', 'last_seen': '2026-01-28T00:00:00Z'},
        {'text': 'Kubernetes', 'type': 'TOOL', 'frequency': 8, 'confidence': 0.70,
         'first_seen': '2026-01-20T00:00:00Z', 'last_seen': '2026-01-29T00:00:00Z'},
        {'text': 'Figma', 'type': 'TOOL', 'frequency': 5, 'confidence': 0.65,
         'first_seen': '2026-01-22T00:00:00Z', 'last_seen': '2026-01-30T00:00:00Z'},
        # These should be excluded (wrong type)
        {'text': 'John Doe', 'type': 'PERSON', 'frequency': 100, 'confidence': 0.99},
        {'text': 'New York', 'type': 'PLACE', 'frequency': 40, 'confidence': 0.95},
    ]


@pytest.fixture
def sample_adjacency():
    """Sample adjacency list for graph tests."""
    return {
        'python': {'fastapi', 'django', 'pytorch', 'flask'},
        'fastapi': {'python', 'postgresql', 'docker'},
        'django': {'python', 'postgresql', 'heroku'},
        'pytorch': {'python', 'cuda', 'tensorflow'},
        'flask': {'python', 'postgresql'},
        'postgresql': {'fastapi', 'django', 'flask', 'redis'},
        'docker': {'fastapi', 'kubernetes', 'nginx'},
        'kubernetes': {'docker', 'terraform', 'prometheus'},
        'cuda': {'pytorch', 'tensorflow'},
        'tensorflow': {'pytorch', 'cuda'},
        'redis': {'postgresql', 'celery'},
        'celery': {'redis'},
        'heroku': {'django'},
        'nginx': {'docker'},
        'terraform': {'kubernetes'},
        'prometheus': {'kubernetes', 'grafana'},
        'grafana': {'prometheus'},
    }


# ============================================================================
# TEST EXPERTISE DISCOVERY
# ============================================================================

class TestExpertiseDiscovery:
    """Tests for ExpertiseDiscoveryService."""

    def test_build_skill_profile(self, expertise_service, sample_entities):
        """Test skill profile building from entities."""
        profile = expertise_service.build_skill_profile(sample_entities)

        assert profile['total_skills'] > 0
        assert 'python' in profile['skills']
        assert 'top_skills' in profile
        assert len(profile['top_skills']) <= 10
        assert profile['primary_category'] in expertise_service.get_all_categories() + ['other']

    def test_skill_profile_scores_normalized(self, expertise_service, sample_entities):
        """Test that skill scores are normalized to 0-100."""
        profile = expertise_service.build_skill_profile(sample_entities)

        for skill_name, skill_data in profile['skills'].items():
            assert 0 <= skill_data['score'] <= 100
            assert skill_data['frequency'] > 0

    def test_skill_profile_excludes_non_skill_types(self, expertise_service, sample_entities):
        """Test that PERSON, PLACE etc. are excluded from skills."""
        profile = expertise_service.build_skill_profile(sample_entities)

        assert 'john doe' not in profile['skills']
        assert 'new york' not in profile['skills']

    def test_skill_profile_category_detection(self, expertise_service, sample_entities):
        """Test that skills are correctly categorized."""
        profile = expertise_service.build_skill_profile(sample_entities)

        assert profile['skills']['python']['category'] == 'programming_languages'
        assert profile['skills']['fastapi']['category'] == 'frameworks'
        assert profile['skills']['postgresql']['category'] == 'databases'
        assert profile['skills']['docker']['category'] == 'devops'

    def test_skill_profile_empty_entities(self, expertise_service):
        """Test with empty entity list."""
        profile = expertise_service.build_skill_profile([])
        assert profile['total_skills'] == 0
        assert profile['top_skills'] == []

    def test_skill_diversity(self, expertise_service, sample_entities):
        """Test skill diversity count."""
        profile = expertise_service.build_skill_profile(sample_entities)
        # Should span multiple categories
        assert profile['skill_diversity'] >= 3

    def test_rank_expertise(self, expertise_service, sample_entities):
        """Test expertise ranking."""
        rankings = expertise_service.rank_expertise(sample_entities)

        assert len(rankings) > 0
        # First should have highest score
        assert rankings[0]['expertise_score'] >= rankings[-1]['expertise_score']
        # Each should have a level
        for r in rankings:
            assert r['level'] in ('beginner', 'intermediate', 'proficient', 'expert')

    def test_rank_expertise_by_topic(self, expertise_service, sample_entities):
        """Test expertise ranking filtered by topic."""
        rankings = expertise_service.rank_expertise(sample_entities, topic='python')

        assert len(rankings) > 0
        assert all(r['entity'].lower() == 'python' or
                   r['category'] == 'python' for r in rankings)

    def test_rank_expertise_with_centrality(self, expertise_service, sample_entities):
        """Test that centrality scores influence ranking."""
        centrality = {'python': 0.9, 'fastapi': 0.1}
        rankings = expertise_service.rank_expertise(
            sample_entities, centrality_scores=centrality
        )

        python_rank = next(r for r in rankings if r['entity'].lower() == 'python')
        assert python_rank['centrality'] == 0.9

    def test_skill_gap_analysis(self, expertise_service, sample_entities):
        """Test skill gap analysis."""
        profile = expertise_service.build_skill_profile(sample_entities)

        target = {
            'python': 80,
            'react': 70,
            'go': 60,       # Missing skill
            'rust': 50,     # Missing skill
        }

        gaps = expertise_service.analyze_skill_gaps(profile['skills'], target)

        assert gaps['total_required'] == 4
        assert gaps['total_gaps'] >= 2  # At least go and rust are missing
        assert 'go' in [s['skill'] for s in gaps['missing_skills']]
        assert 'rust' in [s['skill'] for s in gaps['missing_skills']]
        assert 0 <= gaps['readiness_percentage'] <= 100
        assert len(gaps['recommendations']) > 0

    def test_skill_gap_all_met(self, expertise_service, sample_entities):
        """Test gap analysis when all skills are met."""
        profile = expertise_service.build_skill_profile(sample_entities)

        # Set very low targets
        target = {'python': 10}
        gaps = expertise_service.analyze_skill_gaps(profile['skills'], target)

        assert gaps['readiness_percentage'] == 100.0
        assert gaps['total_gaps'] == 0

    def test_cross_domain_bridges(self, expertise_service, sample_entities):
        """Test cross-domain bridging detection."""
        bridges = expertise_service.detect_cross_domain_bridges(sample_entities)

        assert bridges['domain_count'] >= 3  # programming, frameworks, databases, etc.
        assert bridges['specialization'] in ('specialist', 'balanced', 'generalist')
        assert 0 <= bridges['diversity_score'] <= 100

    def test_expertise_timeline(self, expertise_service, sample_entities):
        """Test expertise timeline building."""
        timeline = expertise_service.build_expertise_timeline(sample_entities, interval_days=15)

        assert len(timeline) > 0
        # Cumulative should be non-decreasing
        for i in range(1, len(timeline)):
            assert timeline[i]['cumulative_skill_count'] >= timeline[i-1]['cumulative_skill_count']

    def test_get_skill_category(self, expertise_service):
        """Test skill category lookup."""
        assert expertise_service.get_skill_category('python') == 'programming_languages'
        assert expertise_service.get_skill_category('docker') == 'devops'
        assert expertise_service.get_skill_category('unknown_tool') == 'other'

    def test_get_all_categories(self, expertise_service):
        """Test all categories listing."""
        categories = expertise_service.get_all_categories()
        assert 'programming_languages' in categories
        assert 'databases' in categories
        assert 'ai_ml' in categories


# ============================================================================
# TEST LEARNING PATH SERVICE
# ============================================================================

class TestLearningPathService:
    """Tests for LearningPathService."""

    @pytest.fixture
    def adjacency(self):
        """Adjacency for learning path tests."""
        return {
            'python_basics': [
                {'neighbor': 'python_oop', 'weight': 1.0},
                {'neighbor': 'python_data', 'weight': 1.5},
            ],
            'python_oop': [
                {'neighbor': 'python_basics', 'weight': 1.0},
                {'neighbor': 'design_patterns', 'weight': 2.0},
                {'neighbor': 'python_web', 'weight': 1.5},
            ],
            'python_data': [
                {'neighbor': 'python_basics', 'weight': 1.5},
                {'neighbor': 'pandas', 'weight': 1.0},
                {'neighbor': 'ml_basics', 'weight': 2.5},
            ],
            'python_web': [
                {'neighbor': 'python_oop', 'weight': 1.5},
                {'neighbor': 'fastapi', 'weight': 1.0},
            ],
            'design_patterns': [
                {'neighbor': 'python_oop', 'weight': 2.0},
                {'neighbor': 'system_design', 'weight': 2.0},
            ],
            'pandas': [
                {'neighbor': 'python_data', 'weight': 1.0},
                {'neighbor': 'ml_basics', 'weight': 1.5},
            ],
            'ml_basics': [
                {'neighbor': 'python_data', 'weight': 2.5},
                {'neighbor': 'pandas', 'weight': 1.5},
                {'neighbor': 'deep_learning', 'weight': 3.0},
            ],
            'fastapi': [
                {'neighbor': 'python_web', 'weight': 1.0},
            ],
            'deep_learning': [
                {'neighbor': 'ml_basics', 'weight': 3.0},
            ],
            'system_design': [
                {'neighbor': 'design_patterns', 'weight': 2.0},
            ],
        }

    def test_find_learning_paths(self, learning_path_service, adjacency):
        """Test BFS path finding between topics."""
        paths = learning_path_service.find_learning_paths(
            'python_basics', 'deep_learning', adjacency
        )

        assert len(paths) > 0
        for path in paths:
            assert path['path'][0] == 'python_basics'
            assert path['path'][-1] == 'deep_learning'
            assert path['total_steps'] >= 2
            assert path['difficulty'] in ('beginner', 'intermediate', 'advanced', 'expert')

    def test_find_paths_same_node(self, learning_path_service, adjacency):
        """Test path to same node."""
        paths = learning_path_service.find_learning_paths(
            'python_basics', 'python_basics', adjacency
        )
        assert len(paths) == 1
        assert paths[0]['total_steps'] == 1
        assert paths[0]['total_cost'] == 0.0

    def test_find_shortest_path(self, learning_path_service, adjacency):
        """Test Dijkstra shortest path."""
        result = learning_path_service.find_shortest_path(
            'python_basics', 'fastapi', adjacency
        )

        assert result is not None
        assert result['path'][0] == 'python_basics'
        assert result['path'][-1] == 'fastapi'
        assert result['total_cost'] > 0

    def test_shortest_path_no_path(self, learning_path_service):
        """Test when no path exists."""
        adjacency = {
            'a': [{'neighbor': 'b', 'weight': 1.0}],
            'b': [{'neighbor': 'a', 'weight': 1.0}],
            'c': [],
        }
        result = learning_path_service.find_shortest_path('a', 'c', adjacency)
        assert result is None

    def test_recommend_paths(self, learning_path_service, adjacency):
        """Test personalized path recommendations."""
        user_skills = {'python_basics', 'python_oop'}

        recs = learning_path_service.recommend_paths(
            'python_basics', adjacency, user_skills=user_skills, top_k=5
        )

        assert len(recs) > 0
        for rec in recs:
            assert 'target' in rec
            assert 'relevance_score' in rec
            # Should not recommend already-known skills
            assert rec['target'] not in user_skills

    def test_recommend_paths_no_skills(self, learning_path_service, adjacency):
        """Test recommendations without existing skills."""
        recs = learning_path_service.recommend_paths(
            'python_basics', adjacency, top_k=3
        )
        assert len(recs) > 0

    def test_score_path(self, learning_path_service):
        """Test path scoring."""
        path = ['python_basics', 'python_oop', 'python_web', 'fastapi']
        metadata = {
            'python_basics': {'difficulty': 'beginner', 'duration_hours': 5.0},
            'python_oop': {'difficulty': 'intermediate', 'duration_hours': 8.0},
            'python_web': {'difficulty': 'intermediate', 'duration_hours': 10.0},
            'fastapi': {'difficulty': 'advanced', 'duration_hours': 15.0},
        }
        user_skills = {'python_basics'}

        result = learning_path_service.score_path(path, metadata, user_skills)

        assert result['total_steps'] == 4
        assert result['known_topics'] == 1
        assert result['new_topics'] == 3
        assert result['total_estimated_hours'] > 0
        assert result['completion_percentage'] == 25.0  # 1/4

    def test_score_path_all_known(self, learning_path_service):
        """Test path scoring when all topics known."""
        path = ['a', 'b']
        user_skills = {'a', 'b'}

        result = learning_path_service.score_path(path, user_skills=user_skills)
        assert result['completion_percentage'] == 100.0
        # Duration should be reduced for known topics
        assert result['total_estimated_hours'] < 2 * 2.0  # default 2h per topic

    def test_infer_prerequisites_temporal(self, learning_path_service):
        """Test prerequisite inference based on temporal order."""
        topics = [
            {'name': 'python', 'frequency': 50, 'first_seen': '2026-01-01'},
            {'name': 'fastapi', 'frequency': 20, 'first_seen': '2026-01-15'},
        ]
        co_occurrences = [
            {'source': 'python', 'target': 'fastapi', 'count': 10, 'strength': 0.8},
        ]

        prereqs = learning_path_service.infer_prerequisites(topics, co_occurrences)

        assert len(prereqs) == 1
        assert prereqs[0]['prerequisite'] == 'python'
        assert prereqs[0]['advanced_topic'] == 'fastapi'
        assert prereqs[0]['direction_basis'] == 'temporal'

    def test_infer_prerequisites_frequency(self, learning_path_service):
        """Test prerequisite inference based on frequency when no timestamps."""
        topics = [
            {'name': 'python', 'frequency': 50},
            {'name': 'fastapi', 'frequency': 20},
        ]
        co_occurrences = [
            {'source': 'fastapi', 'target': 'python', 'count': 5, 'strength': 0.6},
        ]

        prereqs = learning_path_service.infer_prerequisites(topics, co_occurrences)

        assert len(prereqs) == 1
        assert prereqs[0]['prerequisite'] == 'python'  # Higher frequency
        assert prereqs[0]['direction_basis'] == 'frequency'

    def test_infer_prerequisites_min_strength(self, learning_path_service):
        """Test that weak co-occurrences are filtered out."""
        topics = [
            {'name': 'a', 'frequency': 10},
            {'name': 'b', 'frequency': 5},
        ]
        co_occurrences = [
            {'source': 'a', 'target': 'b', 'count': 1, 'strength': 0.1},
        ]

        prereqs = learning_path_service.infer_prerequisites(
            topics, co_occurrences, min_strength=0.3
        )
        assert len(prereqs) == 0

    def test_difficulty_estimation(self, learning_path_service):
        """Test difficulty levels by path length."""
        assert learning_path_service._estimate_difficulty(1) == 'beginner'
        assert learning_path_service._estimate_difficulty(2) == 'beginner'
        assert learning_path_service._estimate_difficulty(3) == 'intermediate'
        assert learning_path_service._estimate_difficulty(5) == 'advanced'
        assert learning_path_service._estimate_difficulty(7) == 'expert'


# ============================================================================
# TEST LINK PREDICTION
# ============================================================================

class TestLinkPrediction:
    """Tests for LinkPredictionService."""

    @pytest.fixture
    def adjacency(self):
        return {
            'a': {'b', 'c', 'd'},
            'b': {'a', 'c'},
            'c': {'a', 'b', 'e'},
            'd': {'a', 'f'},
            'e': {'c', 'f'},
            'f': {'d', 'e'},
        }

    def test_common_neighbors(self, link_prediction_service, adjacency):
        """Test common neighbors calculation."""
        result = link_prediction_service.common_neighbors('a', 'e', adjacency)
        # a neighbors: {b, c, d}, e neighbors: {c, f}
        # common: {c}
        assert result['count'] == 1
        assert 'c' in result['common_neighbors']

    def test_common_neighbors_none(self, link_prediction_service, adjacency):
        """Test when no common neighbors."""
        result = link_prediction_service.common_neighbors('b', 'f', adjacency)
        assert result['count'] == 0

    def test_jaccard_coefficient(self, link_prediction_service, adjacency):
        """Test Jaccard coefficient."""
        result = link_prediction_service.jaccard_coefficient('a', 'b', adjacency)
        # a: {b, c, d}, b: {a, c}
        # intersection: {c}, union: {a, b, c, d}
        # Jaccard: 1/4 = 0.25
        assert result['score'] == 0.25
        assert result['intersection_size'] == 1
        assert result['union_size'] == 4

    def test_jaccard_empty(self, link_prediction_service):
        """Test Jaccard when no neighbors."""
        adj = {'a': set(), 'b': set()}
        result = link_prediction_service.jaccard_coefficient('a', 'b', adj)
        assert result['score'] == 0.0

    def test_adamic_adar(self, link_prediction_service, adjacency):
        """Test Adamic-Adar index."""
        result = link_prediction_service.adamic_adar_index('a', 'e', adjacency)
        assert result['score'] > 0  # c is common neighbor with degree > 1
        assert result['normalized_score'] >= 0
        assert result['normalized_score'] <= 1.0

    def test_preferential_attachment(self, link_prediction_service, adjacency):
        """Test preferential attachment."""
        result = link_prediction_service.preferential_attachment('a', 'e', adjacency)
        # degree(a) = 3, degree(e) = 2, score = 6
        assert result['score'] == 6
        assert result['degree_a'] == 3
        assert result['degree_b'] == 2

    def test_embedding_similarity(self, link_prediction_service):
        """Test embedding-based similarity."""
        embeddings = {
            'a': [1.0, 0.0, 0.0],
            'b': [0.0, 1.0, 0.0],
            'c': [0.9, 0.1, 0.0],
        }
        result = link_prediction_service.embedding_similarity('a', 'c', embeddings)
        assert result['available'] is True
        assert result['score'] > 0.8  # Similar vectors

    def test_embedding_similarity_missing(self, link_prediction_service):
        """Test when embeddings are missing."""
        result = link_prediction_service.embedding_similarity('a', 'b', {})
        assert result['available'] is False
        assert result['score'] == 0.0

    def test_predict_link(self, link_prediction_service, adjacency):
        """Test aggregate link prediction."""
        result = link_prediction_service.predict_link('a', 'e', adjacency)

        assert 'aggregate_score' in result
        assert 'methods' in result
        assert result['prediction'] in ('likely', 'possible', 'unlikely')
        assert 0 <= result['aggregate_score'] <= 1.0
        assert len(result['methods']) == 5

    def test_predict_link_already_connected(self, link_prediction_service, adjacency):
        """Test prediction for already-connected nodes."""
        result = link_prediction_service.predict_link('a', 'b', adjacency)
        assert result['already_connected'] is True

    def test_predict_top_links(self, link_prediction_service, adjacency):
        """Test top-k link predictions for a node."""
        preds = link_prediction_service.predict_top_links('a', adjacency, top_k=3)

        assert len(preds) <= 3
        # All predictions should be for non-connected nodes
        for pred in preds:
            assert pred['node_a'] == 'a' or pred['node_b'] == 'a'

    def test_predict_top_links_exclude_existing(self, link_prediction_service, adjacency):
        """Test that existing links are excluded."""
        preds = link_prediction_service.predict_top_links(
            'a', adjacency, exclude_existing=True
        )
        existing = adjacency['a']
        for pred in preds:
            other = pred['node_b'] if pred['node_a'] == 'a' else pred['node_a']
            assert other not in existing

    def test_batch_predict(self, link_prediction_service, adjacency):
        """Test batch prediction across the graph."""
        result = link_prediction_service.batch_predict(
            adjacency, min_score=0.0, top_k_per_node=2
        )

        assert result['nodes_analyzed'] == len(adjacency)
        assert result['total_predictions'] >= 0
        # No duplicate pairs
        pairs = set()
        for pred in result['predictions']:
            pair = tuple(sorted([pred['node_a'], pred['node_b']]))
            assert pair not in pairs
            pairs.add(pair)

    def test_cosine_similarity(self, link_prediction_service):
        """Test cosine similarity utility."""
        # Identical vectors
        assert abs(link_prediction_service._cosine_similarity(
            [1, 0], [1, 0]) - 1.0) < 0.001
        # Orthogonal vectors
        assert abs(link_prediction_service._cosine_similarity(
            [1, 0], [0, 1]) - 0.0) < 0.001
        # Empty vectors
        assert link_prediction_service._cosine_similarity([], []) == 0.0

    def test_custom_weights(self):
        """Test custom method weights."""
        weights = {'common_neighbors': 1.0, 'jaccard': 0.0,
                   'adamic_adar': 0.0, 'preferential_attachment': 0.0,
                   'embedding_similarity': 0.0}
        service = LinkPredictionService(method_weights=weights)
        assert service.method_weights['common_neighbors'] == 1.0


# ============================================================================
# TEST GRAPH SCHEMA SERVICE
# ============================================================================

class TestGraphSchemaService:
    """Tests for GraphSchemaService."""

    def test_initial_schema(self, schema_service):
        """Test default schema initialization."""
        assert schema_service.current_version == '1.0.0'
        assert len(schema_service.get_node_types()) == 8
        assert len(schema_service.get_relationship_types()) == 8

    def test_get_node_types(self, schema_service):
        """Test node type listing."""
        types = schema_service.get_node_types()
        assert 'PERSON' in types
        assert 'TOOL' in types
        assert 'TOPIC' in types
        assert 'PROJECT' in types

    def test_get_relationship_types(self, schema_service):
        """Test relationship type listing."""
        types = schema_service.get_relationship_types()
        assert 'CO_OCCURS_WITH' in types
        assert 'WORKS_AT' in types
        assert 'USES' in types
        assert 'DEPENDS_ON' in types

    def test_get_node_schema(self, schema_service):
        """Test getting schema for a specific node type."""
        schema = schema_service.get_node_schema('PERSON')
        assert schema is not None
        assert 'name' in schema['required_properties']
        assert 'email' in schema['optional_properties']

    def test_get_node_schema_not_found(self, schema_service):
        """Test getting schema for unknown type."""
        assert schema_service.get_node_schema('UNKNOWN') is None

    def test_validate_node_valid(self, schema_service):
        """Test valid node validation."""
        result = schema_service.validate_node('PERSON', {'name': 'Alice'})
        assert result['valid'] is True
        assert len(result['errors']) == 0

    def test_validate_node_missing_required(self, schema_service):
        """Test node validation with missing required property."""
        result = schema_service.validate_node('PERSON', {})
        assert result['valid'] is False
        assert any('name' in e for e in result['errors'])

    def test_validate_node_unknown_type(self, schema_service):
        """Test validation of unknown node type."""
        result = schema_service.validate_node('UNKNOWN', {'name': 'test'})
        assert result['valid'] is False

    def test_validate_node_unknown_properties(self, schema_service):
        """Test that unknown properties generate warnings."""
        result = schema_service.validate_node(
            'PERSON', {'name': 'Alice', 'zodiac_sign': 'Leo'}
        )
        assert result['valid'] is True
        assert len(result['warnings']) > 0

    def test_validate_relationship_valid(self, schema_service):
        """Test valid relationship validation."""
        result = schema_service.validate_relationship(
            'WORKS_AT', 'PERSON', 'ORG'
        )
        assert result['valid'] is True

    def test_validate_relationship_invalid_source(self, schema_service):
        """Test relationship with invalid source type."""
        result = schema_service.validate_relationship(
            'WORKS_AT', 'TOOL', 'ORG'
        )
        assert result['valid'] is False

    def test_validate_relationship_wildcard(self, schema_service):
        """Test relationship with wildcard source/target."""
        result = schema_service.validate_relationship(
            'CO_OCCURS_WITH', 'TOOL', 'PERSON'
        )
        assert result['valid'] is True  # * allows any types

    def test_add_node_type(self, schema_service):
        """Test adding a new node type."""
        result = schema_service.add_node_type(
            'DATASET', 'A dataset or data source',
            required_properties=['name'],
            optional_properties=['format', 'size_gb']
        )
        assert result['success'] is True
        assert 'DATASET' in schema_service.get_node_types()

    def test_add_node_type_duplicate(self, schema_service):
        """Test adding duplicate node type."""
        result = schema_service.add_node_type('PERSON', 'duplicate')
        assert result['success'] is False

    def test_add_relationship_type(self, schema_service):
        """Test adding a new relationship type."""
        result = schema_service.add_relationship_type(
            'MENTORS', 'Person mentors another person',
            source_types=['PERSON'], target_types=['PERSON'],
            properties=['since', 'topic']
        )
        assert result['success'] is True
        assert 'MENTORS' in schema_service.get_relationship_types()

    def test_bump_version_minor(self, schema_service):
        """Test minor version bump."""
        schema_service.add_node_type('TEST', 'test type')
        result = schema_service.bump_version('minor', 'Added TEST type')

        assert result['previous_version'] == '1.0.0'
        assert result['new_version'] == '1.1.0'
        assert schema_service.current_version == '1.1.0'

    def test_bump_version_major(self, schema_service):
        """Test major version bump."""
        result = schema_service.bump_version('major', 'Breaking change')
        assert result['new_version'] == '2.0.0'

    def test_bump_version_patch(self, schema_service):
        """Test patch version bump."""
        result = schema_service.bump_version('patch', 'Bug fix')
        assert result['new_version'] == '1.0.1'

    def test_diff_versions(self, schema_service):
        """Test version diff."""
        schema_service.add_node_type('NEW_TYPE', 'A new type')
        schema_service.bump_version('minor', 'Added NEW_TYPE')

        diff = schema_service.diff_versions()
        assert diff['total_changes'] > 0
        assert any(c['type'] == 'node_type_added' and c['name'] == 'NEW_TYPE'
                   for c in diff['changes'])

    def test_diff_versions_single(self, schema_service):
        """Test diff with only one version."""
        diff = schema_service.diff_versions()
        assert diff['message'] == 'Only one version exists'

    def test_export_schema(self, schema_service):
        """Test schema export as dict."""
        exported = schema_service.export_schema()
        assert 'node_types' in exported
        assert 'relationship_types' in exported
        assert 'exported_at' in exported

    def test_export_schema_json(self, schema_service):
        """Test schema export as JSON string."""
        json_str = schema_service.export_schema(as_json=True)
        assert isinstance(json_str, str)
        import json
        data = json.loads(json_str)
        assert 'node_types' in data

    def test_version_history(self, schema_service):
        """Test version history tracking."""
        schema_service.bump_version('minor', 'v1.1')
        schema_service.bump_version('patch', 'v1.1.1')

        history = schema_service.get_version_history()
        assert len(history) == 3  # initial + 2 bumps
        assert history[0]['version'] == '1.0.0'
        assert history[1]['version'] == '1.1.0'
        assert history[2]['version'] == '1.1.1'

    def test_statistics(self, schema_service):
        """Test schema statistics."""
        stats = schema_service.get_statistics()
        assert stats['node_type_count'] == 8
        assert stats['relationship_type_count'] == 8
        assert stats['total_properties'] > 0
        assert stats['total_versions'] == 1


# ============================================================================
# TEST SUBGRAPH EXTRACTION
# ============================================================================

class TestSubgraphExtraction:
    """Tests for SubgraphExtractionService."""

    @pytest.fixture
    def adjacency(self):
        return {
            'a': {'b', 'c'},
            'b': {'a', 'c', 'd'},
            'c': {'a', 'b', 'e'},
            'd': {'b', 'f'},
            'e': {'c', 'f'},
            'f': {'d', 'e', 'g'},
            'g': {'f'},
        }

    def test_ego_network_1hop(self, subgraph_service, adjacency):
        """Test 1-hop ego network."""
        result = subgraph_service.extract_ego_network('a', adjacency, k_hops=1)

        assert result['focal_node'] == 'a'
        assert result['node_count'] == 3  # a, b, c
        assert result['edge_count'] >= 1

        # Focal node should be at depth 0
        focal = next(n for n in result['nodes'] if n['id'] == 'a')
        assert focal['is_focal'] is True
        assert focal['depth'] == 0

    def test_ego_network_2hop(self, subgraph_service, adjacency):
        """Test 2-hop ego network."""
        result = subgraph_service.extract_ego_network('a', adjacency, k_hops=2)

        # Should include a, b, c, d, e (2 hops from a)
        assert result['node_count'] >= 5
        node_ids = {n['id'] for n in result['nodes']}
        assert {'a', 'b', 'c', 'd', 'e'} <= node_ids

    def test_ego_network_max_nodes(self, subgraph_service, adjacency):
        """Test ego network with max_nodes limit."""
        result = subgraph_service.extract_ego_network(
            'a', adjacency, k_hops=10, max_nodes=3
        )
        assert result['node_count'] <= 3

    def test_ego_network_statistics(self, subgraph_service, adjacency):
        """Test ego network has statistics."""
        result = subgraph_service.extract_ego_network('a', adjacency, k_hops=2)

        assert 'statistics' in result
        assert 'density' in result['statistics']
        assert 'average_degree' in result['statistics']
        assert result['statistics']['density'] >= 0

    def test_path_subgraph(self, subgraph_service, adjacency):
        """Test path-based subgraph extraction."""
        result = subgraph_service.extract_path_subgraph(
            'a', 'g', adjacency, max_depth=5
        )

        assert result['source'] == 'a'
        assert result['target'] == 'g'
        assert result['path_count'] > 0
        # Each path should start at a and end at g
        for path in result['paths']:
            assert path[0] == 'a'
            assert path[-1] == 'g'

    def test_path_subgraph_no_path(self, subgraph_service):
        """Test when no path exists."""
        adj = {'a': {'b'}, 'b': {'a'}, 'c': set()}
        result = subgraph_service.extract_path_subgraph('a', 'c', adj)
        assert result['path_count'] == 0

    def test_topic_subgraph(self, subgraph_service, adjacency):
        """Test topic-based subgraph."""
        node_topics = {
            'a': ['machine_learning'],
            'b': ['machine_learning', 'python'],
            'c': ['python'],
            'd': ['databases'],
            'e': ['python'],
        }

        result = subgraph_service.extract_topic_subgraph(
            'machine_learning', adjacency, node_topics, include_neighbors=True
        )

        assert result['topic'] == 'machine_learning'
        assert result['topic_member_count'] == 2  # a, b
        assert result['node_count'] >= 2

        # Check member flags
        for node in result['nodes']:
            if node['id'] in ('a', 'b'):
                assert node['is_topic_member'] is True

    def test_topic_subgraph_no_neighbors(self, subgraph_service, adjacency):
        """Test topic subgraph without neighbor expansion."""
        node_topics = {
            'a': ['ml'],
            'b': ['ml'],
        }

        result = subgraph_service.extract_topic_subgraph(
            'ml', adjacency, node_topics, include_neighbors=False
        )
        assert result['node_count'] == 2
        assert result['neighbor_count'] == 0

    def test_temporal_subgraph(self, subgraph_service, adjacency):
        """Test temporal subgraph extraction."""
        node_timestamps = {
            'a': '2026-01-01T00:00:00Z',
            'b': '2026-01-05T00:00:00Z',
            'c': '2026-01-10T00:00:00Z',
            'd': '2026-01-15T00:00:00Z',
            'e': '2026-02-01T00:00:00Z',
            'f': '2026-02-15T00:00:00Z',
            'g': '2026-03-01T00:00:00Z',
        }

        result = subgraph_service.extract_temporal_subgraph(
            adjacency, node_timestamps,
            start_time='2026-01-01T00:00:00Z',
            end_time='2026-01-20T00:00:00Z'
        )

        assert result['node_count'] == 4  # a, b, c, d
        assert 'a' in result['nodes']
        assert 'd' in result['nodes']
        assert 'e' not in result['nodes']

    def test_filtered_subgraph_by_type(self, subgraph_service, adjacency):
        """Test type-filtered subgraph."""
        node_metadata = {
            'a': {'type': 'PERSON'},
            'b': {'type': 'PERSON'},
            'c': {'type': 'TOOL'},
            'd': {'type': 'TOOL'},
            'e': {'type': 'PERSON'},
            'f': {'type': 'TOPIC'},
            'g': {'type': 'TOPIC'},
        }

        result = subgraph_service.extract_filtered_subgraph(
            adjacency, node_metadata, node_types=['PERSON']
        )

        assert result['node_count'] == 3  # a, b, e
        assert all(n in ('a', 'b', 'e') for n in result['nodes'])

    def test_filtered_subgraph_by_degree(self, subgraph_service, adjacency):
        """Test degree-filtered subgraph."""
        node_metadata = {n: {'type': 'ANY'} for n in adjacency}

        result = subgraph_service.extract_filtered_subgraph(
            adjacency, node_metadata, min_degree=2
        )

        # Only nodes with degree >= 2
        for node in result['nodes']:
            assert len(adjacency.get(node, set())) >= 2

    def test_subgraph_statistics(self, subgraph_service, adjacency):
        """Test subgraph statistics computation."""
        nodes = {'a', 'b', 'c'}
        stats = subgraph_service._compute_subgraph_stats(nodes, adjacency)

        assert 0 <= stats['density'] <= 1.0
        assert stats['average_degree'] > 0
        assert 0 <= stats['clustering_coefficient'] <= 1.0

    def test_bfs_distances(self, subgraph_service, adjacency):
        """Test BFS distance computation."""
        nodes = set(adjacency.keys())
        distances = subgraph_service._bfs_distances('a', adjacency, nodes)

        assert distances['a'] == 0
        assert distances['b'] == 1
        assert distances['g'] > 1  # g is far from a
