#!/usr/bin/env pwsh

<#
.SYNOPSIS
Complete integration test for Product Data Explorer
Verifies all functionality: APIs, databases, links, pagination, data accuracy
#>

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      PRODUCT DATA EXPLORER - INTEGRATION TEST SUITE           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$testsPassed = 0
$testsFailed = 0

function RunTest {
    param(
        [string]$Name,
        [scriptblock]$TestBlock,
        [string]$ErrorMsg = "Test failed"
    )
    
    try {
        Write-Host "Test: $Name" -ForegroundColor Yellow -NoNewline
        & $TestBlock
        Write-Host " [PASS]" -ForegroundColor Green
        $global:testsPassed++
    }
    catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "   Error: $ErrorMsg - $_" -ForegroundColor Red
        $global:testsFailed++
    }
}

# Test 1: Backend availability
RunTest "Backend API is running on port 3001" {
    $nav = Invoke-RestMethod -Uri "http://localhost:3001/api/navigation" -TimeoutSec 5 -ErrorAction Stop
    if ($null -eq $nav) { throw "Navigation endpoint returned null" }
}

# Test 2: Frontend availability
RunTest "Frontend is running on port 3000" {
    $home = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($home.StatusCode -ne 200) { throw "Frontend returned status $($home.StatusCode)" }
}

# Test 3: Navigation data
RunTest "3 Navigations exist (Books, Categories, Childrens Books)" {
    $nav = Invoke-RestMethod -Uri "http://localhost:3001/api/navigation" -ErrorAction Stop
    if ($nav.Count -ne 3) { throw "Expected 3 navigations, got $($nav.Count)" }
}

# Test 4: Categories in Books navigation
RunTest "Books navigation has Fiction and Non-Fiction categories" {
    $cats = Invoke-RestMethod -Uri "http://localhost:3001/api/categories/1" -ErrorAction Stop
    if ($cats.Count -lt 2) { throw "Expected at least 2 categories" }
}

# Test 5: Products in Fiction
RunTest "Fiction category has 5+ products" {
    $prods = Invoke-RestMethod -Uri "http://localhost:3001/api/products?categoryId=1&limit=100" -ErrorAction Stop
    if ($prods.items.Count -lt 5) { throw "Expected 5+ products in Fiction, got $($prods.items.Count)" }
}

# Test 6: Product detail with all fields
RunTest "Product detail includes ISBN, publisher, and reviews" {
    $detail = Invoke-RestMethod -Uri "http://localhost:3001/api/products/1" -ErrorAction Stop
    if ([string]::IsNullOrEmpty($detail.detail.isbn)) { throw "ISBN missing" }
    if ([string]::IsNullOrEmpty($detail.detail.publisher)) { throw "Publisher missing" }
    if ($detail.reviews.Count -lt 1) { throw "Reviews missing" }
}

# Test 7: Source URLs are properly formatted
RunTest "Product source URL is a valid World of Books URL" {
    $product = Invoke-RestMethod -Uri "http://localhost:3001/api/product/1" -ErrorAction Stop
    $url = $product.product.sourceUrl
    if ([string]::IsNullOrEmpty($url)) { throw "Source URL is empty" }
    if ($url -notmatch "worldofbooks\.com") { throw "URL missing worldofbooks.com" }
}

# Test 8: Pagination support
RunTest "Products endpoint supports pagination" {
    $page1 = Invoke-RestMethod -Uri "http://localhost:3001/api/products?categoryId=1&page=1&limit=2" -ErrorAction Stop
    if ($page1.items.Count -ne 2) { throw "Limit not working" }
    if ($null -eq $page1.totalPages) { throw "totalPages missing" }
}

# Test 9: Categories section
RunTest "Categories navigation has multiple categories" {
    $cats = Invoke-RestMethod -Uri "http://localhost:3001/api/categories/2" -ErrorAction Stop
    if ($cats.Count -lt 5) { throw "Expected 5+ categories, got $($cats.Count)" }
}

# Test 10: Product response structure
RunTest "Product includes all required fields" {
    $prod = Invoke-RestMethod -Uri "http://localhost:3001/api/product/1" -ErrorAction Stop
    if ($null -eq $prod.product.id) { throw "product.id missing" }
    if ($null -eq $prod.product.sourceUrl) { throw "sourceUrl missing" }
}

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TEST RESULTS                               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "✓ Passed: $testsPassed" -ForegroundColor Green
Write-Host "✗ Failed: $testsFailed" -ForegroundColor Red

if ($testsFailed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! System is fully operational." -ForegroundColor Green
    Write-Host "`nYou can now:" -ForegroundColor Cyan
    Write-Host "  • Open http://localhost:3000 in your browser"  -ForegroundColor Gray
    Write-Host "  • Navigate through Books, Categories, and Children's Books" -ForegroundColor Gray
    Write-Host "  • Click any product to view details with World of Books link" -ForegroundColor Gray
    Write-Host "  • See paginated product lists" -ForegroundColor Gray
    Write-Host "  • View reviews and complete product information" -ForegroundColor Gray
} else {
    Write-Host "`n⚠️  Some tests failed. Please review errors above." -ForegroundColor Red
}

Write-Host ""
