import { ItemEntity } from '../entities/ItemEntity';
import { PlayerEntity } from '../entities/PlayerEntity';
import { testAABB } from './CollisionSystem';
import { AudioManager } from '../audio/AudioManager';
import { SoundId } from '../types/AssetTypes';
import {
  COLLISION_BOX_ITEM, COLLISION_BOX_PLAYER, COLLISION_BOX_UPGRADE,
  ITEM_COIN_POINTS, ITEM_HEALTH_RESTORE_RATIO, ITEM_DAMAGE_UPGRADE,
} from '../core/GameConfig';

export function updateItems(
  coins: ItemEntity[],
  food: ItemEntity[],
  scrolls: ItemEntity[],
  player: PlayerEntity,
  audio: AudioManager,
): void {
  collectItems(coins, player, COLLISION_BOX_ITEM, (p) => {
    p.points += ITEM_COIN_POINTS;
    audio.play(SoundId.Money, false, 0.8);
  });

  collectItems(food, player, COLLISION_BOX_ITEM, (p) => {
    const restored = Math.floor(p.maxHealth * ITEM_HEALTH_RESTORE_RATIO);
    if (p.health < p.maxHealth && p.health + restored <= p.maxHealth) {
      p.health += restored;
      audio.play(SoundId.Eat, false, 0.8);
    }
  });

  collectItems(scrolls, player, COLLISION_BOX_UPGRADE, (p) => {
    p.damage += ITEM_DAMAGE_UPGRADE;
    audio.play(SoundId.LevelUp, false, 0.8);
  });
}

function collectItems(
  items: ItemEntity[],
  player: PlayerEntity,
  itemSize: [number, number],
  onCollect: (player: PlayerEntity) => void,
): void {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]!;
    if (!item.active) {
      items.splice(i, 1);
      continue;
    }

    const hit = testAABB(
      { position: player.position, size: COLLISION_BOX_PLAYER },
      { position: item.position, size: itemSize },
    );

    if (hit) {
      onCollect(player);
      items.splice(i, 1);
    }
  }
}
