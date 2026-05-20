import type { Vector2 } from '../math/Vector2';

export enum EnemyType {
  Common = 'common',
  Boss = 'boss',
  BossExtra = 'bossExtra',
}

export enum ItemType {
  Coin = 'coin',
  Food = 'food',
  Scroll = 'scroll',
}

export enum SpriteDirection {
  Down = 'down',
  Up = 'up',
  Left = 'left',
  Right = 'right',
  UpRight = 'up-right',
  UpLeft = 'up-left',
  DownLeft = 'down-left',
  DownRight = 'down-right',
  Hit = 'hit',
}

export interface SpriteState {
  sheetX: number;
  sheetY: number;
  frameWidth: number;
  frameHeight: number;
  animationSpeed: number;
  frames: readonly number[];
  frameIndex: number;
  playOnce: boolean;
  onceDone: boolean;
}

export interface EnemyProjectileState {
  projectiles: EnemyProjectileData[];
  position: Vector2;
  speedX: number;
  speedY: number;
  active: boolean;
  lastFireTime: number;
}

export interface EnemyProjectileData {
  sheetX: number;
  sheetY: number;
  width: number;
  height: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  damage: number;
  points: number;
  killCount: number;
  throwCount: number;
  playerName: string;
}

export interface WaveState {
  stage: number;
  bossCount: number;
  extraBossCount: number;
  isComplete: boolean;
}
