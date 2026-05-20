import { PlayerEntity } from '../entities/PlayerEntity';
import { EnemyEntity } from '../entities/EnemyEntity';
import { ProjectileEntity } from '../entities/ProjectileEntity';
import { ItemEntity } from '../entities/ItemEntity';
import { ItemType, EnemyType } from '../types/EntityTypes';
import { testAABB } from './CollisionSystem';
import { AudioManager } from '../audio/AudioManager';
import { SoundId } from '../types/AssetTypes';
import {
  COLLISION_BOX_BULLET, COLLISION_BOX_ENEMY,
  ENEMY_DEATH_POINTS,
  ITEM_DROP_CHANCE, ITEM_COIN_CHANCE, ITEM_FOOD_CHANCE, ITEM_SCROLL_CHANCE,
  SPRITE_COIN, SPRITE_FOOD, SPRITE_SCROLL,
  SPRITE_BIRD_DEATH, SPRITE_BIRD_DEATH_FRAMES,
  SPRITE_BOSS_DEATH, SPRITE_BOSS_DEATH_FRAMES,
  SPRITE_BOSS_EXTRA_DEATH,
} from '../core/GameConfig';

export interface CombatEvent {
  type: 'playerDied' | 'enemyDied';
  enemy?: EnemyEntity;
}

export function resolveProjectileVsEnemies(
  projectiles: ProjectileEntity[],
  enemies: EnemyEntity[],
  player: PlayerEntity,
): void {
  for (let pi = projectiles.length - 1; pi >= 0; pi--) {
    const proj = projectiles[pi]!;

    for (const enemy of enemies) {
      if (!enemy.isAlive() || enemy.onDeath) continue;

      const hit = testAABB(
        { position: proj.position, size: COLLISION_BOX_BULLET },
        { position: enemy.position, size: COLLISION_BOX_ENEMY },
      );

      if (hit) {
        enemy.health -= player.damage;
        projectiles.splice(pi, 1);
        break;
      }
    }
  }
}

export function resolveEnemyDeaths(
  enemies: EnemyEntity[],
  player: PlayerEntity,
  items: { coins: ItemEntity[]; food: ItemEntity[]; scrolls: ItemEntity[] },
  audio: AudioManager,
): void {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i]!;

    if (enemy.health <= 0 && !enemy.onDeath) {
      triggerEnemyDeath(enemy, player, items, audio);
    }

    if (enemy.onDeath && enemy.sprite.onceDone) {
      enemies.splice(i, 1);
      player.points += ENEMY_DEATH_POINTS;
    }
  }
}

function triggerEnemyDeath(
  enemy: EnemyEntity,
  player: PlayerEntity,
  items: { coins: ItemEntity[]; food: ItemEntity[]; scrolls: ItemEntity[] },
  audio: AudioManager,
): void {
  enemy.onDeath = true;
  enemy.speedX = 0;
  enemy.speedY = 0;
  enemy.projectileActive = false;
  enemy.projectiles = [];

  setDeathSprite(enemy);

  audio.play(getSoundForEnemy(enemy.type), false, 1);
  player.killCount++;

  spawnDrops(enemy, player, items);
}

function setDeathSprite(enemy: EnemyEntity): void {
  enemy.sprite.playOnce = true;
  enemy.sprite.frameIndex = 0;
  enemy.sprite.animationSpeed = 10;

  switch (enemy.type) {
    case EnemyType.Common:
      enemy.sprite.sheetX = SPRITE_BIRD_DEATH.x;
      enemy.sprite.sheetY = SPRITE_BIRD_DEATH.y;
      enemy.sprite.frameWidth = SPRITE_BIRD_DEATH.w;
      enemy.sprite.frameHeight = SPRITE_BIRD_DEATH.h;
      enemy.sprite.frames = SPRITE_BIRD_DEATH_FRAMES;
      break;
    case EnemyType.Boss:
      enemy.sprite.sheetX = SPRITE_BOSS_DEATH.x;
      enemy.sprite.sheetY = SPRITE_BOSS_DEATH.y;
      enemy.sprite.frameWidth = SPRITE_BOSS_DEATH.w;
      enemy.sprite.frameHeight = SPRITE_BOSS_DEATH.h;
      enemy.sprite.frames = SPRITE_BOSS_DEATH_FRAMES;
      break;
    case EnemyType.BossExtra:
      enemy.sprite.sheetX = SPRITE_BOSS_EXTRA_DEATH.x;
      enemy.sprite.sheetY = SPRITE_BOSS_EXTRA_DEATH.y;
      enemy.sprite.frameWidth = SPRITE_BOSS_DEATH.w;
      enemy.sprite.frameHeight = SPRITE_BOSS_DEATH.h;
      enemy.sprite.frames = SPRITE_BOSS_DEATH_FRAMES;
      break;
  }
}

function getSoundForEnemy(type: EnemyType): SoundId {
  switch (type) {
    case EnemyType.Boss:      return SoundId.DeathBoss;
    case EnemyType.BossExtra: return SoundId.DeathBossExtra;
    default:                  return SoundId.DeathBat;
  }
}

function spawnDrops(
  enemy: EnemyEntity,
  player: PlayerEntity,
  items: { coins: ItemEntity[]; food: ItemEntity[]; scrolls: ItemEntity[] },
): void {
  const dropCoins = Math.random() < ITEM_DROP_CHANCE;

  if (dropCoins) {
    if (Math.random() < ITEM_COIN_CHANCE) {
      items.coins.push(new ItemEntity(
        ItemType.Coin,
        enemy.position,
        SPRITE_COIN.x, SPRITE_COIN.y,
        SPRITE_COIN.w, SPRITE_COIN.h,
      ));
    }
  } else {
    if (Math.random() < ITEM_FOOD_CHANCE) {
      items.food.push(new ItemEntity(
        ItemType.Food,
        enemy.position,
        SPRITE_FOOD.x, SPRITE_FOOD.y,
        SPRITE_FOOD.w, SPRITE_FOOD.h,
      ));
    }
  }

  if (Math.random() < ITEM_SCROLL_CHANCE) {
    items.scrolls.push(new ItemEntity(
      ItemType.Scroll,
      enemy.position,
      SPRITE_SCROLL.x, SPRITE_SCROLL.y,
      SPRITE_SCROLL.w, SPRITE_SCROLL.h,
    ));
  }

  void player;
}
