# Final renders: every social size, H.264, yuv420p so the files play everywhere.
# Usage: .\render.ps1 -Slug event-lesmills-03-september-2026 -Kind promo
#        .\render.ps1 -Slug ... -Kind recap -Only s
param(
  [Parameter(Mandatory = $true)][string]$Slug,
  [ValidateSet("promo", "recap")][string]$Kind = "promo",
  [string]$Only = ""
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path "out" | Out-Null

$targets = @(
  @{ tag = "v"; comp = "Promo-Vertical-9x16";  suffix = "vertical_1080x1920";  note = "Reels / Stories / TikTok / Shorts" },
  @{ tag = "p"; comp = "Promo-Portrait-4x5";   suffix = "portrait_1080x1350";  note = "Instagram + Facebook feed" },
  @{ tag = "s"; comp = "Promo-Square-1x1";     suffix = "square_1080x1080";    note = "LinkedIn + Instagram feed" },
  @{ tag = "l"; comp = "Promo-Landscape-16x9"; suffix = "landscape_1920x1080"; note = "YouTube / LinkedIn / in the room" }
)

foreach ($t in $targets) {
  if ($Only -and $Only -ne $t.tag) { continue }
  $file = "she-sharp-${Slug}-${Kind}_$($t.suffix).mp4"
  Write-Host "`n=== $($t.comp)  ->  $file   [$($t.note)]"
  npx remotion render src/index.ts $t.comp "out\$file" `
    --codec=h264 `
    --crf=18 `
    --pixel-format=yuv420p `
    --log=error
}

Write-Host "`n--- output ---"
Get-ChildItem out\*.mp4 | ForEach-Object {
  $d = & ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration -of csv=p=0 $_.FullName
  "{0,-72} {1,7}MB  {2}" -f $_.Name, [math]::Round($_.Length / 1MB, 1), ($d -join " ")
}
