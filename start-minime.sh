#!/bin/bash

#############################################
# MiniMe Complete Startup Script
# Starts backend, website, and/or desktop
#############################################

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/home/ansari/Documents/MiniMe"
cd "$PROJECT_DIR"

# Track PIDs for cleanup
PIDS=()
START_BACKEND=false
START_WEBSITE=false
START_DESKTOP=false
DESKTOP_MODE="dev"

# ─── Cleanup Handler ────────────────────────────────
cleanup() {
    echo ""
    print_info "Shutting down services..."

    # Kill all tracked background processes
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done

    # Kill by PID files
    for pidfile in /tmp/minime-backend.pid /tmp/minime-website.pid /tmp/minime-desktop.pid /tmp/minime-tracker.pid; do
        if [ -f "$pidfile" ]; then
            kill "$(cat "$pidfile")" 2>/dev/null || true
            rm -f "$pidfile"
        fi
    done

    # Also kill any stale processes on our ports
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true

    if [ "$START_BACKEND" = true ]; then
        print_info "Docker containers are still running. Use 'docker compose down' to stop them."
    fi

    echo ""
    print_status "Shutdown complete"
    exit 0
}

# Register cleanup EARLY (before any background processes)
trap cleanup INT TERM EXIT

# ─── Output Helpers ─────────────────────────────────
print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_section() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}   $1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# ─── Parse Arguments ────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)       START_BACKEND=true; shift ;;
        --website)       START_WEBSITE=true; shift ;;
        --desktop)       START_DESKTOP=true; shift ;;
        --tauri)         DESKTOP_MODE="tauri"; shift ;;
        --all)           START_BACKEND=true; START_WEBSITE=true; START_DESKTOP=true; shift ;;
        --backend-only)  START_BACKEND=true; shift ;;
        --web)           START_BACKEND=true; START_WEBSITE=true; shift ;;
        --frontend-only) START_DESKTOP=true; shift ;;
        --both)          START_BACKEND=true; START_DESKTOP=true; shift ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --backend         Start backend (Docker infra + FastAPI)"
            echo "  --website         Start Next.js website (http://localhost:3000)"
            echo "  --desktop         Start desktop app (Vite dev or Tauri)"
            echo "  --tauri           Use Tauri native window for desktop (default: Vite)"
            echo "  --all             Start everything: backend + website + desktop"
            echo "  --web             Start backend + website (most common)"
            echo "  --backend-only    Alias for --backend"
            echo "  --frontend-only   Alias for --desktop"
            echo "  --both            Start backend + desktop"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                             # Default: backend + website + desktop"
            echo "  $0 --web                       # Backend + website"
            echo "  $0 --all                       # Everything"
            echo "  $0 --all --tauri               # Everything + Tauri native window"
            echo "  $0 --backend --desktop          # Backend + desktop Vite dev"
            echo "  $0 --backend --desktop --tauri  # Backend + Tauri desktop"
            echo ""
            echo "Services:"
            echo "  Backend API:     http://localhost:8000"
            echo "  API Docs:        http://localhost:8000/docs"
            echo "  Website:         http://localhost:3000"
            echo "  Desktop (Vite):  http://localhost:5173"
            echo "  PostgreSQL:      localhost:5432"
            echo "  Neo4j Browser:   http://localhost:7474"
            echo "  Redis:           localhost:6379"
            echo "  Qdrant:          http://localhost:6333"
            exit 0
            ;;
        *) echo "Unknown option: $1"; echo "Use --help for usage"; exit 1 ;;
    esac
done

# Default: if nothing specified, start backend + website + desktop
if [ "$START_BACKEND" = false ] && [ "$START_WEBSITE" = false ] && [ "$START_DESKTOP" = false ]; then
    START_BACKEND=true
    START_WEBSITE=true
    START_DESKTOP=true
fi

