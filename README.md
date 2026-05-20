# ARENA — Legacy Game Rethinking (2026)

> A 2019 JavaScript canvas game, fully redesigned in 2026 as a professional TypeScript project.  
> Not a rewrite. A rethinking.

**Live → [arena-game-2.web.app](https://arena-game-2.web.app)**

---

## Origin

In 2019, this game was a graduation project from an IT course — a first real attempt at building something interactive with JavaScript. It worked. Enemies moved, bullets flew, scores were saved to Firebase. For a first project, it was a real achievement.

But the code reflected exactly what it was: a learning exercise. God classes, mutable globals, magic numbers, broken variable names (`bull`, `gamer`, `enemys`, `linki`, `requst`), a canvas element recreated on every single frame, collision detection living inside an audio handler, Firebase writes triggered from inside damage calculations.

Seven years later, this project was taken apart and rebuilt from scratch — not to make it "cleaner" in a superficial sense, but to answer a specific question:

**What would this game look like if it were written by someone who understands game architecture?**

---

## Philosophy

The reference point was not "better JavaScript" or "TypeScript with types bolted on."  
The reference point was a clean, focused **C++ indie game codebase** — the kind of discipline you find in professionally written game engines and small studios.

That means:

- **Systems own their responsibilities.** A collision system detects collisions. It does not play sounds, spawn items, update scores, or write to a database.
- **Entities are data.** `PlayerEntity` is a plain data container. It holds sprite animation state. It does not update itself, render itself, or know about audio.
- **The renderer is the only thing that touches the canvas.** No entity, system, or game logic calls `ctx.drawImage` or `ctx.fillRect`. Ever.
- **The simulation hot-path runs in WebAssembly.** Player movement, projectile physics, enemy AI, collision detection, item pickups, and combat resolution all run inside a WASM module compiled from AssemblyScript. The renderer and all browser APIs stay in JS.
- **The game loop uses a fixed-step update model.** `GameLoop` accumulates real frame time, runs simulation at a stable 60 Hz step, and renders once per browser frame.
- **Dependencies are explicit.** Every system receives what it needs through its constructor or function arguments. No hidden globals, no module-level singletons with implicit state.
- **Configuration is centralized.** Every magic number — sprite coordinates, speeds, health values, bounds, drop chances, stage thresholds — lives in `GameConfig.ts` with a meaningful name.

---

## What Changed

### Original problems (2019)

| Problem | File | Impact |
|---|---|---|
| `GameModel.js` contained: DB, API, Audio, UI, Game, Loader, Player, Enemy, Sprite, Items | `GameModel.js` | One file owned everything |
| Canvas buffer created with `createElement('canvas')` on every frame | `GameView.js` | GC pressure every 16ms |
| Audio playback used `.find()` on an array on every shot/hit/pickup | `GameModel.js` | O(n) hot path lookup |
| Game state was a raw mutable string `game.about.state === 'play'` | everywhere | Typo-prone, no transitions |
| Firebase writes triggered from inside collision detection | `headlerModal.js` | Side effects in simulation |
| `gamer.move.pos[0, 1]++` — comma operator bug | `headlerModal.js` | Silent wrong behavior |
| `Vector` used but never imported — relied on a global script tag | `headlerModal.js` | Fragile implicit dependency |
| `Player.Win()` contained `debugger;` | `GameModel.js` | Forgotten debug artifact |
| Assets loaded with a 3-second `setTimeout` before game start | `init.js` | Race condition by design |
| All simulation ran as JS heap objects — new Vector2 per entity per frame | everywhere | GC pressure in hot path |

---

## Architecture

```
assembly/                    — WebAssembly simulation core (AssemblyScript)
├── index.ts                 — exports: seedRng, initPlayer, initEnemies, simulate
├── memory.ts                — layout constants: offsets, strides, event/input flag bits
├── rng.ts                   — Xorshift32 PRNG (no Math.random() in WASM)
├── collision.ts             — @inline testAABB — zero-alloc AABB test
├── player.ts                — input → position → arena clamp
├── projectiles.ts           — move, cull, tryFire with rate limiting
├── enemies.ts               — bounce, projectile lifecycle, contact damage
├── combat.ts                — projectile vs enemy AABB, death, item drops
└── items.ts                 — pickup AABB, stat application (coin / food / scroll)

src/
├── core/
│   ├── GameLoop.ts          — fixed-step update loop with accumulator and capped catch-up
│   ├── ScalarRng.ts         — local xorshift RNG for JS-side orchestration (wave spawn variation)
│   ├── SceneManager.ts      — typed state machine with validated transitions
│   └── GameConfig.ts        — every constant, coordinate, speed, threshold in one place
│
├── math/
│   ├── Vector2.ts           — small mutable 2D vector for low-allocation runtime paths
│   └── Rect.ts              — AABB rect
│
├── types/
│   ├── GameScene.ts         — enum GameScene + valid transition map
│   ├── EntityTypes.ts       — EnemyType, ItemType, SpriteState, SpriteDirection
│   ├── AssetTypes.ts        — ImageKey enum, SoundId enum, GameData interface
│   └── LeaderboardTypes.ts  — LeaderboardEntry, ScoreSubmission
│
├── assets/
│   ├── AssetLoader.ts       — Promise.all image loading, game data fetch
│   └── AssetStore.ts        — typed map of loaded images, owned for lifetime of app
│
├── audio/
│   └── AudioManager.ts      — Web Audio API; Map<SoundId, AudioBuffer>; O(1) playback
│
├── input/
│   └── InputManager.ts      — keyboard + mouse state, consume-once fire/escape
│
├── entities/
│   └── PlayerEntity.ts      — sprite animation state only (position/stats in WASM)
│
├── systems/
│   ├── PlayerSystem.ts      — sprite direction from input keys (visual only)
│   └── SpawnSystem.ts       — wave logic, writes enemy data to WASM staging area
│
├── wasm/
│   ├── SimMemory.ts         — TypedArray views on shared WebAssembly.Memory
│   └── GameSimulator.ts     — instantiateStreaming, wraps WASM exports, exposes simulate()
│
├── rendering/               — the only code that may call the canvas API
│   ├── Renderer.ts          — owns canvas + double-buffer (created once at startup)
│   ├── SpriteAnimator.ts    — frame index calculation from SpriteState
│   ├── GameplayRenderer.ts  — reads entity state from SimMemory (not JS objects)
│   ├── HUDRenderer.ts       — health bar, score, level, pause button
│   ├── MenuRenderer.ts      — main menu
│   ├── PauseRenderer.ts     — pause overlay with stats
│   ├── GameOverRenderer.ts  — game over / win screen
│   ├── RatingRenderer.ts    — leaderboard table
│   ├── FadeRenderer.ts      — start animation fade-in
│   └── ArenaRenderer.ts     — arena floor, gates animation
│
├── services/
│   ├── FirebaseService.ts   — Firestore v10 modular: submit score, subscribe leaderboard
│
├── ui/
│   └── NameInputModal.ts    — DOM modal for name entry, Promise-based
│
├── game/
│   ├── WaveManager.ts       — stage counter, boss/extra-boss count progression
│   └── Game.ts              — drives fixed-step update/render pipeline; WASM is the only gameplay authority
│
└── main.ts                  — bootstrap: load assets + WASM in parallel, wire and start
```

---

## Architectural Decisions Explained

### Simulation Core in WebAssembly

The original game ran all simulation logic as plain JS objects: every entity was a JS heap object, every `Vector2` operation produced a new garbage-collected object, and every frame created and discarded dozens of short-lived values.

The 2026 version moves the entire simulation hot-path into a WebAssembly module written in AssemblyScript. All entity state lives in a single flat `ArrayBuffer`:

```
WebAssembly.Memory (1 page = 64 KB, shared between WASM and JS)
├─ [0..63]        Player state      (64 bytes)
├─ [64..5183]     Enemy pool        (80 B × 64 slots)
├─ [5184..7231]   Projectile pool   (32 B × 64 slots)
├─ [7232..11327]  Item pool         (16 B × 256 slots)
└─ [11328..]      Result buffer + enemy staging area
```

JS holds `Float32Array` / `Int32Array` / `Uint8Array` views on the same buffer. There is zero serialisation and zero copying between the two sides — both read and write the same bytes. The entire simulation is one call per frame:

```typescript
const result = simulator.simulate(inputFlags, mouseX, mouseY, dt, now);
// result.eventFlags carries EVT_DAMAGE | EVT_ENEMY_DIED | EVT_ITEM_PICKED | EVT_PLAYER_DEAD
```

The WASM module uses `runtime: "stub"` — no GC, no heap allocator. All data is at fixed offsets in linear memory. The PRNG is Xorshift32 seeded from `performance.now()` (WASM has no `Math.random()`). JS-side wave orchestration also avoids global `Math.random()` and uses a local xorshift RNG. The release build is ~3 KB.

---

### Double-buffer canvas created once

The original `Draw.building()` called `document.createElement('canvas')` and recreated the entire off-screen canvas every frame — ~60 times per second.

`Renderer` creates one buffer canvas in its constructor. `beginFrame()` clears it. `commitFrame()` blits it to the main canvas. The canvas object lives for the entire application lifetime.

---

### Audio is a `Map`, not a scanned array

The original code stored sounds in a plain array and called `.find(item => item.name === 'shot')` on every shot, hit, pickup, and death.

`AudioManager` stores decoded `AudioBuffer` objects in a `Map<SoundId, AudioBuffer>`. Playback is a single hash map lookup. O(1) always.

---

### `GameScene` enum + `SceneManager`

The original code had `game.about.state` as a raw mutable string compared inline across five different files.

`GameScene` is a TypeScript enum. `SceneManager.transitionTo()` validates the transition against a declared map of allowed transitions. The compiler catches typos at build time.

---

### Entities are data, systems are functions

In the original code, entities called methods on themselves: `gamer.GameOver(gamer, game, load, sound)`. The player knew about the audio system, the game state, and the loader.

In the refactored code, `PlayerEntity` holds only sprite animation state (direction, frame). Position, health, and all stats are authoritative in WASM. `Game.syncPlayerFromWasm()` copies them back to `PlayerEntity` each frame so the renderer has what it needs.

---

### Assets loaded before the loop starts

The original code started a 3-second `setTimeout` and hoped assets would be ready in time — a race condition by design.

`main.ts` calls `Promise.all([loadAllAssets(), audio.loadAll(), GameSimulator.load('/game.wasm')])`. The game loop does not start until all three resolve.

---

### Firebase writes isolated from gameplay

In the original, `mainDB.updateUserData(...)` was called directly from inside the `death()` function.

In the refactored code, `Game.handleScoreSubmission()` is called once, guarded by a `scoreSubmitted` flag, and only triggered when the scene transitions to `GameOver`. The simulation never knows the database exists.

---

## Packages

### Runtime

#### `firebase@^10`
Firestore modular client SDK. The browser reads the public leaderboard from Firestore and submits display-safe leaderboard docs directly to Firestore under Security Rules constraints.

---

### Dev

#### `assemblyscript@^0.28`
Compiles the `assembly/` simulation core to `.wasm`. Uses `runtime: "stub"` for zero-overhead linear memory with no GC. Release build applies `-O3` with shrink level 1, producing a ~3 KB binary.

#### `vite@^8`
Build tool and dev server. `assetsInclude: ['**/*.wasm']` ensures `game.wasm` is copied to `dist/`.

#### `typescript@^5.5`
Strict mode: `noUnusedLocals`, `noUnusedParameters`, `strictNullChecks`, `exactOptionalPropertyTypes`, `noImplicitReturns`. The `assembly/` directory is excluded from the main `tsconfig.json` — it has its own that extends `assemblyscript/std/assembly.json`.

---

## Testing And Benchmarks

The simulation core is covered at the state-machine level, not through UI snapshots.

- `yarn test`
- `yarn test:wasm`
- `yarn bench:wasm`
- `yarn bench:wasm:sweep`

`test:wasm` runs deterministic regression tests against the compiled `game.wasm`:

- player initialisation
- enemy staging and pool reset
- projectile fire-rate cooldown
- projectile hit -> death state -> slot cleanup
- coin / food / scroll pickups
- enemy damage cooldown windows
- projectile pool exhaustion
- multi-seed soak invariants across thousands of frames

`bench:wasm` runs one fixed 10,000-frame synthetic scenario for quick regression checks.

`bench:wasm:sweep` runs the same simulation loop across multiple RNG seeds and enemy counts so frame cost drift can be tracked over time.

For browser-side profiling, use Chrome DevTools Performance with a production build and compare:

1. `Scripting` time per frame
2. `Rendering` / `Painting`
3. GC events and JS heap growth
4. frame-time stability, not just average FPS

This matches how engine teams usually split verification:

- deterministic gameplay correctness in simulation tests
- synthetic CPU benchmarks for hot paths
- browser or platform profiling for full-frame cost

---

## Environment Variables

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Copy `.env.example` to `.env` and fill in the values from Firebase Console → Project Settings → Your apps → Web app → Config.

The Firebase Admin SDK service account key (`*-adminsdk-*.json`) must never be committed to git or bundled into a browser build.

The public leaderboard now stores only display-safe fields (`name`, `points`). Abuse-control metadata must not be stored in publicly readable documents.

On the Firebase Spark plan, Cloud Functions deployment is not available. This project therefore uses a Spark-compatible model: the browser may create only tightly validated leaderboard docs (`name`, `points`) under Firestore Rules. This improves privacy and schema safety, but it does not fully prevent forged scores; that requires a trusted backend on Blaze or an external server.

---

## Commands

```bash
yarn install            # install dependencies
yarn build:wasm         # compile assembly/ → public/game.wasm (release, ~3 KB)
yarn build:wasm:dev     # compile assembly/ → public/game.wasm (debug symbols)
yarn dev                # build WASM (dev) + start vite dev server
yarn build              # build:wasm + tsc --noEmit + vite build → dist/
yarn preview            # preview production build locally
yarn deploy             # build + firebase deploy --only hosting,firestore:rules
yarn clean              # remove dist/
```

---

## Deployment

Deployed to **Firebase Hosting** (free Spark plan) — **[arena-game-2.web.app](https://arena-game-2.web.app)**

### CI/CD

Every push to `master` triggers `.github/workflows/deploy.yml`:

1. Install deps
2. Compile WASM (`asc assembly/index.ts`)
3. Type check (`tsc --noEmit`)
4. Build (`vite build`)
5. Deploy Hosting and Firestore Rules

Required GitHub repository secrets:

| Secret | Where to get it |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project Settings → Service accounts → Generate new private key |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps → Web app → Config |
| `VITE_FIREBASE_AUTH_DOMAIN` | same |
| `VITE_FIREBASE_PROJECT_ID` | same |
| `VITE_FIREBASE_STORAGE_BUCKET` | same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | same |
| `VITE_FIREBASE_APP_ID` | same |

### Manual deploy

```bash
npm install -g firebase-tools
firebase login
yarn deploy
```

---

## Original (2019)

> *"My graduation project from IT courses. Legacy project development in start 2019 year, my first work."*

The original is preserved at the git history baseline. It used ES5/ES6, webpack, a single bundle, global script tags for Vector math, and Firebase v6. It was a genuine first project and it ran.

This version is what it could become.
