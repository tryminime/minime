#!/usr/bin/env python3
"""
Seed script: Run enrichment pipeline on testuser's activities.

This bypasses Celery and runs enrichment directly — useful for dev seeding
without a running Redis/Celery stack.

Usage:
    cd /home/ansari/Documents/MiniMe
    source backend/venv/bin/activate
    DATABASE_URL=postgresql+asyncpg://minime:minime_dev_password@localhost:5432/minime \\
    PYTHONPATH=. python scripts/seed_enrichment.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
import structlog

logger = structlog.get_logger()

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://minime:minime_dev_password@localhost:5432/minime"
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Map spaCy/custom labels → DB-allowed entity_type values
# DB CHECK: person, project, skill, concept, organization, artifact, event, interaction
LABEL_TYPE_MAP = {
    "PERSON": "person",
    "ORG": "organization",
    "NORP": "organization",
    "GPE": "concept",
    "LOC": "concept",
    "PRODUCT": "artifact",
    "TOOL": "artifact",         # Tools/software → artifact
    "WORK_OF_ART": "artifact",
    "EVENT": "event",
    "LAW": "concept",
    "FAC": "concept",
}


async def seed_enrichment(email: str = "testuser@minime.com"):
    """Run enrichment pipeline on all activities for a given user."""
    from backend.models import Activity, User, Entity, ActivityEntityLink
    from backend.services.nlp_service import NLPService
    from backend.services.auto_tagger import AutoTagger

    nlp = NLPService()
    tagger = AutoTagger()

    async with AsyncSessionLocal() as db:
        # Get user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print(f"❌ User '{email}' not found")
            return

        user_id = user.id
        print(f"✅ Found user: {user.email} (id={user_id})")

        # Get activities
        result = await db.execute(
            select(Activity).where(Activity.user_id == user_id)
        )
        activities = result.scalars().all()
        print(f"📦 Processing {len(activities)} activities...")

        entity_count = 0
        link_count = 0

        for i, activity in enumerate(activities):
            # Build text blob for NER
            text_parts = []
            if activity.title:
                text_parts.append(activity.title)
            if activity.app:
                text_parts.append(activity.app)
            if activity.domain:
                text_parts.append(activity.domain)
            if activity.data and isinstance(activity.data, dict):
                if activity.data.get("description"):
                    text_parts.append(str(activity.data["description"])[:200])

            text_blob = " ".join(text_parts).strip()
            if not text_blob:
                continue

            # Extract entities using spaCy (enhanced with custom tech patterns)
            try:
                context = {
                    "url": activity.url or "",
                    "domain": activity.domain or "",
                    "app_name": activity.app or "",
                }
                extracted = nlp.extract_entities_enhanced(text_blob, context)
            except Exception as e:
                print(f"  ⚠️  NER failed on activity {activity.id}: {e}")
                continue

            # Process each extracted entity
            for ent in extracted:
                raw_label = ent.get("label", "")
                entity_type = LABEL_TYPE_MAP.get(raw_label)
                if not entity_type:
                    continue  # Skip unmapped types

                entity_name = ent.get("text", "").strip()
                if not entity_name or len(entity_name) < 2:
                    continue

                try:
                    # Use savepoint so one bad entity doesn't kill the session
                    async with db.begin_nested():
                        # Find or create entity by name + type + user
                        existing_result = await db.execute(
                            select(Entity).where(
                                Entity.user_id == user_id,
                                Entity.name == entity_name,
                                Entity.entity_type == entity_type,
                            )
                        )
                        db_entity = existing_result.scalar_one_or_none()

                        if not db_entity:
                            db_entity = Entity(
                                user_id=user_id,
                                name=entity_name,
                                entity_type=entity_type,
                                confidence=ent.get("confidence", 0.8),
                                occurrence_count=1,
                            )
                            db.add(db_entity)
                            await db.flush()
                            entity_count += 1
                        else:
                            db_entity.occurrence_count = (db_entity.occurrence_count or 0) + 1
                            # Update last_seen via DB default
                            db_entity.confidence = max(
                                db_entity.confidence or 0,
                                ent.get("confidence", 0.8)
                            )

                        # Create link if not exists
                        link_check = await db.execute(
                            select(ActivityEntityLink).where(
                                ActivityEntityLink.activity_id == activity.id,
                                ActivityEntityLink.entity_id == db_entity.id,
                            )
                        )
                        existing_link = link_check.scalar_one_or_none()
                        if not existing_link:
                            link = ActivityEntityLink(
                                activity_id=activity.id,
                                entity_id=db_entity.id,
                                relevance_score=ent.get("confidence", 0.8),
                            )
                            db.add(link)
                            link_count += 1

                except Exception as e:
                    print(f"  ⚠️  Entity '{entity_name}' failed: {e}")
                    continue

            # Auto-tag (store tags in activity.data for later UI display)
            try:
                act_dict = {
                    "url": activity.url or "",
                    "domain": activity.domain or "",
                    "title": activity.title or "",
                    "app_name": activity.app or "",
                    "context": activity.data or {},
                }
                tag_result = tagger.auto_tag_activity(act_dict)
                if tag_result and isinstance(activity.data, dict):
                    activity.data = {
                        **activity.data,
                        "_auto_tags": tag_result.get("tags", []),
                        "_primary_category": tag_result.get("primary_category", ""),
                        "_tag_confidence": round(tag_result.get("confidence", 0), 2),
                    }
            except Exception:
                pass  # Non-critical

            if (i + 1) % 10 == 0:
                print(f"  ... processed {i+1}/{len(activities)} activities")

        await db.commit()
        print(f"\n🎉 Done!")
        print(f"   📝 Entities created: {entity_count}")
        print(f"   🔗 Activity-entity links: {link_count}")

        # Show breakdown
        result = await db.execute(
            text(
                "SELECT entity_type, COUNT(*) as c FROM entities "
                "WHERE user_id=:uid GROUP BY entity_type ORDER BY c DESC"
            ),
            {"uid": str(user_id)},
        )
        rows = result.fetchall()
        if rows:
            print("\n📊 Entities by type:")
            for row in rows:
                print(f"   {row[0]:<15} {row[1]}")


if __name__ == "__main__":
    user_email = sys.argv[1] if len(sys.argv) > 1 else "testuser@minime.com"
    asyncio.run(seed_enrichment(user_email))