# ─── Header ─────────────────────────────────────────
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   MiniMe Complete Startup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${BLUE}Services to start:${NC}"
[ "$START_BACKEND" = true ] && echo -e "  ${GREEN}✓${NC} Backend (Docker infra + FastAPI)"
[ "$START_WEBSITE" = true ] && echo -e "  ${GREEN}✓${NC} Website (Next.js on :3000)"
[ "$START_DESKTOP" = true ] && echo -e "  ${GREEN}✓${NC} Desktop (${DESKTOP_MODE} mode)"
echo ""

# ─── Load Environment from .env ─────────────────────
if [ -f "$PROJECT_DIR/.env" ]; then
    print_info "Loading environment from .env..."
    set -a
    source "$PROJECT_DIR/.env"
    set +a
    print_status "Environment loaded from .env"
else
    print_warning "No .env file found — using defaults"
    export DATABASE_URL="postgresql+asyncpg://minime:minime_dev_password@localhost:5432/minime"
    export NEO4J_URI="bolt://localhost:7687"
    export NEO4J_USER="neo4j"
    export NEO4J_PASSWORD="minime_dev_password"
    export REDIS_URL="redis://:minime_dev_password@localhost:6379/0"
    export QDRANT_URL="http://localhost:6333"
    export JWT_SECRET_KEY="dev_secret_key_change_in_production_12345"
    export ENVIRONMENT="development"
fi

# Always set these
export PYTHONPATH="$PROJECT_DIR:$PROJECT_DIR/backend"

# ─── Increase inotify watch limit (needed by uvicorn, Vite, Next.js) ──
CURRENT_WATCHES=$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo 0)
if [ "$CURRENT_WATCHES" -lt 524288 ]; then
    print_info "Current inotify limit: $CURRENT_WATCHES (need 524288)..."
    if sudo -n sysctl -w fs.inotify.max_user_watches=524288 > /dev/null 2>&1; then
        print_status "inotify watch limit increased to 524288"
    else
        print_warning "inotify limit is low ($CURRENT_WATCHES). Services will use polling mode."
        print_info "  To fix permanently: sudo sysctl -w fs.inotify.max_user_watches=524288"
        # Force polling mode for watchfiles (used by uvicorn)
        export WATCHFILES_FORCE_POLLING=true
    fi
fi

#############################################
# BACKEND STARTUP
#############################################

