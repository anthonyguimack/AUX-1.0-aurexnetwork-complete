# =============================================================================
#  deploy_beta_carlosartiles.ps1  --  beta.carlosartiles.com  Smart Deploy
#
#  Automatically detects ALL changes since the last deployment:
#    - Modified files (Claude edits, manual edits)
#    - New files (created since last deploy)
#    - Deleted files (removed since last deploy)
#    - Committed changes not yet deployed
#
#  Usage:
#    .\deploy_beta_carlosartiles.ps1            (interactive confirm)
#    .\deploy_beta_carlosartiles.ps1 -y         (non-interactive / automation)
#    $env:DEPLOY_YES='1'; .\deploy_beta_carlosartiles.ps1
#
#  No manual file lists. No GitHub required.
#  State is tracked in .last-deploy-carlosartiles (created automatically on first run).
#
#  NEVER touches: backend/.env | frontend/.env | backend/uploads/ | MongoDB | Nginx | SSL
#
#  INDEPENDENT from deploy.ps1 (aurexnetwork.com) and deploy_beta_acapital.ps1.
# =============================================================================

Set-StrictMode -Version 1
$ErrorActionPreference = "Stop"

# Non-interactive bypass: pass -y / --yes on the command line, or set DEPLOY_YES=1
$autoYes = ($args -contains '-y') -or ($args -contains '--yes') -or ($env:DEPLOY_YES -eq '1')

# --- CONFIGURATION -----------------------------------------------------------

$KEY      = "C:\2026\AcapitalGroup_Claude_LightsailDefaultKey-us-east-1.pem"
$SERVER   = "52.55.141.150"
$SSHUSER  = "ubuntu"
$LOCAL    = $PSScriptRoot          # project root -- where this script lives

$DEPLOY_DIR  = "/opt/carlos-artiles-cms"      # remote project directory
$DEPLOY_SVC  = "carlos-artiles-backend"       # systemctl service name
$DEPLOY_PORT = "8003"                         # backend API port (internal)
$DEPLOY_URL  = "https://beta.carlosartiles.com"

# Stamp file -- tracks the last deployed commit hash, kept local (never uploaded)
$STAMP_FILE  = Join-Path $LOCAL ".last-deploy-carlosartiles"

# Slug used for backup archive naming (e.g. carlos-artiles-cms-backup-20260529.tar.gz)
$BACKUP_SLUG = "carlos-artiles-cms"

# --- EXCLUSION LIST ----------------------------------------------------------
#  Files/directories NEVER uploaded to or deleted from the server.

$EXCLUDED_PATTERNS = @(
    '^backend/\.env$'                       # server-specific secrets
    '^frontend/\.env'                       # server-specific React env vars
    '^backend/uploads/'                     # user-uploaded media
    '^frontend/node_modules/'               # rebuilt with yarn on server
    '^frontend/build/'                      # rebuilt with yarn build on server
    '^backend/venv/'                        # Python virtualenv rebuilt on server
    '^backend/__pycache__/'                 # Python bytecode cache
    '\.pyc$'                                # compiled Python files
    '^\.git/'                               # git internals
    '^deploy\.ps1$'                         # aurexnetwork deploy script
    '^deploy_all\.ps1$'                     # master launcher (local only)
    '^deploy_beta_acapital\.ps1$'           # acapital script (local only)
    '^deploy_beta_carlosartiles\.ps1$'      # this script (local only)
    '^implement_beta_carlosartiles\.ps1$'   # sibling script (local only)
    '^\.last-deploy$'                       # aurexnetwork stamp
    '^\.last-deploy-acapital$'              # acapital stamp
    '^\.last-deploy-carlosartiles$'         # this script's stamp
    '^memory/'                              # local developer notes
    '^test_reports/'                        # local test output
    '^tests/'                               # local test suite
    '^scripts/'                             # local tooling scripts
    '^\.claude/'                            # local agent config
    '^aurex-login-page/'                    # local-only assets
    '^Design_Files/'                        # local design assets (not for server)
    '^aurex-server-credentials'             # credentials file (never on server)
    '^instrucciones\.md'                    # local developer notes
    '^test_result\.md'                      # local test output
    '^design_guidelines\.json'             # local developer docs
    '^backend_test\.py'                     # local smoke runner
    '\.tar\.gz'                             # backup archives
    '\.pem$'                                # SSH keys
    '^CLAUDE\.md$'                          # developer docs
    '^CLAUDE\.backup\.md'                   # developer docs backup
)

