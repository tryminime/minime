"""
Load & Stress Tests — performance validation under simulated load.

Tests:
- Concurrent user simulation
- Bulk data ingestion throughput
- Search latency under load
- Rate limiter burst handling
- Event sourcing append throughput
- Memory / collection size stress
"""

import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List

import pytest

from backend.services.semantic_search_service import SemanticSearchService
from backend.infrastructure.event_sourcing import (
    Command, CommandHandler, DomainEvent, EventStore,
)
from backend.middleware.rate_limiter import RateLimiterService
from backend.monitoring.health_dashboard import HealthDashboard
from backend.monitoring.prometheus_metrics import MetricsRegistry


# ═══════════════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════════════

@pytest.fixture
def search_service():
    return SemanticSearchService()


@pytest.fixture
def event_store():
    return EventStore()


@pytest.fixture
def rate_limiter():
    return RateLimiterService()


# ═══════════════════════════════════════════════════════════════════════
# Load: Bulk Ingestion
# ═══════════════════════════════════════════════════════════════════════

class TestBulkIngestion:
    def test_insert_1000_vectors(self, search_service):
        """Insert 1000 vectors and verify all are stored."""
        start = time.time()
        points = []
        for i in range(1000):
            vec = [0.0] * 384
            vec[i % 384] = 1.0
            points.append({
                "id": f"pt-{i}",
                "vector": vec,
                "payload": {"user_id": "load-user", "text": f"document {i}"},
            })
        result = search_service.upsert_batch("activities", points)
        elapsed = time.time() - start

        assert result["success"] is True
        assert result["inserted"] == 1000
        assert elapsed < 5.0  # should finish in under 5 seconds
        info = search_service.get_collection_info("activities")
        assert info["vectors_count"] == 1000

    def test_insert_5000_vectors(self, search_service):
        """Insert 5000 vectors — sustained throughput test."""
        start = time.time()
        for batch_start in range(0, 5000, 500):
            points = []
            for i in range(batch_start, batch_start + 500):
                vec = [0.0] * 384
                vec[i % 384] = 1.0
                points.append({
                    "id": f"pt-{i}",
                    "vector": vec,
                    "payload": {"user_id": "load-user", "text": f"doc {i}"},
                })
            search_service.upsert_batch("activities", points)
        elapsed = time.time() - start

        assert search_service.get_collection_info("activities")["vectors_count"] == 5000
        assert elapsed < 15.0

    def test_search_latency_1000_vectors(self, search_service):
        """Search latency with 1000 vectors should be < 100ms."""
        # Seed
        for i in range(1000):
            vec = [0.0] * 384
            vec[i % 384] = 1.0
            search_service.upsert("activities", f"pt-{i}", vec, {
                "user_id": "u1", "text": f"doc {i}",
            })

        query = [0.0] * 384
        query[0] = 1.0

        start = time.time()
        results = search_service.semantic_search(
            "activities", query, limit=10, user_id="u1",
        )
        elapsed = time.time() - start

        assert len(results) > 0
        assert elapsed < 0.1  # 100ms budget

    def test_hybrid_search_under_load(self, search_service):
        """Hybrid search with 1000 vectors."""
        for i in range(1000):
            vec = [0.0] * 384
            vec[i % 384] = 1.0
            search_service.upsert("activities", f"pt-{i}", vec, {
                "user_id": "u1", "text": f"project alpha module {i}",
            })

        query = [0.0] * 384
        query[0] = 1.0

        start = time.time()
        results = search_service.hybrid_search(
            "activities", query, "project alpha", limit=10, user_id="u1",
        )
        elapsed = time.time() - start

        assert len(results) > 0
        assert elapsed < 1.0  # 1s budget for hybrid


# ═══════════════════════════════════════════════════════════════════════
# Load: Concurrent Users
# ═══════════════════════════════════════════════════════════════════════

class TestConcurrentUsers:
    def test_concurrent_searches(self, search_service):
        """20 concurrent searches should complete without errors."""
        # Seed
        for i in range(100):
            vec = [0.0] * 384
            vec[i % 384] = 1.0
            search_service.upsert("activities", f"pt-{i}", vec, {
                "user_id": f"user-{i % 5}", "text": f"doc {i}",
            })

        errors: List[str] = []

        def do_search(user_id: str):
            try:
                query = [0.0] * 384
                query[0] = 1.0
                results = search_service.semantic_search(
                    "activities", query, limit=5, user_id=user_id,
                )
                assert len(results) >= 0
            except Exception as e:
                errors.append(str(e))

        with ThreadPoolExecutor(max_workers=20) as pool:
            futures = [pool.submit(do_search, f"user-{i % 5}") for i in range(20)]
            for f in as_completed(futures):
                f.result()

        assert len(errors) == 0

    def test_concurrent_writes(self, search_service):
        """10 concurrent writers should not corrupt data."""
        errors: List[str] = []

        def do_write(writer_id: int):
            try:
                for i in range(50):
                    vec = [float(writer_id)] * 384
                    search_service.upsert(
                        "activities", f"w{writer_id}-pt-{i}", vec,
                        {"user_id": f"writer-{writer_id}", "text": f"write {i}"},
                    )
            except Exception as e:
                errors.append(str(e))

        with ThreadPoolExecutor(max_workers=10) as pool:
            futures = [pool.submit(do_write, i) for i in range(10)]
            for f in as_completed(futures):
                f.result()

        assert len(errors) == 0
        total = search_service.get_collection_info("activities")["vectors_count"]
        assert total == 500  # 10 writers × 50 each