if [ "$START_BACKEND" = true ]; then
    print_section "Backend Services"

    # ─── Docker Check ───────────────────────────────
    print_info "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker is running"

    # Determine docker compose command
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        print_error "docker compose is not available"
        exit 1
    fi

    # ─── Kill stale processes on ports ────────────────
    print_info "Checking for stale processes..."
    for PORT in 8000 3000 1420 5173; do
        if command -v fuser &> /dev/null; then
            fuser -k $PORT/tcp 2>/dev/null || true
        else
            STALE_PID=$(lsof -ti:$PORT 2>/dev/null || true)
            if [ -n "$STALE_PID" ]; then
                kill -9 $STALE_PID 2>/dev/null || true
            fi
        fi
    done
    # Next.js sometimes uses "next-server" or "next-router-worker"
    pkill -f "next-server" 2>/dev/null || true
    pkill -f "next-router-worker" 2>/dev/null || true
    
    # Clean up Next.js lock file to prevent "another instance" errors
    rm -f "$PROJECT_DIR/website/.next/dev/lock" 2>/dev/null || true
    print_status "Ports are free"

    # ─── Start Infrastructure (Docker containers) ─────
    # The backend runs locally via uvicorn, not as a Docker container.
    # Start the required infrastructure services.
    print_info "Starting infrastructure containers..."

    # Start postgres and redis first (essential)
    docker start minime-postgres 2>/dev/null || $DOCKER_COMPOSE up -d postgres 2>&1 | grep -v "^$" || true
    docker start minime-redis 2>/dev/null || $DOCKER_COMPOSE up -d redis 2>&1 | grep -v "^$" || true

    # Start neo4j and qdrant (optional — failures are non-fatal)
    docker start minime-neo4j 2>/dev/null || $DOCKER_COMPOSE up -d neo4j 2>&1 | grep -v "^$" || true
    docker start minime-qdrant 2>/dev/null || $DOCKER_COMPOSE up -d qdrant 2>&1 | grep -v "^$" || true

    echo ""

    # ─── Wait for PostgreSQL (required) ───────────────
    print_info "Waiting for PostgreSQL..."
    timeout=60; elapsed=0
    while ! docker exec minime-postgres pg_isready -U minime > /dev/null 2>&1; do
        sleep 2; elapsed=$((elapsed + 2))
        if [ $elapsed -ge $timeout ]; then
            print_error "PostgreSQL failed to start within ${timeout}s"
            exit 1
        fi
        echo -n "."
    done
    echo ""
    print_status "PostgreSQL is ready"

    # ─── Wait for Redis (required) ────────────────────
    print_info "Waiting for Redis..."
    timeout=30; elapsed=0
    while ! docker exec minime-redis redis-cli -a minime_dev_password ping > /dev/null 2>&1; do
        sleep 2; elapsed=$((elapsed + 2))
        if [ $elapsed -ge $timeout ]; then
            print_warning "Redis slow to start — continuing anyway"
            break
        fi
        echo -n "."
    done
    echo ""
    print_status "Redis is ready"

    # ─── Neo4j (optional — don't block startup) ───────
    print_info "Checking Neo4j..."
    if docker exec minime-neo4j cypher-shell -u neo4j -p minime_dev_password "RETURN 1" > /dev/null 2>&1; then
        print_status "Neo4j is ready"
    else
        print_warning "Neo4j is starting (non-blocking — graph features may be delayed)"
    fi

    # ─── Qdrant (optional — don't block startup) ──────
    print_info "Checking Qdrant..."
    if curl -s --max-time 3 http://localhost:6333/healthz > /dev/null 2>&1; then
        print_status "Qdrant is ready"
    else
        print_warning "Qdrant is starting (non-blocking — vector search may be delayed)"
    fi

    echo ""
    print_status "Infrastructure services started!"

    # ─── Python Environment ─────────────────────────
    if [ ! -d "backend/venv" ]; then
        print_warning "Virtual environment not found. Creating..."
        python3 -m venv backend/venv
        print_status "Virtual environment created"
    fi

    # Check uvicorn is available in venv
    if [ ! -f "backend/venv/bin/uvicorn" ]; then
        print_warning "uvicorn not found in venv. Installing dependencies..."
        backend/venv/bin/pip install -r backend/requirements.txt
        print_status "Dependencies installed"
    else
        print_status "Python venv ready (uvicorn available)"
    fi

    # Phase 3: Check / install content intelligence packages
    print_info "Checking Phase 3 content intelligence packages..."
    PHASE3_PKGS="pdfplumber python-docx openpyxl python-pptx yake langdetect"
    MISSING_PKGS=""
    for pkg in $PHASE3_PKGS; do
        if ! backend/venv/bin/pip show "$pkg" > /dev/null 2>&1; then
            MISSING_PKGS="$MISSING_PKGS $pkg"
        fi
    done
    if [ -n "$MISSING_PKGS" ]; then
        print_warning "Installing missing Phase 3 packages:$MISSING_PKGS"
        backend/venv/bin/pip install $MISSING_PKGS -q
        print_status "Phase 3 packages installed"
    else
        print_status "Phase 3 packages ready (NLP + document extraction)"
    fi

    # ─── Database Migrations ────────────────────────
    if [ -f "alembic.ini" ]; then
        print_info "Running database migrations..."
        backend/venv/bin/alembic upgrade head 2>/dev/null || print_warning "No migrations to run or alembic not configured"
    fi

    # ─── Ensure required DB columns exist ───────────
    print_info "Ensuring required database columns exist..."
    docker exec minime-postgres psql -U minime -d minime -c "
        ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) NOT NULL DEFAULT 'active';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSONB NOT NULL DEFAULT '{}';
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';
    " > /dev/null 2>&1 || print_warning "Could not verify DB columns (non-fatal)"
    print_status "Database columns verified"

    # ─── Display Infrastructure Status ──────────────
    print_section "Infrastructure Status"
    print_status "PostgreSQL:  localhost:5432"
    print_status "Redis:       localhost:6379"

    # Show optional services status
    if docker exec minime-neo4j echo "ok" > /dev/null 2>&1; then
        print_status "Neo4j:       http://localhost:7474 (Browser)"
    else
        print_warning "Neo4j:       starting..."
    fi

    if curl -s --max-time 1 http://localhost:6333/healthz > /dev/null 2>&1; then
        print_status "Qdrant:      http://localhost:6333"
    else
        print_warning "Qdrant:      starting..."
    fi
    echo ""
