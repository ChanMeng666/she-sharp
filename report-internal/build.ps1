# =============================================================================
# report-internal/build.ps1 — build the internal record report.
#
#   pwsh report-internal/build.ps1            # PDF to report-internal/out/
#   pwsh report-internal/build.ps1 -Png       # ... plus 150ppi page previews
#   pwsh report-internal/build.ps1 -Data      # regenerate record.json first
#
# There is no draft/final split here and no provenance gate. The funder report
# needs both because it carries claims to third parties that must not ship
# unverified; this one is generated in its entirety from
# report-internal/data/record.json, so every figure in it is a count by
# construction and there is nothing for a gate to catch.
#
# What this script checks instead is the thing that CAN go wrong: that the data
# file is present and newer than nothing, that the page count has not moved
# without somebody noticing, and that the output is not empty.
#
# NOTE FOR EDITORS: like report/build.ps1, this file contains no "less than" or
# "greater than" characters anywhere, including in strings and comments. Use
# -lt / -gt / -ne / -eq. The two scripts are read side by side often enough that
# they should not differ in their conventions.
# =============================================================================
[CmdletBinding()]
param(
    [switch] $Png,
    [switch] $Data,
    [int]    $ExpectPages = 12,
    [string] $Src = "report-internal\she-sharp-record.typ"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Run from the repo root: --root . is what makes /report/... imports resolve, so
# the internal report can reuse the funder report's theme and page furniture
# rather than owning a second copy of the design system.
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

# A native command's non-zero exit does not trip $ErrorActionPreference, and a
# compile can die after truncating its own output — so check the code AND the
# file, or a stale PDF sits under a "Build complete" message.
function Assert-Compiled($out, $src) {
    if ($LASTEXITCODE -ne 0) {
        throw "typst compile failed for $src (exit $LASTEXITCODE)"
    }
    if (-not (Test-Path $out)) {
        throw "typst reported success but $out does not exist"
    }
    if ((Get-Item $out).Length -eq 0) {
        throw "typst reported success but $out is empty"
    }
}

try {
    # ── 1. Toolchain ────────────────────────────────────────────────────────
    if (-not (Get-Command typst -ErrorAction SilentlyContinue)) {
        throw "typst is not on PATH. Install Typst 0.15 or later."
    }

    # ── 2. Fonts ────────────────────────────────────────────────────────────
    # The vendored faces live with the funder report and are shared. A missing
    # file does not fail the compile — Typst silently substitutes whatever the
    # OS font book offers, and the document still builds looking wrong.
    $fontDir = "report\fonts"
    foreach ($f in @(
        "BricolageGrotesque-VF.ttf",
        "InstrumentSans-VF.ttf",
        "InstrumentSans-Italic-VF.ttf",
        "Carattere-Regular.ttf"
    )) {
        $path = Join-Path $fontDir $f
        if (-not (Test-Path $path)) {
            Write-Warning "Vendored font missing: $path — typography will be substituted."
        }
    }

    # ── 3. Data ─────────────────────────────────────────────────────────────
    $dataPath = "report-internal\data\record.json"
    if ($Data) {
        Write-Host "Regenerating $dataPath"
        npx tsx scripts/internal-report/build-record.ts
        if ($LASTEXITCODE -ne 0) {
            throw "build-record.ts failed (exit $LASTEXITCODE). It needs both raw exports; see its header."
        }
    }
    if (-not (Test-Path $dataPath)) {
        throw "$dataPath is missing. Run with -Data, or npx tsx scripts/internal-report/build-record.ts"
    }
    $stamp = (Get-Item $dataPath).LastWriteTime.ToString("yyyy-MM-dd HH:mm")
    Write-Host "Data       $dataPath   (written $stamp)"

    # ── 4. Compile ──────────────────────────────────────────────────────────
    $out = "report-internal\out\she-sharp-record-INTERNAL.pdf"
    New-Item -ItemType Directory -Force "report-internal\out" | Out-Null

    Write-Host "Compiling  $Src"
    typst compile --root . --font-path $fontDir --input mode=final $Src $out
    Assert-Compiled $out $Src

    # ── 5. Page count ───────────────────────────────────────────────────────
    # Warns rather than throws: a page moving is usually a spacing change worth
    # looking at, not a reason to refuse to produce the file.
    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $out))
    $text = [System.Text.Encoding]::Latin1.GetString($bytes)
    $pages = ([regex]::Matches($text, "/Type\s*/Page[^s]")).Count
    if ($pages -ne $ExpectPages) {
        Write-Warning "Page count is $pages, expected $ExpectPages. A section has probably overflowed; render with -Png and look at the seam."
    }

    $size = (Get-Item $out).Length
    Write-Host ""
    Write-Host "Build complete"
    Write-Host ("   " + $out + "   " + $size.ToString('N0') + " bytes, " + $pages + " pages")

    # ── 6. Previews ─────────────────────────────────────────────────────────
    if ($Png) {
        $previewDir = "report-internal\out\preview"
        if (Test-Path $previewDir) { Remove-Item -Recurse -Force $previewDir }
        New-Item -ItemType Directory -Force $previewDir | Out-Null
        typst compile --root . --font-path $fontDir --input mode=final `
            --format png --ppi 150 $Src (Join-Path $previewDir "p-{0p}.png")
        if ($LASTEXITCODE -ne 0) { throw "preview render failed (exit $LASTEXITCODE)" }
        Write-Host ("   previews written to " + $previewDir)
    }

    # ── 7. What this file is ────────────────────────────────────────────────
    Write-Host ""
    Write-Host "INTERNAL. Every page is stamped and the footer says so."
    Write-Host "It carries figures the organisation has not decided how to say publicly."
    Write-Host "Do not attach it to a funding application, a sponsor deck, or a board pack"
    Write-Host "that circulates outside the team without agreeing what goes in first."
}
finally {
    Pop-Location
}
