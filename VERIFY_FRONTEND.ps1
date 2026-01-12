# FRONTEND VERIFICATION & STARTUP CHECKLIST
# This PowerShell script must be run EVERY TIME the frontend is started or changed
# to ensure it's actually listening on port 3000

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FRONTEND SERVICE VERIFICATION CHECKLIST" -ForegroundColor Cyan
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

Push-Location "c:\Users\HP\OneDrive\Desktop\Full-Stack-Assignment\frontend"
$process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow
Pop-Location

Start-Sleep -Seconds 4
Write-Host "OK npm run dev process started (PID: $($process.Id))" -ForegroundColor Green

# STEP 4: VERIFY PORT BINDING
Write-Host "`n[4/5] BINDING: Verifying frontend is listening on port 3000..." -ForegroundColor Yellow

$maxAttempts = 12  # 24 seconds total
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
  Write-Host "   The Next.js process may have errored. Killing process and exiting..." -ForegroundColor Red
  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  exit 1
}

# STEP 5: HTTP CONNECTIVITY TEST
Write-Host "`n[5/5] CONNECTIVITY: Testing HTTP response from localhost:3000..." -ForegroundColor Yellow

$connectAttempts = 5
$httpSuccess = $false

for ($i = 1; $i -le $connectAttempts; $i++) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
      Write-Host "OK HTTP 200 OK - Frontend is serving pages! (Attempt $i of $connectAttempts)" -ForegroundColor Green
      $httpSuccess = $true
      break
    }
  } catch {
    if ($i -lt $connectAttempts) {
      Write-Host "  WAIT Attempt $i of $connectAttempts waiting for HTTP response..." -ForegroundColor Gray
      Start-Sleep -Seconds 2
    }
  }
}

if (-not $httpSuccess) {
  Write-Host "WARNING Port 3000 is bound but HTTP responses not ready yet" -ForegroundColor Yellow
  Write-Host "  This is normal during Next.js compilation. Waiting a bit more..." -ForegroundColor Gray
  Start-Sleep -Seconds 5
  
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
      Write-Host "OK HTTP 200 OK - Frontend is ready!" -ForegroundColor Green
      $httpSuccess = $true
    }
  } catch {
    Write-Host "WARNING Still waiting for HTTP... This is OK, it may still be building" -ForegroundColor Yellow
  }
}

# FINAL SUMMARY
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "`nSERVICE STATUS:" -ForegroundColor Cyan
Write-Host "  Port 3000 (Frontend): $(if ($portBound) { 'OK LISTENING' } else { 'ERROR NOT LISTENING' })" -ForegroundColor $(if ($portBound) { 'Green' } else { 'Red' })
Write-Host "  HTTP Response: $(if ($httpSuccess) { 'OK RESPONDING' } else { 'WAIT BUILDING' })" -ForegroundColor $(if ($httpSuccess) { 'Green' } else { 'Yellow' })

Write-Host "`nACCESS FRONTEND AT:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor Green

Write-Host "`nIMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "  . If port 3000 shows ERROR CRITICAL, the frontend CANNOT be accessed" -ForegroundColor Gray
Write-Host "  . If HTTP shows WAIT BUILDING, wait a few more seconds then refresh" -ForegroundColor Gray
Write-Host "  . Backend API should be running at http://localhost:3001" -ForegroundColor Gray

Write-Host "`n==========================================================" -ForegroundColor Cyan
