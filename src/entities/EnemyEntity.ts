import { Vector2 } from '../math/Vector2';
import { EnemyType, SpriteState } from '../types/EntityTypes';
import { RANDOM_SIGN_VALUES } from '../core/GameConfig';

function randomSign(): number {
  return RANDOM_SIGN_VALUES[Math.floor(Math.random() * RANDOM_SIGN_VALUES.length)]!;
}

export interface EnemyProjectile {
  sheetX: number;
  sheetY: number;
  width: number;
  height: number;
}

export class EnemyEntity {
  readonly id: string;
  readonly type: EnemyType;

  position: Vector2;
  health: number;
  readonly maxHealth: number;
  readonly damage: number;

  speedX: number;
  speedY: number;

  sprite: SpriteState;

  projectileActive = false;
  projectiles: EnemyProjectile[] = [];
  projectilePosition: Vector2;
  projectileSpeedX = 0;
  projectileSpeedY = 0;
  lastProjectileTime = 0;

  onDeath = false;
  deathAnimDone = false;

  constructor(
    id: string,
    type: EnemyType,
    position: Vector2,
    health: number,
    damage: number,
    sprite: SpriteState,
  ) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.health = health;
    this.maxHealth = health;
    this.damage = damage;
    this.sprite = sprite;
    this.speedX = randomSign();
    this.speedY = randomSign();
    this.projectilePosition = position;
  }

  isAlive(): boolean {
    return this.health > 0;
  }
}
