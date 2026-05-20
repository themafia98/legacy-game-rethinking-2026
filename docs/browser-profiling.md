# Browser Profiling Guide

This project now has two distinct performance layers:

- simulation correctness and synthetic CPU checks via `yarn test`, `yarn bench:wasm`, and `yarn bench:wasm:sweep`
- full-frame browser profiling for render, scripting, painting, and GC behaviour

Use both. The Node benchmarks are useful regression baselines, but they do not measure canvas draw cost, browser scheduling, layout, painting, or Web Audio interaction.

## Goal

Capture repeatable traces that answer:

1. Is the frame budget being spent in scripting, rendering, or painting?
2. Are there GC spikes or allocation churn on the main thread?
3. Does frame-time stay flat under load, or are there periodic hitches?
4. Does performance degrade between builds or branches?

## Profiling Setup

1. Build the production bundle:

```bash
yarn build
```

2. Serve it locally:

```bash
yarn preview
```

3. Open Chrome DevTools:

- `Performance`
- `Memory`
- `Rendering`

4. In the Performance panel:

- disable screenshots if CPU noise matters more than visual trace
- enable memory
- use 4x CPU throttling for comparative traces if you want weaker-device sensitivity

## Test Scenarios

Run the same scenarios every time.

### Scenario A: Menu Idle

- open the game and stay on menu for 10 seconds
- record CPU, GC, and paint activity

Expected:

- almost no scripting spikes
- mostly flat rendering and paint cost

### Scenario B: Start Animation

- start a new game
- capture the full gate/start animation

Expected:

- small scripting cost
- no burst allocations per frame

### Scenario C: Normal Gameplay

- play one wave with repeated movement and fire input for 20 seconds

Expected:

- stable frame pacing
- scripting dominated by render orchestration and one wasm simulation call per fixed update

### Scenario D: Heavy Wave

- reach or force a high-enemy-count wave
- hold movement and repeated fire for 20 seconds

Expected:

- higher scripting and paint cost than Scenario C
- no catastrophic spikes
- no rapid JS heap growth

## What To Inspect

### Performance Panel

Look at:

- `Scripting`
- `Rendering`
- `Painting`
- `Idle`
- dropped frames
- longest frames, not just average

For this project specifically:

- check whether `GameplayRenderer.renderAllEnemies()` dominates JS time
- compare traces with `SHOW_ENEMY_HP = false` and `SHOW_ENEMY_HP = true`
- check whether repeated text drawing for enemy HP becomes expensive in dense waves
- check whether canvas paint cost overtakes wasm simulation cost

### Memory Panel

Look for:

- rising heap with no return to baseline
- frequent small collections caused by per-frame allocations
- bursty collections during gameplay transitions

After the current cleanup, the main suspicion area is render-side object churn rather than simulation-side churn.

## Comparison Checklist

When comparing two commits or old-vs-new repositories, record:

| Metric | Scenario A | Scenario B | Scenario C | Scenario D |
|---|---:|---:|---:|---:|
| Avg FPS |  |  |  |  |
| 1% low FPS |  |  |  |  |
| Avg scripting ms/frame |  |  |  |  |
| Avg rendering+painting ms/frame |  |  |  |  |
| Longest frame ms |  |  |  |  |
| GC events count |  |  |  |  |
| Peak JS heap MB |  |  |  |  |

Do not rely on one number. A build with the same average FPS but fewer long frames is usually the better build.

## Current Hypotheses

Based on the codebase after the WASM migration and runtime cleanup:

- simulation cost should be relatively small and stable
- render cost should dominate once enemy count grows
- enemy HP text drawing is a likely browser-side hotspot in dense waves
- static background caching should reduce repeated per-frame texture work
- remaining optimization work should be driven by browser traces, not by further blind refactors

## Next Trace-Driven Steps

If traces show scripting pressure in gameplay rendering:

- reduce per-enemy text work
- cache or batch more HUD/menu render assets
- consider conditional debug-style overlays for enemy HP instead of always-on text

If traces show paint pressure:

- reduce overdraw
- reduce alpha-heavy layers
- lower repeated full-canvas texture work

If traces show GC pressure:

- inspect renderer call sites for transient object creation
- move frequently reused draw parameters to stable scratch objects where appropriate
