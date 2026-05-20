import { SpriteState } from '../types/EntityTypes';

export function tickSprite(sprite: SpriteState, dt: number): void {
  if (sprite.animationSpeed <= 0) return;
  sprite.frameIndex += sprite.animationSpeed * dt;
}

export function getCurrentFrameX(sprite: SpriteState): number {
  if (sprite.animationSpeed <= 0) {
    return sprite.sheetX;
  }

  const max = sprite.frames.length;
  const idx = Math.floor(sprite.frameIndex);

  if (sprite.playOnce && idx >= max) {
    sprite.onceDone = true;
    return sprite.sheetX + sprite.frames[max - 1]! * sprite.frameWidth;
  }

  const frame = sprite.frames[idx % max] ?? 0;
  return sprite.sheetX + frame * sprite.frameWidth;
}

export function resetSprite(sprite: SpriteState): void {
  sprite.frameIndex = 0;
  sprite.onceDone = false;
}
