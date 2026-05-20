import { ProjectileEntity } from '../entities/ProjectileEntity';
import { PlayerEntity } from '../entities/PlayerEntity';
import { AssetStore } from '../assets/AssetStore';
import { InputManager } from '../input/InputManager';
import { Vector2 } from '../math/Vector2';
import {
  BULLET_SPEED, BULLET_FIRE_DELAY_MS,
  BULLET_BOUNDS_LEFT, BULLET_BOUNDS_RIGHT,
  BULLET_BOUNDS_TOP, BULLET_BOUNDS_BOTTOM,
  SPRITE_PLAYER_BULLET,
} from '../core/GameConfig';

let lastFireTime = 0;

export function tryFireProjectile(
  player: PlayerEntity,
  input: InputManager,
  assets: AssetStore,
  projectiles: ProjectileEntity[],
  now: number,
  fired: boolean,
): void {
  if (!fired) return;
  if (now - lastFireTime < BULLET_FIRE_DELAY_MS) return;

  const direction = input.getAimDirection(player.position);
  if (direction.length() < 0.01) return;

  projectiles.push(new ProjectileEntity(
    player.position,
    direction,
    BULLET_SPEED,
    SPRITE_PLAYER_BULLET.x,
    SPRITE_PLAYER_BULLET.y,
    SPRITE_PLAYER_BULLET.w,
    SPRITE_PLAYER_BULLET.h,
  ));

  player.throwCount++;
  lastFireTime = now;

  void assets;
}

export function updateProjectiles(projectiles: ProjectileEntity[], dt: number): void {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]!;
    const delta = p.direction.scale(p.speed * dt);
    p.position = p.position.add(delta);

    if (isOutOfBounds(p.position)) {
      projectiles.splice(i, 1);
    }
  }
}

function isOutOfBounds(pos: Vector2): boolean {
  return (
    pos.x < BULLET_BOUNDS_LEFT ||
    pos.x > BULLET_BOUNDS_RIGHT ||
    pos.y < BULLET_BOUNDS_TOP ||
    pos.y > BULLET_BOUNDS_BOTTOM
  );
}
