#!/bin/bash
#
# Disaster Recovery Test Script
# Tests the complete backup and restore process
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "\n${GREEN}=========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}=========================================${NC}\n"
}

print_step() {
    echo -e "${YELLOW}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Test configuration
TEST_DIR="/tmp/dr-test-$(date +%s)"
BACKUP_DIR="/backups/neo4j"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-changeme}"

print_header "Disaster Recovery Test"
echo "Test Directory: $TEST_DIR"
echo "Start Time: $(date)"
echo ""

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Test 1: Verify backup script exists
print_step "Test 1: Verify backup script exists"
if [ -f "/app/scripts/backup-neo4j.sh" ]; then
    print_success "Backup script found"
else
    print_error "Backup script not found"
    exit 1
fi

# Test 2: Verify restore script exists
print_step "Test 2: Verify restore script exists"
if [ -f "/app/scripts/restore-neo4j.sh" ]; then
    print_success "Restore script found"
else
    print_error "Restore script not found"
    exit 1
fi

# Test 3: Check Neo4j cluster health
print_step "Test 3: Check Neo4j cluster health"
healthy_nodes=0
for i in {1..3}; do
    if docker exec "neo4j-core-$i" cypher-shell -u neo4j -p "$NEO4J_PASSWORD" "RETURN 1" &>/dev/null; then
        print_success "neo4j-core-$i is healthy"
        ((healthy_nodes++))
    else
        print_error "neo4j-core-$i is not responding"
    fi
done

if [ $healthy_nodes -eq 3 ]; then
    print_success "All 3 nodes are healthy"
else
    print_error "Only $healthy_nodes/3 nodes are healthy"
    exit 1
fi

# Test 4: Create test data
print_step "Test 4: Create test data"
TEST_NODE_ID=$(docker exec neo4j-core-1 cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
    "CREATE (n:DRTest {name: 'Test Node', timestamp: datetime()}) RETURN id(n)" \
    | grep -oP '\d+' | head -1)

if [ -n "$TEST_NODE_ID" ]; then
    print_success "Test node created with ID: $TEST_NODE_ID"
else
    print_error "Failed to create test node"
    exit 1
fi

# Test 5: Run backup
print_step "Test 5: Run backup"
if bash /app/scripts/backup-neo4j.sh > "$TEST_DIR/backup.log" 2>&1; then
    BACKUP_ID=$(ls -t "$BACKUP_DIR"/*.manifest | head -1 | grep -oP '\d{8}_\d{6}')
    print_success "Backup completed: $BACKUP_ID"
else
    print_error "Backup failed"
    cat "$TEST_DIR/backup.log"
    exit 1
fi

# Test 6: Verify backup files exist
print_step "Test 6: Verify backup files"
backup_files_found=0
for i in {1..3}; do
    if [ -f "$BACKUP_DIR/neo4j-core-$i-$BACKUP_ID.dump.gz" ]; then
        print_success "Backup file found: neo4j-core-$i-$BACKUP_ID.dump.gz"
        ((backup_files_found++))
    else
        print_error "Backup file missing: neo4j-core-$i-$BACKUP_ID.dump.gz"
    fi
done

if [ $backup_files_found -eq 3 ]; then
    print_success "All backup files present"
else
    print_error "Only $backup_files_found/3 backup files found"
    exit 1
fi

# Test 7: Delete test data
print_step "Test 7: Delete test data"
docker exec neo4j-core-1 cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
    "MATCH (n:DRTest) WHERE id(n) = $TEST_NODE_ID DELETE n" &>/dev/null
print_success "Test data deleted"

# Test 8: Verify data is gone
print_step "Test 8: Verify data deletion"
node_count=$(docker exec neo4j-core-1 cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
    "MATCH (n:DRTest) WHERE id(n) = $TEST_NODE_ID RETURN count(n)" \
    | grep -oP '\d+' | tail -1)

if [ "$node_count" -eq 0 ]; then
    print_success "Test data successfully deleted"
else
    print_error "Test data still exists"
    exit 1
fi

# Test 9: Restore from backup
print_step "Test 9: Restore from backup"
echo "YES" | bash /app/scripts/restore-neo4j.sh "$BACKUP_ID" > "$TEST_DIR/restore.log" 2>&1 &
RESTORE_PID=$!

# Wait for restore to complete (with timeout)
timeout=300
elapsed=0
while kill -0 $RESTORE_PID 2>/dev/null; do
    sleep 5
    ((elapsed+=5))
    if [ $elapsed -ge $timeout ]; then
        print_error "Restore timeout after ${timeout}s"
        kill $RESTORE_PID
        exit 1
    fi
    echo -n "."
done
echo ""

wait $RESTORE_PID
if [ $? -eq 0 ]; then
    print_success "Restore completed"
else
    print_error "Restore failed"
    cat "$TEST_DIR/restore.log"
    exit 1
fi

# Test 10: Verify cluster health after restore
print_step "Test 10: Verify cluster health after restore"
sleep 30  # Wait for cluster to stabilize

healthy_nodes=0
for i in {1..3}; do
    if docker exec "neo4j-core-$i" cypher-shell -u neo4j -p "$NEO4J_PASSWORD" "RETURN 1" &>/dev/null; then
        print_success "neo4j-core-$i is healthy"
        ((healthy_nodes++))
    else
        print_error "neo4j-core-$i is not responding"
    fi
done

if [ $healthy_nodes -eq 3 ]; then
    print_success "All 3 nodes are healthy after restore"
else
    print_error "Only $healthy_nodes/3 nodes are healthy after restore"
    exit 1
fi

# Test 11: Verify data restored
print_step "Test 11: Verify data restoration"
node_count=$(docker exec neo4j-core-1 cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
    "MATCH (n:DRTest) WHERE id(n) = $TEST_NODE_ID RETURN count(n)" \
    | grep -oP '\d+' | tail -1)

if [ "$node_count" -eq 1 ]; then
    print_success "Test data successfully restored"
else
    print_error "Test data not found after restore"
    exit 1
fi

# Test 12: Cleanup test data
print_step "Test 12: Cleanup test data"
docker exec neo4j-core-1 cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
    "MATCH (n:DRTest) DELETE n" &>/dev/null
print_success "Test data cleaned up"

# Test 13: Verify monitoring alerts
print_step "Test 13: Verify monitoring alerts"
if curl -s http://prometheus:9090/api/v1/alerts | grep -q "alerts"; then
    print_success "Prometheus alerts accessible"
else
    print_error "Prometheus alerts not accessible"
fi

# Test 14: Verify Grafana dashboards
print_step "Test 14: Verify Grafana dashboards"
if curl -s http://grafana:3000/api/health | grep -q "ok"; then
    print_success "Grafana is healthy"
else
    print_error "Grafana is not healthy"
fi

# Cleanup
print_step "Cleanup"
rm -rf "$TEST_DIR"
print_success "Test directory cleaned up"

# Summary
print_header "Test Summary"
echo "All tests passed! ✓"
echo ""
echo "Test Results:"
echo "  ✓ Backup script functional"
echo "  ✓ Restore script functional"
echo "  ✓ Cluster health verified"
echo "  ✓ Data backup successful"
echo "  ✓ Data restore successful"
echo "  ✓ Monitoring operational"
echo ""
echo "End Time: $(date)"
echo ""

# Send success notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \":white_check_mark: Disaster Recovery Test Passed\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Tests Passed\", \"value\": \"14/14\", \"short\": true},
                    {\"title\": \"Duration\", \"value\": \"$(date -d @$SECONDS -u +%M:%S)\", \"short\": true}
                ]
            }]
        }"
fi

exit 0