fi

#############################################
# WEBSITE SETUP (Next.js)
#############################################

if [ "$START_WEBSITE" = true ]; then
    print_section "Website Setup (Next.js)"
    cd "$PROJECT_DIR/website"
    if [ ! -d "node_modules" ]; then
        print_warning "Node modules not found. Installing..."
        npm install
        print_status "Node modules installed"
    else
        print_status "Node modules already installed"
    fi
    cd "$PROJECT_DIR"
fi

#############################################
# DESKTOP SETUP (Vite + Tauri)
#############################################

if [ "$START_DESKTOP" = true ]; then
    print_section "Desktop Setup (Vite/Tauri)"
    cd "$PROJECT_DIR/desktop"
    if [ ! -d "node_modules" ]; then
        print_warning "Node modules not found. Installing..."
        npm install
        print_status "Node modules installed"
    else
        print_status "Node modules already installed"
    fi

    # Ensure desktop .env exists
    if [ ! -f ".env" ]; then
        print_info "Creating desktop .env file..."
        cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
EOF
        print_status "Desktop .env created"
    else
        print_status "Desktop .env exists"
    fi
    cd "$PROJECT_DIR"
fi

#############################################
# START SERVICES
#############################################

print_section "Starting Services"

# ─── Start Backend ──────────────────────────────
if [ "$START_BACKEND" = true ]; then
    print_info "Starting FastAPI backend on http://localhost:8000..."
    cd "$PROJECT_DIR"

    # Choose reload strategy based on inotify limit
    RELOAD_ARGS=""
    if [ "${WATCHFILES_FORCE_POLLING:-}" = "true" ]; then
        # inotify limit is low — run without reload to avoid crash
        print_warning "Running backend without hot-reload (inotify limit too low)"
        RELOAD_ARGS="--log-level info"
    else
        RELOAD_ARGS="--reload --reload-dir backend --reload-include '*.py' --reload-exclude 'venv' --reload-exclude '__pycache__' --log-level info"
    fi

    backend/venv/bin/uvicorn backend.main:app \
        --host 0.0.0.0 \
        --port 8000 \
        $RELOAD_ARGS &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/minime-backend.pid
    PIDS+=($BACKEND_PID)
    sleep 4

    # Verify backend started
    if kill -0 $BACKEND_PID 2>/dev/null; then
        # Wait for health check
        for i in $(seq 1 10); do
            if curl -s --max-time 2 http://localhost:8000/health > /dev/null 2>&1; then
                print_status "Backend started and healthy (PID: $BACKEND_PID)"
                break
            fi
            sleep 1
        done
        if ! curl -s --max-time 2 http://localhost:8000/health > /dev/null 2>&1; then
            print_warning "Backend started but health check not responding yet (PID: $BACKEND_PID)"
        fi
    else
        print_error "Backend failed to start! Check logs above."
        exit 1
    fi
fi

