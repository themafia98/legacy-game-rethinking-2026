import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSim,
  ENEMY_TYPE_COMMON,
  EVT_DAMAGE,
  EVT_ENEMY_DIED,
  EVT_ITEM_PICKED,
  INPUT_FIRED,
  ITEM_TYPE_COIN,
  ITEM_TYPE_FOOD,
  ITEM_TYPE_SCROLL,
  MAX_PROJECTILES,
} from './wasmHarness.mjs';

const SIM_FRAMES = 2_000;

function makeEnemy(overrides = {}) {
  return {
    posX: 140,
    posY: 100,
    speedX: 0,
    speedY: 0,
    health: 10,
    maxHealth: 10,
    damage: 3,
    type: ENEMY_TYPE_COMMON,
    ...overrides,
  };
}

test('initPlayer seeds authoritative player state and resets counters', async () => {
  const sim = await createSim();

  sim.initPlayer(120, 80, 9, 4, 220);

  assert.deepEqual(sim.readPlayer(), {
    posX: 120,
    posY: 80,
    health: 9,
    maxHealth: 9,
    damage: 4,
    speed: 220,
    points: 0,
    killCount: 0,
    throwCount: 0,
    alive: true,
  });
});

test('initEnemies copies staging data and clears projectile and item pools', async () => {
  const sim = await createSim();
  sim.initPlayer(100, 100, 10, 5, 200);

  sim.writeEnemyStaging(0, makeEnemy({ posX: 250, posY: 150, health: 12, maxHealth: 12, damage: 4 }));
  sim.setProjectile(0, { posX: 1, posY: 2, dirX: 1, dirY: 0, speed: 320, active: true });
  sim.setItem(0, { posX: 1, posY: 2, type: ITEM_TYPE_COIN, active: true });

  sim.initEnemies(1);

  const enemy = sim.readEnemy(0);
  assert.equal(enemy.posX, 250);
  assert.equal(enemy.posY, 150);
  assert.equal(enemy.health, 12);
  assert.equal(enemy.maxHealth, 12);
  assert.equal(enemy.damage, 4);
  assert.equal(enemy.alive, true);
  assert.equal(sim.activeProjectileCount(), 0);
  assert.equal(sim.activeItemCount(), 0);
});

test('simulate fires one projectile and enforces fire-rate cooldown', async () => {
  const sim = await createSim();
  sim.initPlayer(100, 100, 10, 5, 200);
  sim.initEnemies(0);

  sim.simulate(INPUT_FIRED, 200, 100, 0, 300);

  const firstProjectile = sim.readProjectile(0);
  assert.equal(firstProjectile.active, true);
  assert.equal(firstProjectile.posX, 100);
  assert.equal(firstProjectile.posY, 100);
  assert.equal(sim.readPlayer().throwCount, 1);
  assert.equal(sim.activeProjectileCount(), 1);

  sim.simulate(INPUT_FIRED, 200, 100, 0, 450);

  assert.equal(sim.activeProjectileCount(), 1);
  assert.equal(sim.readPlayer().throwCount, 1);
});

test('projectile hit triggers enemy death state, event flag, and later frees the slot', async () => {
  const sim = await createSim();
  sim.seed(1);
  sim.initPlayer(100, 100, 10, 10, 200);
  sim.writeEnemyStaging(0, makeEnemy({ posX: 132, posY: 100, health: 10, maxHealth: 10 }));
  sim.initEnemies(1);

  const result = sim.simulate(INPUT_FIRED, 200, 100, 0.1, 300);
  const enemyAfterHit = sim.readEnemy(0);

  assert.equal(result.eventFlags & EVT_ENEMY_DIED, EVT_ENEMY_DIED);
  assert.equal(result.killsDelta, 1);
  assert.equal(enemyAfterHit.alive, true);
  assert.equal(enemyAfterHit.onDeath, true);
  assert.equal(enemyAfterHit.health, 0);
  assert.equal(sim.readPlayer().killCount, 1);

  sim.advanceDeathFrame(0);
  sim.advanceDeathFrame(0);
  sim.advanceDeathFrame(0);

  const cleanupResult = sim.simulate(0, 0, 0, 0, 700);
  const enemyAfterCleanup = sim.readEnemy(0);

  assert.equal(cleanupResult.pointsDelta, 25);
  assert.equal(enemyAfterCleanup.alive, false);
  assert.equal(sim.readPlayer().points, 25);
});

