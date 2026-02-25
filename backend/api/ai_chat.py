"""
FastAPI backend endpoints for AI Chat Assistant with LLM integration.

Enhanced with:
- Conversation persistence via ConversationService
- RAG context retrieval with citation tracking
- SSE streaming responses
- Ollama local LLM integration
- Conversation management (list, archive, delete, export)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from ..database.postgres_client import get_db
from ..services.conversation_service import conversation_service
from ..services.rag_service import rag_service
from ..services.conversation_export_service import conversation_export_service
from ..auth.jwt_handler import decode_token, verify_token_type
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone
import asyncio
import uuid
import os
import json
import structlog

security = HTTPBearer()

def _get_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    """Extract user_id from JWT token."""
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or not verify_token_type(payload, "access"):
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


# Try import for Ollama (local LLM)
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

# Try import for OpenAI
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# AI Chat Router
ai_router = APIRouter(prefix="/api/ai", tags=["ai_chat"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: str
    model: Optional[str] = None
    citations: Optional[List[Dict[str, Any]]] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, str]] = None
    use_rag: bool = True
    stream: bool = False

class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    timestamp: str
    model: Optional[str] = None
    citations: Optional[List[Dict[str, Any]]] = None
    tokens: int = 0

class ConversationSummary(BaseModel):
    id: str
    title: str
    message_count: int
    last_message_at: str
    archived: bool = False

class ConversationDetail(BaseModel):
    id: str
    title: str
    messages: List[ChatMessage]
    message_count: int
    created_at: str

class ExportRequest(BaseModel):
    format: str = "markdown"  # markdown, json, pdf, txt

# ============================================================================
# LLM INTEGRATION (Enhanced)
# ============================================================================

class LLMManager:
    """Manages LLM integration (Ollama local, OpenAI cloud, or demo mode)"""

    def __init__(self):
        self.use_ollama = OLLAMA_AVAILABLE and os.getenv("USE_OLLAMA", "true").lower() == "true"
        self.use_openai = OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY") is not None

        if self.use_openai:
            openai.api_key = os.getenv("OPENAI_API_KEY")
            self.model = os.getenv("OPENAI_MODEL", "gpt-4")
        elif self.use_ollama:
            # Default to llama3.2:3b — fastest locally available model
            self.model = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
        else:
            # Fallback to demo responses
            self.model = "demo"

    def set_model(self, model_name: str) -> bool:
        """Dynamically switch the active Ollama model. Returns True if accepted."""
        if self.use_openai:
            self.model = model_name  # openai: whatever user passes
            return True
        if self.use_ollama:
            self.model = model_name
            return True
        return False

    def get_available_models(self) -> list:
        """Return list of available Ollama models (chat-capable only)."""
        if not self.use_ollama:
            return []
        try:
            response = ollama.list()
            # response is a Pydantic ListResponse with .models list of Model objects
            models_list = getattr(response, 'models', [])
            # Filter out embedding-only models (they can't be used for chat)
            SKIP = ('embed', 'nomic', 'clip')
            results = []
            for m in models_list:
                name = getattr(m, 'model', '') or getattr(m, 'name', '')
                if not name or any(s in name.lower() for s in SKIP):
                    continue
                size_bytes = getattr(m, 'size', 0) or 0
                results.append({
                    "name": name,
                    "size_gb": round(size_bytes / 1e9, 1),
                })
            return results
        except Exception as e:
            logger.warning("ollama_list_failed", error=str(e))
            return []


    def get_model_name(self) -> str:
        """Return the active model name."""
        return self.model

    async def get_response(
        self,
        messages: List[Dict[str, str]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get AI response from messages list. Returns response + token count."""

        if self.use_openai:
            return await self._get_openai_response(messages)
        elif self.use_ollama:
            return await self._get_ollama_response(messages)
        else:
            # Extract user message for demo
            user_msg = messages[-1]['content'] if messages else ''
            text = self._get_demo_response(user_msg, user_context)
            return {'text': text, 'tokens': len(text.split())}

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
    ):
        """Generate streaming response chunks (SSE-compatible)."""
        if self.use_openai:
            async for chunk in self._stream_openai(messages):
                yield chunk
        elif self.use_ollama:
            async for chunk in self._stream_ollama(messages):
                yield chunk
        else:
            # Demo streaming
            user_msg = messages[-1]['content'] if messages else ''
            demo_text = self._get_demo_response(user_msg)
            for word in demo_text.split():
                yield word + ' '
                await asyncio.sleep(0.05)

    def _build_system_prompt(self, user_context: Optional[Dict[str, Any]] = None) -> str:
        """Build system prompt with user context"""
        base_prompt = """You are MiniMe AI, an intelligent assistant for a productivity and activity tracking platform.
You have access to the user's activity data, focus metrics, wellness scores, and project information.
Provide helpful, concise, and actionable insights based on their data.
Be friendly but professional.
When citing sources, use numbered references like [1], [2] etc."""

        if user_context:
            context_info = "\n\nUser Context:\n"
            if "focus_score" in user_context:
                context_info += f"- Current Focus Score: {user_context['focus_score']}/10\n"
            if "wellness_score" in user_context:
                context_info += f"- Wellness Score: {user_context['wellness_score']}/100\n"
            if "projects" in user_context:
                context_info += f"- Active Projects: {len(user_context['projects'])}\n"

            base_prompt += context_info

        return base_prompt

    async def _get_openai_response(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Get response from OpenAI API"""
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            return {
                'text': response.choices[0].message.content,
                'tokens': response.usage.total_tokens,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

    async def _get_ollama_response(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Get response from Ollama (local LLM)"""
        try:
            response = ollama.chat(
                model=self.model,
                messages=messages
            )
            # Handle both new Pydantic API (response.message.content)
            # and old dict API (response['message']['content'])
            if hasattr(response, 'message'):
                content = response.message.content
                tokens = getattr(response, 'eval_count', 0) or 0
            else:
                content = response['message']['content']
                tokens = response.get('eval_count', 0)
            return {
                'text': content,
                'tokens': tokens,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")


    async def _stream_openai(self, messages: List[Dict[str, str]]):
        """Stream from OpenAI API."""
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                stream=True,
            )
            async for chunk in response:
                delta = chunk.choices[0].delta
                if hasattr(delta, 'content') and delta.content:
                    yield delta.content
        except Exception:
            yield "[Error generating response]"

    async def _stream_ollama(self, messages: List[Dict[str, str]]):
        """Stream from Ollama."""
        try:
            stream = ollama.chat(
                model=self.model,
                messages=messages,
                stream=True,
            )
            for chunk in stream:
                # Handle both new Pydantic API and old dict API
                if hasattr(chunk, 'message') and chunk.message:
                    text = chunk.message.content
                    if text:
                        yield text
                elif isinstance(chunk, dict) and 'message' in chunk:
                    text = chunk['message'].get('content', '')
                    if text:
                        yield text
        except Exception:
            yield "[Error generating response]"


    def _get_demo_response(self, message: str, user_context: Optional[Dict[str, Any]] = None) -> str:
        """Demo responses when no LLM is available"""
        msg = message.lower()

        if "focus score" in msg or "focus" in msg:
            score = user_context.get("focus_score", 8.2) if user_context else 8.2
            return f"Your focus score is {score}/10. You're doing great! You had solid deep work sessions today."

        if ("time" in msg and "coding" in msg) or "spent" in msg:
            return "You spent 4 hours 22 minutes coding today across 3 projects (MemoryAI, MiniMe, Air Quality). That's 73% of your active time."

        if "burn out" in msg or "burnout" in msg or "wellness" in msg:
            wellness = user_context.get("wellness_score", 72) if user_context else 72
            return f"Your wellness score is {wellness}/100 (GOOD). However, I noticed 2 days with >12h work. Recommendation: Take Friday afternoon off or reduce meetings next week."

        if "paper" in msg or "writing" in msg:
            return "MiniMe Activity Paper: 28% complete (3,200/8,000 words). Writing pace: 450 words/day. At current pace, you'll complete in 13 days. Deadline is 42 days away ✓"

        if "report" in msg or "summary" in msg:
            return """📊 Weekly Report: Jan 25-31, 2026

Total tracked: 42h 15min
Days active: 6/7
Avg focus: 8.1/10

Deep Work: 18h 30m (44%)
Meetings: 5h 12m (12%)

📈 Trends:
↑ Deep work up 12% vs last week
✓ Focus score: +0.4 points"""

        if "pattern" in msg or "productive" in msg:
            return """Based on 4 weeks of data:
• Peak productivity: 9-11 AM
• Good focus: 2-4 PM
• Evening focused work: 7-9 PM

Suggestion: Schedule deep work during your morning peak hours!"""

        return f'I\'m analyzing your request: "{message}". This is a demo response. Connect a real LLM (Ollama or OpenAI) for intelligent responses!'

# Initialize LLM Manager
llm_manager = LLMManager()

# ============================================================================
# AI CHAT ENDPOINTS (Enhanced with persistence + RAG)
# ============================================================================

@ai_router.post("/chat", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Send a message to AI chat and get response with citations."""

    user_id = _get_user_id(credentials)
    conversation_id = request.conversation_id or str(uuid.uuid4())

    # Get user context (REAL data from DB)
    user_context = await _get_user_context(credentials, db)

    # Build personalized system prompt from real user data
    system_prompt = _build_personalized_system_prompt(user_context)

    # RAG: Retrieve relevant context
    citations = []
    if request.use_rag:
        # Index recent activities into RAG store (populate if empty / stale)
        await _index_activities_into_rag(db, user_id)

        rag_collection = f"activities_{user_id}"
        rag_results = rag_service.retrieve(
            query=request.message,
            collections=[rag_collection],
            top_k=5,
        )
        if rag_results:
            augmented = rag_service.build_augmented_prompt(
                query=request.message,
                retrieved_docs=rag_results,
            )
            system_prompt += f"\n\n{augmented['context_text']}"
            citations = augmented.get('citations', [])



    # Build messages with memory
    messages = conversation_service.build_llm_messages(
        user_id=user_id,
        conversation_id=conversation_id,
        system_prompt=system_prompt,
        current_message=request.message,
    )

    # Get AI response
    result = await llm_manager.get_response(messages=messages, user_context=user_context)

    # Persist user message
    conversation_service.add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=request.message,
    )

    # Persist assistant message
    conversation_service.add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="assistant",
        content=result['text'],
        model=llm_manager.get_model_name(),
        tokens=result.get('tokens', 0),
        citations=citations,
    )

    return ChatResponse(
        message=result['text'],
        conversation_id=conversation_id,
        timestamp=datetime.now(tz=None).isoformat(),
        model=llm_manager.get_model_name(),
        citations=citations,
        tokens=result.get('tokens', 0),
    )


@ai_router.post("/chat/stream")
async def stream_message(
    request: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Stream AI chat response via Server-Sent Events."""

    user_id = _get_user_id(credentials)
    conversation_id = request.conversation_id or str(uuid.uuid4())

    user_context = await _get_user_context(credentials, db)
    system_prompt = _build_personalized_system_prompt(user_context)

    # Index activities into RAG for this user
    if request.use_rag:
        await _index_activities_into_rag(db, user_id)

    messages = conversation_service.build_llm_messages(
        user_id=user_id,
        conversation_id=conversation_id,
        system_prompt=system_prompt,
        current_message=request.message,
    )

    # Persist user message immediately
    conversation_service.add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=request.message,
    )

    async def event_generator():
        full_response = []
        async for chunk in llm_manager.stream_response(messages):
            full_response.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk, 'conversation_id': conversation_id})}\n\n"

        # Persist complete response
        complete_text = ''.join(full_response)
        conversation_service.add_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content=complete_text,
            model=llm_manager.get_model_name(),
        )

        yield f"data: {json.dumps({'done': True, 'conversation_id': conversation_id})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


