import { PlayerEntity } from '../entities/PlayerEntity';
import { InputManager } from '../input/InputManager';
import { Vector2 } from '../math/Vector2';
import {
  PLAYER_BOUNDS_LEFT, PLAYER_BOUNDS_RIGHT,
  PLAYER_BOUNDS_TOP, PLAYER_BOUNDS_BOTTOM,
  SPRITE_PLAYER_DOWN, SPRITE_PLAYER_RIGHT, SPRITE_PLAYER_LEFT,
  SPRITE_PLAYER_UP, SPRITE_PLAYER_UP_RIGHT, SPRITE_PLAYER_UP_LEFT,
  SPRITE_PLAYER_DOWN_LEFT, SPRITE_PLAYER_DOWN_RIGHT,
} from '../core/GameConfig';

export function updatePlayer(player: PlayerEntity, input: InputManager, dt: number): void {
  const keys = input.getKeys();
  const speed = player.speed * dt;

  let newPos = player.position;

  if (keys.right) {
    newPos = new Vector2(newPos.x + speed, newPos.y);
    player.sprite.sheetX = SPRITE_PLAYER_RIGHT.x;
    player.sprite.frameWidth = SPRITE_PLAYER_RIGHT.w;
  }
  if (keys.left) {
    newPos = new Vector2(newPos.x - speed, newPos.y);
    player.sprite.sheetX = SPRITE_PLAYER_LEFT.x;
    player.sprite.frameWidth = SPRITE_PLAYER_LEFT.w;
  }
  if (keys.up) {
    newPos = new Vector2(newPos.x, newPos.y - speed);
    player.sprite.sheetX = SPRITE_PLAYER_UP.x;
    player.sprite.frameWidth = SPRITE_PLAYER_UP.w;
  }
  if (keys.down) {
    newPos = new Vector2(newPos.x, newPos.y + speed);
    player.sprite.sheetX = SPRITE_PLAYER_DOWN.x;
    player.sprite.frameWidth = SPRITE_PLAYER_DOWN.w;
  }

  if (keys.up && keys.right) {
    player.sprite.sheetX = SPRITE_PLAYER_UP_RIGHT.x;
    player.sprite.frameWidth = SPRITE_PLAYER_UP_RIGHT.w;
  } else if (keys.up && keys.left) {
    player.sprite.sheetX = SPRITE_PLAYER_UP_LEFT.x;
    player.sprite.frameWidth = SPRITE_PLAYER_UP_LEFT.w;
  } else if (keys.down && keys.left) {
    player.sprite.sheetX = SPRITE_PLAYER_DOWN_LEFT.x;
    player.sprite.frameWidth = SPRITE_PLAYER_DOWN_LEFT.w;
  } else if (keys.down && keys.right) {
    player.sprite.sheetX = SPRITE_PLAYER_DOWN_RIGHT.x;
    player.sprite.frameWidth = SPRITE_PLAYER_DOWN_RIGHT.w;
  }

  player.position = clampToArena(newPos);
}

export function clampToArena(pos: Vector2): Vector2 {
  return new Vector2(
    Math.max(PLAYER_BOUNDS_LEFT, Math.min(PLAYER_BOUNDS_RIGHT, pos.x)),
    Math.max(PLAYER_BOUNDS_TOP, Math.min(PLAYER_BOUNDS_BOTTOM, pos.y)),
  );
}

export function advanceStartAnimation(player: PlayerEntity, dt: number): boolean {
  if (player.position.y < player.animationTargetPosition.y) {
    player.position = new Vector2(
      player.position.x,
      player.position.y + player.speed * dt,
    );
    return false;
  }
  return true;
}
