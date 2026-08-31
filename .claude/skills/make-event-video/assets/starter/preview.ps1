# Half-scale preview plus a contact sheet of evenly spaced frames.
# Scene-accurate mids belong in the event's own preview once Promo.tsx exists;
# this script is the first pass, before those numbers are known.
# Usage: .\preview.ps1 [-Comp Promo-Vertical-9x16] [-Tag v] [-Count 9]
param(
  [string]$Comp = "Promo-Vertical-9x16",
  [string]$Tag = "v",
  [int]$Count = 9
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path "stills", "out" | Out-Null

$mp4 = "out\preview-$Tag.mp4"
npx remotion render src/index.ts $Comp $mp4 --scale=0.5 --log=error
if (-not (Test-Path $mp4)) { throw "render produced no file" }

$dur = [double](& ffprobe -v error -show_entries format=duration -of csv=p=0 $mp4)
$files = @()
for ($i = 0; $i -lt $Count; $i++) {
  $sec = $dur * ($i + 0.5) / $Count
  $name = "stills\$Tag-{0:d2}.png" -f ($i + 1)
  & ffmpeg -y -v error -ss $sec -i $mp4 -frames:v 1 $name
  $files += $name
}

$probe = & ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 $files[0]
$w, $h = $probe.Split(",")
$cw = 400
$ch = [math]::Round($cw * [int]$h / [int]$w)
$cellW = $cw + 20
$cellH = $ch + 20
$cols = [math]::Min(3, $Count)
$rows = [math]::Ceiling($Count / $cols)

$inputs = @()
foreach ($f in $files) { $inputs += @("-i", $f) }
$filter = ""
for ($i = 0; $i -lt $files.Count; $i++) {
  $filter += "[${i}:v]scale=${cw}:${ch},pad=${cellW}:${cellH}:10:10:color=0x2a2a3a[s${i}];"
}
$filter += (0..($files.Count - 1) | ForEach-Object { "[s${_}]" }) -join ""
$layout = @()
for ($r = 0; $r -lt $rows; $r++) {
  for ($c = 0; $c -lt $cols; $c++) {
    if (($r * $cols + $c) -lt $Count) { $layout += "$($c * $cellW)_$($r * $cellH)" }
  }
}
$filter += "xstack=inputs=$($files.Count):layout=$($layout -join '|')[out]"

& ffmpeg -y -v error @inputs -filter_complex $filter -map "[out]" "stills\_sheet-$Tag.png"
Write-Host "sheet -> stills\_sheet-$Tag.png"
