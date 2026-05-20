import { performance } from 'node:perf_hooks';

import {
  createSim,
  ENEMY_TYPE_COMMON,
  INPUT_FIRED,
  INPUT_LEFT,
  INPUT_RIGHT,
} from '../tests/wasmHarness.mjs';

const FRAME_COUNT = 10_000;
const DT = 1 / 60;

function stageWave(sim, enemyCount) {
  for (let i = 0; i < enemyCount; i++) {
    sim.writeEnemyStaging(i, {
      posX: 120 + (i % 8) * 60,
      posY: 90 + Math.floor(i / 8) * 40,
      speedX: i % 2 === 0 ? 1.5 : -1.5,
      speedY: i % 3 === 0 ? 1.0 : -1.0,
      health: 20,
      maxHealth: 20,
      damage: 1,
      type: ENEMY_TYPE_COMMON,
    });
  }
  sim.initEnemies(enemyCount);
}

const sim = await createSim();
sim.seed(0xC0FFEE);
sim.initPlayer(380, 220, 10_000, 10, 200);
stageWave(sim, 24);

let now = 0;
const startedAt = performance.now();

for (let frame = 0; frame < FRAME_COUNT; frame++) {
  now += 16.6667;
  const input =
    (frame % 120 < 60 ? INPUT_LEFT : INPUT_RIGHT) |
    (frame % 18 === 0 ? INPUT_FIRED : 0);

  sim.simulate(input, 700, 220, DT, now);

  for (let i = 0; i < 24; i++) {
    const enemy = sim.readEnemy(i);
    if (enemy.onDeath && !enemy.deathDone) {
      sim.advanceDeathFrame(i);
    }
  }
}

const elapsedMs = performance.now() - startedAt;
const avgFrameMs = elapsedMs / FRAME_COUNT;
const simFps = 1000 / avgFrameMs;
const player = sim.readPlayer();

console.log(`Frames: ${FRAME_COUNT}`);
console.log(`Total ms: ${elapsedMs.toFixed(2)}`);
console.log(`Avg ms/frame: ${avgFrameMs.toFixed(4)}`);
console.log(`Equivalent FPS: ${simFps.toFixed(1)}`);
console.log(`Final player: hp=${player.health} points=${player.points} kills=${player.killCount} throws=${player.throwCount}`);
console.log(`Final pools: enemies=${sim.aliveEnemyCount()} projectiles=${sim.activeProjectileCount()} items=${sim.activeItemCount()}`);
