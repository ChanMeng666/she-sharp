# Cut the music bed out of a full-length track and level it.
#
# The window start is chosen so the track's drop lands on the video's title
# card; tools/locate-drop.mjs measures the drop and tools/find-window.mjs
# reports candidate starts. Nothing here fades or ducks the audio — the
# composition does that in src/Promo.tsx, so the file stays a clean bed.
#
# Usage:
#   .\tools\prepare-bed.ps1 -Source "C:\path\track.mp3" -Start 21.30103 -Length 29.2
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][double]$Start,
  [double]$Length = 29.2,
  [double]$TargetLufs = -16.0,
  [string]$Out = "public\music\bed.mp3"
)

# ffmpeg writes progress and warnings to stderr, which PowerShell turns into
# error records. Under "Stop" that aborts the script on a harmless
# "Guessed Channel Layout" line, so exit codes are checked by hand instead.
$ErrorActionPreference = "Continue"
New-Item -ItemType Directory -Force -Path (Split-Path $Out) | Out-Null
$tmp = Join-Path $env:TEMP "bed-cut-$PID.wav"

function Invoke-FFmpeg {
  param([string[]]$FFArgs)
  $out = & ffmpeg @FFArgs 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { Write-Host $out; throw "ffmpeg failed ($LASTEXITCODE)" }
  return $out
}

# -ss AFTER -i is output seeking: slower, but sample accurate. Input seeking on
# an mp3 can land up to a frame (~26ms) out, which is the whole point here.
# -vn drops the embedded cover art, which would otherwise become a video stream.
Invoke-FFmpeg @("-y", "-v", "error", "-i", $Source, "-ss", $Start, "-t", $Length, "-vn", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", $tmp) | Out-Null
if (-not (Test-Path $tmp)) { throw "cut failed" }

# Measure, then apply a single flat gain. A flat gain keeps the track's own
# dynamics intact, where loudnorm's dynamic mode would squash the build.
$log = Invoke-FFmpeg @("-hide_banner", "-nostats", "-i", $tmp, "-af", "ebur128=peak=true", "-f", "null", "NUL")
$m = [regex]::Matches($log, "I:\s+(-?\d+\.\d+)\s+LUFS")
if ($m.Count -eq 0) { throw "could not read loudness" }
$lufs = [double]$m[$m.Count - 1].Groups[1].Value
$gain = [math]::Round($TargetLufs - $lufs, 2)
Write-Host ("segment {0:N1} LUFS  ->  target {1:N1}  ->  gain {2:N2} dB" -f $lufs, $TargetLufs, $gain)

# alimiter catches any peak the gain pushes over; at a negative gain it is a
# no-op, but it keeps the command safe if a future track is quieter.
Invoke-FFmpeg @("-y", "-v", "error", "-i", $tmp, "-af", "volume=${gain}dB,alimiter=limit=0.95", "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000", $Out) | Out-Null
Remove-Item $tmp -Force

$dur = & ffprobe -v error -show_entries format=duration -of csv=p=0 $Out
$check = Invoke-FFmpeg @("-hide_banner", "-nostats", "-i", $Out, "-af", "ebur128=peak=true", "-f", "null", "NUL")
$final = [regex]::Matches($check, "I:\s+(-?\d+\.\d+)\s+LUFS")
Write-Host ("wrote {0}  {1}s  {2:N1}KB  final {3} LUFS" -f $Out, $dur, ((Get-Item $Out).Length / 1KB), $final[$final.Count - 1].Groups[1].Value)
