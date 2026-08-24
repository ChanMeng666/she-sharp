#!/usr/bin/env pwsh
# Build the She Sharp H1 2026 impact report PDF.
#
# Usage (from anywhere):
#   pwsh report/build.ps1                 # draft, writes report/out/she-sharp-h1-2026-DRAFT.pdf
#   pwsh report/build.ps1 -Png            # ... plus 150ppi page previews
#   pwsh report/build.ps1 -Assets         # re-run the photo conversion first
#   pwsh report/build.ps1 -Diagrams       # re-render the mermaid diagrams first
#   pwsh report/build.ps1 -Final          # final, writes report/out/she-sharp-half-year-report-2026-h1.pdf
#
# Both modes write into report/out/, which is gitignored. The FINAL pdf is NOT
# committed and does NOT belong in public/ — see the note printed at the end of
# a successful final build.
#
# NOTE FOR EDITORS: this file must contain NO "less than" or "greater than"
# characters anywhere, including inside strings and comments. They are the
# PowerShell redirection operators and turn an innocent message into a file
# write. Use -lt / -gt / -ne / -eq for comparisons throughout.

[CmdletBinding()]
param(
    [switch] $Final,
    [switch] $Assets,
    [switch] $Diagrams,
    [switch] $Png,
    [int]    $ExpectPages = 31,
    [string] $Src = "report\she-sharp-h1-2026.typ"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

# A failed `typst compile` leaves the PREVIOUS pdf sitting in place, and a native
# command's non-zero exit does NOT trip $ErrorActionPreference — so without this
# guard the script prints "Build complete" over a stale artifact. Check the exit
# code AND the file, because a compile can also die after truncating its output.
function Assert-Compiled($path, $source) {
    if ($LASTEXITCODE -ne 0) {
        throw "typst compile failed for $source (exit $LASTEXITCODE). $path was NOT regenerated and may be stale."
    }
    if (-not (Test-Path $path)) {
        throw "typst reported success but $path does not exist."
    }
    if ((Get-Item $path).Length -eq 0) {
        throw "typst wrote an EMPTY $path from $source."
    }
}

function Assert-Ran($step) {
    if ($LASTEXITCODE -ne 0) {
        throw "$step failed (exit $LASTEXITCODE)."
    }
}

# Returns the part of a Typst line that a grep is allowed to read: string
# literals blanked first, then any line comment removed. Strings go first so an
# "https://..." literal is removed whole and cannot leave a bare "//" behind,
# and the comment strip additionally refuses to fire on a "//" preceded by a
# colon, which is a URL sitting in markup rather than in a string.
#
# BOTH file-scanning gates below run on the result. This is one function on
# purpose: the two rules drifted apart once already. The provenance gate (step
# 5) used to read raw lines, so three lines of explanatory COMMENT PROSE in
# report/data/report-data.typ — the ones documenting what p() and e() mean —
# counted as unverified metrics. A perfectly clean data tree still reported
# hits and refused to build, and the grep disagreed with the Typst-side
# assert-final-clean by a factor of three. They are supposed to be two
# implementations of one rule.
function Get-TypstCode($line) {
    $code = [regex]::Replace($line, '"(?:[^"\\]|\\.)*"', '""')
    [regex]::Replace($code, '(^|[^:])//.*$', '$1')
}

try {
    # ── 1. Toolchain ────────────────────────────────────────────────────────
    if (-not (Get-Command typst -ErrorAction SilentlyContinue)) {
        throw "typst is not on PATH. Install it, then re-run. Expected typst 0.15.0."
    }

    # ── 2. Fonts ────────────────────────────────────────────────────────────
    # --font-path vendors these so the PDF renders identically on any machine,
    # independent of the OS font book. A missing file does not fail the compile,
    # it silently substitutes a fallback face and quietly ruins the typography.
    $fonts = @(
        "report\fonts\BricolageGrotesque-VF.ttf",
        "report\fonts\InstrumentSans-VF.ttf",
        "report\fonts\InstrumentSans-Italic-VF.ttf",
        "report\fonts\Carattere-Regular.ttf"
    )
    foreach ($f in $fonts) {
        if (-not (Test-Path $f)) { throw "Missing vendored font: $f" }
    }

    # ── 3. CeTZ package cache (warn only) ───────────────────────────────────
    # report/theme/theme.typ carries USE-CETZ, and the chart module falls back to
    # a pure-Typst renderer, so a cold cache degrades rather than fails.
    $cetz = Join-Path $env:LOCALAPPDATA "typst\packages\preview\cetz\0.3.4"
    if (-not (Test-Path $cetz)) {
        Write-Warning "CeTZ 0.3.4 is not in the local package cache ($cetz). Charts will use the fallback renderer, or typst will try to download it."
    }

    # ── 4. Markup escape check (pitfalls 9 and 10) ──────────────────────────
    # In Typst MARKUP a bare tilde is a non-breaking space and a bare at-sign is
    # a label reference. Both vanish silently and neither is a compile error, so
    # a grep is the only defence.
    #
    # ESCAPING IS MARKUP-ONLY. This is the thing that makes a naive version of
    # this gate actively harmful: inside a STRING LITERAL the same characters are
    # already literal, and "writing the fix" there makes it worse —
    # `"hello\@shesharp.org.nz"` renders a VISIBLE BACKSLASH on the page
    # (measured, not assumed). So the gate must never ask anyone to escape a
    # string. String literals and line comments are therefore stripped before
    # matching, by Get-TypstCode above.
    #
    # The at-sign pattern is narrowed to a DOMAIN SHAPE (@word.tld) rather than
    # any at-sign, for two reasons: it is precisely the hazard (an email address
    # written into a content block), and `@some-label` is LEGITIMATE Typst markup
    # that this gate must not flag. Typst label names cannot contain a dot, so
    # the two can never be confused. A gate that cries wolf gets disabled, which
    # is worse than no gate.
    #
    # Both patterns use a leading "not a backslash" class rather than a lookbehind
    # because lookbehind syntax needs the forbidden angle-bracket characters.
    #
    # Scope is every directory that can contain markup — data/ and lib/ both hold
    # prose inside content blocks, so neither is exempt.
    $contentFiles = @()
    foreach ($dir in @("report\sections", "report\data", "report\lib")) {
        if (Test-Path $dir) {
            $contentFiles += Get-ChildItem -Path $dir -Filter *.typ -Recurse -File
        }
    }
    $tildeHits = @()
    $atHits = @()
    foreach ($file in $contentFiles) {
        $lineNo = 0
        foreach ($line in [System.IO.File]::ReadAllLines($file.FullName)) {
            $lineNo++
            $code = Get-TypstCode $line
            if ($code -match '(^|[^\\])~\d') {
                $tildeHits += ("  " + $file.FullName + ":" + $lineNo + "  " + $line.Trim())
            }
            if ($code -match '(^|[^\\@])@[A-Za-z0-9-]+\.[A-Za-z]') {
                $atHits += ("  " + $file.FullName + ":" + $lineNo + "  " + $line.Trim())
            }
        }
    }
    # Both lists are reported BEFORE throwing, so an author fixes every escape in
    # one pass. Throwing on the first category means a second build cycle just to
    # discover the second category.
    if ($tildeHits.Count -gt 0) {
        Write-Host ""
        Write-Host "Unescaped tilde before a digit in Typst MARKUP. A bare ~ is a"
        Write-Host "non-breaking space, so the tilde vanishes and leaves a ghost space."
        Write-Host "Write \~ instead:"
        $tildeHits | ForEach-Object { Write-Host $_ }
    }
    if ($atHits.Count -gt 0) {
        Write-Host ""
        Write-Host "Unescaped email address in Typst MARKUP. A bare @ is a label"
        Write-Host "reference, so the address is silently dropped. Write \@ instead:"
        $atHits | ForEach-Object { Write-Host $_ }
    }
    if ($tildeHits.Count -gt 0 -or $atHits.Count -gt 0) {
        Write-Host ""
        Write-Host "NOTE: this applies to MARKUP only. Inside a string literal both"
        Write-Host "characters are already literal, and adding a backslash there"
        Write-Host "prints the backslash on the page. Do not 'fix' a string."
        Write-Host ""
        throw "$($tildeHits.Count + $atHits.Count) unescaped markup character(s). See the list above."
    }

    # ── 5. Final-build provenance gate ──────────────────────────────────────
    # report/lib/metrics.typ panics at compile time on the same condition. This
    # is the earlier, friendlier failure: it names the file and line so the
    # operator can go straight there.
    #
    # It matches the CONSTRUCTOR CALLS — `p(12)`, `e(46, "…")` — not the string
    # `src: "placeholder"`. That string appears nowhere in the data: it only
    # exists inside the `#let` lines that DEFINE p() and e(), so a pattern on
    # the string found exactly those lines and nothing else, on every run,
    # whatever the data said. A gate that fires unconditionally is a gate nobody
    # can act on, and it would have passed a tree of pure placeholders just as
    # readily. `^\s*#let` keeps the definitions themselves out.
    #
    # It reads Get-TypstCode output, not the raw line. Three lines of comment
    # prose in report-data.typ describe p() and e() by name; scanning raw lines
    # meant a fully verified tree still reported those three and threw. The
    # Typst-side assert-final-clean never saw them, so the two gates disagreed.
    #
    # The constructor set is v / p / e / na, and only p and e are FAKE. `na()`
    # is not matched and must not be: it records that a measurement was never
    # taken (the two Youth Tech sessions ran no check-in), which is a verified
    # statement about a system of record and survives a final build. Writing 0
    # there would be the lie this gate exists to prevent, so the message below
    # names na() as the correct answer rather than leaving an author to guess.
    #
    # The leading "not a name character" class replaces a lookbehind, whose
    # syntax needs the angle-bracket characters this file must not contain. It
    # is what stops `type(` matching on its trailing `e(`.
    if ($Final -and (Test-Path "report\data")) {
        $fake = @()
        foreach ($file in (Get-ChildItem -Path "report\data" -Filter *.typ -Recurse -File)) {
            $lineNo = 0
            foreach ($line in [System.IO.File]::ReadAllLines($file.FullName)) {
                $lineNo++
                if ($line -match '^\s*#let') { continue }
                if ((Get-TypstCode $line) -match '(^|[^A-Za-z0-9_-])[pe]\(') {
                    $fake += ("  " + $file.FullName + ":" + $lineNo + "  " + $line.Trim())
                }
            }
        }
        if ($fake.Count -gt 0) {
            Write-Host ""
            Write-Host "FINAL build blocked. These metrics are not verified:"
            $fake | ForEach-Object { Write-Host $_ }
            Write-Host ""
            Write-Host "Replace each with v(value, note) once the figure is traced to a named"
            Write-Host "source, or with na(note) if the measurement was never taken at all."
            Write-Host "Do not write 0 for something nobody counted."
            Write-Host ""
            throw "$($fake.Count) unverified metric(s) in report\data."
        }
    }

    # ── 6. Assets ───────────────────────────────────────────────────────────
    # Written by prepare-assets.mjs. Its absence is what makes a fresh clone
    # convert the photo set once without anyone passing -Assets.
    $assetLock = "report\assets\MANIFEST.lock.json"
    $assetScript = "report\scripts\prepare-assets.mjs"
    if ($Assets -or -not (Test-Path $assetLock)) {
        if (Test-Path $assetScript) {
            Write-Host "Preparing assets (node $assetScript)"
            node $assetScript
            Assert-Ran "prepare-assets.mjs"
        } else {
            Write-Warning "$assetScript not found; skipping asset preparation."
        }
    }

    # ── 7. Diagrams ─────────────────────────────────────────────────────────
    # Each report/diagrams/*.mmd renders to report/diagrams/out/*.svg, which is
    # what report/lib/assets.typ diagram() resolves.
    if ($Diagrams) {
        $mmd = @()
        if (Test-Path "report\diagrams") {
            $mmd = Get-ChildItem -Path "report\diagrams" -Filter *.mmd -File
        }
        if ($mmd.Count -eq 0) {
            Write-Warning "No .mmd sources in report\diagrams; nothing to render."
        } else {
            New-Item -ItemType Directory -Force "report\diagrams\out" | Out-Null
            foreach ($m in $mmd) {
                $out = Join-Path "report\diagrams\out" ($m.BaseName + ".svg")
                Write-Host ("Rendering diagram " + $m.Name)
                npx -y @mermaid-js/mermaid-cli -i $m.FullName -o $out -b transparent
                Assert-Ran ("mmdc " + $m.Name)
            }
        }
    }

    # ── 8. Compile ──────────────────────────────────────────────────────────
    if (-not (Test-Path $Src)) {
        throw "Report entry file not found: $Src"
    }
    # BOTH modes write into report\out\, which is gitignored regenerable output.
    # The final build used to write public\docs\, which no longer exists: the
    # impact-report PDFs live on Vercel Blob and are referenced through
    # lib\config\assets.ts. Writing there recreated a directory that must not be
    # committed, and put the whole report binary inside the Next.js static tree. The
    # filenames differ so a draft can never be mistaken for the shipping PDF.
    $mode = "draft"
    $out = "report\out\she-sharp-h1-2026-DRAFT.pdf"
    if ($Final) {
        $mode = "final"
        $out = "report\out\she-sharp-half-year-report-2026-h1.pdf"
    }
    New-Item -ItemType Directory -Force "report\out" | Out-Null

    Write-Host "Compiling $Src (mode=$mode) to $out"
    typst compile --root . --font-path report\fonts --input mode=$mode $Src $out
    Assert-Compiled $out $Src

    # ── 9. Page count ───────────────────────────────────────────────────────
    # Counted off the raw bytes rather than a PDF library so the build has no
    # extra dependency. The [^s] tail keeps /Pages from matching /Page.
    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $out))
    $ascii = [System.Text.Encoding]::ASCII.GetString($bytes)
    $pages = ([regex]::Matches($ascii, '/Type\s*/Page[^s]')).Count
    if ($pages -ne $ExpectPages) {
        Write-Warning "Page count is $pages, expected $ExpectPages. A spacing change has probably pushed a section over. Render previews with -Png and look at the seam."
    }

    # ── 10. Size gate ───────────────────────────────────────────────────────
    $size = (Get-Item $out).Length
    if ($Final -and $size -gt 20971520) {
        $mb = [math]::Round($size / 1MB, 1)
        throw "FINAL build is $mb MB, over the 20 MB ceiling. Re-run report\scripts\prepare-assets.mjs with tighter JPEG quality, or move a bloated SVG onto the RASTER-FALLBACK list in report\lib\assets.typ."
    }

    # ── 11. Previews ────────────────────────────────────────────────────────
    if ($Png) {
        $previewDir = "report\out\preview"
        New-Item -ItemType Directory -Force $previewDir | Out-Null
        Get-ChildItem -Path $previewDir -Filter *.png -File | Remove-Item -Force
        Write-Host "Rendering 150ppi previews to $previewDir"
        typst compile --root . --font-path report\fonts --input mode=$mode --format png --ppi 150 $Src "$previewDir\p-{0p}.png"
        Assert-Ran "typst png preview"
    }

    Write-Host ""
    Write-Host "Build complete"
    Write-Host ("   " + $out + "   " + $size.ToString('N0') + " bytes, " + $pages + " pages")

    # ── 12. What publishing actually takes ──────────────────────────────────
    # The build stops at a file on disk. Nothing here uploads, and nothing here
    # should: Blob assets are served with a one-year immutable cache, so a
    # replaced file keeps serving the old bytes to anyone who has seen it. The
    # only safe publish is a NEW filename and a NEW constant. Printing the two
    # steps here is the difference between an operator doing that and an
    # operator committing the PDF into public/ because that is what the script
    # used to imply.
    if ($Final) {
        Write-Host ""
        Write-Host "This file is NOT the published report yet, and it must not be committed."
        Write-Host "public\docs\ no longer exists; the impact-report PDFs live on Vercel Blob."
        Write-Host "Two manual steps remain:"
        Write-Host ""
        Write-Host ("  1. Upload " + $out + " to the Vercel Blob store under a NEW filename.")
        Write-Host "     Never overwrite an existing Blob asset — they are cached immutable"
        Write-Host "     for a year, so an overwrite serves stale bytes with no way to bust it."
        Write-Host ""
        Write-Host "  2. Add a new constant for the returned URL in lib\config\assets.ts,"
        Write-Host "     beside IMPACT_REPORT_2024_PDF and IMPACT_REPORT_2025_PDF, and point"
        Write-Host "     the /resources listing at it. See docs\development\FUNDER_REPORTS.md."
    }
}
finally {
    Pop-Location
}
