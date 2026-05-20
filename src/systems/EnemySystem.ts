import { EnemyEntity } from '../entities/EnemyEntity';
import { PlayerEntity } from '../entities/PlayerEntity';
import { Vector2 } from '../math/Vector2';
import { EnemyType } from '../types/EntityTypes';
import { testAABB } from './CollisionSystem';
import { AudioManager } from '../audio/AudioManager';
import { SoundId } from '../types/AssetTypes';
import {
  ENEMY_BOUNDS_LEFT, ENEMY_BOUNDS_RIGHT,
  ENEMY_BOUNDS_TOP, ENEMY_BOUNDS_BOTTOM,
  ENEMY_PROJECTILE_SPEED, ENEMY_PROJECTILE_UPDATE_DELAY_MS,
  ENEMY_PROJECTILE_BOUNDS_LEFT, ENEMY_PROJECTILE_BOUNDS_RIGHT,
  ENEMY_PROJECTILE_BOUNDS_TOP, ENEMY_PROJECTILE_BOUNDS_BOTTOM,
  COLLISION_BOX_ENEMY, COLLISION_BOX_PLAYER,
  SPRITE_ENEMY_BULLET_COMMON, SPRITE_ENEMY_BULLET_BOSS, SPRITE_ENEMY_BULLET_BOSS_EXTRA,
  SPRITE_BOSS_LEFT, SPRITE_BOSS_RIGHT, SPRITE_BOSS_UP, SPRITE_BOSS_DOWN,
  DAMAGE_SOUND_COOLDOWN_MS,
  RANDOM_SIGN_VALUES,
} from '../core/GameConfig';

function randomSign(): number {
  return RANDOM_SIGN_VALUES[Math.floor(Math.random() * RANDOM_SIGN_VALUES.length)]!;
}

let lastProjectileUpdateTime = 0;
let lastDamageSoundTime = 0;

export function updateEnemies(
  enemies: EnemyEntity[],
  player: PlayerEntity,
  audio: AudioManager,
  now: number,
): void {
  if (now - lastProjectileUpdateTime < ENEMY_PROJECTILE_UPDATE_DELAY_MS) return;
  lastProjectileUpdateTime = now;

  for (const enemy of enemies) {
    if (!enemy.isAlive() || enemy.onDeath) continue;

    bounceEnemy(enemy);
    enemy.position = new Vector2(
      enemy.position.x + enemy.speedX,
      enemy.position.y + enemy.speedY,
    );

    updateEnemyProjectile(enemy);
    checkEnemyProjectileHitsPlayer(enemy, player, audio, now);
    checkEnemyBodyHitsPlayer(enemy, player, audio, now);
  }
}

function bounceEnemy(enemy: EnemyEntity): void {
  if (enemy.position.x > ENEMY_BOUNDS_RIGHT) {
    enemy.speedX *= -1;
    setSpriteForDirection(enemy, 'right');
  }
  if (enemy.position.x < ENEMY_BOUNDS_LEFT) {
    enemy.speedX *= -1;
    setSpriteForDirection(enemy, 'left');
  }
  if (enemy.position.y < ENEMY_BOUNDS_TOP) {
    enemy.speedY *= -1;
    setSpriteForDirection(enemy, 'up');
  }
  if (enemy.position.y > ENEMY_BOUNDS_BOTTOM) {
    enemy.speedY *= -1;
    setSpriteForDirection(enemy, 'down');
  }
}

function setSpriteForDirection(enemy: EnemyEntity, dir: 'left' | 'right' | 'up' | 'down'): void {
  if (enemy.type !== EnemyType.Boss && enemy.type !== EnemyType.BossExtra) return;

  switch (dir) {
    case 'right': enemy.sprite.sheetX = SPRITE_BOSS_RIGHT.x; break;
    case 'left':  enemy.sprite.sheetX = SPRITE_BOSS_LEFT.x;  break;
    case 'up':    enemy.sprite.sheetX = SPRITE_BOSS_UP.x;    break;
    case 'down':  enemy.sprite.sheetX = SPRITE_BOSS_DOWN.x;  break;
  }
}

function updateEnemyProjectile(enemy: EnemyEntity): void {
  if (enemy.projectiles.length === 0) {
    const bulletData = getBulletSprite(enemy.type);
    enemy.projectiles.push(bulletData);
    enemy.projectileSpeedX = ENEMY_PROJECTILE_SPEED * randomSign();
    enemy.projectileSpeedY = ENEMY_PROJECTILE_SPEED;
    enemy.projectilePosition = enemy.position;
  }

  const pos = enemy.projectilePosition;
  const outOfBounds =
    pos.x <= ENEMY_PROJECTILE_BOUNDS_LEFT ||
    pos.x > ENEMY_PROJECTILE_BOUNDS_RIGHT ||
    pos.y < ENEMY_PROJECTILE_BOUNDS_TOP ||
    pos.y > ENEMY_PROJECTILE_BOUNDS_BOTTOM;

  if (outOfBounds) {
    enemy.projectiles.splice(0, 1);
    enemy.projectilePosition = enemy.position;
    return;
  }

  enemy.projectilePosition = new Vector2(
    pos.x + enemy.projectileSpeedX * 0.016,
    pos.y + enemy.projectileSpeedY * 0.016,
  );
  enemy.projectileActive = true;
}

function checkEnemyProjectileHitsPlayer(
  enemy: EnemyEntity,
  player: PlayerEntity,
  audio: AudioManager,
  now: number,
): void {
  const hit = testAABB(
    { position: enemy.projectilePosition, size: [30, 30] },
    { position: player.position, size: COLLISION_BOX_PLAYER },
  );

  if (!hit || !player.isAlive()) return;

  if (now - lastDamageSoundTime > audio.getDuration(SoundId.Damage) * 1000) {
    audio.play(SoundId.Damage, false, 0.8);
    lastDamageSoundTime = now;
  }

  player.health = Math.max(0, player.health - 1);
}

function checkEnemyBodyHitsPlayer(
  enemy: EnemyEntity,
  player: PlayerEntity,
  audio: AudioManager,
  now: number,
): void {
  const hit = testAABB(
    { position: enemy.position, size: COLLISION_BOX_ENEMY },
    { position: player.position, size: COLLISION_BOX_PLAYER },
  );

  if (!hit || !player.isAlive()) return;

  if (now - lastDamageSoundTime > DAMAGE_SOUND_COOLDOWN_MS) {
    audio.play(SoundId.Damage, false, 0.8);
    lastDamageSoundTime = now;
  }

  player.health = Math.max(0, player.health - 1);
}

function getBulletSprite(type: EnemyType): { sheetX: number; sheetY: number; width: number; height: number } {
  switch (type) {
    case EnemyType.Boss:      return { sheetX: SPRITE_ENEMY_BULLET_BOSS.x, sheetY: SPRITE_ENEMY_BULLET_BOSS.y, width: 30, height: 30 };
    case EnemyType.BossExtra: return { sheetX: SPRITE_ENEMY_BULLET_BOSS_EXTRA.x, sheetY: SPRITE_ENEMY_BULLET_BOSS_EXTRA.y, width: 30, height: 30 };
    default:                  return { sheetX: SPRITE_ENEMY_BULLET_COMMON.x, sheetY: SPRITE_ENEMY_BULLET_COMMON.y, width: 30, height: 30 };
  }
}
