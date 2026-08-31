# Soundtrack

The picture is cut to the music, not the other way around. A track that is
"about 120 BPM" with an edit that assumed exactly 120 will drift by a beat
every few seconds, and the title card will miss the drop.

## How the music is made

**The person generates it in Suno. The agent does not.**

ElevenLabs' Music API returns `paid_plan_required` on the free tier. Their
sound-generation endpoint will emit a 10-second loop, but it is not a track —
no structure, no drop, no bars. Do not spend the session trying APIs. Write
the prompt, wait for an MP3, then cut it.

Suno: Custom mode, **Instrumental ON**. Ask for 120 BPM and at least 40 seconds
(the video is ~30s; extra length is what lets you place the drop). Longer is
fine — `prepare-bed.ps1` trims.

### Style of Music — start from this, then rewrite the last sentence for the event

```
Uplifting electronic pop instrumental, 120 BPM, bright and driving. Plucky
staccato synth arpeggio hook, punchy four-on-the-floor kick, crisp claps and
finger snaps, warm rounded sub bass, shimmering bell and pluck layers, airy
white-noise risers into each new section. Confident, modern, optimistic major
key. [ONE SENTENCE tying the sound to THIS event — gym energy for Les Mills,
quiet focus for a cybersecurity night, festival lift for a hackathon.] Wide
stereo, radio-ready mastering, no vocals, no lyrics, no vocal chops.
```

### Lyrics box — paste even with Instrumental on; Suno reads the tags

Rewrite the section lengths if the edit is not ~30s. The drop section has to
cover the title card.

```
[Intro - 4 bars, filtered pluck arpeggio, light kick, building]
[Build - 4 bars, add claps and a riser]
[Drop - 8 bars, full kick and bass, main arpeggio hook, brightest point]
[Break - 4 bars, strip to pluck and bass, breathing room]
[Final Drop - 8 bars, full energy, add bell counter-melody]
[Outro - 2 bars, clean confident stop, no long fade]
```

### Exclude Styles

```
vocals, singing, rap, lo-fi, downtempo, sad, minor key, orchestral, trap,
dubstep, distorted, aggressive, cinematic trailer braams
```

Hand the three blocks to the person as copy-paste text. Do not generate the
file for them.

## Once the MP3 arrives

1. **Measure, do not trust the prompt.**
   ```
   node tools/analyze-music.mjs "C:\path\to\track.mp3"
   ```
   Put the reported BPM in `src/theme.ts`. Recut scene `beats` in `Promo.tsx`
   so the title card sits on a **multiple of 4 beats** (a bar line).

2. **Find the drop, then cut backwards from it.**
   ```
   node tools/find-window.mjs "<track>" <bpm> <phaseSeconds> <titleCardSeconds> <videoSeconds>
   node tools/locate-drop.mjs "<track>" <searchFrom> <searchTo> <bpm> <phase> <titleCardSeconds>
   ```
   The window start is `dropTime - titleCardTime`, snapped to a bar. For the
   Les Mills promo the drop was at 30.968s, the title at beat 20 (9.67s), so
   the bed started at 21.301s.

3. **Cut and level. The composition owns the envelope.**
   ```
   .\tools\prepare-bed.ps1 -Source "<track>" -Start <seconds> -Length <videoSeconds + 0.7>
   ```
   Target −16 LUFS, flat gain, no fade. `Promo.tsx` fades in over 18 frames and
   out over the last 55. A fade in the file plus a fade in the composition is
   a dip.

4. Set `MUSIC` in `src/data.ts` to `"music/bed.mp3"` and re-render.

## Why the edit is in beats

124 BPM at 30fps is 14.516 frames per beat. A fixed frame count drifts. Scene
lengths are declared in beats; cut frames are `round(startBeat * FRAMES_PER_BEAT)`
from each scene's absolute beat index, so error never accumulates. Change
durations in whole beats, not in frames.