test('coin, food, and scroll pickups apply exact stat deltas', async (t) => {
  await t.test('coin pickup awards score and emits pickup event', async () => {
    const sim = await createSim();
    sim.initPlayer(100, 100, 10, 5, 200);
    sim.initEnemies(0);
    sim.setItem(0, { posX: 100, posY: 100, type: ITEM_TYPE_COIN, active: true });

    const result = sim.simulate(0, 0, 0, 0, 0);

    assert.equal(result.eventFlags & EVT_ITEM_PICKED, EVT_ITEM_PICKED);
    assert.equal(result.pointsDelta, 10);
    assert.equal(sim.readPlayer().points, 10);
    assert.equal(sim.readItem(0).active, false);
  });

  await t.test('food pickup heals but never exceeds max health', async () => {
    const sim = await createSim();
    sim.initPlayer(100, 100, 10, 5, 200);
    sim.initEnemies(0);
    sim.views.i32[(0 + 8) >> 2] = 5;
    sim.setItem(0, { posX: 100, posY: 100, type: ITEM_TYPE_FOOD, active: true });

    const result = sim.simulate(0, 0, 0, 0, 0);

    assert.equal(result.healthDelta, 1);
    assert.equal(sim.readPlayer().health, 6);
  });

  await t.test('scroll pickup increases player damage deterministically', async () => {
    const sim = await createSim();
    sim.initPlayer(100, 100, 10, 5, 200);
    sim.initEnemies(0);
    sim.setItem(0, { posX: 100, posY: 100, type: ITEM_TYPE_SCROLL, active: true });

    const result = sim.simulate(0, 0, 0, 0, 0);

    assert.equal(result.damageDelta, 5);
    assert.equal(sim.readPlayer().damage, 10);
  });
});

test('enemy contact damage respects cooldown windows across frames', async () => {
  const sim = await createSim();
  sim.initPlayer(100, 100, 10, 5, 200);
  sim.writeEnemyStaging(0, makeEnemy({ posX: 100, posY: 100, damage: 3 }));
  sim.initEnemies(1);

  const first = sim.simulate(0, 0, 0, 0, 1000);
  const second = sim.simulate(0, 0, 0, 0, 1100);
  const third = sim.simulate(0, 0, 0, 0, 1301);

  assert.equal(first.eventFlags & EVT_DAMAGE, EVT_DAMAGE);
  assert.equal(sim.readPlayer().health, 4);
  assert.equal(second.eventFlags & EVT_DAMAGE, 0);
  assert.equal(third.eventFlags & EVT_DAMAGE, EVT_DAMAGE);
});

test('firing is ignored when projectile pool is exhausted', async () => {
  const sim = await createSim();
  sim.initPlayer(100, 100, 10, 5, 200);
  sim.initEnemies(0);

  for (let i = 0; i < MAX_PROJECTILES; i++) {
    sim.setProjectile(i, { posX: 100, posY: 100, dirX: 1, dirY: 0, speed: 320, active: true });
  }

  sim.simulate(INPUT_FIRED, 200, 100, 0, 300);

  assert.equal(sim.activeProjectileCount(), MAX_PROJECTILES);
  assert.equal(sim.readPlayer().throwCount, 0);
});

test('multi-seed soak run preserves core simulation invariants', async () => {
  const seeds = [1, 7, 42, 1337, 0xC0FFEE];

  for (const seed of seeds) {
    const sim = await createSim();
    sim.seed(seed);
    sim.initPlayer(380, 220, 25, 10, 200);

    for (let i = 0; i < 12; i++) {
      sim.writeEnemyStaging(i, makeEnemy({
        posX: 120 + (i % 4) * 80,
        posY: 90 + Math.floor(i / 4) * 60,
        speedX: i % 2 === 0 ? 1.5 : -1.5,
        speedY: i % 3 === 0 ? 1.0 : -1.0,
        health: 20,
        maxHealth: 20,
        damage: 1,
      }));
    }
    sim.initEnemies(12);

    let now = 0;
    for (let frame = 0; frame < SIM_FRAMES; frame++) {
      now += 16.6667;
      const input =
        (frame % 120 < 60 ? 0x04 : 0x08) |
        (frame % 18 === 0 ? INPUT_FIRED : 0);

      sim.simulate(input, 700, 220, 1 / 60, now);

      for (let i = 0; i < 12; i++) {
        const enemy = sim.readEnemy(i);
        if (enemy.onDeath && !enemy.deathDone) {
          sim.advanceDeathFrame(i);
        }
      }

      const player = sim.readPlayer();
      assert.ok(player.health >= 0, `seed ${seed}: player health below zero`);
      assert.ok(player.health <= player.maxHealth, `seed ${seed}: player health exceeds max`);
      assert.ok(player.points >= 0, `seed ${seed}: negative score`);
      assert.ok(player.killCount >= 0, `seed ${seed}: negative kill count`);
      assert.ok(sim.activeProjectileCount() <= MAX_PROJECTILES, `seed ${seed}: projectile pool overflow`);
    }

    const player = sim.readPlayer();
    assert.ok(player.throwCount >= 0, `seed ${seed}: negative throw count`);
    assert.ok(sim.aliveEnemyCount() >= 0, `seed ${seed}: negative enemy count`);
  }
});
