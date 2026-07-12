# auto-commit.ps1
# Runs a background loop checking for modified files. 
# Automatically commits and pushes changes every 2 minutes.

$IntervalSeconds = 120

Write-Host "=============================================" -ForegroundColor Green
Write-Host "TransitOps Auto-Commit & Push Watcher Enabled" -ForegroundColor Green
Write-Host "Checking for file changes every $IntervalSeconds seconds." -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate the watcher." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Green

while ($true) {
    # Check if there are any changes (tracked or untracked)
    $status = git status --porcelain
    if ($status) {
        Write-Host ""
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Change detected. Staging files..." -ForegroundColor Cyan
        git add -A
        
        $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "Creating auto-commit..." -ForegroundColor Cyan
        git commit -m "Auto-commit: Progress update ($Timestamp)"
        
        $Branch = git rev-parse --abbrev-ref HEAD
        Write-Host "Pushing changes to remote branch '$Branch'..." -ForegroundColor Cyan
        git push origin $Branch
        
        Write-Host "Sync successful!" -ForegroundColor Green
    }
    
    Start-Sleep -Seconds $IntervalSeconds
}