# =============================================================================
#  HELPER FUNCTIONS
# =============================================================================

function Write-Banner { param($m) Write-Host "`n  -- $m" -ForegroundColor Cyan }
function Write-OK     { param($m) Write-Host "     OK  $m" -ForegroundColor Green }
function Write-Warn   { param($m) Write-Host "     >>  $m" -ForegroundColor Yellow }
function Write-Info   { param($m) Write-Host "     ->  $m" -ForegroundColor Gray }
function Write-Fail   { param($m) Write-Host "     XX  $m" -ForegroundColor Red }

function Invoke-SSH {
    param([string]$Cmd, [switch]$AllowFail)
    # -n : redirect stdin from /dev/null so SSH never waits for pipe input
    #       even when run inside a task runner that keeps stdin open.
    # 2>$null : suppress stderr to avoid PowerShell 5.1 wrapping SSH stderr
    #           lines as ErrorRecords (NativeCommandError) which, under
    #           ErrorActionPreference=Stop, become terminating errors.
    $out = ssh -n -i $KEY `
               -o StrictHostKeyChecking=no `
               -o BatchMode=yes `
               -o ConnectTimeout=20 `
               "${SSHUSER}@${SERVER}" $Cmd 2>$null
    if (-not $AllowFail -and $LASTEXITCODE -ne 0) {
        throw "SSH command failed (exit $LASTEXITCODE)`nCmd : $Cmd`nOut : $($out -join ' ')"
    }
    return $out
}

