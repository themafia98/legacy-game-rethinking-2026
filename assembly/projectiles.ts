import {
  MAX_PROJECTILES,
  PF_POS_X, PF_POS_Y, PF_DIR_X, PF_DIR_Y, PF_SPEED, PF_ACTIVE,
  PLAYER_POS_X, PLAYER_POS_Y, PLAYER_THROW_COUNT,
  INPUT_FIRED,
  projAddr,
} from './memory';

const BULLET_LEFT:   f32 = 35.0;
const BULLET_RIGHT:  f32 = 727.0;
const BULLET_TOP:    f32 = 50.0;
const BULLET_BOTTOM: f32 = 440.0;

const BULLET_SPEED:  i32 = 320;   // px/s
const FIRE_DELAY_MS: f32 = 300.0; // min ms between shots

let lastFireTime: f32 = 0.0;

export function updateProjectiles(dt: f32): void {
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    const base = projAddr(i);
    if (load<u8>(base + PF_ACTIVE) == 0) continue;

    const spd: f32 = f32(load<i32>(base + PF_SPEED)) * dt;
    const nx: f32  = load<f32>(base + PF_POS_X) + load<f32>(base + PF_DIR_X) * spd;
    const ny: f32  = load<f32>(base + PF_POS_Y) + load<f32>(base + PF_DIR_Y) * spd;

    if (nx < BULLET_LEFT || nx > BULLET_RIGHT || ny < BULLET_TOP || ny > BULLET_BOTTOM) {
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

  const px: f32 = load<f32>(PLAYER_POS_X);
  const py: f32 = load<f32>(PLAYER_POS_Y);
  let dx: f32 = mouseX - px;
  let dy: f32 = mouseY - py;
  const len: f32 = Mathf.sqrt(dx * dx + dy * dy);
  if (len < 0.01) return;
  dx /= len;
  dy /= len;

  for (let i = 0; i < MAX_PROJECTILES; i++) {
    const base = projAddr(i);
    if (load<u8>(base + PF_ACTIVE) != 0) continue;

    store<f32>(base + PF_POS_X, px);
    store<f32>(base + PF_POS_Y, py);
    store<f32>(base + PF_DIR_X, dx);
    store<f32>(base + PF_DIR_Y, dy);
    store<i32>(base + PF_SPEED, BULLET_SPEED);
    store<u8> (base + PF_ACTIVE, 1);

    store<i32>(PLAYER_THROW_COUNT, load<i32>(PLAYER_THROW_COUNT) + 1);
    lastFireTime = now;
    return;
  }
}

export function resetProjectiles(): void {
  lastFireTime = 0.0;
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    store<u8>(projAddr(i) + PF_ACTIVE, 0);
  }
}

export function getActiveProjectileCount(): i32 {
  let count: i32 = 0;
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (load<u8>(projAddr(i) + PF_ACTIVE) != 0) count++;
  }
  return count;
}
