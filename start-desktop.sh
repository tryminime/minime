#!/usr/bin/env bash
# start-desktop.sh — Launch MiniMe desktop app
# Ensures the website dev server (port 3000) is running before opening Tauri.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBSITE_DIR="$SCRIPT_DIR/website"
DESKTOP_DIR="$SCRIPT_DIR/desktop"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}→${NC} $*"; }

# ── 1. Ensure backend is running ─────────────────────────────────────────────
warn "Checking backend (localhost:8000)..."
if ! curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    warn "Backend not running — starting it..."
    cd "$SCRIPT_DIR"
    source backend/venv/bin/activate 2>/dev/null || true
    nohup uvicorn backend.main:app --host 0.0.0.0 --port 8000 > /tmp/minime-backend.log 2>&1 &
    sleep 5
    curl -sf http://localhost:8000/health > /dev/null && log "Backend started" || echo "Backend may still be starting..."
else
    log "Backend already running"
fi

# ── 2. Ensure website dev server is running ──────────────────────────────────
warn "Checking website dev server (localhost:3000)..."
if ! curl -sf http://localhost:3000 > /dev/null 2>&1; then
    warn "Website not running — starting it in background..."
    cd "$WEBSITE_DIR"
    nohup npm run dev > /tmp/minime-website.log 2>&1 &
    WEBSITE_PID=$!
    echo "Website PID: $WEBSITE_PID"

    # Wait for it to be ready (up to 30s)
    for i in $(seq 1 15); do
        sleep 2
        curl -sf http://localhost:3000 > /dev/null 2>&1 && break
        echo -n "."
    done
    echo ""
    log "Website dev server started"
else
    log "Website dev server already running"
fi

# ── 3. Launch Tauri desktop app ──────────────────────────────────────────────
warn "Launching MiniMe desktop..."
cd "$DESKTOP_DIR"
npm run tauri:dev
