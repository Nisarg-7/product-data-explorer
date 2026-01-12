Write-Host "INTEGRATION TEST" -ForegroundColor Cyan

# Test 1: Backend
Write-Host "Test 1: Backend navigation..." -NoNewline
try { $nav = Invoke-RestMethod -Uri "http://localhost:3001/api/navigation" -ErrorAction Stop; Write-Host " PASS" -ForegroundColor Green } catch { Write-Host " FAIL" -ForegroundColor Red }

# Test 2: Frontend
Write-Host "Test 2: Frontend home..." -NoNewline
try { $h = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop; Write-Host " PASS" -ForegroundColor Green } catch { Write-Host " FAIL" -ForegroundColor Red }

# Test 3: Fiction products
Write-Host "Test 3: Fiction has products..." -NoNewline
try { $p = Invoke-RestMethod -Uri "http://localhost:3001/api/products?categoryId=1&limit=100" -ErrorAction Stop; if ($p.items.Count -gt 0) { Write-Host " PASS ($($p.items.Count) products)" -ForegroundColor Green } else { Write-Host " FAIL (0 products)" -ForegroundColor Red } } catch { Write-Host " FAIL" -ForegroundColor Red }

# Test 4: Product detail with URL
Write-Host "Test 4: Product source URL..." -NoNewline
try { $d = Invoke-RestMethod -Uri "http://localhost:3001/api/product/1" -ErrorAction Stop; if ($d.product.sourceUrl -match "worldofbooks") { Write-Host " PASS" -ForegroundColor Green } else { Write-Host " FAIL (invalid URL)" -ForegroundColor Red } } catch { Write-Host " FAIL" -ForegroundColor Red }

# Test 5: Metadata
Write-Host "Test 5: Product metadata..." -NoNewline
try { $d = Invoke-RestMethod -Uri "http://localhost:3001/api/product/1" -ErrorAction Stop; if ($d.detail.isbn -and $d.detail.publisher) { Write-Host " PASS" -ForegroundColor Green } else { Write-Host " FAIL" -ForegroundColor Red } } catch { Write-Host " FAIL" -ForegroundColor Red }

# Test 6: Reviews
Write-Host "Test 6: Product reviews..." -NoNewline
try { $d = Invoke-RestMethod -Uri "http://localhost:3001/api/product/1" -ErrorAction Stop; if ($d.reviews.Count -gt 0) { Write-Host " PASS ($($d.reviews.Count) reviews)" -ForegroundColor Green } else { Write-Host " FAIL (no reviews)" -ForegroundColor Red } } catch { Write-Host " FAIL" -ForegroundColor Red }

# Test 7: Pagination
Write-Host "Test 7: Pagination..." -NoNewline
try { $p = Invoke-RestMethod -Uri "http://localhost:3001/api/products?categoryId=1&page=1&limit=2" -ErrorAction Stop; if ($p.items.Count -eq 2 -and $p.totalPages -ge 1) { Write-Host " PASS" -ForegroundColor Green } else { Write-Host " FAIL" -ForegroundColor Red } } catch { Write-Host " FAIL" -ForegroundColor Red }

# Test 8: Categories
Write-Host "Test 8: Categories navigation..." -NoNewline
try { $c = Invoke-RestMethod -Uri "http://localhost:3001/api/categories/2" -ErrorAction Stop; if ($c.Count -ge 5) { Write-Host " PASS ($($c.Count) categories)" -ForegroundColor Green } else { Write-Host " FAIL" -ForegroundColor Red } } catch { Write-Host " FAIL" -ForegroundColor Red }

# Test 9: Children's Books
Write-Host "Test 9: Childrens Books..." -NoNewline
try { $c = Invoke-RestMethod -Uri "http://localhost:3001/api/categories/3" -ErrorAction Stop; if ($c.Count -ge 5) { Write-Host " PASS ($($c.Count) categories)" -ForegroundColor Green } else { Write-Host " FAIL" -ForegroundColor Red } } catch { Write-Host " FAIL" -ForegroundColor Red }

Write-Host ""
Write-Host "All critical tests completed!" -ForegroundColor Green
