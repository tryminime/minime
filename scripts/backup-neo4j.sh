#!/bin/bash
#
# Neo4j Cluster Backup Script
# Creates daily backups of all Neo4j cluster nodes
# Retention: 7 days
#

set -e

# Configuration
BACKUP_DIR="/backups/neo4j"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
NEO4J_PASSWORD="${NEO4J_PASSWORD:-changeme}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to backup a Neo4j node
backup_node() {
    local node_name=$1
    local container_name=$2
    
    echo "========================================="
    echo "Backing up $node_name..."
    echo "========================================="
    
    # Create dump
    docker exec "$container_name" neo4j-admin database dump neo4j \
        --to-path=/backups \
        --overwrite-destination=true
    
    # Copy dump from container
    docker cp "$container_name:/backups/neo4j.dump" \
        "$BACKUP_DIR/${node_name}-${DATE}.dump"
    
    # Compress dump
    gzip "$BACKUP_DIR/${node_name}-${DATE}.dump"
    
    echo "✓ Backup created: ${node_name}-${DATE}.dump.gz"
    echo ""
}

# Backup all cluster nodes
echo "Starting Neo4j cluster backup..."
echo "Date: $(date)"
echo ""

backup_node "neo4j-core-1" "neo4j-core-1"
backup_node "neo4j-core-2" "neo4j-core-2"
backup_node "neo4j-core-3" "neo4j-core-3"

# Create a cluster-wide backup manifest
cat > "$BACKUP_DIR/backup-${DATE}.manifest" <<EOF
Backup Date: $(date)
Backup ID: ${DATE}
Nodes Backed Up:
  - neo4j-core-1
  - neo4j-core-2
  - neo4j-core-3
Files:
  - neo4j-core-1-${DATE}.dump.gz
  - neo4j-core-2-${DATE}.dump.gz
  - neo4j-core-3-${DATE}.dump.gz
EOF

echo "✓ Backup manifest created"
echo ""

# Calculate backup sizes
echo "Backup Sizes:"
du -h "$BACKUP_DIR"/*-${DATE}.dump.gz

# Cleanup old backups
echo ""
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.manifest" -mtime +$RETENTION_DAYS -delete
echo "✓ Cleanup complete"

# Upload to S3 (optional)
if [ -n "$S3_BUCKET" ]; then
    echo ""
    echo "Uploading backups to S3..."
    aws s3 sync "$BACKUP_DIR" "s3://$S3_BUCKET/neo4j-backups/" \
        --exclude "*" \
        --include "*-${DATE}.*"
    echo "✓ Upload complete"
fi

echo ""
echo "========================================="
echo "Backup completed successfully!"
echo "========================================="
echo "Backup location: $BACKUP_DIR"
echo "Backup ID: $DATE"
echo ""

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \":white_check_mark: Neo4j backup completed successfully\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Backup ID\", \"value\": \"$DATE\", \"short\": true},
                    {\"title\": \"Nodes\", \"value\": \"3\", \"short\": true}
                ]
            }]
        }"
fi

exit 0
