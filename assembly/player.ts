import {
  PLAYER_POS_X, PLAYER_POS_Y,
  PLAYER_HEALTH, PLAYER_ALIVE, PLAYER_SPEED,
  INPUT_UP, INPUT_DOWN, INPUT_LEFT, INPUT_RIGHT,
} from './memory';

// Arena walkable bounds — match the visible floor in the arena sprite.
const ARENA_LEFT:   f32 = 35.0;
const ARENA_RIGHT:  f32 = 727.0;
const ARENA_TOP:    f32 = 55.0;
const ARENA_BOTTOM: f32 = 440.0;

export function updatePlayer(inputFlags: i32, dt: f32): void {
  if (load<u8>(PLAYER_ALIVE) == 0) return;
  if (load<i32>(PLAYER_HEALTH) <= 0) {
    store<u8>(PLAYER_ALIVE, 0);
    return;
  }

  const spd: f32 = f32(load<i32>(PLAYER_SPEED)) * dt;
  let x: f32 = load<f32>(PLAYER_POS_X);
  let y: f32 = load<f32>(PLAYER_POS_Y);

  if (inputFlags & INPUT_RIGHT) x += spd;
  if (inputFlags & INPUT_LEFT)  x -= spd;
  if (inputFlags & INPUT_DOWN)  y += spd;
  if (inputFlags & INPUT_UP)    y -= spd;

  store<f32>(PLAYER_POS_X, x < ARENA_LEFT  ? ARENA_LEFT  : x > ARENA_RIGHT  ? ARENA_RIGHT  : x);
  store<f32>(PLAYER_POS_Y, y < ARENA_TOP   ? ARENA_TOP   : y > ARENA_BOTTOM ? ARENA_BOTTOM : y);
}