# ============================================================================
# CONVERSATION MANAGEMENT ENDPOINTS
# ============================================================================

@ai_router.get("/conversations")
async def list_conversations(
    include_archived: bool = False,
    limit: int = 50,
    offset: int = 0,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """List all user conversations."""
    user_id = _get_user_id(credentials)
    return conversation_service.list_conversations(
        user_id=user_id,
        include_archived=include_archived,
        limit=limit,
        offset=offset,
    )


@ai_router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Get conversation with full message history."""
    user_id = _get_user_id(credentials)
    conv = conversation_service.get_conversation(
        user_id=user_id,
        conversation_id=conversation_id,
    )
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@ai_router.patch("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    title: Optional[str] = None,
    context_enabled: Optional[bool] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Update conversation metadata."""
    user_id = _get_user_id(credentials)
    conv = conversation_service.update_conversation(
        user_id=user_id,
        conversation_id=conversation_id,
        title=title,
        context_enabled=context_enabled,
    )
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@ai_router.post("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Archive a conversation."""
    user_id = _get_user_id(credentials)
    conv = conversation_service.archive_conversation(
        user_id=user_id,
        conversation_id=conversation_id,
    )
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@ai_router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Delete a conversation permanently."""
    user_id = _get_user_id(credentials)
    deleted = conversation_service.delete_conversation(
        user_id=user_id,
        conversation_id=conversation_id,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"deleted": True}


@ai_router.post("/conversations/{conversation_id}/export")
async def export_conversation(
    conversation_id: str,
    export_request: ExportRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Export a conversation to the specified format."""
    user_id = _get_user_id(credentials)
    conv = conversation_service.get_conversation(
        user_id=user_id,
        conversation_id=conversation_id,
        include_messages=True,
    )
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation_export_service.export_conversation(
        conversation=conv,
        format=export_request.format,
    )


@ai_router.get("/conversations/stats/overview")
async def get_conversation_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Get conversation statistics."""
    user_id = _get_user_id(credentials)
    return conversation_service.get_conversation_stats(user_id)


# ============================================================================
# SEARCH ENDPOINT
# ============================================================================

@ai_router.get("/search")
async def smart_search(
    q: str,
    top_k: int = 10,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Smart contextual search across the knowledge base."""
    return rag_service.smart_search(query=q, top_k=top_k)


# ============================================================================
# ANALYTICS ENDPOINTS FOR AI
# ============================================================================

@ai_router.get("/analytics/focus-score")
async def get_focus_score(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get user's current focus score — computed from real activities."""
    from backend.models import Activity
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone
    import uuid as uuid_lib

    try:
        user_id = _get_user_id(credentials)
        user_uuid = uuid_lib.UUID(str(user_id))
    except Exception:
        return None

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)

    # Today's activities
    result = db.execute(
        select(Activity).where(
            Activity.user_id == user_uuid,
            Activity.occurred_at >= today_start,
        )
    )
    today_acts = result.scalars().all()

    # This week's activities (for trend)
    result2 = db.execute(
        select(Activity).where(
            Activity.user_id == user_uuid,
            Activity.occurred_at >= week_start,
            Activity.occurred_at < today_start,
        )
    )
    week_acts = result2.scalars().all()

    if not today_acts and not week_acts:
        return None  # No data = no card shown

    # Today's focus
    total_s = sum(a.duration_seconds or 0 for a in today_acts)
    focused = [a for a in today_acts if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 600]
    focused_s = sum(a.duration_seconds or 0 for a in focused)
    score = min(10.0, (focused_s / max(total_s, 1)) * 10)
    deep_hours = sum(a.duration_seconds or 0 for a in focused) / 3600

    # Week focus for trend
    week_total = sum(a.duration_seconds or 0 for a in week_acts)
    week_focused = sum(a.duration_seconds or 0 for a in week_acts if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 600)
    prev_score = min(10.0, (week_focused / max(week_total, 1)) * 10) if week_total else score
    change = score - prev_score
    trend = "up" if change > 0.2 else "down" if change < -0.2 else "stable"

    return {
        "score": round(score, 1),
        "max_score": 10,
        "deep_work_hours": round(deep_hours, 1),
        "trend": trend,
        "change": round(change, 1)
    }

@ai_router.get("/analytics/wellness")
async def get_wellness_score(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get user's wellness/burnout score — computed from real activities."""
    from backend.models import Activity
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone
    import uuid as uuid_lib

    try:
        user_id = _get_user_id(credentials)
        user_uuid = uuid_lib.UUID(str(user_id))
    except Exception:
        return None

    now = datetime.now(timezone.utc)
    start = now - timedelta(days=7)

    result = db.execute(
        select(Activity).where(
            Activity.user_id == user_uuid,
            Activity.occurred_at >= start,
        )
    )
    activities = result.scalars().all()

    if not activities:
        return None  # No data = no card shown

    total_s = sum(a.duration_seconds or 0 for a in activities)
    total_h = total_s / 3600
    breaks = [a for a in activities if a.type in ("break", "idle")]
    long_sessions = [a for a in activities if (a.duration_seconds or 0) > 7200]
    moderate = [a for a in activities if 600 <= (a.duration_seconds or 0) <= 5400]

    session_balance = min(100, (len(moderate) / max(len(activities), 1)) * 120)
    unique_apps = len(set(a.app for a in activities if a.app))
    variety = min(100, (unique_apps + len(set(a.type for a in activities))) * 10)
    days_active = max(1, len(set(a.occurred_at.date() for a in activities if a.occurred_at)))
    avg_daily = total_h / days_active
    hours_score = 100 if 4 <= avg_daily <= 8 else max(0, 100 - abs(avg_daily - 6) * 15)
    break_ratio = sum(a.duration_seconds or 0 for a in breaks) / max(total_s, 1)
    break_score = min(100, break_ratio * 500) if breaks else max(40, hours_score * 0.6)

    overall = min(100, max(0, session_balance * 0.3 + variety * 0.2 + hours_score * 0.3 + break_score * 0.2))

    if overall >= 70:
        status = "good"
    elif overall >= 40:
        status = "warning"
    else:
        status = "alert"

    recs = []
    if len(long_sessions) >= 3:
        recs.append("Take more breaks — you have many long sessions")
    if avg_daily > 9:
        recs.append("Consider reducing daily work hours")
    if break_ratio < 0.05:
        recs.append("Schedule more breaks between tasks")

    return {
        "score": round(overall),
        "max_score": 100,
        "status": status,
        "factors": {
            "work_intensity": round(hours_score),
            "collaboration_stress": round(min(100, len([a for a in activities if a.type == "meeting"]) * 10)),
            "work_life_balance": round(session_balance),
            "skill_utilization": round(variety),
            "growth_opportunity": round(variety * 0.8)
        },
        "recommendations": recs
    }

@ai_router.post("/reports/weekly")
async def generate_weekly_report(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Generate weekly activity report — computed from real activities."""
    from backend.models import Activity
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone
    import uuid as uuid_lib

    empty_report = {"period": "", "total_hours": 0, "days_active": 0, "avg_focus_score": 0, "breakdown": {}, "trends": {}}
    try:
        user_id = _get_user_id(credentials)
        user_uuid = uuid_lib.UUID(str(user_id))
    except Exception:
        return empty_report

    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)

    result = db.execute(
        select(Activity).where(
            Activity.user_id == user_uuid,
            Activity.occurred_at >= week_start,
        )
    )
    activities = result.scalars().all()

    if not activities:
        return {"period": f"{week_start.strftime('%b %d')}-{now.strftime('%b %d, %Y')}", "total_hours": 0, "days_active": 0, "avg_focus_score": 0, "breakdown": {}, "trends": {}}

    total_s = sum(a.duration_seconds or 0 for a in activities)
    total_h = total_s / 3600
    days_active = len(set(a.occurred_at.date() for a in activities if a.occurred_at))
    deep = [a for a in activities if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 1500]
    meetings = [a for a in activities if a.type == "meeting"]
    focused_s = sum(a.duration_seconds or 0 for a in deep)
    focus_score = min(10, (focused_s / max(total_s, 1)) * 10)

    return {
        "period": f"{week_start.strftime('%b %d')}-{now.strftime('%b %d, %Y')}",
        "total_hours": round(total_h, 2),
        "days_active": days_active,
        "avg_focus_score": round(focus_score, 1),
        "breakdown": {
            "deep_work": round(sum(a.duration_seconds or 0 for a in deep) / 3600, 1),
            "meetings": round(sum(a.duration_seconds or 0 for a in meetings) / 3600, 1),
            "other": round((total_s - focused_s - sum(a.duration_seconds or 0 for a in meetings)) / 3600, 1),
        },
        "trends": {}
    }

# ============================================================================
# MODEL INFO ENDPOINT
# ============================================================================

@ai_router.get("/model/info")
async def get_model_info():
    """Get information about the active LLM model."""
    return {
        "model": llm_manager.get_model_name(),
        "provider": (
            "openai" if llm_manager.use_openai
            else "ollama" if llm_manager.use_ollama
            else "demo"
        ),
        "supports_streaming": True,
        "supports_rag": True,
        "ollama_available": OLLAMA_AVAILABLE,
        "openai_available": OPENAI_AVAILABLE,
    }


class SetModelRequest(BaseModel):
    model: str


@ai_router.put("/model")
async def set_active_model(request: SetModelRequest):
    """Change the active LLM model at runtime."""
    accepted = llm_manager.set_model(request.model)
    return {
        "accepted": accepted,
        "active_model": llm_manager.get_model_name(),
        "provider": (
            "openai" if llm_manager.use_openai
            else "ollama" if llm_manager.use_ollama
            else "demo"
        ),
    }


@ai_router.get("/models/available")
async def get_available_models():
    """List all locally available Ollama models (for the settings selector)."""
    models = llm_manager.get_available_models()
    return {
        "models": models,
        "active_model": llm_manager.get_model_name(),
        "provider": (
            "openai" if llm_manager.use_openai
            else "ollama" if llm_manager.use_ollama
            else "demo"
        ),
    }



# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _get_user_context(credentials: HTTPAuthorizationCredentials, db: Session) -> Dict[str, Any]:
    """
    Fetch REAL per-user context from the activities table.
    Returns actual stats used to personalise the AI system prompt.
    """
    from backend.models import Activity
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone
    import uuid as uuid_lib

    try:
        user_id = _get_user_id(credentials)
        user_uuid = uuid_lib.UUID(str(user_id))
    except Exception:
        return {"has_data": False}

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    result = db.execute(
        select(Activity).where(
            Activity.user_id == user_uuid,
            Activity.occurred_at >= week_ago,
        ).order_by(Activity.occurred_at.desc()).limit(300)
    )
    activities = result.scalars().all()

    if not activities:
        return {"has_data": False, "user_id": user_id}

    total_seconds = sum(a.duration_seconds or 0 for a in activities)
    total_hours = round(total_seconds / 3600, 1)

    focused = [a for a in activities if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 600]
    focused_seconds = sum(a.duration_seconds or 0 for a in focused)
    focus_score = round(min(10.0, (focused_seconds / max(total_seconds, 1)) * 10), 1)

    deep_work = [a for a in activities if a.type in ("window_focus", "app_focus") and (a.duration_seconds or 0) >= 1500]
    deep_work_hours = round(sum(a.duration_seconds or 0 for a in deep_work) / 3600, 1)

    app_time: Dict[str, float] = {}
    for a in activities:
        if a.app:
            app_time[a.app] = app_time.get(a.app, 0) + (a.duration_seconds or 0)
    top_apps = sorted(app_time.items(), key=lambda x: -x[1])[:6]
    top_apps_str = ", ".join(f"{app} ({round(secs/3600,1)}h)" for app, secs in top_apps) if top_apps else "none recorded"

    hour_time: Dict[int, float] = {}
    for a in activities:
        if a.occurred_at:
            h = a.occurred_at.hour
            hour_time[h] = hour_time.get(h, 0) + (a.duration_seconds or 0)
    if hour_time:
        peak_hour = max(hour_time, key=lambda h: hour_time[h])
        peak_hour_str = f"{peak_hour}:00\u2013{(peak_hour+1)%24}:00"
    else:
        peak_hour_str = "unknown"

    days_active = len(set(a.occurred_at.date() for a in activities if a.occurred_at))

    today_acts = [a for a in activities if a.occurred_at and a.occurred_at >= today_start]
    recent_titles = list({a.title for a in today_acts if a.title and len(a.title) > 3})[:8]

    type_counts: Dict[str, int] = {}
    for a in activities:
        type_counts[a.type] = type_counts.get(a.type, 0) + 1

    return {
        "has_data": True,
        "user_id": user_id,
        "total_hours_this_week": total_hours,
        "days_active": days_active,
        "focus_score": focus_score,
        "deep_work_hours": deep_work_hours,
        "top_apps": top_apps_str,
        "peak_productive_hour": peak_hour_str,
        "recent_window_titles": recent_titles,
        "activity_type_breakdown": type_counts,
        "total_activities": len(activities),
    }



# ── RAG Activity Indexer ─────────────────────────────────────────────────────

import time as _time
_rag_indexed_at: dict = {}  # user_id -> unix timestamp of last index


def _build_personalized_system_prompt(user_context: Dict[str, Any]) -> str:
    """Build a rich system prompt from REAL user data."""
    if not user_context.get("has_data"):
        return (
            "You are MiniMe AI, a personal work intelligence assistant. "
            "The user has no recorded activity data yet. "
            "Politely inform them to install the desktop tracking app and let it run for a day "
            "to generate personalised insights. Be friendly and helpful. Do NOT invent statistics."
        )

    ctx = user_context
    titles_str = ""
    if ctx.get("recent_window_titles"):
        titles_str = "\n  Recent window titles today: " + ", ".join(ctx["recent_window_titles"][:6])

    breakdown_str = ""
    if ctx.get("activity_type_breakdown"):
        breakdown_str = "\n  Activity type counts: " + ", ".join(
            f"{k}: {v}" for k, v in list(ctx["activity_type_breakdown"].items())[:6]
        )

    return f"""You are MiniMe AI, a personal work intelligence assistant.

== THIS USER'S REAL ACTIVITY DATA (last 7 days) ==
- Total tracked hours: {ctx.get('total_hours_this_week', 0)}h
- Days active this week: {ctx.get('days_active', 0)} of 7
- Focus score: {ctx.get('focus_score', 0)}/10
- Deep work hours: {ctx.get('deep_work_hours', 0)}h
- Peak productive hour: {ctx.get('peak_productive_hour', 'unknown')}
- Top apps by usage: {ctx.get('top_apps', 'none recorded')}{titles_str}{breakdown_str}
- Total activity events recorded: {ctx.get('total_activities', 0)}

== INSTRUCTIONS ==
1. Base ALL answers on the data above. NEVER make up statistics.
2. Reference the EXACT numbers from above (focus score, hours, app names, peak hour).
3. If asked about something not in the data above, say \"I don't have data on that yet.\"
4. Be concise, specific, and actionable.
5. If RAG context is provided below, use it for more granular answers.
"""


async def _index_activities_into_rag(db: Session, user_id: str) -> None:
    """
    Fetch recent activities from the DB and index them into the RAG store.
    Re-indexes every 5 minutes to ensure data freshness per user.
    """
    from ..services.rag_service import rag_service

    # Re-index every 5 minutes
    last_indexed = _rag_indexed_at.get(user_id, 0)
    if _time.time() - last_indexed < 300:
        return

    try:
        from sqlalchemy import text
        from datetime import datetime, timedelta

        collection = f"activities_{user_id}"
        cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()

        result = db.execute(
            text("""
                SELECT
                    id::text,
                    type          AS activity_type,
                    app           AS app_name,
                    title         AS window_title,
                    COALESCE(data::text, '{}') AS meta,
                    occurred_at   AS started_at,
                    COALESCE(duration_seconds, 0) / 60.0 AS duration_min
                FROM activities
                WHERE user_id = :user_id
                  AND occurred_at > :cutoff
                ORDER BY occurred_at DESC
                LIMIT 200
            """),
            {"user_id": user_id, "cutoff": cutoff}
        )
        rows = result.fetchall()

        if not rows:
            return

        documents = []
        for row in rows:
            doc_id, act_type, app_name, win_title, meta, started_at, duration = row
            title_parts = [p for p in [win_title, app_name, act_type] if p]
            title = " — ".join(title_parts[:2]) if title_parts else "Activity"
            content = (
                f"Activity type: {act_type or 'unknown'}. "
                f"App: {app_name or 'unknown'}. "
                f"Window: {win_title or ''}. "
                f"Duration: {round(duration or 0, 1)} min. "
                f"Time: {str(started_at)[:16]}."
            )
            documents.append({
                "id": doc_id,
                "title": title,
                "content": content,
                "type": "activity",
                "timestamp": str(started_at),
                "metadata": {"app": app_name, "type": act_type},
            })

        # Delete old collection data and re-populate with fresh docs
        try:
            rag_service.delete_collection(collection)
        except Exception:
            pass
        rag_service.add_documents(collection=collection, documents=documents)
        _rag_indexed_at[user_id] = _time.time()

    except Exception as e:
        # Don't break chat if indexing fails — just log
        import structlog
        structlog.get_logger().warning("rag_indexing_failed", error=str(e))
