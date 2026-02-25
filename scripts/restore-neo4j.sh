#!/bin/bash
#
# Neo4j Cluster Disaster Recovery Script
# Restores Neo4j cluster from backup
#

set -e

# Configuration
BACKUP_DIR="/backups/neo4j"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-changeme}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backup ID provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <backup_id>"
    print_info "Available backups:"
    ls -lh "$BACKUP_DIR"/*.manifest 2>/dev/null | awk '{print $9}' | sed 's/.*backup-/  /' | sed 's/.manifest//'
    exit 1
fi

BACKUP_ID=$1

# Verify backup exists
if [ ! -f "$BACKUP_DIR/backup-${BACKUP_ID}.manifest" ]; then
    print_error "Backup $BACKUP_ID not found!"
    exit 1
fi

print_info "========================================="
print_info "Neo4j Cluster Disaster Recovery"
print_info "========================================="
print_info "Backup ID: $BACKUP_ID"
print_info ""

# Show backup manifest
print_info "Backup Manifest:"
cat "$BACKUP_DIR/backup-${BACKUP_ID}.manifest"
print_info ""

# Confirmation
print_warn "⚠️  WARNING: This will DESTROY all current data!"
print_warn "⚠️  All Neo4j nodes will be stopped and restored from backup."
print_info ""
read -p "Are you sure you want to continue? (type 'YES' to confirm): " confirm

if [ "$confirm" != "YES" ]; then
    print_info "Recovery cancelled."
    exit 0
fi

print_info ""
print_info "Starting recovery process..."
print_info ""

# Function to restore a node
restore_node() {
    local node_name=$1
    local container_name=$2
    local backup_file="$BACKUP_DIR/${node_name}-${BACKUP_ID}.dump.gz"
    
    print_info "Restoring $node_name..."
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Stop container
    print_info "  Stopping $container_name..."
    docker stop "$container_name" || true
    
    # Remove container (keep volumes)
    print_info "  Removing container..."
    docker rm "$container_name" || true
    
    # Decompress backup
    print_info "  Decompressing backup..."
    gunzip -c "$backup_file" > "/tmp/${node_name}.dump"
    
    # Start temporary container for restore
    print_info "  Starting temporary container..."
    docker run -d \
        --name "${container_name}-restore" \
        --network neo4j-cluster \
        -v "${node_name}-data:/data" \
        -v "/tmp/${node_name}.dump:/backup.dump:ro" \
        -e NEO4J_AUTH=neo4j/${NEO4J_PASSWORD} \
        neo4j:5.15-enterprise \
        tail -f /dev/null
    
    # Wait for container to start
    sleep 5
    
    # Load backup
    print_info "  Loading backup into database..."
    docker exec "${container_name}-restore" \
        neo4j-admin database load neo4j \
        --from-path=/backup.dump \
        --overwrite-destination=true
    
    # Stop and remove temporary container
    print_info "  Cleaning up..."
    docker stop "${container_name}-restore"
    docker rm "${container_name}-restore"
    rm "/tmp/${node_name}.dump"
    
    print_info "  ✓ $node_name restored successfully"
    print_info ""
}

# Restore all nodes
restore_node "neo4j-core-1" "neo4j-core-1"
restore_node "neo4j-core-2" "neo4j-core-2"
restore_node "neo4j-core-3" "neo4j-core-3"

# Restart cluster
print_info "Restarting Neo4j cluster..."
docker-compose -f docker-compose.neo4j-cluster.yml up -d

print_info ""
print_info "Waiting for cluster to form..."
sleep 30

# Verify cluster health
print_info "Verifying cluster health..."
for i in {1..3}; do
    node_name="neo4j-core-$i"
    if docker exec "$node_name" cypher-shell -u neo4j -p "$NEO4J_PASSWORD" "RETURN 1" &>/dev/null; then
        print_info "  ✓ $node_name is healthy"
    else
        print_warn "  ✗ $node_name is not responding"
    fi
done

print_info ""
print_info "========================================="
print_info "Recovery completed!"
print_info "========================================="
print_info ""
print_info "Next steps:"
print_info "1. Verify data integrity"
print_info "2. Check application connectivity"
print_info "3. Monitor cluster status"
print_info "4. Review logs for any errors"
print_info ""

# Send notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \":warning: Neo4j cluster restored from backup\",
            \"attachments\": [{
                \"color\": \"warning\",
                \"fields\": [
                    {\"title\": \"Backup ID\", \"value\": \"$BACKUP_ID\", \"short\": true},
                    {\"title\": \"Status\", \"value\": \"Complete\", \"short\": true}
                ]
            }]
        }"
fi

exit 0