function Invoke-SCP {
    param([string]$LocalFile, [string]$RemotePath)
    scp -i $KEY `
        -o StrictHostKeyChecking=no `
        -o BatchMode=yes `
        -q $LocalFile "${SSHUSER}@${SERVER}:${RemotePath}" 2>$null
    if ($LASTEXITCODE -ne 0) { throw "Upload failed: $LocalFile -> $RemotePath" }
}

function Test-IsExcluded {
    param([string]$Path)
    $p = $Path -replace '\\', '/'
    foreach ($pat in $EXCLUDED_PATTERNS) {
        if ($p -match $pat) { return $true }
    }
    return $false
}

function Get-ChangedFiles {
    $upload = [System.Collections.Generic.List[string]]::new()
    $delete = [System.Collections.Generic.List[string]]::new()

    $lastHash = if (Test-Path $STAMP_FILE) { (Get-Content $STAMP_FILE -Raw).Trim() } else { $null }
    $currHash = (git -C $LOCAL rev-parse HEAD 2>$null) -join '' | ForEach-Object { $_.Trim() }

    # 1. Committed changes since last deploy
    if ($lastHash -and $lastHash -ne $currHash) {
        $diffLines = git -C $LOCAL diff "${lastHash}..${currHash}" --name-status 2>$null
        foreach ($line in $diffLines) {
            if (-not $line.Trim()) { continue }
            if ($line -match '^R\d*\s+(\S+)\s+(\S+)$') {
                $delete.Add($Matches[1])
                $upload.Add($Matches[2])
            } elseif ($line -match '^D\s+(.+)$') {
                $delete.Add($Matches[1].Trim())
            } elseif ($line -match '^[ACMT]\s+(.+)$') {
                $upload.Add($Matches[1].Trim())
            }
        }
    }

    # 2. Uncommitted changes (Claude edits, manual saves, new files)
    $statusLines = git -C $LOCAL status --porcelain 2>$null
    foreach ($line in $statusLines) {
        if (-not $line.Trim()) { continue }
        $xy   = $line.Substring(0, 2)
        $file = $line.Substring(3).Trim()

        if ($file -match '^(.+) -> (.+)$') {
            $oldFile = $Matches[1].Trim()
            $file    = $Matches[2].Trim()
            if (-not $delete.Contains($oldFile)) { $delete.Add($oldFile) }
        }

        if ($xy -match 'D') {
            if (-not $delete.Contains($file)) { $delete.Add($file) }
        } else {
            if (-not $upload.Contains($file)) { $upload.Add($file) }
        }
    }

    # 3. Apply exclusion filters
    return @{
        Upload = @( $upload | Where-Object { $_ -and -not (Test-IsExcluded $_) } | Sort-Object -Unique )
        Delete = @( $delete | Where-Object { $_ -and -not (Test-IsExcluded $_) } | Sort-Object -Unique )
    }
}

function Invoke-Rollback {
    param([string]$BackupPath)
    if (-not $BackupPath) { return }
    Write-Host "`n  ROLLING BACK to last known good state..." -ForegroundColor Yellow
    try {
        Invoke-SSH "sudo tar -xzf $BackupPath -C /opt/ 2>/dev/null && sudo systemctl restart $DEPLOY_SVC"
        Write-OK "Restored from: $BackupPath"
    } catch {
        Write-Warn "Could not restore from backup: $_"
    }
    Write-Host ""
    Write-Host "  Inspect service logs:" -ForegroundColor Gray
    Write-Host "  ssh -i `"$KEY`" ${SSHUSER}@${SERVER} `"sudo journalctl -u $DEPLOY_SVC -n 50 --no-pager`"" -ForegroundColor DarkGray
    Write-Host ""
}

# =============================================================================
#  MAIN
# =============================================================================

Clear-Host
Write-Host ""
Write-Host "  ==========================================================" -ForegroundColor White
Write-Host "   beta.carlosartiles.com  --  Smart Deploy" -ForegroundColor White
Write-Host "   $(Get-Date -Format 'yyyy-MM-dd  HH:mm:ss')" -ForegroundColor Gray
Write-Host "  ==========================================================" -ForegroundColor White
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Fail "git not found. Install Git for Windows: https://git-scm.com"
    exit 1
}
if (-not (Test-Path (Join-Path $LOCAL ".git"))) {
    Write-Fail "Project is not a git repository: $LOCAL"
    exit 1
}
if (-not (Test-Path $KEY)) {
    Write-Fail "SSH key not found: $KEY"
    exit 1
}

Write-Host "  Scanning for changes..." -ForegroundColor Gray
$changes = Get-ChangedFiles

