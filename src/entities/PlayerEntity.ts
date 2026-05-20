import { Vector2 } from '../math/Vector2';
import { SpriteState } from '../types/EntityTypes';
import {
  PLAYER_MAX_HEALTH,
  PLAYER_SPEED,
  PLAYER_BASE_DAMAGE,
  CANVAS_WIDTH_DESKTOP,
  CANVAS_HEIGHT_DESKTOP,
  SPRITE_PLAYER_DOWN,
  SPRITE_PLAYER_FRAMES,
  SPRITE_PLAYER_ANIM_SPEED,
} from '../core/GameConfig';

export class PlayerEntity {
  position: Vector2;
  readonly startPosition: Vector2;
  readonly animationTargetPosition: Vector2;

  health: number = PLAYER_MAX_HEALTH;
  readonly maxHealth: number = PLAYER_MAX_HEALTH;
  damage: number = PLAYER_BASE_DAMAGE;
  readonly speed: number = PLAYER_SPEED;

  points: number = 0;
  killCount: number = 0;
  throwCount: number = 0;
  playerName: string = '';

  deathSoundPlayed = false;

  sprite: SpriteState;

  constructor(canvasWidth = CANVAS_WIDTH_DESKTOP, canvasHeight = CANVAS_HEIGHT_DESKTOP) {
    this.position = new Vector2(canvasWidth / 2, canvasHeight / 2);
    this.startPosition = new Vector2(385, -120);
    this.animationTargetPosition = new Vector2(canvasWidth / 2, canvasHeight / 2);

    this.sprite = {
      sheetX: SPRITE_PLAYER_DOWN.x,
      sheetY: SPRITE_PLAYER_DOWN.y,
      frameWidth: SPRITE_PLAYER_DOWN.w,
      frameHeight: SPRITE_PLAYER_DOWN.h,
      animationSpeed: SPRITE_PLAYER_ANIM_SPEED,
      frames: SPRITE_PLAYER_FRAMES,
      frameIndex: 0,
      playOnce: false,
      onceDone: false,
    };
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  reset(canvasWidth: number, canvasHeight: number): void {
    this.position = new Vector2(canvasWidth / 2, canvasHeight / 2);
    this.health = PLAYER_MAX_HEALTH;
    this.damage = PLAYER_BASE_DAMAGE;
    this.points = 0;
    this.killCount = 0;
    this.throwCount = 0;
    this.deathSoundPlayed = false;
    this.sprite.sheetX = SPRITE_PLAYER_DOWN.x;
    this.sprite.frameWidth = SPRITE_PLAYER_DOWN.w;
    this.sprite.frameIndex = 0;
  }
}
