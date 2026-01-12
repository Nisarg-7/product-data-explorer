# Frontend Verification Checklist

> **IMPORTANT**: This checklist MUST be run after every frontend change, schema change, or API modification to ensure the frontend can connect to the backend.

## Quick Start

Run this to verify and start the frontend:

```powershell
powershell -ExecutionPolicy Bypass -File "c:\Users\HP\OneDrive\Desktop\Full-Stack-Assignment\FRONTEND_VERIFY.ps1"
```

---

## 5-Step Verification Process

### Step 1: Cleanup
**Requirement**: No Node.js processes running
**Command**: `taskkill /F /IM node.exe /IM npm.exe`
**Success Criteria**: All node/npm processes killed
```
OK - All processes killed
```

### Step 2: Port Verification
**Requirement**: Ports 3000 and 3001 are free
**Check**: 
```powershell
Get-NetTcpConnection -State Listen | Where-Object {$_.LocalPort -eq 3000 -or $_.LocalPort -eq 3001}
```
**Success Criteria**: No output (both ports free)

### Step 3: Start Frontend
**Command**: `cd frontend && npm run dev`
**Verify**: Terminal shows "✓ Ready in X.Xs"
**Success Criteria**: Process starts without immediate errors

### Step 4: Port Binding Verification
**Requirement**: Frontend listening on port 3000
**Check**:
```powershell
Get-NetTcpConnection -State Listen | Where-Object {$_.LocalPort -eq 3000}
```
**Success Criteria**: Returns entry for localhost:3000
**Timeout**: Wait max 30 seconds

### Step 5: HTTP Connectivity
**Test**: `Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing`
**Success Criteria**: HTTP 200 OK response
**Note**: May need to wait 5-10 seconds for Next.js compilation

---

## Verification Outcome

### SUCCESS (Green)
✅ Port 3000 is LISTENING  
✅ HTTP 200 OK response  
**Action**: Proceed to manual testing in browser

### PARTIAL (Yellow)  
✅ Port 3000 is LISTENING  
⏳ HTTP Still Building  
**Action**: Wait 10 seconds, refresh browser, try again

### FAILURE (Red)
❌ Port 3000 NOT LISTENING  
**Action**: Troubleshoot (see below)

---

## Troubleshooting Port 3000 Not Binding

### Issue 1: Ghost Process Holding Port
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>
```

### Issue 2: Next.js Configuration Problem
```powershell
# Clear Next.js cache
rm -r frontend\.next
rm -r frontend\node_modules\.next

# Reinstall dependencies
cd frontend
npm install

# Try again
npm run dev
```

### Issue 3: Environment Variable Issue
Check `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
If missing or wrong, frontend cannot call backend.

### Issue 4: Windows Firewall Blocking
- Check Windows Defender Firewall settings
- Allow Node.js to run on localhost:3000
- Or disable firewall temporarily for testing

### Issue 5: Another Service Using Port 3000
```powershell
# Check all listening ports
Get-NetTcpConnection -State Listen | Select-Object LocalPort, OwningProcess

# Kill any process using port 3000
Stop-Process -Id <PID> -Force
```

---

## Manual Frontend Testing

Once verification passes, test these flows in browser at `http://localhost:3000`:

### Test 1: Home Page & Navigation
- [ ] Page loads without errors
- [ ] Three navigation sections visible: "Books", "Categories", "Children's Books"
- [ ] No console errors (check F12 Developer Tools)

### Test 2: Books Navigation
- [ ] Click "Books" section
- [ ] See 2 categories: "Fiction", "Non-Fiction"
- [ ] Click "Fiction"
- [ ] See 4 products listed

### Test 3: Categories Navigation
- [ ] Go back to home
- [ ] Click "Categories" section
- [ ] See 5 categories: "Action & Adventure", "Romance", "Mystery & Thriller", "Sci-Fi & Fantasy", "Biography"
- [ ] Click any category
- [ ] See products listed

### Test 4: Children's Books Navigation
- [ ] Go back to home
- [ ] Click "Children's Books" section
- [ ] See 5 categories: "Picture Books", "Early Readers", "Chapter Books", "Middle Grade", "Young Adult"
- [ ] Click "Picture Books"
- [ ] See 2 products

### Test 5: Product Detail Page
- [ ] Click any product to view detail
- [ ] See product information: Title, ISBN, Publisher, Pages, Rating
- [ ] See customer reviews section
- [ ] Page loads without 404 or connection errors

---

## Workflow for Making Frontend Changes

**EVERY TIME** you modify frontend code:

1. **Make your code changes** ✏️
2. **Run verification script** 🔍
   ```powershell
   powershell -ExecutionPolicy Bypass -File "FRONTEND_VERIFY.ps1"
   ```
3. **Verify both statuses are GREEN** ✅
   - Port 3000: LISTENING
   - HTTP: 200 OK
4. **Open browser and test** 🌐
5. **If any test fails**, use troubleshooting section above

---

## Workflow for Making API Changes

**EVERY TIME** you modify backend API:

1. **Stop backend** (Ctrl+C)
2. **Make code changes** ✏️
3. **Restart backend** (in backend folder):
   ```powershell
   npm run start:dev
   ```
4. **Wait for "Server running on port 3001" message** ⏳
5. **Test backend API** (Swagger at http://localhost:3001/api/docs)
6. **Run frontend verification** 🔍
   ```powershell
   powershell -ExecutionPolicy Bypass -File "FRONTEND_VERIFY.ps1"
   ```
7. **Test frontend connectivity** 🌐

---

## Workflow for Making Database Changes

**EVERY TIME** you modify Prisma schema or seeds:

1. **Stop both services** (Ctrl+C in both terminals)
2. **Make schema changes** in `backend/prisma/schema.prisma` ✏️
3. **Run migration** (in backend folder):
   ```powershell
   npx prisma migrate dev --name <description>
   ```
4. **Verify migration succeeded** ✅
5. **Restart backend**:
   ```powershell
   npm run start:dev
   ```
6. **Verify backend API** (test navigation endpoint)
7. **Verify frontend**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "FRONTEND_VERIFY.ps1"
   ```

---

## Success Indicators

| Check | Success |
|-------|---------|
| Port 3000 (Frontend) | LISTENING |
| Port 3001 (Backend) | LISTENING |
| HTTP GET /localhost:3000 | 200 OK |
| HTTP GET /api/navigation | 3 items |
| All navigation sections | Clickable |
| Product pages load | No errors |
| Product detail pages | Full data visible |

---

## Quick Commands Reference

```powershell
# Full verification (recommended)
powershell -ExecutionPolicy Bypass -File "FRONTEND_VERIFY.ps1"

# Kill all node processes
taskkill /F /IM node.exe /IM npm.exe

# Check port 3000
Get-NetTcpConnection -State Listen | Where-Object {$_.LocalPort -eq 3000}

# Test frontend HTTP
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing

# Test backend API
Invoke-RestMethod -Uri "http://localhost:3001/api/navigation"

# Start backend
cd backend; npm run start:dev

# Start frontend
cd frontend; npm run dev

# Clear caches
rm -r frontend\.next; rm -r frontend\node_modules\.cache
```

---

**Last Updated**: January 2025  
**Critical for**: Preventing ERR_CONNECTION_REFUSED errors