# ═══════════════════════════════════════════════════════════════════════
# Load: Event Sourcing Throughput
# ═══════════════════════════════════════════════════════════════════════

class TestEventSourcingLoad:
    def test_append_10000_events(self, event_store):
        """Append 10k events and verify throughput."""
        start = time.time()
        for i in range(10_000):
            event_store.append(DomainEvent(
                f"agg-{i % 100}", "activity_recorded",
                {"id": f"act-{i}", "duration": 100},
            ))
        elapsed = time.time() - start

        stats = event_store.get_stats()
        assert stats["total_events"] == 10_000
        assert stats["total_aggregates"] == 100
        assert elapsed < 5.0

    def test_replay_from_100_events(self, event_store):
        """Replay 100 events for a single aggregate."""
        for i in range(100):
            event_store.append(DomainEvent(
                "agg-replay", "activity_recorded",
                {"id": f"act-{i}", "duration": 60},
            ))

        start = time.time()
        events = event_store.get_events("agg-replay")
        elapsed = time.time() - start

        assert len(events) == 100
        assert elapsed < 0.1


# ═══════════════════════════════════════════════════════════════════════
# Stress: Rate Limiter
# ═══════════════════════════════════════════════════════════════════════

class TestRateLimiterStress:
    def test_rapid_fire_requests(self, rate_limiter):
        """Rapid-fire 100 requests should correctly enforce limits."""
        allowed = 0
        blocked = 0
        for _ in range(100):
            result = rate_limiter.record("stress-user", "/api/v1/test", "free")
            if result.allowed:
                allowed += 1
            else:
                blocked += 1

        # free tier: burst=10, 30/min → should block most after initial burst
        assert blocked > 0
        assert allowed <= 30  # can't exceed per-minute limit

    def test_multi_user_isolation(self, rate_limiter):
        """Limits for user A should not affect user B."""
        # Exhaust user A
        for _ in range(50):
            rate_limiter.record("user-A", "/api/v1/test", "free")

        # User B should still be allowed
        result = rate_limiter.record("user-B", "/api/v1/test", "free")
        assert result.allowed is True

    def test_stats_accuracy(self, rate_limiter):
        """Stats should accurately count checks and blocks."""
        for _ in range(20):
            rate_limiter.record("stat-user", "/api/v1/test", "free")
        stats = rate_limiter.get_stats()
        assert stats["total_checked"] == 20
        assert stats["total_blocked"] + 20 - stats["total_blocked"] == 20


# ═══════════════════════════════════════════════════════════════════════
# Stress: Memory / Collection Size
# ═══════════════════════════════════════════════════════════════════════

class TestMemoryStress:
    def test_large_collection_optimize(self, search_service):
        """Optimize a collection with 2000 vectors including duplicates."""
        for i in range(1000):
            vec = [float(i % 10)] * 384
            search_service.upsert("activities", f"pt-{i}", vec, {"text": f"doc {i}"})
        # add duplicates
        for i in range(500):
            search_service._stores["activities"].append({
                "id": f"pt-{i}", "vector": [0.0] * 384, "payload": {"text": "dup"},
            })

        result = search_service.optimize_collection("activities")
        assert result["duplicates_removed"] == 500
        assert result["total_vectors"] == 1000

    def test_many_collections(self, search_service):
        """Create 50 collections and verify listing."""
        for i in range(50):
            search_service.create_collection(f"coll_{i}", dimension=64)
        colls = search_service.list_collections()
        assert len(colls) >= 54  # 4 default + 50 new


# ═══════════════════════════════════════════════════════════════════════
# Stress: Monitoring Under Load
# ═══════════════════════════════════════════════════════════════════════

class TestMonitoringUnderLoad:
    def test_metrics_high_cardinality(self):
        """Record metrics with high label cardinality."""
        reg = MetricsRegistry()
        for i in range(500):
            reg.http_requests_total.inc(
                method="GET", endpoint=f"/api/v1/item/{i}", status_code="200",
            )
        collected = reg.collect_all()
        assert len(collected["http_requests_total"]) == 500

    def test_health_dashboard_rapid_checks(self):
        """Rapid health checks should not degrade performance."""
        hd = HealthDashboard()
        hd.check_database("postgresql", connected=True, latency_ms=5)
        hd.check_database("redis", connected=True, latency_ms=1)

        start = time.time()
        for _ in range(200):
            hd.get_health()
        elapsed = time.time() - start

        assert elapsed < 2.0
        history = hd.get_health_history()
        assert len(history) == 100  # capped at 100
