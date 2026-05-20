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
const SEEDS = [1, 7, 42, 1337, 0xC0FFEE];
const ENEMY_COUNTS = [8, 24, 48];

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

async function runScenario(seed, enemyCount) {
  const sim = await createSim();
  sim.seed(seed);
  sim.initPlayer(380, 220, 10_000, 10, 200);
  stageWave(sim, enemyCount);

  let now = 0;
  const startedAt = performance.now();

  for (let frame = 0; frame < FRAME_COUNT; frame++) {
    now += 16.6667;
    const input =
      (frame % 120 < 60 ? INPUT_LEFT : INPUT_RIGHT) |
      (frame % 18 === 0 ? INPUT_FIRED : 0);

    sim.simulate(input, 700, 220, DT, now);

    for (let i = 0; i < enemyCount; i++) {
      const enemy = sim.readEnemy(i);
      if (enemy.onDeath && !enemy.deathDone) {
        sim.advanceDeathFrame(i);
      }
    }
  }

  const elapsedMs = performance.now() - startedAt;
  return {
    seed,
    enemyCount,
    elapsedMs,
    avgFrameMs: elapsedMs / FRAME_COUNT,
    final: {
      player: sim.readPlayer(),
      enemies: sim.aliveEnemyCount(),
      projectiles: sim.activeProjectileCount(),
      items: sim.activeItemCount(),
    },
  };
}

for (const enemyCount of ENEMY_COUNTS) {
  const results = [];

  for (const seed of SEEDS) {
    results.push(await runScenario(seed, enemyCount));
  }

  const avgFrameMs =
    results.reduce((sum, result) => sum + result.avgFrameMs, 0) / results.length;
  const minFrameMs = Math.min(...results.map((result) => result.avgFrameMs));
  const maxFrameMs = Math.max(...results.map((result) => result.avgFrameMs));

  console.log(`Scenario: enemies=${enemyCount}, frames=${FRAME_COUNT}, seeds=${SEEDS.length}`);
  console.log(`Avg ms/frame: ${avgFrameMs.toFixed(4)}`);
  console.log(`Min ms/frame: ${minFrameMs.toFixed(4)}`);
  console.log(`Max ms/frame: ${maxFrameMs.toFixed(4)}`);

  for (const result of results) {
    console.log(
      `  seed=${result.seed} avg=${result.avgFrameMs.toFixed(4)}ms ` +
      `hp=${result.final.player.health} pts=${result.final.player.points} ` +
      `kills=${result.final.player.killCount} throws=${result.final.player.throwCount} ` +
      `aliveEnemies=${result.final.enemies} activeProjectiles=${result.final.projectiles} activeItems=${result.final.items}`,
    );
  }
}
