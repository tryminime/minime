#!/bin/bash

# MiniMe Security Audit Script
# Runs automated security scans

set -e

echo "========================================="
echo "MiniMe Security Audit"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running locally
BASE_URL="${1:-http://localhost:3000}"
echo "Target URL: $BASE_URL"
echo ""

# 1. NPM Audit
echo "1. Running npm audit..."
cd website
npm audit --production || echo -e "${YELLOW}Warning:Some npm vulnerabilities found${NC}"
echo ""

# 2. Check for exposed secrets
echo "2. Checking for exposed secrets..."
if grep -r "pk_live_" . --exclude-dir={node_modules,.next,build} > /dev/null; then
  echo -e "${RED}ERROR: Live Stripe keys found in code!${NC}"
  exit 1
else
  echo -e "${GREEN}✓ No exposed Stripe live keys${NC}"
fi

if grep -r "sk_live_" . --exclude-dir={node_modules,.next,build} > /dev/null; then
  echo -e "${RED}ERROR: Stripe secret keys found in code!${NC}"
  exit 1
else
  echo -e "${GREEN}✓ No exposed Stripe secret keys${NC}"
fi
echo ""

# 3. Check HTTPS/TLS
echo "3. Checking HTTPS/TLS configuration..."
if [[ "$BASE_URL" == https://* ]]; then
  SSL_RESULT=$(curl -vI "$BASE_URL" 2>&1 | grep "SSL connection")
  if [ -n "$SSL_RESULT" ]; then
    echo -e "${GREEN}✓ HTTPS enabled${NC}"
  else
    echo -e "${RED}ERROR: HTTPS not properly configured${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}Skipping HTTPS check (localhost)${NC}"
fi
echo ""

# 4. Check security headers
echo "4. Checking security headers..."
HEADERS=$(curl -sI "$BASE_URL")

# Check for important security headers
REQUIRED_HEADERS=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection" "Strict-Transport-Security")

for header in "${REQUIRED_HEADERS[@]}"; do
  if echo "$HEADERS" | grep -qi "$header"; then
    echo -e "${GREEN}✓ $header present${NC}"
  else
    echo -e "${RED}✗ $header missing${NC}"
  fi
done
echo ""

# 5. Check for directory listing
echo "5. Checking for directory listing..."
DIR_LIST=$(curl -s "$BASE_URL/static/" | grep -i "index of" || true)
if [ -z "$DIR_LIST" ]; then
  echo -e "${GREEN}✓ No directory listing exposed${NC}"
else
  echo -e "${RED}ERROR: Directory listing enabled${NC}"
  exit 1
fi
echo ""

# 6. Check CORS configuration
echo "6. Checking CORS configuration..."
CORS_HEADERS=$(curl -sI -H "Origin: https://evil.com" "$BASE_URL/api/health" | grep -i "access-control-allow-origin" || true)
if [ -z "$CORS_HEADERS" ]; then
  echo -e "${GREEN}✓ CORS properly configured (restrictive)${NC}"
else
  if echo "$CORS_HEADERS" | grep -qi "*"; then
    echo -e "${RED}WARNING: CORS allows all origins (*)${NC}"
  else
    echo -e "${GREEN}✓ CORS allows specific origins${NC}"
  fi
fi
echo ""

# 7. SQL Injection basic test
echo "7. Testing SQL injection prevention..."
SQL_TEST=$(curl -s "$BASE_URL/api/v1/waitlist" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com OR 1=1--"}' \
  | grep -i "error" || echo "safe")
  
if echo "$SQL_TEST" | grep -qi "sql\|syntax\|database"; then
  echo -e "${RED}ERROR: Potential SQL injection vulnerability${NC}"
  exit 1
else
  echo -e "${GREEN}✓ SQL injection test passed${NC}"
fi
echo ""

# 8. XSS basic test
echo "8. Testing XSS prevention..."
XSS_TEST=$(curl -s "$BASE_URL/waitlist" | grep "<script>" || true)
if [ -n "$XSS_TEST" ]; then
  echo -e "${RED}ERROR: Potential XSS vulnerability${NC}"
  exit 1
else
  echo -e "${GREEN}✓ XSS test passed${NC}"
fi
echo ""

# Summary
echo "========================================="
echo -e "${GREEN}Security audit completed!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Run OWASP ZAP for comprehensive scan"
echo "2. Review Snyk security report"
echo "3. Check dependency vulnerabilities"
echo "4. Perform penetration testing"
echo ""
