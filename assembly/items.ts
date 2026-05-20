import {
  MAX_ITEMS,
  IF_POS_X, IF_POS_Y, IF_TYPE, IF_ACTIVE,
  PLAYER_POS_X, PLAYER_POS_Y,
  PLAYER_POINTS, PLAYER_HEALTH, PLAYER_MAX_HEALTH, PLAYER_DAMAGE,
  RESULT_EVENT_FLAGS, RESULT_POINTS_DELTA, RESULT_HEALTH_DELTA, RESULT_DAMAGE_DELTA,
  EVT_ITEM_PICKED,
  itemAddr,
} from './memory';
import { testAABB } from './collision';

const ITEM_COIN:   u8 = 0;
const ITEM_FOOD:   u8 = 1;
const ITEM_SCROLL: u8 = 2;

const PLAYER_PICKUP_W: f32 = 32.0;
const PLAYER_PICKUP_H: f32 = 32.0;
const ITEM_W:          f32 = 26.0;
const ITEM_H:          f32 = 26.0;

const COIN_POINTS:     i32 = 10;
const FOOD_HEAL_RATIO: f32 = 0.16; // restores 16% of max HP, capped at max
const SCROLL_DAMAGE:   i32 = 5;

export function updateItems(): void {
  const playerX: f32 = load<f32>(PLAYER_POS_X);
  const playerY: f32 = load<f32>(PLAYER_POS_Y);

  for (let i = 0; i < MAX_ITEMS; i++) {
    const base = itemAddr(i);
    if (load<u8>(base + IF_ACTIVE) == 0) continue;

    if (!testAABB(playerX, playerY, PLAYER_PICKUP_W, PLAYER_PICKUP_H,
                  load<f32>(base + IF_POS_X), load<f32>(base + IF_POS_Y), ITEM_W, ITEM_H)) continue;

    store<u8> (base + IF_ACTIVE, 0);
    store<i32>(RESULT_EVENT_FLAGS, load<i32>(RESULT_EVENT_FLAGS) | EVT_ITEM_PICKED);

    const itemType: u8 = load<u8>(base + IF_TYPE);

    if (itemType == ITEM_COIN) {
      store<i32>(PLAYER_POINTS,       load<i32>(PLAYER_POINTS)       + COIN_POINTS);
      store<i32>(RESULT_POINTS_DELTA, load<i32>(RESULT_POINTS_DELTA) + COIN_POINTS);

    } else if (itemType == ITEM_FOOD) {
      const maxHp:   i32 = load<i32>(PLAYER_MAX_HEALTH);
      const curHp:   i32 = load<i32>(PLAYER_HEALTH);
      const newHp:   i32 = min(curHp + i32(f32(maxHp) * FOOD_HEAL_RATIO), maxHp);
      store<i32>(PLAYER_HEALTH,       newHp);
      store<i32>(RESULT_HEALTH_DELTA, load<i32>(RESULT_HEALTH_DELTA) + (newHp - curHp));

    } else { // ITEM_SCROLL
      store<i32>(PLAYER_DAMAGE,       load<i32>(PLAYER_DAMAGE)       + SCROLL_DAMAGE);
      store<i32>(RESULT_DAMAGE_DELTA, load<i32>(RESULT_DAMAGE_DELTA) + SCROLL_DAMAGE);
    }
  }
}

export function getActiveItemCount(): i32 {
  let count: i32 = 0;
  for (let i = 0; i < MAX_ITEMS; i++) {
    if (load<u8>(itemAddr(i) + IF_ACTIVE) != 0) count++;
  }
  return count;
}
