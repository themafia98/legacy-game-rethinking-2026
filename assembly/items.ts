import {
  MAX_ITEMS,
  IF_POS_X, IF_POS_Y, IF_TYPE, IF_ACTIVE,
  PLAYER_POS_X, PLAYER_POS_Y,
  PLAYER_POINTS, PLAYER_HEALTH, PLAYER_MAX_HEALTH, PLAYER_DAMAGE,
  RESULT_POINTS_DELTA, RESULT_HEALTH_DELTA, RESULT_DAMAGE_DELTA,
  ITEM_COIN, ITEM_FOOD, ITEM_SCROLL,
  HITBOX_PLAYER_W, HITBOX_PLAYER_H, HITBOX_ITEM_W, HITBOX_ITEM_H,
  EVT_ITEM_PICKED,
  isItemAlive, emitEvent,
  itemAddr,
} from './memory';
import { testAABB } from './collision';

const COIN_POINTS:     i32 = 10;
const FOOD_HEAL_RATIO: f32 = 0.16; // restores 16% of max HP, capped at max
const SCROLL_DAMAGE:   i32 = 5;

// ── Public API ────────────────────────────────────────────────────────────────

export function updateItems(): void {
  const playerX = load<f32>(PLAYER_POS_X);
  const playerY = load<f32>(PLAYER_POS_Y);

  for (let i = 0; i < MAX_ITEMS; i++) {
    const base = itemAddr(i);
    if (!isItemAlive(base)) continue;

    if (!testAABB(playerX, playerY, HITBOX_PLAYER_W, HITBOX_PLAYER_H,
                  load<f32>(base + IF_POS_X), load<f32>(base + IF_POS_Y),
                  HITBOX_ITEM_W, HITBOX_ITEM_H)) continue;

    store<u8>(base + IF_ACTIVE, 0);
    emitEvent(EVT_ITEM_PICKED);
    applyEffect(load<u8>(base + IF_TYPE));
  }
}

export function getActiveItemCount(): i32 {
  let n: i32 = 0;
  for (let i = 0; i < MAX_ITEMS; i++) {
    if (isItemAlive(itemAddr(i))) n++;
  }
  return n;
}

// ── Private helpers — one function per item type (SRP) ────────────────────────

function applyEffect(type: u8): void {
  if (type == ITEM_COIN)   { applyCoin();   return; }
  if (type == ITEM_FOOD)   { applyFood();   return; }
  if (type == ITEM_SCROLL) { applyScroll(); return; }
}

function applyCoin(): void {
  store<i32>(PLAYER_POINTS,       load<i32>(PLAYER_POINTS)       + COIN_POINTS);
  store<i32>(RESULT_POINTS_DELTA, load<i32>(RESULT_POINTS_DELTA) + COIN_POINTS);
}

function applyFood(): void {
  const maxHp = load<i32>(PLAYER_MAX_HEALTH);
  const curHp = load<i32>(PLAYER_HEALTH);
  const newHp = min(curHp + i32(f32(maxHp) * FOOD_HEAL_RATIO), maxHp);
  store<i32>(PLAYER_HEALTH,       newHp);
  store<i32>(RESULT_HEALTH_DELTA, load<i32>(RESULT_HEALTH_DELTA) + (newHp - curHp));
}

function applyScroll(): void {
  store<i32>(PLAYER_DAMAGE,       load<i32>(PLAYER_DAMAGE)       + SCROLL_DAMAGE);
  store<i32>(RESULT_DAMAGE_DELTA, load<i32>(RESULT_DAMAGE_DELTA) + SCROLL_DAMAGE);
}
