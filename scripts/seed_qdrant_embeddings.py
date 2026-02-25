#!/usr/bin/env python3
"""
Seed entity embeddings into Qdrant for semantic duplicate detection.

This script:
1. Loads all entities from PostgreSQL
2. Generates sentence-transformer embeddings (384-dim)
3. Uploads them to the Qdrant `entities` collection
4. Removes low-quality/test entities (TestApp, VerifyApp, duplicates)

Usage:
    cd /home/ansari/Documents/MiniMe
    source backend/venv/bin/activate
    DATABASE_URL=postgresql+asyncpg://minime:minime_dev_password@localhost:5432/minime \\
    QDRANT_URL=http://localhost:6333 \\
    PYTHONPATH=. python scripts/seed_qdrant_embeddings.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://minime:minime_dev_password@localhost:5432/minime"
)
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")

# Low-quality entities to purge (test/demo data, bad NER extractions)
ENTITIES_TO_PURGE = {
    "TestApp",
    "VerifyApp",
    "Chrome stackoverflow.com",  # URL-based false positive
}

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def purge_bad_entities(db: AsyncSession):
    """Remove low-quality entities and consolidate duplicates."""
    from backend.models import Entity, ActivityEntityLink

    purged = 0
    for name in ENTITIES_TO_PURGE:
        result = await db.execute(
            select(Entity).where(Entity.name == name)
        )
        entities = result.scalars().all()
        for ent in entities:
            # Delete links first
            await db.execute(
                text("DELETE FROM activity_entity_links WHERE entity_id = :eid"),
                {"eid": str(ent.id)}
            )
            await db.delete(ent)
            purged += 1
            print(f"  🗑  Purged: {name} ({ent.entity_type})")

    # Remove duplicate entities with same name+type (keep highest occurrence_count)
    dedup_result = await db.execute(
        text("""
            SELECT name, entity_type, COUNT(*) as c
            FROM entities
            GROUP BY name, entity_type
            HAVING COUNT(*) > 1
        """)
    )
    dupes = dedup_result.fetchall()
    for name, etype, count in dupes:
        # Get all with this name+type ordered by occurrence_count desc
        ents_result = await db.execute(
            select(Entity)
            .where(Entity.name == name, Entity.entity_type == etype)
            .order_by(Entity.occurrence_count.desc())
        )
        ents = ents_result.scalars().all()
        # Keep first (highest occurrence), delete rest
        keeper = ents[0]
        for dup in ents[1:]:
            # Re-point links to keeper
            await db.execute(
                text("""
                    UPDATE activity_entity_links
                    SET entity_id = :keeper
                    WHERE entity_id = :dup_id
                    AND (activity_id, :keeper) NOT IN (
                        SELECT activity_id, entity_id FROM activity_entity_links WHERE entity_id = :keeper
                    )
                """),
                {"keeper": str(keeper.id), "dup_id": str(dup.id)}
            )
            # Delete leftover links for dup
            await db.execute(
                text("DELETE FROM activity_entity_links WHERE entity_id = :eid"),
                {"eid": str(dup.id)}
            )
            await db.delete(dup)
            purged += 1
            print(f"  🔀 Deduped: {name} ({etype})")

    if purged:
        print(f"\n✅ Purged {purged} low-quality/duplicate entities")
    else:
        print("✅ No entities to purge")

    return purged


async def ensure_qdrant_collection():
    """Ensure the entities collection exists in Qdrant with correct settings."""
    from qdrant_client import QdrantClient
    from qdrant_client.models import VectorParams, Distance

    client = QdrantClient(url=QDRANT_URL)
    collections = [c.name for c in client.get_collections().collections]

    if "entities" not in collections:
        client.create_collection(
            collection_name="entities",
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        print("✅ Created Qdrant 'entities' collection")
    else:
        print("✅ Qdrant 'entities' collection already exists")

    return client


async def seed_embeddings():
    """Generate embeddings for all entities and upload to Qdrant."""
    from backend.models import Entity
    from backend.services.embedding_service import embedding_service
    from qdrant_client import QdrantClient
    from qdrant_client.models import PointStruct

    print("🚀 Starting Qdrant entity embedding pipeline...")
    print(f"   DB:     {DATABASE_URL.split('@')[-1]}")
    print(f"   Qdrant: {QDRANT_URL}")

    async with AsyncSessionLocal() as db:
        # Step 1: Purge bad entities
        print("\n🧹 Purging low-quality entities...")
        await purge_bad_entities(db)
        await db.commit()

        # Step 2: Fetch all remaining entities
        result = await db.execute(select(Entity))
        entities = result.scalars().all()
        print(f"\n📦 Found {len(entities)} entities to embed")

        if not entities:
            print("❌ No entities found. Run seed_enrichment.py first.")
            return

        # Step 3: Generate embeddings in batch
        print("🧠 Generating embeddings (all-MiniLM-L6-v2, 384-dim)...")
        names = [e.name for e in entities]
        embeddings = embedding_service.generate_batch_embeddings(names)
        print(f"✅ Generated {len(embeddings)} embeddings")

        # Step 4: Ensure Qdrant collection
        qdrant = await ensure_qdrant_collection()

        # Step 5: Upload to Qdrant
        points = []
        for entity, embedding in zip(entities, embeddings):
            points.append(PointStruct(
                id=str(entity.id),
                vector=embedding,
                payload={
                    "name": entity.name,
                    "entity_type": entity.entity_type,
                    "occurrence_count": entity.occurrence_count or 0,
                    "user_id": str(entity.user_id),
                }
            ))

        qdrant.upsert(collection_name="entities", points=points)
        print(f"✅ Uploaded {len(points)} entity embeddings to Qdrant")

        # Step 6: Summary
        result2 = await db.execute(
            text("SELECT entity_type, COUNT(*) as c, SUM(occurrence_count) as total_occ FROM entities GROUP BY entity_type ORDER BY c DESC")
        )
        rows = result2.fetchall()
        print("\n📊 Entity summary:")
        for row in rows:
            print(f"   {row[0]:<15} {row[1]:>2} entities  ({row[2]} total occurrences)")

        # Step 7: Check Qdrant
        info = qdrant.get_collection("entities")
        print(f"\n🔷 Qdrant entities collection: {info.points_count} points")


if __name__ == "__main__":
    asyncio.run(seed_embeddings())