# ─── Start Website ─────────────────────────────
if [ "$START_WEBSITE" = true ]; then
    print_info "Starting Next.js website on http://localhost:3000..."
    cd "$PROJECT_DIR/website"
    npm run dev &
    WEBSITE_PID=$!
    echo $WEBSITE_PID > /tmp/minime-website.pid
    PIDS+=($WEBSITE_PID)
    sleep 3

    # Verify website started
    if kill -0 $WEBSITE_PID 2>/dev/null; then
        print_status "Website started (PID: $WEBSITE_PID)"
    else
        print_error "Website failed to start!"
    fi
    cd "$PROJECT_DIR"
fi

    # Desktop app is now launched at the very end of this script in the foreground

# ─── Start System Activity Tracker ─────────────────
if [ "$START_BACKEND" = true ]; then
    TRACKER_SCRIPT="$PROJECT_DIR/desktop/minime-tracker.py"
    if [ -f "$TRACKER_SCRIPT" ]; then
        # Kill any existing tracker
        if [ -f /tmp/minime-tracker.pid ]; then
            kill "$(cat /tmp/minime-tracker.pid)" 2>/dev/null || true
            rm -f /tmp/minime-tracker.pid
        fi

        print_info "Starting system activity tracker..."

        # Install GNOME extension if not linked
        EXT_DIR="$HOME/.local/share/gnome-shell/extensions/minime-tracker@minime"
        EXT_SRC="$PROJECT_DIR/desktop/gnome-extension/minime-tracker@minime"
        if [ ! -d "$EXT_DIR" ] && [ -d "$EXT_SRC" ]; then
            mkdir -p "$HOME/.local/share/gnome-shell/extensions"
            ln -sfn "$EXT_SRC" "$EXT_DIR"
            print_info "MiniMe GNOME extension installed (enable after next login)"
        fi

        # Build tracker args — pass email/password if set in .env
        TRACKER_ARGS="--api-url http://localhost:8000"
        if [ -n "${MINIME_EMAIL:-}" ] && [ -n "${MINIME_PASSWORD:-}" ]; then
            TRACKER_ARGS="$TRACKER_ARGS --email $MINIME_EMAIL --password $MINIME_PASSWORD"
        fi

        python3 "$TRACKER_SCRIPT" $TRACKER_ARGS > /tmp/minime-tracker.log 2>&1 &
        TRACKER_PID=$!
        PIDS+=($TRACKER_PID)
        print_status "System activity tracker started (PID: $TRACKER_PID)"
        print_info "  Log: /tmp/minime-tracker.log"
    else
        print_warning "System activity tracker not found at $TRACKER_SCRIPT"
    fi
fi

# ─── Summary ────────────────────────────────────
echo ""
print_section "MiniMe is Running!"

if [ "$START_BACKEND" = true ]; then
    echo -e "${GREEN}Backend API:${NC}      http://localhost:8000"
    echo -e "${GREEN}API Docs:${NC}         http://localhost:8000/docs"
    echo -e "${GREEN}Content API:${NC}      http://localhost:8000/api/v1/content"
    echo -e "${GREEN}Documents API:${NC}    http://localhost:8000/api/v1/documents"
    echo -e "${GREEN}PostgreSQL:${NC}       localhost:5432"
    echo -e "${GREEN}Redis:${NC}            localhost:6379"
    echo -e "${GREEN}Qdrant:${NC}           http://localhost:6333"
fi

if [ "$START_WEBSITE" = true ]; then
    echo -e "${GREEN}Website:${NC}          http://localhost:3000"
    echo -e "${GREEN}Knowledge Library:${NC} http://localhost:3000/dashboard/knowledge"
fi

if [ "$START_DESKTOP" = true ]; then
    echo -e "${GREEN}Desktop App:${NC}      Tauri native window"
fi

echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

if [ "$START_DESKTOP" = true ]; then
    echo ""
    print_info "Launching MiniMe desktop app (Tauri)..."
    cd "$PROJECT_DIR/desktop"
    # Launch in foreground — ties the terminal to the Tauri app
    if npm run tauri:dev; then
        echo "Desktop app closed."
    fi
else
    # Wait for all background processes (cleanup runs via trap)
    wait "${PIDS[@]}" 2>/dev/null || true
fi
