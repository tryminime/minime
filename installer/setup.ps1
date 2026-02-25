# MiniMe Windows Installer
# Run as Administrator in PowerShell:
#   irm https://tryminime.com/install.ps1 | iex

#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$MiniMeDir = "$env:USERPROFILE\.minime"
$ComposeFile = "$MiniMeDir\docker-compose.yml"
$EnvFile = "$MiniMeDir\.env"
$Repo = "tryminime/minime"

function Write-Step  { Write-Host "`n→ $args" -ForegroundColor Cyan -NoNewline; Write-Host "" }
function Write-Ok    { Write-Host "  ✓ $args" -ForegroundColor Green }
function Write-Warn  { Write-Host "  ⚠ $args" -ForegroundColor Yellow }
function Write-Fail  { Write-Host "  ✗ $args" -ForegroundColor Red; exit 1 }

Write-Host @"

  ███╗   ███╗██╗███╗   ██╗██╗███╗   ███╗███████╗
  ████╗ ████║██║████╗  ██║██║████╗ ████║██╔════╝
  ██╔████╔██║██║██╔██╗ ██║██║██╔████╔██║█████╗
  ██║ ╚██╔╝██║██║██║╚██╗██║██║██║╚██╔╝██║██╔══╝
  ██║  ╚═╝ ██║██║██║ ╚████║██║██║  ╚═╝ ██║███████╗
  ╚═╝      ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═╝      ╚═╝╚══════╝

  Privacy-first activity intelligence
  https://tryminime.com

"@ -ForegroundColor White

# ── 1. Create MiniMe directory ───────────────────────────────────────────────

Write-Step "Creating MiniMe data directory"
New-Item -ItemType Directory -Force -Path $MiniMeDir | Out-Null
Write-Ok "Data directory: $MiniMeDir"

# ── 2. Check / install Docker ────────────────────────────────────────────────

Write-Step "Checking Docker"
$DockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $DockerCmd) {
    Write-Warn "Docker not found — installing Docker Desktop..."
    # Try winget first
    $WinGet = Get-Command winget -ErrorAction SilentlyContinue
    if ($WinGet) {
        winget install -e --id Docker.DockerDesktop --silent --accept-package-agreements --accept-source-agreements
    } else {
        $DockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"
        Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -OutFile $DockerInstaller
        Start-Process -FilePath $DockerInstaller -Args "install --quiet" -Wait
        Remove-Item $DockerInstaller
    }
    Write-Ok "Docker Desktop installed — please start it and re-run this script"
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    exit 0
}

# Wait for Docker to be ready
$Tries = 0
while ($Tries -lt 30) {
    try { docker info 2>$null | Out-Null; break } catch {}
    Start-Sleep 2; $Tries++
    Write-Host "  Waiting for Docker... $($Tries * 2)s" -NoNewline -ForegroundColor Yellow
    Write-Host "`r" -NoNewline
}
if ($Tries -ge 30) { Write-Fail "Docker is not responding. Please ensure Docker Desktop is running." }
Write-Ok "Docker ready"

# ── 3. Generate secrets (first install only) ─────────────────────────────────

Write-Step "Configuring secrets"
if (-not (Test-Path $EnvFile)) {
    Write-Ok "Generating new secrets..."
    $DbPass    = [System.Web.Security.Membership]::GeneratePassword(48, 0) -replace '[^a-zA-Z0-9]', '' | Select-Object -First 1
    $DbPass    = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
    $JwtSecret = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })

    @"
POSTGRES_USER=minime
POSTGRES_PASSWORD=$DbPass
POSTGRES_DB=minime
DATABASE_URL=postgresql://minime:$DbPass@localhost:5432/minime

NEO4J_AUTH=neo4j/$DbPass
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=$DbPass

REDIS_URL=redis://:$DbPass@localhost:6379/0

QDRANT_URL=http://localhost:6333

JWT_SECRET_KEY=$JwtSecret
ENVIRONMENT=production
"@ | Set-Content $EnvFile
    Write-Ok "Secrets generated and saved to $EnvFile"
} else {
    Write-Ok "Existing configuration found — keeping your data"
}

# ── 4. Download docker-compose.yml ───────────────────────────────────────────

Write-Step "Downloading MiniMe services configuration"
$ComposeUrl = "https://raw.githubusercontent.com/$Repo/main/installer/docker-compose.local.yml"
Invoke-WebRequest -Uri $ComposeUrl -OutFile $ComposeFile
Write-Ok "Services config saved"

# ── 5. Start databases ────────────────────────────────────────────────────────

Write-Step "Starting MiniMe databases"
Set-Location $MiniMeDir
docker compose --env-file $EnvFile -f $ComposeFile pull --quiet
docker compose --env-file $EnvFile -f $ComposeFile up -d

# ── 6. Wait for healthy ───────────────────────────────────────────────────────

Write-Step "Waiting for databases to be ready"
$Ready = $false
for ($i = 1; $i -le 30; $i++) {
    $Status = docker compose --env-file $EnvFile -f $ComposeFile ps postgres 2>$null
    if ($Status -match "healthy") { $Ready = $true; break }
    Write-Host "  Waiting... $($i * 2)s`r" -NoNewline -ForegroundColor Yellow
    Start-Sleep 2
}
if (-not $Ready) { Write-Warn "Databases may still be starting — check with: docker compose ps" }
else { Write-Ok "Databases are ready" }

# ── 7. Open dashboard ────────────────────────────────────────────────────────

Write-Step "Opening MiniMe dashboard"
Start-Process "https://app.tryminime.com"

Write-Host @"

  ✓ MiniMe is running!

    Dashboard:   https://app.tryminime.com
    Local API:   http://localhost:8000
    Data dir:    $MiniMeDir

    To stop:     cd ~/.minime && docker compose down
    To restart:  cd ~/.minime && docker compose up -d

"@ -ForegroundColor Green
