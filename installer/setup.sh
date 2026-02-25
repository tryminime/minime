#!/usr/bin/env bash
# MiniMe Installer — macOS & Linux
# Usage: curl -fsSL https://tryminime.com/install.sh | bash
set -euo pipefail

MINIME_DIR="$HOME/.minime"
COMPOSE_FILE="$MINIME_DIR/docker-compose.yml"
ENV_FILE="$MINIME_DIR/.env"
LOG_FILE="$MINIME_DIR/install.log"
REPO="tryminime/minime"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
fail() { echo -e "${RED}✗${NC} $*"; exit 1; }
step() { echo -e "\n${BOLD}→ $*${NC}"; }

echo -e "${BOLD}"
echo "  ███╗   ███╗██╗███╗   ██╗██╗███╗   ███╗███████╗"
echo "  ████╗ ████║██║████╗  ██║██║████╗ ████║██╔════╝"
echo "  ██╔████╔██║██║██╔██╗ ██║██║██╔████╔██║█████╗  "
echo "  ██║╚██╔╝██║██║██║╚██╗██║██║██║╚██╔╝██║██╔══╝  "
echo "  ██║ ╚═╝ ██║██║██║ ╚████║██║██║ ╚═╝ ██║███████╗"
echo "  ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚══════╝"
echo -e "${NC}"
echo "  Privacy-first activity intelligence"
echo "  https://tryminime.com"
echo ""

# ── 1. Create MiniMe directory ──────────────────────────────────────────────

step "Creating MiniMe data directory"
mkdir -p "$MINIME_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1
log "Data directory: $MINIME_DIR"

# ── 2. Check / install Docker ────────────────────────────────────────────────

step "Checking Docker"
if ! command -v docker &>/dev/null; then
  warn "Docker not found — installing..."
  OS=$(uname -s)
  if [[ "$OS" == "Darwin" ]]; then
    if command -v brew &>/dev/null; then
      brew install --cask docker
      open /Applications/Docker.app
      echo "  Waiting for Docker to start (up to 60s)..."
      for i in $(seq 1 30); do
        docker info &>/dev/null && break || sleep 2
      done
    else
      fail "Please install Docker Desktop from https://docker.com/products/docker-desktop and re-run this script."
    fi
  elif [[ "$OS" == "Linux" ]]; then
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"
    warn "You may need to log out and back in for Docker group permissions."
  fi
fi

if ! docker info &>/dev/null; then
  fail "Docker is not running. Please start Docker Desktop and re-run."
fi
log "Docker OK ($(docker --version | cut -d' ' -f3 | tr -d ','))"

# ── 3. Generate secrets (first install only) ─────────────────────────────────

step "Configuring secrets"
if [[ ! -f "$ENV_FILE" ]]; then
  log "Generating new secrets..."
  DB_PASS=$(openssl rand -hex 24)
  JWT_SECRET=$(openssl rand -hex 48)
  cat > "$ENV_FILE" << EOF
# MiniMe local configuration — do not share
POSTGRES_USER=minime
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=minime
DATABASE_URL=postgresql://minime:${DB_PASS}@localhost:5432/minime

NEO4J_AUTH=neo4j/${DB_PASS}
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=${DB_PASS}

REDIS_URL=redis://:${DB_PASS}@localhost:6379/0

QDRANT_URL=http://localhost:6333

JWT_SECRET_KEY=${JWT_SECRET}
ENVIRONMENT=production
EOF
  log "Secrets generated and saved to $ENV_FILE"
else
  log "Existing configuration found — keeping your data"
fi

# ── 4. Download docker-compose.yml ───────────────────────────────────────────

step "Downloading MiniMe services configuration"
RELEASE_URL="https://github.com/${REPO}/releases/latest/download/docker-compose.local.yml"
curl -fsSL "$RELEASE_URL" -o "$COMPOSE_FILE" 2>/dev/null || \
  curl -fsSL "https://raw.githubusercontent.com/${REPO}/main/installer/docker-compose.local.yml" -o "$COMPOSE_FILE"
log "Services config saved to $COMPOSE_FILE"

# ── 5. Start databases ────────────────────────────────────────────────────────

step "Starting MiniMe databases"
cd "$MINIME_DIR"
docker compose --env-file "$ENV_FILE" -f docker-compose.yml pull --quiet
docker compose --env-file "$ENV_FILE" -f docker-compose.yml up -d

# ── 6. Wait for healthy ───────────────────────────────────────────────────────

step "Waiting for databases to be ready"
for i in $(seq 1 30); do
  PG_READY=$(docker compose --env-file "$ENV_FILE" -f docker-compose.yml ps postgres 2>/dev/null | grep -c "healthy" || true)
  [[ "$PG_READY" -gt 0 ]] && break
  echo -ne "  \r  Waiting... ${i}s"
  sleep 2
done
echo ""
log "Databases are ready"

# ── 7. Open dashboard ────────────────────────────────────────────────────────

step "Opening MiniMe dashboard"
DASHBOARD_URL="https://app.tryminime.com"
if command -v open &>/dev/null; then      # macOS
  open "$DASHBOARD_URL"
elif command -v xdg-open &>/dev/null; then  # Linux
  xdg-open "$DASHBOARD_URL"
fi

echo ""
echo -e "${GREEN}${BOLD}MiniMe is running! 🎉${NC}"
echo ""
echo "  Dashboard:   https://app.tryminime.com"
echo "  Local API:   http://localhost:8000"
echo "  Data dir:    $MINIME_DIR"
echo ""
echo "  To stop:     cd ~/.minime && docker compose down"
echo "  To restart:  cd ~/.minime && docker compose up -d"
echo ""
