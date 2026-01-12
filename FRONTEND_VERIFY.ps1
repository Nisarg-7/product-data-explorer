# FRONTEND VERIFICATION & STARTUP CHECKLIST
# This PowerShell script must be run EVERY TIME the frontend is started or changed
# to ensure it's actually listening on port 3000

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FRONTEND SERVICE VERIFICATION & STARTUP" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# STEP 1: CLEANUP
Write-Host "`n[1/5] CLEANUP: Killing existing Node processes..." -ForegroundColor Yellow
$before = @(Get-Process | Where-Object {$_.ProcessName -match "node|npm"}).Count
taskkill /F /IM node.exe /IM npm.exe 2>&1 | Out-Null
Start-Sleep -Seconds 3
$after = @(Get-Process | Where-Object {$_.ProcessName -match "node|npm"}).Count
if ($after -eq 0) {
  Write-Host "OK All Node processes killed ($before to $after)" -ForegroundColor Green
} else {
  Write-Host "WARNING Some processes still running ($after)" -ForegroundColor Yellow
}

# STEP 2: PORT VERIFICATION
Write-Host "`n[2/5] PORTS: Checking if ports 3000 and 3001 are free..." -ForegroundColor Yellow
$port3000 = Get-NetTcpConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 3000}
$port3001 = Get-NetTcpConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 3001}

if ($port3000) {
  Write-Host "ERROR Port 3000 is in use - Force killing..." -ForegroundColor Red
  Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

if ($port3001) {
  Write-Host "INFO Port 3001 in use (backend may still be running)" -ForegroundColor Yellow
} else {
  Write-Host "OK Port 3001 is free" -ForegroundColor Green
}

# Verify 3000 is free now
$port3000Check = Get-NetTcpConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 3000}
if (-not $port3000Check) {
  Write-Host "OK Port 3000 is free and ready" -ForegroundColor Green
} else {
  Write-Host "ERROR CRITICAL: Port 3000 still occupied!" -ForegroundColor Red
  exit 1
}

# STEP 3: START FRONTEND
Write-Host "`n[3/5] START: Starting Next.js frontend..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "HH:mm:ss"
Write-Host "  [$timestamp] Launching: npm run dev on port 3000" -ForegroundColor Gray

$npmPath = "c:\Users\HP\OneDrive\Desktop\Full-Stack-Assignment\frontend"
$process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd /d `"$npmPath`" && npm run dev" -PassThru

Start-Sleep -Seconds 6
Write-Host "OK npm run dev process started (PID: $($process.Id))" -ForegroundColor Green

# STEP 4: VERIFY PORT BINDING
Write-Host "`n[4/5] BINDING: Verifying frontend is listening on port 3000..." -ForegroundColor Yellow

$maxAttempts = 15
$attempt = 0
$portBound = $false

while ($attempt -lt $maxAttempts) {
  $attempt++
  $listening = Get-NetTcpConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 3000}
  
  if ($listening) {
    Write-Host "OK Port 3000 is BOUND and LISTENING (Attempt $attempt of $maxAttempts)" -ForegroundColor Green
    $portBound = $true
    break
  }
  
  Write-Host "  WAIT Attempt $attempt of $maxAttempts waiting for port binding..." -ForegroundColor Gray
  Start-Sleep -Seconds 2
}

if (-not $portBound) {
  Write-Host "ERROR CRITICAL: Frontend failed to bind to port 3000!" -ForegroundColor Red
  Write-Host "   The Next.js process may have errored. Check the frontend terminal window." -ForegroundColor Red
  Write-Host "   Killing process..." -ForegroundColor Red
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  exit 1
}

# STEP 5: HTTP CONNECTIVITY TEST
Write-Host "`n[5/5] CONNECTIVITY: Testing HTTP response from localhost:3000..." -ForegroundColor Yellow

$connectAttempts = 8
$httpSuccess = $false

for ($i = 1; $i -le $connectAttempts; $i++) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
      Write-Host "OK HTTP 200 OK - Frontend is serving pages! (Attempt $i of $connectAttempts)" -ForegroundColor Green
      $httpSuccess = $true
      break
    }
  } catch {
    if ($i -lt $connectAttempts) {
      Write-Host "  WAIT Attempt $i of $connectAttempts..." -ForegroundColor Gray
      Start-Sleep -Seconds 2
    }
  }
}

if (-not $httpSuccess) {
  Write-Host "WARNING Still compiling, please wait a moment and refresh your browser" -ForegroundColor Yellow
}

# FINAL SUMMARY
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "`nSTATUS:" -ForegroundColor Cyan
Write-Host "  Port 3000 (Frontend): $(if ($portBound) { 'LISTENING' } else { 'ERROR' })" -ForegroundColor $(if ($portBound) { 'Green' } else { 'Red' })
Write-Host "  HTTP Response: $(if ($httpSuccess) { 'OK' } else { 'BUILDING' })" -ForegroundColor $(if ($httpSuccess) { 'Green' } else { 'Yellow' })

Write-Host "`nACCESS FRONTEND:" -ForegroundColor Green
Write-Host "  http://localhost:3000" -ForegroundColor Yellow

Write-Host "`nBACKEND API (should also be running):" -ForegroundColor Green
Write-Host "  http://localhost:3001/api" -ForegroundColor Yellow

Write-Host "`n==========================================================" -ForegroundColor Cyan
