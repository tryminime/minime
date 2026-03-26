#!/usr/bin/env bash
# start-desktop.sh — Launch MiniMe desktop app (Tauri + Vite)
# Starts backend + website if needed, then opens Tauri window.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBSITE_DIR="$SCRIPT_DIR/website"
DESKTOP_DIR="$SCRIPT_DIR/desktop"
VENV_UVICORN="$SCRIPT_DIR/backend/venv/bin/uvicorn"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()     { echo -e "${GREEN}✓${NC} $*"; }
warn()    { echo -e "${YELLOW}→${NC} $*"; }
section() { echo -e "\n${CYAN}── $* ──${NC}"; }

section "MiniMe Desktop Launcher"

# ── 1. Backend ────────────────────────────────────────────────────────────────
warn "Checking backend (localhost:8000)..."
if ! curl -sf --max-time 2 http://localhost:8000/health > /dev/null 2>&1; then
    warn "Backend not running — starting it..."
    cd "$SCRIPT_DIR"
    export PYTHONPATH="$SCRIPT_DIR"
    # Load .env so credentials (Google, Microsoft, Stripe, etc.) reach the process
    if [ -f "$SCRIPT_DIR/.env" ]; then
        set -a
        # shellcheck disable=SC1091
        source "$SCRIPT_DIR/.env"
        set +a
    fi
    nohup "$VENV_UVICORN" backend.main:app \
        --host 0.0.0.0 --port 8000 --log-level warning \
        > /tmp/minime-backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/minime-backend.pid


    # Wait up to 15s for backend to be healthy
    for i in $(seq 1 15); do
        sleep 1
        if curl -sf --max-time 2 http://localhost:8000/health > /dev/null 2>&1; then
            log "Backend started (PID: $BACKEND_PID)"
            break
        fi
        echo -n "."
    done
    echo ""
    if ! curl -sf --max-time 2 http://localhost:8000/health > /dev/null 2>&1; then
        echo "⚠ Backend may still be starting — check /tmp/minime-backend.log"
    fi
else
    log "Backend already running at http://localhost:8000"
fi

# ── 2. Website dev server ─────────────────────────────────────────────────────
warn "Checking website dev server (localhost:3000)..."
if ! curl -sf --max-time 2 http://localhost:3000 > /dev/null 2>&1; then
    warn "Website not running — starting it in background..."
    cd "$WEBSITE_DIR"
    nohup npm run dev > /tmp/minime-website.log 2>&1 &
    WEBSITE_PID=$!
    echo $WEBSITE_PID > /tmp/minime-website.pid

    # Wait up to 30s (Next.js cold-start takes ~10-20s)
    for i in $(seq 1 15); do
        sleep 2
        if curl -sf --max-time 2 http://localhost:3000 > /dev/null 2>&1; then
            log "Website started (PID: $WEBSITE_PID)"
            break
        fi
        echo -n "."
    done
    echo ""
    if ! curl -sf --max-time 2 http://localhost:3000 > /dev/null 2>&1; then
        echo "⚠ Website still starting — Tauri will open when ready"
    fi
else
    log "Website already running at http://localhost:3000"
fi

# ── 3. Summary ────────────────────────────────────────────────────────────────
section "Services Ready"
echo -e "${GREEN}Backend:${NC}            http://localhost:8000"
echo -e "${GREEN}API Docs:${NC}           http://localhost:8000/docs"
echo -e "${GREEN}Content API:${NC}        http://localhost:8000/api/v1/content"
echo -e "${GREEN}Documents API:${NC}      http://localhost:8000/api/v1/documents"
echo -e "${GREEN}Website:${NC}            http://localhost:3000"
echo -e "${GREEN}Knowledge Library:${NC}  http://localhost:3000/dashboard/knowledge"
echo ""

# ── 4. Launch Tauri ───────────────────────────────────────────────────────────
warn "Launching MiniMe desktop app (Tauri)..."
cd "$DESKTOP_DIR"
npm run tauri:dev
