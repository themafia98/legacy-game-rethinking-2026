import { readFile } from 'node:fs/promises';

const WASM_PAGE_SIZE = 64 * 1024;
const MIN_MEMORY_BYTES = WASM_PAGE_SIZE;

const PLAYER_BASE = 0;
const ENEMY_BASE = 64;
const ENEMY_STRIDE = 80;
const PROJ_BASE = 5184;
const PROJ_STRIDE = 32;
const ITEM_BASE = 7232;
const ITEM_STRIDE = 16;
const RESULT_BASE = 11328;
const STAGING_BASE = 11392;

export const MAX_ENEMIES = 64;
export const MAX_PROJECTILES = 64;
export const MAX_ITEMS = 256;

export const INPUT_UP = 0x01;
export const INPUT_DOWN = 0x02;
export const INPUT_LEFT = 0x04;
export const INPUT_RIGHT = 0x08;
export const INPUT_FIRED = 0x10;

export const EVT_DAMAGE = 0x01;
export const EVT_ENEMY_DIED = 0x02;
export const EVT_ITEM_PICKED = 0x04;
export const EVT_PLAYER_DEAD = 0x08;

export const ITEM_TYPE_COIN = 0;
export const ITEM_TYPE_FOOD = 1;
export const ITEM_TYPE_SCROLL = 2;

export const ENEMY_TYPE_COMMON = 0;
export const ENEMY_TYPE_BOSS = 1;
export const ENEMY_TYPE_BOSS_EXTRA = 2;

function enemyBase(index) {
  return ENEMY_BASE + index * ENEMY_STRIDE;
}

function projectileBase(index) {
  return PROJ_BASE + index * PROJ_STRIDE;
}

function itemBase(index) {
  return ITEM_BASE + index * ITEM_STRIDE;
}

export async function createSim() {
  const wasmBytes = await readFile(new URL('../public/game.wasm', import.meta.url));
  const { instance } = await WebAssembly.instantiate(wasmBytes, {
    env: {
      abort(_msg, _file, line, col) {
        throw new Error(`WASM abort at ${line}:${col}`);
      },
    },
  });

  const memory = instance.exports.memory;
  if (memory.buffer.byteLength < MIN_MEMORY_BYTES) {
    memory.grow(Math.ceil((MIN_MEMORY_BYTES - memory.buffer.byteLength) / WASM_PAGE_SIZE));
  }

  const views = {
    f32: new Float32Array(memory.buffer),
    i32: new Int32Array(memory.buffer),
    u8: new Uint8Array(memory.buffer),
  };

  return {
    exports: instance.exports,
    memory,
    views,
    seed(seed) {
      instance.exports.seedRng(seed >>> 0);
    },
    initPlayer(posX, posY, health, damage, speed) {
      instance.exports.initPlayer(posX, posY, health, damage, speed);
    },
    initEnemies(count) {
      instance.exports.initEnemies(count);
    },
    simulate(inputFlags, mouseX, mouseY, dt, now) {
      instance.exports.simulate(inputFlags, mouseX, mouseY, dt, now);
      return this.readResult();
    },
    advanceDeathFrame(index) {
      instance.exports.advanceDeathFrame(index);
    },
    readPlayer() {
      return {
        posX: views.f32[(PLAYER_BASE + 0) >> 2],
        posY: views.f32[(PLAYER_BASE + 4) >> 2],
        health: views.i32[(PLAYER_BASE + 8) >> 2],
        maxHealth: views.i32[(PLAYER_BASE + 12) >> 2],
        damage: views.i32[(PLAYER_BASE + 16) >> 2],
        speed: views.i32[(PLAYER_BASE + 20) >> 2],
        points: views.i32[(PLAYER_BASE + 24) >> 2],
        killCount: views.i32[(PLAYER_BASE + 28) >> 2],
        throwCount: views.i32[(PLAYER_BASE + 32) >> 2],
        alive: views.u8[PLAYER_BASE + 36] !== 0,
      };
    },
    readEnemy(index) {
      const base = enemyBase(index);
      return {
        posX: views.f32[(base + 0) >> 2],
        posY: views.f32[(base + 4) >> 2],
        speedX: views.f32[(base + 8) >> 2],
        speedY: views.f32[(base + 12) >> 2],
        health: views.i32[(base + 16) >> 2],
        maxHealth: views.i32[(base + 20) >> 2],
        damage: views.i32[(base + 24) >> 2],
        type: views.u8[base + 28],
        alive: views.u8[base + 29] !== 0,
        onDeath: views.u8[base + 30] !== 0,
        deathDone: views.u8[base + 31] !== 0,
        projActive: views.u8[base + 48] !== 0,
        frameIndex: views.i32[(base + 60) >> 2],
      };
    },
    readProjectile(index) {
      const base = projectileBase(index);
      return {
        posX: views.f32[(base + 0) >> 2],
        posY: views.f32[(base + 4) >> 2],
        dirX: views.f32[(base + 8) >> 2],
        dirY: views.f32[(base + 12) >> 2],
        speed: views.i32[(base + 16) >> 2],
        active: views.u8[base + 20] !== 0,
      };
    },
    readItem(index) {
      const base = itemBase(index);
      return {
        posX: views.f32[(base + 0) >> 2],
        posY: views.f32[(base + 4) >> 2],
        type: views.u8[base + 8],
        active: views.u8[base + 9] !== 0,
      };
    },
    readResult() {
      return {
        eventFlags: views.i32[(RESULT_BASE + 0) >> 2],
        pointsDelta: views.i32[(RESULT_BASE + 4) >> 2],
        healthDelta: views.i32[(RESULT_BASE + 8) >> 2],
        damageDelta: views.i32[(RESULT_BASE + 12) >> 2],
        killsDelta: views.i32[(RESULT_BASE + 16) >> 2],
      };
    },
    writeEnemyStaging(index, enemy) {
      const base = STAGING_BASE + index * ENEMY_STRIDE;
      views.f32[(base + 0) >> 2] = enemy.posX;
      views.f32[(base + 4) >> 2] = enemy.posY;
      views.f32[(base + 8) >> 2] = enemy.speedX;
      views.f32[(base + 12) >> 2] = enemy.speedY;
      views.i32[(base + 16) >> 2] = enemy.health;
      views.i32[(base + 20) >> 2] = enemy.maxHealth;
      views.i32[(base + 24) >> 2] = enemy.damage;
      views.u8[base + 28] = enemy.type;
    },
    setProjectile(index, projectile) {
      const base = projectileBase(index);
      views.f32[(base + 0) >> 2] = projectile.posX;
      views.f32[(base + 4) >> 2] = projectile.posY;
      views.f32[(base + 8) >> 2] = projectile.dirX;
      views.f32[(base + 12) >> 2] = projectile.dirY;
      views.i32[(base + 16) >> 2] = projectile.speed;
      views.u8[base + 20] = projectile.active ? 1 : 0;
    },
    setItem(index, item) {
      const base = itemBase(index);
      views.f32[(base + 0) >> 2] = item.posX;
      views.f32[(base + 4) >> 2] = item.posY;
      views.u8[base + 8] = item.type;
      views.u8[base + 9] = item.active ? 1 : 0;
    },
    activeProjectileCount() {
      return Number(instance.exports.getActiveProjectileCount());
    },
    activeItemCount() {
      return Number(instance.exports.getActiveItemCount());
    },
    aliveEnemyCount() {
      return Number(instance.exports.getAliveEnemyCount());
    },
  };
}