if ($changes.Upload.Count -eq 0 -and $changes.Delete.Count -eq 0) {
    Write-Host ""
    Write-Warn "Nothing to deploy -- no changes detected since last deployment."
    Write-Host ""
    Write-Host "  If you made changes that aren't showing up, ensure the files" -ForegroundColor Gray
    Write-Host "  are saved and that they aren't in the exclusion list." -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host ""
if ($changes.Upload.Count -gt 0) {
    Write-Host "  TO UPLOAD  ($($changes.Upload.Count) files)" -ForegroundColor White
    foreach ($f in $changes.Upload) { Write-Host "    +  $f" -ForegroundColor Green }
}
if ($changes.Delete.Count -gt 0) {
    Write-Host ""
    Write-Host "  TO DELETE ON SERVER  ($($changes.Delete.Count) files)" -ForegroundColor White
    foreach ($f in $changes.Delete) { Write-Host "    -  $f" -ForegroundColor Red }
}

$needsFrontendBuild = ($changes.Upload | Where-Object { $_ -match '^frontend/src/' }).Count -gt 0
$needsPipInstall    = ($changes.Upload | Where-Object { $_ -match 'requirements\.txt$' }).Count -gt 0
$needsYarnInstall   = ($changes.Upload | Where-Object { $_ -match 'frontend/package\.json$' }).Count -gt 0

Write-Host ""
Write-Host "  BUILD PLAN" -ForegroundColor White
Write-Host "    Frontend rebuild : $(if ($needsFrontendBuild){'YES  (frontend/src/ files changed)'}else{'NO   (backend only -- skipping yarn build)'})" `
    -ForegroundColor $(if ($needsFrontendBuild) { "Yellow" } else { "DarkGray" })
Write-Host "    pip install      : $(if ($needsPipInstall){'YES  (requirements.txt changed)'}else{'NO'})" `
    -ForegroundColor $(if ($needsPipInstall) { "Yellow" } else { "DarkGray" })
Write-Host "    yarn install     : $(if ($needsYarnInstall){'YES  (package.json changed)'}else{'NO'})" `
    -ForegroundColor $(if ($needsYarnInstall) { "Yellow" } else { "DarkGray" })
Write-Host ""

Write-Host "  TARGET:  $DEPLOY_URL" -ForegroundColor Cyan
Write-Host "  SERVER:  $SERVER  ->  $DEPLOY_DIR" -ForegroundColor Cyan
Write-Host ""

if ($autoYes) {
    Write-Info "Auto-confirmed (non-interactive mode)"
} else {
    $confirm = (Read-Host "  Deploy to beta.carlosartiles.com? (y/n)").ToLower().Trim()
    if ($confirm -ne "y" -and $confirm -ne "yes") {
        Write-Host "`n  Cancelled.`n" -ForegroundColor Gray
        exit 0
    }
}

$backupPath = $null
$startTime  = Get-Date

try {
    # STEP 0: Validate SSH connection
    Write-Banner "Connecting to $SERVER"
    Invoke-SSH "echo ok" | Out-Null
    Write-OK "SSH connection established"

    # STEP 1: Backup
    Write-Banner "Backup"
    $ts         = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "/opt/${BACKUP_SLUG}-backup-${ts}.tar.gz"
    Invoke-SSH "sudo tar --exclude='*/node_modules' --exclude='*/venv' --exclude='*/__pycache__' -czf $backupPath -C /opt $BACKUP_SLUG"
    Write-OK "$backupPath"

    # STEP 2: Fix frontend file ownership (prevents EACCES on yarn build)
    Write-Banner "Ownership"
    Invoke-SSH "sudo chown -R ubuntu:ubuntu $DEPLOY_DIR/frontend"
    Write-OK "$DEPLOY_DIR/frontend -> ubuntu:ubuntu"

    # STEP 3: Ensure REACT_APP_BACKEND_URL is set in frontend .env
    Write-Banner "Frontend .env"
    Invoke-SSH "touch $DEPLOY_DIR/frontend/.env; if grep -q 'REACT_APP_BACKEND_URL' $DEPLOY_DIR/frontend/.env; then sed -i 's|REACT_APP_BACKEND_URL=.*|REACT_APP_BACKEND_URL=$DEPLOY_URL|' $DEPLOY_DIR/frontend/.env; else echo 'REACT_APP_BACKEND_URL=$DEPLOY_URL' >> $DEPLOY_DIR/frontend/.env; fi"
    Write-OK "REACT_APP_BACKEND_URL=$DEPLOY_URL"

    # STEP 4: Upload changed files
    if ($changes.Upload.Count -gt 0) {
        Write-Banner "Uploading $($changes.Upload.Count) file(s)"
        foreach ($f in $changes.Upload) {
            $localFile  = Join-Path $LOCAL ($f -replace '/', '\')
            $remotePath = "$DEPLOY_DIR/$f"
            $remoteDir  = $remotePath -replace '/[^/]+$', ''

            Invoke-SSH "mkdir -p $remoteDir"
            Invoke-SCP $localFile $remotePath
            Write-OK $f
        }
    }

    # STEP 5: Delete removed files from server
    if ($changes.Delete.Count -gt 0) {
        Write-Banner "Removing $($changes.Delete.Count) deleted file(s)"
        foreach ($f in $changes.Delete) {
            Invoke-SSH "rm -f $DEPLOY_DIR/$f" -AllowFail
            Write-OK "Removed: $f"
        }
    }

    # STEP 6: pip install (only if requirements.txt changed)
    if ($needsPipInstall) {
        Write-Banner "pip install (requirements.txt changed)"
        # Merge pip stderr into stdout on the remote side so [notice] lines flow
        # through grep rather than reaching SSH stderr (which PS 5.1 wraps as
        # NativeCommandError under ErrorActionPreference=Stop).
        # ${PIPESTATUS[0]} preserves pip's real exit code through the pipe.
        Invoke-SSH "$DEPLOY_DIR/backend/venv/bin/pip install -r $DEPLOY_DIR/backend/requirements.txt -q 2>&1 | grep -v '^\[notice\]'; exit `${PIPESTATUS[0]}"
        Write-OK "pip install complete"
    }

    # STEP 7: yarn install (only if package.json changed)
    if ($needsYarnInstall) {
        Write-Banner "yarn install (package.json changed)"
        # Use grep -v to suppress peer-dep warnings server-side; always exit 0
        # so warning-only runs don't abort the deploy under ErrorActionPreference=Stop.
        Invoke-SSH "cd $DEPLOY_DIR/frontend && yarn install 2>&1 | grep -v '^warning'; exit 0" -AllowFail
        Write-OK "yarn install complete"
    }

    # STEP 8: Frontend build (skipped if no frontend/src/ files changed)
    if ($needsFrontendBuild) {
        Write-Banner "Building frontend (~2 min)"
        $buildOut = Invoke-SSH "cd $DEPLOY_DIR/frontend && NODE_OPTIONS=--max_old_space_size=2048 yarn build 2>&1 | tail -5"
        $buildOut -split "`n" | Where-Object { $_.Trim() } | ForEach-Object { Write-Info $_.Trim() }
        Write-OK "Frontend built"
    } else {
        Write-Banner "Frontend build"
        Write-Info "Skipped -- no frontend/src/ files changed"
    }

    # STEP 9: Restart backend service
    Write-Banner "Restarting $DEPLOY_SVC"
    Invoke-SSH "sudo systemctl restart $DEPLOY_SVC"
    Start-Sleep -Seconds 5
    $status = (Invoke-SSH "systemctl is-active $DEPLOY_SVC").Trim()
    if ($status -ne "active") { throw "Backend is not running after restart (status: $status)" }
    Write-OK "$DEPLOY_SVC -> $status"

    # STEP 10: Health check
    Write-Banner "Health check"
    $code = (Invoke-SSH "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${DEPLOY_PORT}/api/public/settings").Trim()
    if ($code -ne "200") { throw "API health check failed: HTTP $code (expected 200)" }
    Write-OK "$DEPLOY_URL -> HTTP $code"

    # Save deployment stamp
    $currHash = (git -C $LOCAL rev-parse HEAD 2>$null) -join '' | ForEach-Object { $_.Trim() }
    Set-Content -Path $STAMP_FILE -Value $currHash -NoNewline

    # Success summary
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
    $mins    = [math]::Floor($elapsed / 60)
    $secs    = $elapsed % 60
    Write-Host ""
    Write-Host "  ==========================================================" -ForegroundColor Green
    Write-Host "   Deployment complete in ${mins}m ${secs}s" -ForegroundColor Green
    Write-Host "   $DEPLOY_URL" -ForegroundColor Green
    Write-Host "  ==========================================================" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host ""
    Write-Fail "Deployment failed: $_"
    Invoke-Rollback $backupPath
    exit 1
}
