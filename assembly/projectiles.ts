import {
  MAX_PROJECTILES,
  PF_POS_X, PF_POS_Y, PF_DIR_X, PF_DIR_Y, PF_SPEED, PF_ACTIVE,
  PLAYER_POS_X, PLAYER_POS_Y, PLAYER_THROW_COUNT,
  INPUT_FIRED,
  isProjAlive,
  projAddr,
} from './memory';

const ARENA_LEFT:   f32 = 35.0;
const ARENA_RIGHT:  f32 = 727.0;
const ARENA_TOP:    f32 = 50.0;
const ARENA_BOTTOM: f32 = 440.0;

const BULLET_SPEED:  i32 = 320;   // px/s
const FIRE_DELAY_MS: f32 = 300.0; // min ms between shots

let lastFireTime: f32 = 0.0;

// ── Public API ────────────────────────────────────────────────────────────────

export function updateProjectiles(dt: f32): void {
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    const base = projAddr(i);
    if (!isProjAlive(base)) continue;

    const spd = f32(load<i32>(base + PF_SPEED)) * dt;
    const nx  = load<f32>(base + PF_POS_X) + load<f32>(base + PF_DIR_X) * spd;
    const ny  = load<f32>(base + PF_POS_Y) + load<f32>(base + PF_DIR_Y) * spd;

    if (isOutOfArena(nx, ny)) {
      store<u8>(base + PF_ACTIVE, 0);
    } else {
      store<f32>(base + PF_POS_X, nx);
      store<f32>(base + PF_POS_Y, ny);
    }
  }
}

export function tryFireProjectile(inputFlags: i32, mouseX: f32, mouseY: f32, now: f32): void {
  if (!(inputFlags & INPUT_FIRED)) return;
  if (now - lastFireTime < FIRE_DELAY_MS) return;

  const px  = load<f32>(PLAYER_POS_X);
  const py  = load<f32>(PLAYER_POS_Y);
  const len = normalizeDirection(mouseX - px, mouseY - py);
  if (len < 0.01) return; // cursor exactly on player — skip to avoid NaN

  const dx = (mouseX - px) / len;
  const dy = (mouseY - py) / len;

  const slot = findFreeSlot();
  if (slot < 0) return; // pool exhausted

  const base = projAddr(slot);
  store<f32>(base + PF_POS_X, px);
  store<f32>(base + PF_POS_Y, py);
  store<f32>(base + PF_DIR_X, dx);
  store<f32>(base + PF_DIR_Y, dy);
  store<i32>(base + PF_SPEED, BULLET_SPEED);
  store<u8> (base + PF_ACTIVE, 1);

  store<i32>(PLAYER_THROW_COUNT, load<i32>(PLAYER_THROW_COUNT) + 1);
  lastFireTime = now;
}

export function resetProjectiles(): void {
  lastFireTime = 0.0;
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    store<u8>(projAddr(i) + PF_ACTIVE, 0);
  }
}

export function getActiveProjectileCount(): i32 {
  let n: i32 = 0;
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (isProjAlive(projAddr(i))) n++;
  }
  return n;
}

// ── Private helpers ───────────────────────────────────────────────────────────

@inline
function isOutOfArena(x: f32, y: f32): bool {
  return x < ARENA_LEFT || x > ARENA_RIGHT || y < ARENA_TOP || y > ARENA_BOTTOM;
}

@inline
function normalizeDirection(dx: f32, dy: f32): f32 {
  return Mathf.sqrt(dx * dx + dy * dy);
}

function findFreeSlot(): i32 {
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (!isProjAlive(projAddr(i))) return i;
  }
  return -1;
}
