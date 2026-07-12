#!/bin/bash
# auto-commit.sh
# Runs a background loop checking for modified files.
# Automatically commits and pushes changes every 2 minutes.

INTERVAL=120

echo "============================================="
echo "TransitOps Auto-Commit & Push Watcher Enabled"
echo "Checking for file changes every $INTERVAL seconds."
echo "Press Ctrl+C to terminate the watcher."
echo "============================================="

while true; do
    # Check if there are any changes (tracked or untracked)
    if [ -n "$(git status --porcelain)" ]; then
        echo ""
        echo "[$(date '+%H:%M:%S')] Change detected. Staging files..."
        git add -A
        
        TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
        echo "Creating auto-commit..."
        git commit -m "Auto-commit: Progress update ($TIMESTAMP)"
        
        BRANCH=$(git rev-parse --abbrev-ref HEAD)
        echo "Pushing changes to remote branch '$BRANCH'..."
        git push origin "$BRANCH"
        
        echo "Sync successful!"
    fi
    
    sleep $INTERVAL
done
